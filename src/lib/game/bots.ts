// Botovi (ADR-044): hoteli koje vodi računalo. Bot je obična tvrtka (kind "bot") s nedohvatljivim tokenom, pa ga
// obračun grada tretira kao svaki drugi hotel. Odluke su čista pravila, bez AI-ja (ADR-002); baza se dira samo kroz
// postojeće funkcije igrača (savePlan, submitAnswer, decideContract) s ctx-om bota.
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { answers, companies, contracts, events, finances, mail, plans, players, roundReports, rooms, situations } from "@/db/schema";
import type { CompanyRow, ContractRow, PlayerRow, WorldRow } from "@/db/schema";
import { isUuid, listCompanies, listFinanceRows, listRooms, listSituationsWithAnswers, getSituationForCompany, getPlanRow, listWorldContracts, logEvent } from "@/db/queries";
import { HOTELS } from "@/content";
import { assignHotel } from "@/lib/engine/assign";
import { refPrice } from "@/lib/engine/economy";
import { HttpError } from "@/lib/http";
import { PRICE_MAX, PRICE_MIN } from "@/lib/rules";
import type { requirePlayer } from "@/lib/session";
import type { PlanRequest } from "@/lib/types";
import { contractTerms, decideContract, savePlan } from "./city";
import { submitAnswer } from "./answer";

type PlayerCtx = Awaited<ReturnType<typeof requirePlayer>>;

export const BOT_KIND = "bot";
export const BOT_PLAYER_NAME = "Računalo";
export const BOT_SUFFIX = " (bot)";
export const BOT_MARKETING = 1000;
export const DEFAULT_BOT_TARGET = 5;

export const BOT_NAMES = [
  "Hotel Bonavia",
  "Hotel Kvarner Breeze",
  "Villa Opatija Mare",
  "Hotel Lungomare",
  "Hotel Učka View",
  "Hotel Riviera Palace",
  "Pansion Kantrida",
  "Hotel Trsat",
  "Hotel Volosko Sunce",
  "Hotel Preluk",
  "Hotel Lovran Garden",
  "Hotel Krk Marina",
  "Hotel Rabac Bay",
  "Villa Kostrena",
  "Hotel Crikvenica Plaža",
  "Hotel Medveja",
];

// ---------- Čisti dijelovi (bez baze, testirani u bots.test.ts) ----------

/** Plan bota: cijena je referentna × 0,95 / 1,00 / 1,05 po indeksu bota, marketing 1.000 €, bez ulaganja. */
export function botPlan(botIndex: number, ref: number, lastOccupancyPct?: number): PlanRequest {
  // ADR-044 (Leon): mala promjena prema popunjenosti prošlog mjeseca: puno (> 85 %) +5 %, malo (< 50 %) −5 %.
  const nudge = lastOccupancyPct === undefined ? 1 : lastOccupancyPct > 85 ? 1.05 : lastOccupancyPct < 50 ? 0.95 : 1;
  const raw = Math.round(ref * (0.95 + 0.05 * (botIndex % 3)) * nudge);
  return { price: Math.min(PRICE_MAX, Math.max(PRICE_MIN, raw)), marketing: BOT_MARKETING };
}

/** Determinirani 32-bitni hash (FNV-1a) teksta. */
export function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Indeks ponuđene opcije koju bot klikne: isti bot i ista situacija uvijek daju isti izbor. */
/**
 * Koju ponuđenu opciju bot klikne: opcije se poslože po broju kriterija koje pokrivaju (to je kvaliteta klika);
 * bot je „solidan" i uzme drugu najbolju, a svaki četvrti bot je „jak" i uzme najbolju. Isti ulaz, isti izbor.
 * Kod jednakih opcija odlučuje hash bota i situacije, da svi botovi ne kliknu isto.
 */
export function botOptionIndex(botIndex: number, situationId: string, optionCriteria: number[]): number {
  if (optionCriteria.length === 0) return 0;
  const tie = hash32(`${botIndex}:${situationId}`);
  const ranked = optionCriteria
    .map((n, i) => ({ i, n, t: hash32(`${tie}:${i}`) }))
    .sort((a, b) => b.n - a.n || a.t - b.t);
  const rank = botIndex % 4 === 0 ? 0 : 1;
  return ranked[Math.min(rank, ranked.length - 1)].i;
}

/** Bot prihvaća ugovor samo ako mu je dobit pozitivna: prihod od noćenja minus mjesečni trošak. */
export function botAcceptsContract(c: { pricePerNight: number; nights: number; monthlyCost: number }): boolean {
  return c.pricePerNight * c.nights - c.monthlyCost > 0;
}

export const isBotName = (name: string) => name.endsWith(BOT_SUFFIX);

/** Prvo ime iz popisa koje još nije zauzeto u igri; kad ih nestane, ime s brojem. */
export function pickBotName(taken: string[]): string {
  const used = new Set(taken.map((n) => n.toLocaleLowerCase("hr")));
  const full = (base: string) => `${base}${BOT_SUFFIX}`;
  const free = BOT_NAMES.find((n) => !used.has(full(n).toLocaleLowerCase("hr")));
  if (free) return full(free);
  for (let i = 2; ; i++) {
    const candidate = full(`${BOT_NAMES[0]} ${i}`);
    if (!used.has(candidate.toLocaleLowerCase("hr"))) return candidate;
  }
}

// ---------- Dodavanje i uklanjanje (samo u čekaonici) ----------

type Entry = { company: CompanyRow; player: PlayerRow };

function assertLobby(world: WorldRow) {
  if (world.status !== "lobby") throw new HttpError(409, "Botove je moguće dodavati i uklanjati samo prije početka igre");
}

async function insertBot(world: WorldRow, taken: { names: string[]; templateIds: string[]; joinIndex: number }) {
  const hotel = assignHotel(HOTELS, taken.templateIds);
  const name = pickBotName(taken.names);
  const companyId = crypto.randomUUID();
  // Isti oblik kao joinWorld: jedna transakcija (db.batch), pa nema tvrtke bez soba ili igrača.
  await db.batch([
    db.insert(companies).values({
      id: companyId,
      worldId: world.id,
      kind: BOT_KIND,
      name,
      templateId: hotel.id,
      startMetrics: hotel.startMetrics,
      metrics: hotel.startMetrics,
      cash: hotel.startCash,
      startCash: hotel.startCash,
      joinIndex: taken.joinIndex,
    }),
    db.insert(rooms).values(
      hotel.rooms.map((r) => ({
        companyId,
        number: r.number,
        floor: r.floor,
        type: r.type,
        beds: r.beds,
        view: r.view,
        basePrice: r.basePrice,
        status: r.status,
        note: r.note ?? null,
      })),
    ),
    // bot: je nedohvatljiv, jer pravi tokenHash dolazi iz hashCode(token) i nikad nema taj prefiks
    db.insert(players).values({ companyId, displayName: BOT_PLAYER_NAME, tokenHash: `bot:${crypto.randomUUID()}` }),
  ]);
  taken.names.push(name);
  taken.templateIds.push(hotel.id);
  taken.joinIndex += 1;
  await logEvent({
    worldId: world.id,
    companyId,
    round: world.round,
    type: "player.joined",
    payload: { name: BOT_PLAYER_NAME, hotelName: name, templateId: hotel.id, place: hotel.place },
  });
}

function takenOf(all: Entry[]) {
  return {
    names: all.map((c) => c.company.name),
    templateIds: all.map((c) => c.company.templateId),
    joinIndex: all.reduce((m, c) => Math.max(m, c.company.joinIndex), 0) + 1,
  };
}

/** Dodaj jednog bota; samo u čekaonici i dok ima mjesta (botovi se broje u maxPlayers). */
export async function addBot(world: WorldRow): Promise<void> {
  assertLobby(world);
  const all = await listCompanies(world.id);
  if (all.length >= world.maxPlayers) throw new HttpError(409, "Igra je puna");
  await insertBot(world, takenOf(all));
}

/** Dodaj botove dok broj hotela ne dosegne `target` ili igra ne bude puna. Vrati koliko ih je dodano. */
export async function fillBots(world: WorldRow, target: number = DEFAULT_BOT_TARGET): Promise<number> {
  assertLobby(world);
  const all = await listCompanies(world.id);
  const taken = takenOf(all);
  const goal = Math.min(target, world.maxPlayers);
  let added = 0;
  for (let n = all.length; n < goal; n++) {
    await insertBot(world, taken);
    added++;
  }
  return added;
}

/** Ukloni bota iz čekaonice: briše tvrtku i sve što na nju upire, redom koji poštuje strane ključeve, u jednom batchu. */
export async function removeBot(world: WorldRow, companyId: string): Promise<void> {
  assertLobby(world);
  if (!isUuid(companyId)) throw new HttpError(404, "Ta tvrtka nije u ovoj igri");
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.worldId, world.id)))
    .limit(1);
  if (!company) throw new HttpError(404, "Ta tvrtka nije u ovoj igri");
  if (company.kind !== BOT_KIND) throw new HttpError(409, "Ukloniti se može samo bot");
  const ownSituations = db.select({ id: situations.id }).from(situations).where(eq(situations.companyId, companyId));
  const ownContracts = db.select({ id: contracts.id }).from(contracts).where(eq(contracts.companyId, companyId));
  await db.batch([
    db.delete(answers).where(inArray(answers.situationId, ownSituations)),
    db.delete(situations).where(eq(situations.companyId, companyId)),
    db.delete(plans).where(eq(plans.companyId, companyId)),
    db.delete(finances).where(eq(finances.companyId, companyId)),
    db.delete(roundReports).where(eq(roundReports.companyId, companyId)),
    db
      .delete(mail)
      .where(or(eq(mail.fromCompanyId, companyId), eq(mail.toCompanyId, companyId), inArray(mail.contractId, ownContracts))),
    db.delete(contracts).where(eq(contracts.companyId, companyId)),
    db.delete(events).where(eq(events.companyId, companyId)),
    db.delete(rooms).where(eq(rooms.companyId, companyId)),
    db.delete(players).where(eq(players.companyId, companyId)),
    db.delete(companies).where(and(eq(companies.id, companyId), eq(companies.kind, BOT_KIND))),
  ]);
}

// ---------- Igranje mjeseca ----------

async function playOneBot(world: WorldRow, round: number, entry: Entry, botIndex: number, offers: ContractRow[]) {
  const ctx: PlayerCtx = { player: entry.player, company: entry.company, world };
  const { company } = entry;

  if (!(await getPlanRow(company.id, round))) {
    const [roomRows, financeRows] = await Promise.all([listRooms(company.id), listFinanceRows(company.id)]);
    const last = financeRows.filter((f) => f.round < round).sort((a, b) => b.round - a.round)[0];
    await savePlan(ctx, botPlan(botIndex, refPrice(roomRows), last?.occupancyPct));
  }

  for (const { situation, answer } of await listSituationsWithAnswers(company.id, round)) {
    if (answer || situation.state !== "open") continue;
    try {
      const found = await getSituationForCompany(situation.id, company.id);
      const options = found?.template.options ?? [];
      if (options.length === 0) continue;
      const option = options[botOptionIndex(botIndex, situation.id, options.map((o) => o.criteria.length))];
      await submitAnswer(ctx, situation.id, { optionId: option.id });
    } catch (err) {
      console.error(`bot ${company.id}: situacija ${situation.id} nije odgovorena`, err);
    }
  }

  for (const offer of offers) {
    try {
      await decideContract(ctx, offer.id, botAcceptsContract(contractTerms(offer)));
    } catch (err) {
      console.error(`bot ${company.id}: ugovor ${offer.id} nije odlučen`, err);
    }
  }
}

/**
 * Prije zatvaranja mjeseca `round`: svaki bot postavi plan (ako ga nema), odgovori na otvorene situacije i odluči o
 * ponudama ugovora. Svaki bot i svaki korak su u try/catch: jedan pokvaren bot nikad ne smije zaustaviti zatvaranje mjeseca.
 */
export async function playBots(world: WorldRow, round: number): Promise<void> {
  try {
    const bots = (await listCompanies(world.id)).filter((c) => c.company.kind === BOT_KIND);
    if (bots.length === 0) return;
    const offered = (await listWorldContracts(world.id)).filter((c) => c.roundOffered === round && c.status === "offered");
    for (const [i, entry] of bots.entries()) {
      try {
        await playOneBot(world, round, entry, i, offered.filter((c) => c.companyId === entry.company.id));
      } catch (err) {
        console.error(`bot ${entry.company.id}: mjesec ${round} nije odigran`, err);
      }
    }
  } catch (err) {
    console.error(`botovi: mjesec ${round} nije odigran`, err);
  }
}
