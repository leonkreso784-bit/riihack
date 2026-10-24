// S11: the city business writes the reply to a counter-offer. The ENGINE decided the outcome and the numbers;
// the AI only words the email, and a deterministic guard rejects any number that did not come from the engine.
import { generateText, type LanguageModel } from "ai";
import { MAIL_BODY_MAX } from "@/lib/rules";
import type { AgencyReplyInput } from "@/lib/game/mail"; // type only: erased at build, so no import cycle
import { aiEnabled, modelFor, withAi } from "./client";
import { agencyReplyFallback } from "./fallbacks";
import { AGENCY_SYSTEM } from "./prompts";

/** Neutralise angle brackets so the student's text cannot close or open our prompt tags. */
const clean = (text: string) => text.replace(/</g, "‹").replace(/>/g, "›");

const SLASH_GENDER = /\p{L}\/(la|a|ica|ka)\b/u;
const OUTCOME_LABEL = { accepted: "PRIHVAĆENO", countered: "PROTUPONUDA (nađimo se na pola puta)", rejected: "ODBIJENO" } as const;
const KIND_LABEL = { agency: "agencija", laundry: "praonica", bakery: "pekara", security: "zaštitarska tvrtka", supplier: "dobavljač" } as const;
const eur = (n: number) => `${n.toLocaleString("hr-HR")} €`;

/** All numbers in a text as plain values: "1.200 €" -> 1200, "12,5 %" -> 12.5. */
export function numbersIn(text: string): number[] {
  const found = text.match(/\d[\d.,]*/g) ?? [];
  return found.map((raw) => {
    const s = raw.replace(/[.,]+$/, "");
    if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ""));
    return Number(s.replace(",", "."));
  });
}

function terms(i: AgencyReplyInput): string {
  const parts: string[] = [];
  if (i.contract.nights > 0) parts.push(`${i.contract.nights} noćenja mjesečno po ${eur(i.agreed.pricePerNight)} po noćenju`);
  if (i.agreed.monthlyCost > 0) parts.push(`mjesečna naknada ${eur(i.agreed.monthlyCost)}`);
  return parts.join(", ") || "bez novčanih uvjeta";
}

function userPrompt(i: AgencyReplyInput, error?: string): string {
  const c = i.contract;
  const original = [c.nights > 0 ? `${c.nights} noćenja po ${eur(c.pricePerNight)}` : "", c.monthlyCost > 0 ? `naknada ${eur(c.monthlyCost)} mjesečno` : ""]
    .filter(Boolean)
    .join(", ");
  const lines = [
    `Tvrtka: ${clean(i.business.name)} (${KIND_LABEL[i.business.kind]}). ${clean(i.business.description)}`,
    `Ponuda: ${clean(c.title)}. Izvorna ponuda: ${original}. Trajanje: ${c.durationRounds} mj.`,
    `Ishod: ${OUTCOME_LABEL[i.outcome]}`,
    i.outcome === "rejected" ? "Dogovoreni uvjeti: nema (ne navodi nove brojke)." : `Dogovoreni uvjeti (navedi točno ove): ${terms(i)}.`,
  ];
  const message = i.studentMessage?.trim();
  if (message) lines.push(`<poruka_hotela>${clean(message)}</poruka_hotela>`);
  lines.push("Napiši e-mail.");
  if (error) lines.push(`Prethodni pokušaj nije prošao provjeru (${error}). Ispravi to.`);
  return lines.join("\n\n");
}

/** Why a reply is not usable, or null. The number check is the safety net for "the AI never changes a number". */
export function agencyProblem(text: string, i: AgencyReplyInput): string | null {
  if (!text.trim()) return "tekst je prazan";
  if (text.length > MAIL_BODY_MAX) return `tekst je dulji od ${MAIL_BODY_MAX} znakova`;
  if (SLASH_GENDER.test(text)) return "oblici s kosom crtom nisu dopušteni";
  const c = i.contract;
  const allowed = new Set([0, i.agreed.pricePerNight, i.agreed.monthlyCost, c.nights, c.durationRounds, c.pricePerNight, c.monthlyCost]);
  const found = numbersIn(text);
  const stray = found.find((n) => !allowed.has(n));
  if (stray !== undefined) return `broj ${stray} nije među dogovorenim brojkama`;
  if (i.outcome !== "rejected") {
    if (c.nights > 0 && !found.includes(i.agreed.pricePerNight)) return `dogovorena cijena ${i.agreed.pricePerNight} nije navedena`;
    if (i.agreed.monthlyCost > 0 && !found.includes(i.agreed.monthlyCost)) return `dogovorena naknada ${i.agreed.monthlyCost} nije navedena`;
  }
  return null;
}

/**
 * The business's email reply. Retries once with the problem stated; AI off, error, timeout or two bad replies give the
 * fixed fallback for the outcome. The numbers in the text are always the engine's.
 */
export function agencyReply(i: AgencyReplyInput, model?: LanguageModel): Promise<string> {
  const fallback = agencyReplyFallback(i);
  if (!aiEnabled() && !model) return Promise.resolve(fallback);
  return withAi<string>(async () => {
    let error: string | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await generateText({
        model: modelFor("character", model),
        instructions: { role: "system", content: AGENCY_SYSTEM, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } },
        prompt: userPrompt(i, error),
        maxOutputTokens: 1500,
        providerOptions: { anthropic: { thinking: { type: "disabled" } } }, // a short email needs no reasoning; thinking ate the whole budget
      });
      const text = result.text.trim();
      const found = agencyProblem(text, i);
      if (!found) return text;
      error = found;
    }
    return fallback;
  }, fallback);
}
