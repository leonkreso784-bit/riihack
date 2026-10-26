// Poruka drugom hotelu (L18, #303): oblik, duljine i granice slanja. Čisto (bez baze), pa isti kod provjerava obrazac
// u pregledniku i POST /api/me/mail (kao counterError u negotiate.ts).
import * as z from "zod/mini"; // mini, not "zod": this file ships to the browser (client.ts imports it) and mini costs about 5 KB gzip instead of tens
import { MAIL_BODY_MAX, MAIL_SUBJECT_MAX } from "@/lib/rules";
import type { MailMessage, SendMailRequest } from "@/lib/types";

// Granice slanja po hotelu. Igru može otvoriti svatko, a slobodan tekst među hotelima bez granice znači poplavu
// pošte. Granice su po pošiljatelju: ne štite same sebe od više pošiljatelja istom primatelju, pa Pošta primatelju
// hotelske poruke prikazuje u vlastitom prozoru (listMailWindow u game/mail.ts) i ne potiskuju ponude agencija.
export const MAIL_PER_MINUTE = 5; // zaštita od niza zahtjeva u kratkom roku
export const MAIL_PER_GAME = 60; // ukupno po hotelu u igri
export const MAIL_PER_RECIPIENT = 15; // po hotelu primatelju u igri
export const MAIL_WINDOW_SECONDS = 60;

const MSG_RECIPIENT = "Odaberi hotel kojem pišeš";
const MSG_SELF = "Ne možeš pisati sam sebi";
const MSG_SUBJECT = `Naslov mora imati od 1 do ${MAIL_SUBJECT_MAX} znakova`;
const MSG_BODY = `Tekst mora imati od 1 do ${MAIL_BODY_MAX} znakova`;

/** Shema poruke za hotel `me`: naslov i tekst obrezani, 1 do najviše znakova; primatelj je odabran i nije on sam. */
export function sendMailSchema(me: string) {
  const text = (message: string, max: number) =>
    z.string({ error: message }).check(z.trim(), z.minLength(1, message), z.maxLength(max, message));
  return z.object(
    {
      toCompanyId: z.string({ error: MSG_RECIPIENT }).check(z.minLength(1, MSG_RECIPIENT), z.refine((id) => id !== me, MSG_SELF)),
      subject: text(MSG_SUBJECT, MAIL_SUBJECT_MAX),
      body: text(MSG_BODY, MAIL_BODY_MAX),
    },
    { error: "Neispravna poruka" },
  );
}

export type SendMailFields = Partial<Record<keyof SendMailRequest, string>>;
export type SendMailCheck =
  | { ok: true; data: SendMailRequest }
  | { ok: false; error: string; fields: SendMailFields }; // error = prva greška, fields = prva greška po polju

/** Provjera poruke iz nepouzdanog ulaza. `data` je obrezan, a nepoznata polja (npr. `fromCompanyId`) se odbacuju. */
export function checkSendMail(input: unknown, me: string): SendMailCheck {
  const parsed = sendMailSchema(me).safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  const fields: SendMailFields = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof SendMailRequest | undefined;
    if (key !== undefined && !(key in fields)) fields[key] = issue.message;
  }
  return { ok: false, error: parsed.error.issues[0].message, fields };
}

/** Koliko je hotel već poslao: ukupno u igri, u zadnjoj minuti (MAIL_WINDOW_SECONDS) i baš ovom primatelju. */
export type MailCounts = { total: number; recent: number; toRecipient: number };

/** Poruka greške ako je granica dosegnuta (redom: igra, primatelj, minuta), inače null. */
export function checkMailLimit({ total, recent, toRecipient }: MailCounts): string | null {
  if (total >= MAIL_PER_GAME) return "Dosegnut je najveći broj poruka koje hotel smije poslati u ovoj igri";
  if (toRecipient >= MAIL_PER_RECIPIENT) return "Ovom si hotelu već poslao najveći dopušteni broj poruka u ovoj igri";
  if (recent >= MAIL_PER_MINUTE) return "Previše poruka u zadnjoj minuti. Pričekaj malo pa pokušaj ponovno.";
  return null;
}

const MSG_NOT_FOUND = "Hotel nije pronađen";
const MSG_BOT = "Hotel vodi računalo i ne čita poruke";

/**
 * Primatelj koji ne smije dobiti poruku: ne postoji u igri → 404, vodi ga računalo (ADR-044, nitko ne čita
 * njegovu poštu) → 400. `null` = može. Isto pravilo koristi poslužitelj (sendMail) i lažni API u pregledniku.
 */
export function recipientRefusal(target: { isBot: boolean } | undefined): { status: 400 | 404; error: string } | null {
  if (!target) return { status: 404, error: MSG_NOT_FOUND };
  if (target.isBot) return { status: 400, error: MSG_BOT };
  return null;
}

/** Skrati tekst na `max` znakova, "…" na kraju kad je skraćen. */
export const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/** Naslov odgovora: "Re: " ispred naslova (jednom), skraćen na MAIL_SUBJECT_MAX. */
export const replySubject = (subject: string) => clip(subject.startsWith("Re: ") ? subject : `Re: ${subject}`, MAIL_SUBJECT_MAX);

/**
 * Pošta koju stranica prikazuje: ono što je poslužitelj vratio plus upravo poslane poruke koje se još nisu pojavile
 * u odgovoru (poruka se po id-u ne udvostručuje kad je anketa vrati).
 */
export function mergeSentMail(stored: MailMessage[], sent: MailMessage[]): MailMessage[] {
  const known = new Set(stored.map((m) => m.id));
  return [...stored, ...sent.filter((m) => !known.has(m.id))];
}
