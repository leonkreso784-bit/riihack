// Pošta (L15): e-mail ponude agencije, protuponuda hotela i odgovor agencije. Poruke među hotelima (L18):
// `sendMail` (hotel → hotel iste igre) i `loadWorldMail` (profesor vidi sve poruke među hotelima).
import { and, count, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { isUuid, listCompanies } from "@/db/queries";
import { companies, contracts, events, mail } from "@/db/schema";
import type { MailRow } from "@/db/schema";
import { CITY } from "@/content";
import { agencyReply } from "@/lib/ai";
import {
  checkMailLimit,
  checkSendMail,
  clip,
  MAIL_PER_GAME,
  MAIL_PER_MINUTE,
  MAIL_PER_RECIPIENT,
  MAIL_WINDOW_SECONDS,
  recipientRefusal,
  replySubject,
} from "@/lib/engine/mail-send";
import type { MailCounts } from "@/lib/engine/mail-send";
import { eur } from "@/lib/format";
import { HttpError } from "@/lib/http";
import { MAIL_BODY_MAX, MAIL_SUBJECT_MAX } from "@/lib/rules";
import type { CityBusiness, ContractTemplate, MailKind, MailMessage, NegotiationOutcome } from "@/lib/types";

export { replySubject }; // živi u engine/mail-send.ts (koristi ga i obrazac u pregledniku); city.ts ga uvozi odavde

// Prozor pošte u GET /api/me: zadnjih 30 poruka hotela posebno od ponuda agencija i obavijesti grada, da poruke
// drugih hotela ne potisnu ponude (listMailWindow).
export const MAIL_LIMIT = 30;
export const MAIL_OTHER_LIMIT = 100; // agencije i grad: u praksi nekoliko po mjesecu, granica samo čuva veličinu odgovora
type Terms = Pick<ContractTemplate, "nights" | "pricePerNight" | "monthlyCost">;

// ---------- Čisti dijelovi (bez baze, testirani u mail.test.ts) ----------

const months = (n: number) => (n === 1 ? "1 mjesec" : `${n} mjeseca`);

/** Uvjeti ugovora jednom rečenicom: noćenja po cijeni i/ili mjesečna naknada. */
export function termsText(t: Terms): string {
  const parts: string[] = [];
  if (t.nights > 0) parts.push(`${t.nights} noćenja mjesečno po ${eur(t.pricePerNight)}`);
  if (t.monthlyCost > 0) parts.push(`naknada ${eur(t.monthlyCost)} mjesečno`);
  return parts.join(", ");
}

export const offerSubject = (t: ContractTemplate) => clip(`Ponuda: ${t.title}`, MAIL_SUBJECT_MAX);

/** E-mail ponude pri otvaranju mjeseca: fiksni predložak, bez AI-ja (30 studenata otvara mjesec odjednom). */
export function offerBody(t: ContractTemplate, business: CityBusiness, hotelName: string): string {
  return clip(
    [
      `Poštovani, ${hotelName},`,
      t.text,
      `Uvjeti: ${termsText(t)}. Trajanje: ${months(t.durationRounds)}.`,
      "Ponuda vrijedi do kraja ovog mjeseca. Možete je prihvatiti, odbiti ili nam predložiti drugu cijenu.",
      `Srdačan pozdrav,\n${business.name}`,
    ].join("\n\n"),
    MAIL_BODY_MAX,
  );
}

/** Protuponuda hotela: studentova poruka (ako je ima) i prijedlog s brojkom. */
export function counterBody(proposal: Terms, hotelName: string, message?: string): string {
  const note = message?.trim();
  const line = `Naš prijedlog: ${termsText(proposal)}.`;
  return clip(note ? `${note}\n\n${line}` : `Poštovani,\n\n${line}\n\nSrdačan pozdrav,\n${hotelName}`, MAIL_BODY_MAX);
}

export type AgencyReplyInput = {
  business: CityBusiness;
  contract: ContractTemplate;
  outcome: NegotiationOutcome;
  studentMessage?: string;
  agreed: { pricePerNight: number; monthlyCost: number };
};

/** Rezervni odgovor agencije po ishodu (fiksni tekst). Brojke su samo one koje je odredio motor. */
export function agencyFallback(i: AgencyReplyInput): string {
  const terms = termsText({ nights: i.contract.nights, ...i.agreed });
  const sign = `Srdačan pozdrav,\n${i.business.name}`;
  switch (i.outcome) {
    case "accepted":
      return `Poštovani,\n\nprihvaćamo vaš prijedlog. Dogovoreno: ${terms}. Ugovor vrijedi od ovog mjeseca.\n\n${sign}`;
    case "countered":
      return `Poštovani,\n\ntoliko ne možemo, ali nađimo se na pola puta: ${terms}. Javite nam do kraja mjeseca prihvaćate li.\n\n${sign}`;
    case "rejected":
      return `Poštovani,\n\nnažalost, vaš je prijedlog predaleko od naše ponude, pa ovaj put odustajemo od suradnje.\n\n${sign}`;
  }
}

/**
 * Tekst odgovora agencije. JEDINO MJESTO ZA ZAMJENU: kad S11 doda `agencyReply` u `@/lib/ai`, ovdje vrati
 * `clip(await agencyReply(i), MAIL_BODY_MAX)` (agencyReply ima svoju rezervu po ishodu).
 */
export async function agencyText(i: AgencyReplyInput): Promise<string> {
  return clip(await agencyReply(i), MAIL_BODY_MAX);
}

const businessName = (id: string | null) => (id ? CITY.find((b) => b.id === id)?.name : undefined);

/**
 * Redak → MailMessage za tvrtku `me`. `names` = id tvrtke → ime hotela. Strana bez tvrtke je gradska tvrtka
 * (`business_id`); vlastita poslana pošta je uvijek pročitana.
 */
export function toMailMessage(row: MailRow, me: string, names: Record<string, string>): MailMessage {
  const side = (companyId: string | null) =>
    (companyId ? names[companyId] : businessName(row.businessId)) ?? (companyId ? "Hotel" : "Simpolis");
  const mine = row.fromCompanyId === me;
  return {
    id: row.id,
    kind: row.kind as MailKind,
    threadId: row.threadId,
    fromName: side(row.fromCompanyId),
    toName: side(row.toCompanyId),
    subject: row.subject,
    body: row.body,
    at: new Date(row.createdAt).toISOString(),
    read: mine || row.readAt !== null,
    mine,
    ...(row.contractId !== null && { contractId: row.contractId }),
    ...(row.referralId !== null && { referralId: row.referralId }),
  };
}

/** Prozor pošte: poruke hotela i ostala pošta (agencije, grad) spojene, najnovije prvo. Dvije liste su već svaka najnovije prvo. */
export function mergeMailRows(hotel: MailRow[], other: MailRow[]): MailRow[] {
  const at = (r: MailRow) => new Date(r.createdAt).getTime();
  return [...hotel, ...other].sort((a, b) => at(b) - at(a) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
}

// ---------- Baza ----------

export type NewMail = typeof mail.$inferInsert;

/** Upis pošte (jedan ili više redaka u jednoj naredbi), vraća upisane retke. */
export async function insertMail(rows: NewMail[]): Promise<MailRow[]> {
  if (rows.length === 0) return [];
  return db.insert(mail).values(rows).returning();
}

/**
 * E-mail ponude za ugovor `contractId`, upisan samo ako taj ugovor postoji (INSERT … SELECT), da ide u isti
 * `db.batch` kao i ponude: ponuda koju je preskočio `onConflictDoNothing` ne dobije e-mail.
 */
export function offerMailInsert(o: {
  contractId: string;
  threadId: string;
  businessId: string;
  subject: string;
  body: string;
}) {
  return db.insert(mail).select((qb) =>
    qb
      .select({
        id: sql`gen_random_uuid()`.as("id"),
        worldId: contracts.worldId,
        threadId: sql`${o.threadId}::uuid`.as("thread_id"),
        kind: sql`'agency'`.as("kind"),
        fromCompanyId: sql`null::uuid`.as("from_company_id"),
        toCompanyId: contracts.companyId,
        businessId: sql`${o.businessId}::text`.as("business_id"),
        subject: sql`${o.subject}::text`.as("subject"),
        body: sql`${o.body}::text`.as("body"),
        contractId: contracts.id,
        referralId: sql`null::uuid`.as("referral_id"),
        readAt: sql`null::timestamptz`.as("read_at"),
        createdAt: sql`now()`.as("created_at"),
      })
      .from(contracts)
      .where(eq(contracts.id, o.contractId)),
  );
}

/** Prvi e-mail uz ugovor (ponuda): nit i naslov za odgovore. */
export async function getOfferMail(contractId: string): Promise<MailRow | null> {
  const rows = await db
    .select()
    .from(mail)
    .where(eq(mail.contractId, contractId))
    .orderBy(mail.createdAt)
    .limit(1);
  return rows[0] ?? null;
}

const visibleTo = (companyId: string) => or(eq(mail.toCompanyId, companyId), eq(mail.fromCompanyId, companyId));

/** Primljena i poslana pošta tvrtke (po želji samo ona koja zadovoljava `only`), najnovije prvo. */
export async function listMailRows(companyId: string, limit?: number, only?: SQL): Promise<MailRow[]> {
  const q = db.select().from(mail).where(and(visibleTo(companyId), only)).orderBy(desc(mail.createdAt), desc(mail.id));
  return limit ? q.limit(limit) : q;
}

/**
 * Pošta u GET /api/me: zadnjih MAIL_LIMIT poruka hotela i, odvojeno, zadnjih MAIL_OTHER_LIMIT ponuda agencija i
 * obavijesti grada. Odvojeno zato što hotel može dobiti puno poruka od drugih hotela, a one ne smiju istisnuti
 * ponudu agencije iz prozora (nepročitani broj ih ionako broji sve).
 */
export async function listMailWindow(companyId: string): Promise<MailRow[]> {
  const [hotel, other] = await Promise.all([
    listMailRows(companyId, MAIL_LIMIT, eq(mail.kind, "hotel")),
    listMailRows(companyId, MAIL_OTHER_LIMIT, ne(mail.kind, "hotel")),
  ]);
  return mergeMailRows(hotel, other);
}

/** GET /api/me/mail: sva pošta tvrtke kao MailMessage, najnovije prvo. */
export async function loadMail(ctx: { world: { id: string }; company: { id: string } }): Promise<MailMessage[]> {
  const [rows, all] = await Promise.all([listMailRows(ctx.company.id), listCompanies(ctx.world.id)]);
  const names = Object.fromEntries(all.map(({ company }) => [company.id, company.name]));
  return rows.map((r) => toMailMessage(r, ctx.company.id, names));
}

/** Broj nepročitanih primljenih poruka. */
export async function countUnreadMail(companyId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(mail)
    .where(and(eq(mail.toCompanyId, companyId), isNull(mail.readAt)));
  return row?.n ?? 0;
}

/** Označi primljenu poruku pročitanom (poslana ostaje kakva jest); tuđa ili nepostojeća → 404. */
export async function markMailRead(companyId: string, mailId: string): Promise<{ ok: true }> {
  if (!isUuid(mailId)) throw new HttpError(404, "Poruka nije pronađena");
  const [row] = await db
    .update(mail)
    .set({ readAt: sql`coalesce(${mail.readAt}, now())` })
    .where(and(eq(mail.id, mailId), eq(mail.toCompanyId, companyId)))
    .returning({ id: mail.id });
  if (row) return { ok: true };
  const [own] = await db
    .select({ id: mail.id })
    .from(mail)
    .where(and(eq(mail.id, mailId), eq(mail.fromCompanyId, companyId)))
    .limit(1);
  if (!own) throw new HttpError(404, "Poruka nije pronađena");
  return { ok: true };
}

type MailCtx = { world: { id: string; status: string; round: number }; company: { id: string } };

/** Koliko je poruka hotel `companyId` poslao hotelima: u igri, u zadnjoj minuti i baš hotelu `toCompanyId` (jedan upit). */
export async function countSentMail(companyId: string, toCompanyId: string): Promise<MailCounts> {
  const [row] = await db
    .select({
      total: count(),
      recent: sql<number>`count(*) filter (where ${mail.createdAt} > now() - make_interval(secs => ${MAIL_WINDOW_SECONDS}))`.mapWith(Number),
      toRecipient: sql<number>`count(*) filter (where ${mail.toCompanyId} = ${toCompanyId})`.mapWith(Number),
    })
    .from(mail)
    .where(and(eq(mail.fromCompanyId, companyId), eq(mail.kind, "hotel")));
  return { total: row?.total ?? 0, recent: row?.recent ?? 0, toRecipient: row?.toRecipient ?? 0 };
}

/** `(select count(*) …) < max` nad porukama koje je hotel `from` poslao hotelima, sužene s `narrow` (podupit u istoj naredbi). */
const sentBelow = (from: string, max: number, narrow?: SQL) =>
  sql`(select count(*) from ${mail} where ${and(eq(mail.fromCompanyId, from), eq(mail.kind, "hotel"), narrow)}) < ${max}`;

/** Uvjeti granica slanja (MAIL_PER_GAME, MAIL_PER_RECIPIENT, MAIL_PER_MINUTE) kao SQL, iste kao u checkMailLimit. */
export function mailLimitsHold(from: string, to: string): SQL | undefined {
  return and(
    sentBelow(from, MAIL_PER_GAME),
    sentBelow(from, MAIL_PER_RECIPIENT, eq(mail.toCompanyId, to)),
    sentBelow(from, MAIL_PER_MINUTE, sql`${mail.createdAt} > now() - make_interval(secs => ${MAIL_WINDOW_SECONDS})`),
  );
}

/** Ključ zaključavanja slanja po pošiljatelju: sve tri granice su po pošiljatelju, pa se zahtjevi istog hotela slažu u red. */
export const sendLock = (from: string) => sql`select pg_advisory_xact_lock(hashtext(${`mail.send:${from}`}))`;

/**
 * Poruka hotelu upisana samo ako primatelj postoji u istoj igri, nije bot i granice slanja još drže (INSERT … SELECT
 * nad retkom primatelja, kao offerMailInsert). Bez retka u odgovoru nije ništa upisano. Mora ići iza `sendLock`.
 */
export function hotelMailInsert(o: { id: string; threadId: string; worldId: string; from: string; to: string; subject: string; body: string }) {
  return db
    .insert(mail)
    .select((qb) =>
      qb
        .select({
          id: sql`${o.id}::uuid`.as("id"),
          worldId: companies.worldId,
          threadId: sql`${o.threadId}::uuid`.as("thread_id"),
          kind: sql`'hotel'`.as("kind"),
          fromCompanyId: sql`${o.from}::uuid`.as("from_company_id"),
          toCompanyId: companies.id,
          businessId: sql`null::text`.as("business_id"),
          subject: sql`${o.subject}::text`.as("subject"),
          body: sql`${o.body}::text`.as("body"),
          contractId: sql`null::uuid`.as("contract_id"),
          referralId: sql`null::uuid`.as("referral_id"),
          readAt: sql`null::timestamptz`.as("read_at"),
          createdAt: sql`now()`.as("created_at"),
        })
        .from(companies)
        .where(and(eq(companies.id, o.to), eq(companies.worldId, o.worldId), ne(companies.kind, "bot"), mailLimitsHold(o.from, o.to))),
    )
    .returning();
}

/** Događaj `mail.sent` (bez teksta) za upisanu poruku `mailId`; ako poruke nema, ne upisuje se ništa. */
export function mailSentEvent(mailId: string, round: number) {
  return db.insert(events).select((qb) =>
    qb
      .select({
        id: sql`gen_random_uuid()`.as("id"),
        worldId: mail.worldId,
        companyId: mail.fromCompanyId,
        round: sql`${round}::int`.as("round"),
        type: sql`'mail.sent'`.as("type"),
        payload: sql`jsonb_build_object('mailId', ${mail.id}, 'toCompanyId', ${mail.toCompanyId})`.as("payload"),
        at: sql`now()`.as("at"),
      })
      .from(mail)
      .where(eq(mail.id, mailId)),
  );
}

/**
 * POST /api/me/mail (L18, #303): poruka hotelu iste igre, nova nit. Pošiljatelj je uvijek hotel iz kolačića
 * (tijelo ne nosi pošiljatelja). 400 oblik, duljina ili primatelj koji je bot, 404 hotel nije u ovoj igri,
 * 409 igra nije u tijeku, 429 previše poruka (granice u engine/mail-send.ts).
 *
 * Granice se provjeravaju u samom upisu, ne prije njega: jedna transakcija (db.batch) uzme zaključavanje po
 * pošiljatelju, pa INSERT … SELECT broji već upisane poruke i upiše novu samo ako granice drže. Istodobni zahtjevi
 * istog hotela tako idu jedan za drugim i nitko ne prođe granicu. Bez upisanog retka čitamo brojače samo da
 * vratimo pravu poruku. Događaj `mail.sent` ne ide u vijesti.
 */
export async function sendMail(ctx: MailCtx, input: unknown): Promise<MailMessage> {
  const check = checkSendMail(input, ctx.company.id);
  if (!check.ok) throw new HttpError(400, check.error);
  const r = check.data;
  if (ctx.world.status !== "running") throw new HttpError(409, "Igra nije u tijeku");
  const all = await listCompanies(ctx.world.id);
  const target = all.find(({ company }) => company.id === r.toCompanyId);
  const refusal = recipientRefusal(target && { isBot: target.company.kind === "bot" });
  if (refusal) throw new HttpError(refusal.status, refusal.error);
  const id = crypto.randomUUID();
  const [, inserted] = await db.batch([
    db.execute(sendLock(ctx.company.id)),
    hotelMailInsert({ id, threadId: crypto.randomUUID(), worldId: ctx.world.id, from: ctx.company.id, to: r.toCompanyId, subject: r.subject, body: r.body }),
    mailSentEvent(id, ctx.world.round),
  ]);
  const [row] = inserted;
  if (!row) {
    // Granica je dosegnuta (ili se u međuvremenu nešto promijenilo): poruka iz brojača, a ako ih je klizni prozor već pustio, općenita.
    throw new HttpError(429, checkMailLimit(await countSentMail(ctx.company.id, r.toCompanyId)) ?? "Poruka nije poslana. Pokušaj ponovno.");
  }
  const names = Object.fromEntries(all.map(({ company }) => [company.id, company.name]));
  return toMailMessage(row, ctx.company.id, names);
}

/** GET /api/prof/[worldId]/mail (L18): sve poruke među hotelima igre, najnovije prvo (`mine` je uvijek false). */
export async function loadWorldMail(worldId: string): Promise<MailMessage[]> {
  const [rows, all] = await Promise.all([
    db
      .select()
      .from(mail)
      .where(and(eq(mail.worldId, worldId), eq(mail.kind, "hotel")))
      .orderBy(desc(mail.createdAt), desc(mail.id)),
    listCompanies(worldId),
  ]);
  const names = Object.fromEntries(all.map(({ company }) => [company.id, company.name]));
  return rows.map((r) => toMailMessage(r, "", names));
}
