// Grad (L11): plan kruga, ponude i odluke o ugovorima, obračun mjeseca, vijesti i karta.
// Obračun ide za cijeli grad odjednom, jer turisti biraju između svih hotela (docs/ARHITEKTURA.md §6).
import { and, eq, lt, sql, type SQL } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { companies, contracts, events, finances, plans, roundReports, worlds } from "@/db/schema";
import type { ContractRow, EventRow, FinanceRow, PlanRow, WorldRow } from "@/db/schema";
import {
  getContractForCompany,
  getPlanRow,
  listCompanies,
  listEvents,
  listPlans,
  listRoomPrices,
  listRooms,
  listWorldContracts,
  logEvent,
  upsertPlan,
} from "@/db/queries";
import { CITY, CONTRACTS, getBusiness, getContract, getHotel } from "@/content";
import { contractEffects, contractNightsTotal, drawOffer, isActive } from "@/lib/engine/contracts";
import { counterError, negotiate } from "@/lib/engine/negotiate";
import { INVESTMENT_ERROR, investmentEffects, investmentTotal, parseInvestments } from "@/lib/engine/departments";
import { financeEffect, refPrice, roundFinance, settleMarket } from "@/lib/engine/economy";
import { eur } from "@/lib/format";
import { HttpError } from "@/lib/http";
import { MARKETING_MAX, METRIC_LABELS, PRICE_MAX, PRICE_MIN, ROUND_LABELS } from "@/lib/rules";
import type { requirePlayer } from "@/lib/session";
import {
  agencyText,
  counterBody,
  getOfferMail,
  insertMail,
  offerBody,
  offerMailInsert,
  offerSubject,
  replySubject,
  toMailMessage,
} from "./mail";
import type {
  CityView,
  ContractStatus,
  ContractTemplate,
  ContractView,
  CounterOfferRequest,
  LeaderboardRow,
  MetricKey,
  NegotiationResult,
  NewsItem,
  PlanRequest,
  RoundFinance,
  RoundPlan,
} from "@/lib/types";

type PlayerCtx = Awaited<ReturnType<typeof requirePlayer>>;
export type CityLink = CityView["links"][number];
export type NewsEvent = Pick<EventRow, "type" | "round" | "companyId" | "payload" | "at">;

const NEWS_LIMIT = 10;
const NEWS_TYPES = ["player.joined", "round.opened", "contract.accepted", "round.settled"];
const PLAN_CLOSED = "Plan se može mijenjati samo dok je krug otvoren";
const OFFER_GONE = "Ova ponuda više ne vrijedi";
const NEGOTIATED = "Već ste pregovarali";

// ---------- Čisti dijelovi (bez baze, testirani u city.test.ts) ----------

/** Plan iz tijela zahtjeva: cijena, marketing i ulaganja po odjelu moraju biti cijeli brojevi u rasponu, inače 400. */
export function parsePlan(body: { price?: unknown; marketing?: unknown; investments?: unknown }): PlanRequest {
  const { price, marketing } = body;
  if (typeof price !== "number" || !Number.isInteger(price) || price < PRICE_MIN || price > PRICE_MAX) {
    throw new HttpError(400, `Cijena noćenja mora biti cijeli broj od ${eur(PRICE_MIN)} do ${eur(PRICE_MAX)}`);
  }
  if (typeof marketing !== "number" || !Number.isInteger(marketing) || marketing < 0 || marketing > MARKETING_MAX) {
    throw new HttpError(400, `Marketing mora biti cijeli broj od ${eur(0)} do ${eur(MARKETING_MAX)}`);
  }
  if (body.investments === undefined) return { price, marketing };
  const investments = parseInvestments(body.investments);
  if (!investments) throw new HttpError(400, INVESTMENT_ERROR);
  return { price, marketing, investments };
}

/** Predložak ugovora s dogovorenim vrijednostima iz pregovaranja (L15), ako ih ima; obračun računa s njim. */
export function contractTerms(row: ContractRow): ContractTemplate {
  const t = getContract(row.templateId);
  return {
    ...t,
    pricePerNight: row.agreedPricePerNight ?? t.pricePerNight,
    monthlyCost: row.agreedMonthlyCost ?? t.monthlyCost,
  };
}

export function toContractView(row: ContractRow): ContractView {
  const t = contractTerms(row);
  const business = getBusiness(t.businessId);
  return {
    id: row.id,
    templateId: t.id,
    businessName: business.name,
    businessKind: business.kind,
    title: t.title,
    text: t.text,
    monthlyCost: t.monthlyCost,
    nights: t.nights,
    pricePerNight: t.pricePerNight,
    durationRounds: t.durationRounds,
    roundOffered: row.roundOffered,
    status: row.status as ContractStatus,
    ...(row.status === "accepted" && row.activeTo !== null && { activeUntilRound: row.activeTo }),
    ...(row.negotiated && { negotiated: true }),
    ...(row.counterPricePerNight !== null && { counterPricePerNight: row.counterPricePerNight }),
    ...(row.counterMonthlyCost !== null && { counterMonthlyCost: row.counterMonthlyCost }),
  };
}

export function toFinance(row: FinanceRow): RoundFinance {
  return {
    round: row.round,
    nights: row.nights,
    contractNights: row.contractNights,
    capacityNights: row.capacityNights,
    occupancyPct: row.occupancyPct,
    marketSharePct: row.marketSharePct,
    revenue: row.revenue,
    costs: row.costs,
    profit: row.profit,
    cashAfter: row.cashAfter,
    investments: row.investments,
    ...(row.breakdown && { breakdown: row.breakdown }),
  };
}

const activeRows = (rows: ContractRow[], round: number) =>
  rows.filter((r) =>
    isActive({ status: r.status as ContractStatus, activeFrom: r.activeFrom, activeTo: r.activeTo }, round),
  );

/** Predlošci ugovora koji vrijede u tom krugu, s dogovorenim vrijednostima (L15). */
export function activeTemplates(rows: ContractRow[], round: number): ContractTemplate[] {
  return activeRows(rows, round).map(contractTerms);
}

/** Linije karte: hotel–tvrtka za svaki ugovor koji vrijedi u tom krugu (bez ponavljanja). */
export function toCityLinks(rows: ContractRow[], round: number): CityLink[] {
  const seen = new Set<string>();
  const links: CityLink[] = [];
  for (const r of activeRows(rows, round)) {
    const businessId = getContract(r.templateId).businessId;
    const key = `${r.companyId}:${businessId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ companyId: r.companyId, businessId });
  }
  return links;
}

/** Karta grada: sve gradske tvrtke, hoteli s ljestvice i aktivni ugovori kao linije. */
export function toCityView(hotels: LeaderboardRow[], links: CityLink[] = []): CityView {
  return { businesses: CITY, hotels, links };
}

const monthName = (round: number) => ROUND_LABELS[round - 1] ?? `Krug ${round}`;
const text = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : undefined);

function newsText(e: NewsEvent, names: Record<string, string>): string | undefined {
  const p = (e.payload ?? {}) as Record<string, unknown>;
  const hotel = (e.companyId ? names[e.companyId] : undefined) ?? text(p.hotelName);
  switch (e.type) {
    case "player.joined": {
      const place = text(p.place);
      return hotel && place ? `Novi hotel u gradu: ${hotel} (${place})` : undefined;
    }
    case "round.opened":
      return `Počinje ${monthName(e.round).toLocaleLowerCase("hr")}`;
    case "contract.accepted": {
      const business = text(p.businessName);
      return hotel && business ? `Novi ugovor: ${hotel} i ${business}` : undefined;
    }
    case "round.settled": {
      const topId = text(p.topCompanyId);
      const top = (topId ? names[topId] : undefined) ?? text(p.topHotelName);
      return top && typeof p.occupancyPct === "number"
        ? `${monthName(e.round)}: najpopunjeniji je ${top} (${p.occupancyPct} %)`
        : undefined;
    }
    default:
      return undefined;
  }
}

/** Vijesti grada iz dnevnika događaja: zadnjih 10, najnovije prvo. `names` = id tvrtke → ime hotela. */
export function buildNews(events: NewsEvent[], names: Record<string, string>): NewsItem[] {
  return [...events]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .flatMap((e) => {
      const t = newsText(e, names);
      return t ? [{ at: new Date(e.at).toISOString(), text: t }] : [];
    })
    .slice(0, NEWS_LIMIT);
}

/** Zbroj učinaka na pokazatelje (samo poznati ključevi, bez nula). */
export function sumEffects(...parts: Partial<Record<MetricKey, number>>[]): Partial<Record<MetricKey, number>> {
  const out: Partial<Record<MetricKey, number>> = {};
  for (const part of parts) {
    for (const [k, v] of Object.entries(part) as [MetricKey, number][]) {
      if (!(k in METRIC_LABELS) || !v) continue;
      out[k] = (out[k] ?? 0) + v;
    }
  }
  for (const k of Object.keys(out) as MetricKey[]) if (out[k] === 0) delete out[k];
  return out;
}

// Pokazatelji + učinak u jednoj SQL naredbi (jsonb_set po ključu, rezano na 0–100), da se ne izgubi
// istodobno zatvaranje kruga koje također piše pokazatelje. Ključevi su samo MetricKey, pa je sql.raw siguran.
/** Pokazatelji u jsonb stupcu (`companies.metrics` ili `round_reports.metrics_after`) plus delta, rezano 0–100. */
export function metricsPlus(column: AnyPgColumn, delta: Partial<Record<MetricKey, number>>): SQL {
  let expr: SQL = sql`${column}`;
  for (const [k, d] of Object.entries(delta) as [MetricKey, number][]) {
    if (!(k in METRIC_LABELS) || !Number.isInteger(d) || d === 0) continue;
    const current = sql`round((${column} ->> ${sql.raw(`'${k}'`)})::numeric)::int`;
    expr = sql`jsonb_set(${expr}, ${sql.raw(`'{${k}}'`)}, to_jsonb(least(100, greatest(0, ${current} + ${sql.raw(String(d))}))))`;
  }
  return expr;
}

// ---------- Plan kruga ----------

/** Plan za krug iz spremljenog retka; bez njega cijena je referentna cijena soba, marketing 0 i bez ulaganja. */
export function toPlan(round: number, row: PlanRow | null, rooms: { basePrice: number }[]): RoundPlan {
  if (row) return { round, price: row.price, marketing: row.marketing, investments: row.investments ?? {} };
  return { round, price: refPrice(rooms), marketing: 0, investments: {} };
}

/** #227.1: planovi prošlog mjeseca kao zadani planovi novog (cijena i marketing; ulaganja su jednokratna, pa ne). */
export function carryOverPlans(rows: PlanRow[], round: number): (typeof plans.$inferInsert)[] {
  return rows.map((r) => ({ companyId: r.companyId, round, price: r.price, marketing: r.marketing, investments: {} }));
}

/** Planovi bez botova (ADR-044): bot svaki mjesec planira sam, samo kad za taj mjesec nema retka (playOneBot). */
export function withoutBotPlans(rows: PlanRow[], all: { id: string; kind: string }[]): PlanRow[] {
  const bots = new Set(all.filter((c) => c.kind === "bot").map((c) => c.id));
  return rows.filter((r) => !bots.has(r.companyId));
}

/**
 * Pri otvaranju mjeseca `round` prepiše plan mjeseca `round − 1` svakog studentskog hotela u novi mjesec. Plan koji je
 * student već spremio za novi mjesec ostaje (onConflictDoNothing), a hotel bez plana i dalje dobije zadani.
 */
export async function carryPlansForward(worldId: string, round: number): Promise<void> {
  const [prev, all] = await Promise.all([listPlans(worldId, round - 1), listCompanies(worldId)]);
  // botovi planiraju sami svaki mjesec (ADR-044), pa im se plan ne prenosi
  const rows = carryOverPlans(withoutBotPlans(prev, all.map((c) => c.company)), round);
  if (rows.length) await db.insert(plans).values(rows).onConflictDoNothing();
}

/** Plan tvrtke za krug (spremljeni ili zadani). */
export async function getPlan(companyId: string, round: number): Promise<RoundPlan> {
  const row = await getPlanRow(companyId, round);
  return toPlan(round, row, row ? [] : await listRooms(companyId));
}

/** Spremi plan tekućeg kruga (samo dok igra traje, a tvrtka krug nije zatvorila ni grad ga nije obračunao). */
export async function savePlan(ctx: PlayerCtx, req: PlanRequest): Promise<RoundPlan> {
  const { price, marketing, investments } = parsePlan(req);
  const { world, company } = ctx;
  if (world.status !== "running" || company.closedRound >= world.round || world.settledRound >= world.round) {
    throw new HttpError(409, PLAN_CLOSED);
  }
  const row = await upsertPlan({ companyId: company.id, round: world.round, price, marketing, investments });
  return toPlan(row.round, row, []);
}

// ---------- Ugovori ----------

/**
 * Po jedna ponuda po hotelu za krug (deterministički iz sjemena igre) i uz nju e-mail agencije (L15), u jednom
 * `db.batch`; ponovni poziv ne radi ništa (ni ponudu ni e-mail).
 */
export async function createOffers(world: WorldRow, round: number): Promise<void> {
  const all = await listCompanies(world.id);
  if (all.length === 0) return;
  const offers = all.map(({ company }) => ({
    company,
    id: crypto.randomUUID(),
    template: drawOffer(world.seed, round, company.joinIndex, CONTRACTS),
  }));
  const insertOffers = db
    .insert(contracts)
    .values(
      offers.map(({ company, id, template }) => ({
        id,
        worldId: world.id,
        companyId: company.id,
        templateId: template.id,
        roundOffered: round,
      })),
    )
    .onConflictDoNothing();
  const offerMails = offers.map(({ company, id, template }) =>
    offerMailInsert({
      contractId: id,
      threadId: crypto.randomUUID(),
      businessId: template.businessId,
      subject: offerSubject(template),
      body: offerBody(template, getBusiness(template.businessId), company.name),
    }),
  );
  await db.batch([insertOffers, ...offerMails]);
}

/** Ponuda tekućeg kruga koja još vrijedi; inače 404 ili 409. */
async function openOffer(ctx: PlayerCtx, contractId: string): Promise<ContractRow> {
  const { world, company } = ctx;
  const row = await getContractForCompany(contractId, company.id);
  if (!row) throw new HttpError(404, "Ponuda nije pronađena");
  if (
    row.status !== "offered" ||
    world.status !== "running" ||
    row.roundOffered !== world.round ||
    world.settledRound >= row.roundOffered
  ) {
    throw new HttpError(409, OFFER_GONE);
  }
  return row;
}

// krug ponude je još otvoren i grad ga nije obračunao (obračun prvo zauzme settled_round)
const roundStillOpen = () =>
  sql`exists (select 1 from ${worlds} where ${worlds.id} = ${contracts.worldId} and ${worlds.status} = 'running' and ${worlds.round} = ${contracts.roundOffered} and ${worlds.settledRound} < ${contracts.roundOffered})`;

async function logAccepted(world: WorldRow, companyId: string, row: ContractRow, template: ContractTemplate) {
  const business = getBusiness(template.businessId);
  await logEvent({
    worldId: world.id,
    companyId,
    round: row.roundOffered,
    type: "contract.accepted",
    payload: { contractId: row.id, templateId: template.id, businessId: business.id, businessName: business.name },
  });
}

/** Prihvati ili odbij ponudu tekućeg kruga. Jedan uvjetni UPDATE: druga odluka ili zakašnjeli klik dobije 409. */
export async function decideContract(ctx: PlayerCtx, contractId: string, accept: boolean): Promise<ContractView> {
  const { world, company } = ctx;
  const row = await openOffer(ctx, contractId);
  const template = getContract(row.templateId);
  // nakon protuponude agencije (countered) prihvaćanje vrijedi po njezinim brojkama
  const countered = row.counterPricePerNight !== null || row.counterMonthlyCost !== null;
  const decided = await db
    .update(contracts)
    .set(
      accept
        ? {
            status: "accepted",
            activeFrom: row.roundOffered,
            activeTo: row.roundOffered + template.durationRounds - 1,
            ...(countered && { agreedPricePerNight: row.counterPricePerNight, agreedMonthlyCost: row.counterMonthlyCost }),
          }
        : { status: "rejected" },
    )
    .where(and(eq(contracts.id, row.id), eq(contracts.status, "offered"), roundStillOpen()))
    .returning();
  if (!decided[0]) throw new HttpError(409, OFFER_GONE);
  if (accept) {
    await logAccepted(world, company.id, row, template);
    return toContractView(decided[0]);
  }
  const business = getBusiness(template.businessId);
  await logEvent({
    worldId: world.id,
    companyId: company.id,
    round: row.roundOffered,
    type: "contract.rejected",
    payload: { contractId: row.id, templateId: template.id, businessId: business.id, businessName: business.name },
  });
  return toContractView(decided[0]);
}

/**
 * Protuponuda na ponudu tekućeg kruga (L15), jednom po ponudi. Motor odlučuje (negotiate): accepted → ugovor vrijedi
 * po dogovorenim brojkama; countered → agencija nudi sredinu, student je zatim prihvaća ili odbija (decideContract);
 * rejected → ponuda propada. Svaki ishod upiše protuponudu hotela i odgovor agencije u nit e-maila ponude.
 */
export async function counterOffer(
  ctx: PlayerCtx,
  contractId: string,
  req: CounterOfferRequest,
): Promise<NegotiationResult> {
  const { world, company } = ctx;
  const row = await openOffer(ctx, contractId);
  if (row.negotiated) throw new HttpError(409, NEGOTIATED);
  const template = getContract(row.templateId);
  const error = counterError(template, req);
  if (error) throw new HttpError(400, error);
  const deal = negotiate(template, req);
  const agreed = { pricePerNight: deal.pricePerNight, monthlyCost: deal.monthlyCost };

  const updated = await db
    .update(contracts)
    .set(
      deal.outcome === "accepted"
        ? {
            status: "accepted",
            activeFrom: row.roundOffered,
            activeTo: row.roundOffered + template.durationRounds - 1,
            agreedPricePerNight: agreed.pricePerNight,
            agreedMonthlyCost: agreed.monthlyCost,
            negotiated: true,
          }
        : deal.outcome === "countered"
          ? { counterPricePerNight: agreed.pricePerNight, counterMonthlyCost: agreed.monthlyCost, negotiated: true }
          : { status: "expired", negotiated: true },
    )
    .where(
      and(eq(contracts.id, row.id), eq(contracts.status, "offered"), eq(contracts.negotiated, false), roundStillOpen()),
    )
    .returning();
  if (!updated[0]) throw new HttpError(409, OFFER_GONE);

  const business = getBusiness(template.businessId);
  const offerMail = await getOfferMail(row.id);
  const threadId = offerMail?.threadId ?? crypto.randomUUID();
  const subject = replySubject(offerMail?.subject ?? offerSubject(template));
  const proposal = {
    nights: template.nights,
    pricePerNight: req.pricePerNight ?? template.pricePerNight,
    monthlyCost: req.monthlyCost ?? template.monthlyCost,
  };
  const sentAt = new Date();
  const replyBody = await agencyText({
    business,
    contract: template,
    outcome: deal.outcome,
    studentMessage: req.message,
    agreed,
  });
  const repliedAt = new Date(Math.max(Date.now(), sentAt.getTime() + 1));
  const common = { worldId: world.id, threadId, kind: "agency", businessId: business.id, subject, contractId: row.id };
  const written = await insertMail([
    { ...common, fromCompanyId: company.id, body: counterBody(proposal, company.name, req.message), createdAt: sentAt },
    { ...common, toCompanyId: company.id, body: replyBody, createdAt: repliedAt },
  ]);
  const reply = written.find((m) => m.toCompanyId === company.id) ?? written[written.length - 1];
  if (deal.outcome === "accepted") await logAccepted(world, company.id, row, template);
  return {
    outcome: deal.outcome,
    contract: toContractView(updated[0]),
    reply: toMailMessage(reply, company.id, { [company.id]: company.name }),
  };
}

// ---------- Obračun mjeseca ----------

/**
 * Obračun kruga za cijeli grad, točno jednom: prvo zauzme `settled_round` (bez retka → netko je već obračunao),
 * zatim tržište, novac, pokazatelji, retci u `finances`, istek neprihvaćenih ponuda i događaj u jednom `db.batch`.
 * Ako upis padne, vrati `settled_round`, da sljedeći poziv (profesorov klik) mjesec ponovno obračuna.
 */
export async function settleCityRound(world: WorldRow, round: number): Promise<void> {
  if (!Number.isInteger(round) || round < 1) return;
  const claimed = await db
    .update(worlds)
    .set({ settledRound: round })
    .where(and(eq(worlds.id, world.id), lt(worlds.settledRound, round)))
    .returning({ id: worlds.id });
  if (!claimed[0]) return;

  try {
    await writeSettlement(world, round);
  } catch (err) {
    await db
      .update(worlds)
      .set({ settledRound: round - 1 })
      .where(and(eq(worlds.id, world.id), eq(worlds.settledRound, round)));
    throw err;
  }
}

async function writeSettlement(world: WorldRow, round: number): Promise<void> {
  const [all, planRows, roomPrices, contractRows] = await Promise.all([
    listCompanies(world.id),
    listPlans(world.id, round),
    listRoomPrices(world.id),
    listWorldContracts(world.id),
  ]);

  const hotels = all.map(({ company }) => {
    const roomsOf = roomPrices.filter((r) => r.companyId === company.id);
    const ref = refPrice(roomsOf);
    const plan = planRows.find((p) => p.companyId === company.id);
    const active = activeTemplates(
      contractRows.filter((c) => c.companyId === company.id),
      round,
    );
    return {
      company,
      roomsCount: roomsOf.length,
      ref,
      price: plan?.price ?? ref,
      marketing: plan?.marketing ?? 0,
      investments: plan?.investments ?? {},
      active,
    };
  });

  const market = settleMarket(
    round,
    hotels.map((h) => ({
      companyId: h.company.id,
      roomsCount: h.roomsCount,
      reviews: h.company.metrics.reviews,
      guests: h.company.metrics.guests,
      staff: h.company.metrics.staff,
      operations: h.company.metrics.operations,
      finance: h.company.metrics.finance,
      price: h.price,
      refPrice: h.ref,
      marketing: h.marketing,
      contractNights: contractNightsTotal(h.active),
    })),
  );

  const settled = hotels.map((h, k) => {
    const finance = roundFinance(market[k], {
      round,
      price: h.price,
      marketing: h.marketing,
      staffCost: getHotel(h.company.templateId).staffCost,
      roomsCount: h.roomsCount,
      cashBefore: h.company.cash,
      contracts: h.active,
      investments: investmentTotal(h.investments),
    });
    const delta = sumEffects(
      contractEffects(h.active),
      { finance: financeEffect(finance.profit) },
      investmentEffects(h.investments),
    );
    return { company: h.company, finance, delta };
  });

  const top = settled.reduce<(typeof settled)[number] | undefined>(
    (best, s) => (!best || s.finance.occupancyPct > best.finance.occupancyPct ? s : best),
    undefined,
  );

  const perHotel: BatchItem<"pg">[] = settled.flatMap(({ company, finance, delta }) => [
    db
      .update(companies)
      .set({ cash: sql`${companies.cash} + ${finance.profit}`, metrics: metricsPlus(companies.metrics, delta) })
      .where(eq(companies.id, company.id)),
    // #226: ista delta i u izvještaj mjeseca, da izvještaj, mentor i podij (roundGain) vide obračun kao i tvrtka
    db
      .update(roundReports)
      .set({ metricsAfter: metricsPlus(roundReports.metricsAfter, delta) })
      .where(and(eq(roundReports.companyId, company.id), eq(roundReports.round, round))),
    // bez onConflict: da obračun ikad stigne dvaput, unique (company_id, round) poništi cijeli batch
    db.insert(finances).values({ companyId: company.id, ...finance }),
  ]);

  const settledEvent = db.insert(events).values({
    worldId: world.id,
    round,
    type: "round.settled",
    payload: {
      hotels: settled.length,
      topCompanyId: top?.company.id ?? null,
      topHotelName: top?.company.name ?? null,
      occupancyPct: top?.finance.occupancyPct ?? null,
    },
  });
  const expireOffers = db
    .update(contracts)
    .set({ status: "expired" })
    .where(and(eq(contracts.worldId, world.id), eq(contracts.roundOffered, round), eq(contracts.status, "offered")));

  await db.batch([settledEvent, expireOffers, ...perHotel]);
}

// ---------- Podaci za poglede (views.ts gradi plan, ugovore, obračune, kartu i vijesti iz redaka) ----------

/** Događaji iz kojih se pišu vijesti grada (buildNews), najnoviji prvo. */
export async function listNewsEvents(worldId: string): Promise<EventRow[]> {
  return listEvents(worldId, NEWS_TYPES, NEWS_LIMIT);
}
