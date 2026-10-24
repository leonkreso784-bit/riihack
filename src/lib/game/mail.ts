// Pošta (L15): e-mail ponude agencije, protuponuda hotela i odgovor agencije. Poruke među hotelima (L18) dodaju
// `sendMail` ovdje i pišu kroz isti `mailValues` / `insertMail`.
import { and, count, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { isUuid, listCompanies } from "@/db/queries";
import { contracts, mail } from "@/db/schema";
import type { MailRow } from "@/db/schema";
import { CITY } from "@/content";
import { eur } from "@/lib/format";
import { HttpError } from "@/lib/http";
import { MAIL_BODY_MAX, MAIL_SUBJECT_MAX } from "@/lib/rules";
import type { CityBusiness, ContractTemplate, MailKind, MailMessage, NegotiationOutcome } from "@/lib/types";

export const MAIL_LIMIT = 30;
type Terms = Pick<ContractTemplate, "nights" | "pricePerNight" | "monthlyCost">;

// ---------- Čisti dijelovi (bez baze, testirani u mail.test.ts) ----------

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
const months = (n: number) => (n === 1 ? "1 mjesec" : `${n} mjeseca`);

/** Uvjeti ugovora jednom rečenicom: noćenja po cijeni i/ili mjesečna naknada. */
export function termsText(t: Terms): string {
  const parts: string[] = [];
  if (t.nights > 0) parts.push(`${t.nights} noćenja mjesečno po ${eur(t.pricePerNight)}`);
  if (t.monthlyCost > 0) parts.push(`naknada ${eur(t.monthlyCost)} mjesečno`);
  return parts.join(", ");
}

export const offerSubject = (t: ContractTemplate) => clip(`Ponuda: ${t.title}`, MAIL_SUBJECT_MAX);
export const replySubject = (subject: string) => clip(subject.startsWith("Re: ") ? subject : `Re: ${subject}`, MAIL_SUBJECT_MAX);

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
  return clip(agencyFallback(i), MAIL_BODY_MAX);
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

/** Primljena i poslana pošta tvrtke, najnovije prvo. */
export async function listMailRows(companyId: string, limit?: number): Promise<MailRow[]> {
  const q = db.select().from(mail).where(visibleTo(companyId)).orderBy(desc(mail.createdAt), desc(mail.id));
  return limit ? q.limit(limit) : q;
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
