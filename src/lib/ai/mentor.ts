// S4: the Socratic mentor. One question after a round, one debrief after the student's reflection.
import { generateText, type LanguageModel } from "ai";
import { METRIC_LABELS, ROUND_LABELS } from "@/lib/rules";
import type { MentorInput, MentorItem, MetricKey, RoundFinance } from "@/lib/types";
import { modelFor, withAi } from "./client";
import { fallbackDebrief, fallbackMentorQuestion } from "./fallbacks";
import { MENTOR_DEBRIEF_SYSTEM, MENTOR_QUESTION_SYSTEM } from "./prompts";

/** Neutralise angle brackets so student text cannot close or open our prompt tags. */
export const clean = (text: string) => text.replace(/</g, "‹").replace(/>/g, "›");

const MAX_QUESTION_WORDS = 25;
const MAX_DEBRIEF_CHARS = 1200;
const LEAKED_ID = /\b(kriterij|k|c)\s*\d|\bkriterija\b/i;
const SLASH_GENDER = /\p{L}+\/\p{L}+/u; // "ispričao/la"; "€/noć" and "58/100" have no letter before the slash
const metricKeys = Object.keys(METRIC_LABELS) as MetricKey[];

const noSlashGender = (text: string) => !SLASH_GENDER.test(text.replace(/\bi\/ili\b/gi, ""));
const noRawKeys = (text: string) => !new RegExp(`\\b(${metricKeys.join("|")})\\b`).test(text) && !/\bcent[ia]?\b/i.test(text);
const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");
const MODE_LABELS = { click: "odabrao ponuđenu opciju", own: "napisao vlastiti odgovor", none: "nije odgovorio" } as const;
const looksLikeId = (s: string) => /^[a-z]{0,2}\d+$/i.test(s.trim());

/** The weakest decision: lowest quality, the first one on a tie. */
export function weakestItem(items: MentorItem[]): MentorItem | undefined {
  return items.reduce<MentorItem | undefined>((w, i) => (!w || i.quality < w.quality ? i : w), undefined);
}

const eur = (n: number) => `${n.toLocaleString("hr-HR")} €`;

/** The month's accounts as the engine computed them, in euros and percent. The mentor explains them and never recomputes. */
export function financeBlock(f: RoundFinance): string {
  return [
    "Obračun mjeseca (izračunala ga je jezgra igre):",
    `- Noćenja: ${f.nights} od ${f.capacityNights} mogućih, popunjenost ${f.occupancyPct} %; od toga ${f.contractNights} po ugovorima`,
    `- Tržišni udio: ${f.marketSharePct} %`,
    `- Prihod: ${eur(f.revenue)}; troškovi: ${eur(f.costs)}; dobit: ${eur(f.profit)}`,
    `- Novac nakon mjeseca: ${eur(f.cashAfter)}`,
  ].join("\n");
}

/** Facts in human units only: Croatian labels, "/100", deltas like "+6", month names. Never raw keys. */
export function factsBlock(input: MentorInput): string {
  const month = ROUND_LABELS[input.round - 1] ?? `${input.round}. krug`;
  const metrics = metricKeys
    .map((k) => {
      const before = input.metricsBefore[k];
      const after = input.metricsAfter[k];
      return `- ${METRIC_LABELS[k]}: ${before}/100 → ${after}/100 (${signed(after - before)})`;
    })
    .join("\n");
  const weakest = weakestItem(input.items);
  const items = input.items
    .map((i) => {
      const missed = i.criteriaMissed.filter((m) => !looksLikeId(m));
      const lines = [
        `- Situacija: ${clean(i.title)}${i === weakest ? " (NAJSLABIJA ODLUKA)" : ""}`,
        `  Student je ${MODE_LABELS[i.mode]}; kvaliteta ${i.quality} od 5.`,
      ];
      if (i.answerText) lines.push(`  <odgovor_studenta>${clean(i.answerText)}</odgovor_studenta>`);
      if (missed.length) lines.push(`  Što je nedostajalo: ${missed.map(clean).join("; ")}`);
      return lines.join("\n");
    })
    .join("\n");
  const finance = input.finance ? `\n\n${financeBlock(input.finance)}` : "";
  return `Hotel: ${clean(input.hotelName)}\nKrug: ${month}\n\nPokazatelji (prije → poslije):\n${metrics}${finance}\n\nOdluke u krugu:\n${items || "- (nema odluka)"}`;
}

const cache = { anthropic: { cacheControl: { type: "ephemeral" as const } } };

async function ask(system: string, prompt: string, model?: LanguageModel): Promise<string> {
  const { text } = await generateText({
    model: modelFor("mentor", model),
    instructions: { role: "system", content: system, providerOptions: cache },
    prompt,
  });
  return text.trim();
}

/** Keep only the first sentence that ends with "?"; null when there is none. */
export function firstQuestion(text: string): string | null {
  const flat = text.replace(/\s+/g, " ").trim();
  const match = flat.match(/[^.!?]*\?/);
  const q = match?.[0].trim().replace(/^["„“'-]+\s*/, "");
  return q && q.length > 1 ? q : null;
}

function questionOk(q: string | null): q is string {
  return q !== null && wordCount(q) <= MAX_QUESTION_WORDS && noSlashGender(q) && !LEAKED_ID.test(q) && noRawKeys(q);
}

/** One Croatian question, at most 25 words, about the weakest decision. Any failure gives the fixed question. */
export function mentorQuestion(input: MentorInput, model?: LanguageModel): Promise<string> {
  return withAi(async () => {
    const prompt = `${factsBlock(input)}\n\nPostavi jedno pitanje o odluci označenoj kao NAJSLABIJA ODLUKA.`;
    for (let attempt = 0; attempt < 2; attempt++) {
      const q = firstQuestion(await ask(MENTOR_QUESTION_SYSTEM, prompt, model));
      if (questionOk(q)) return q;
    }
    return fallbackMentorQuestion(input);
  }, fallbackMentorQuestion(input));
}

const sentenceCount = (text: string) => text.split(/(?<=[.!?])\s+/).filter((s) => /\p{L}/u.test(s)).length;

function debriefOk(text: string): boolean {
  const n = sentenceCount(text);
  return n >= 3 && n <= 5 && text.length <= MAX_DEBRIEF_CHARS && noSlashGender(text) && !LEAKED_ID.test(text) && noRawKeys(text);
}

/** 3 to 5 sentences building on the reflection. Any failure gives the debrief built from the numbers. */
export function mentorDebrief(
  input: MentorInput & { question: string; reflection: string },
  model?: LanguageModel,
): Promise<string> {
  return withAi(async () => {
    const prompt = `${factsBlock(input)}\n\n<pitanje_mentora>${clean(input.question)}</pitanje_mentora>\n\n<refleksija>${clean(input.reflection)}</refleksija>`;
    for (let attempt = 0; attempt < 2; attempt++) {
      const text = (await ask(MENTOR_DEBRIEF_SYSTEM, prompt, model)).replace(/\s*\n+\s*/g, " ");
      if (debriefOk(text)) return text;
    }
    return fallbackDebrief(input);
  }, fallbackDebrief(input));
}
