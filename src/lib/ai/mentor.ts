// S4: the Socratic mentor. One question after a round, one debrief after the student's reflection.
import { generateText, type LanguageModel } from "ai";
import { METRIC_LABELS, ROUND_LABELS } from "@/lib/rules";
import type { MentorInput, MentorItem, MetricKey, RoundFinance } from "@/lib/types";
import { CACHE_SYSTEM, LOW_EFFORT, maxOutputFor, modelFor, withAi } from "./client";
import { fallbackDebrief, fallbackMentorQuestion, fallbackReview } from "./fallbacks";
import { MENTOR_DEBRIEF_SYSTEM, MENTOR_QUESTION_SYSTEM, MENTOR_REVIEW_SYSTEM } from "./prompts";

/** Neutralise angle brackets so student text cannot close or open our prompt tags. */
export const clean = (text: string) => text.replace(/</g, "‹").replace(/>/g, "›");

const MIN_QUESTION_WORDS = 4; // a bare "300 €?" is not a question
const MAX_QUESTION_WORDS = 25;
const MAX_DEBRIEF_CHARS = 1200;
const DEBRIEF_TIMEOUT_MS = 35_000; // two Sonnet attempts of 5 to 9 s each must fit; the student waits on this call
const LEAKED_ID = /\b(kriterij|k|c)\s*\d|\bkriterija\b/i;
const SLASH_GENDER = /\p{L}+\/\p{L}+/u; // "ispričao/la"; "€/noć" and "58/100" have no letter before the slash
const metricKeys = Object.keys(METRIC_LABELS) as MetricKey[];

const noSlashGender = (text: string) => !SLASH_GENDER.test(text.replace(/\bi\/ili\b/gi, ""));
// The model once wrote Cyrillic letters inside a Croatian word ("mog" + Cyrillic "lo", review SVJEZEOCI-03); the text here is Latin only.
const noCyrillic = (text: string) => !/[\u0400-\u04FF]/.test(text);
const noRawKeys = (text: string) => !new RegExp(`\\b(${metricKeys.join("|")})\\b`).test(text) && !/\bcent[ia]?\b/i.test(text);
const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");
/** Whole predicate after "Student": "Student je nije odgovorio" was ungrammatical (review AI-TOKOVI-03). */
const MODE_LABELS = { click: "je odabrao ponuđenu opciju", own: "je napisao vlastiti odgovor", none: "nije odgovorio" } as const;
/** An own answer with no text (ADR-049 allows it): the mentor must not talk about "your answer". */
const emptyOwn = (i: MentorItem) => i.mode === "own" && !i.answerText?.trim();
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
    // f.nights are market nights only; occupancy counts contract nights too (review AI-TOKOVI-04).
    `- Noćenja: ${f.nights + f.contractNights} od ${f.capacityNights} mogućih, popunjenost ${f.occupancyPct} %; od toga ${f.contractNights} po ugovorima`,
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
        emptyOwn(i)
          ? `  Student je poslao PRAZAN odgovor (ništa nije napisao); kvaliteta ${i.quality} od 5. Nema odgovora o kojem bi se pričalo.`
          : `  Student ${MODE_LABELS[i.mode]}; kvaliteta ${i.quality} od 5.`,
      ];
      if (i.answerText?.trim()) lines.push(`  <odgovor_studenta>${clean(i.answerText)}</odgovor_studenta>`);
      if (missed.length) lines.push(`  Što je nedostajalo: ${missed.map(clean).join("; ")}`);
      return lines.join("\n");
    })
    .join("\n");
  const finance = input.finance ? `\n\n${financeBlock(input.finance)}` : "";
  return `Hotel: ${clean(input.hotelName)}\nKrug: ${month}\n\nPokazatelji (prije → poslije):\n${metrics}${finance}\n\nOdluke u krugu:\n${items || "- (nema odluka)"}`;
}

/** `action` is the label in the usage log: "mentor-pitanje", "mentor-razgovor" or "mentor-osvrt". */
async function ask(action: string, system: string, prompt: string, model?: LanguageModel): Promise<string> {
  const { text } = await generateText({
    model: modelFor("mentor", model, action),
    instructions: { role: "system", content: system, providerOptions: CACHE_SYSTEM },
    prompt,
    maxOutputTokens: maxOutputFor("mentor", 1200),
    // Sonnet 5.5 thinks by default and cannot turn it off: the debrief took 8 to 16 s per call, so two attempts ran
    // past the 20 s cap and the student got the fixed fallback text (audit 24.10.). Low effort: the mentor only
    // explains facts it is given.
    providerOptions: LOW_EFFORT,
  });
  return text.trim();
}

/**
 * Keep only the first sentence that ends with "?"; null when there is none.
 * Uses splitSentences so "2.300 €", "npr." and "3. kvartal" inside the question do not cut it.
 */
export function firstQuestion(text: string): string | null {
  const flat = text.replace(/\s+/g, " ").trim();
  const sentence = splitSentences(flat).find((s) => /\?["”“»]?$/.test(s));
  const q = sentence?.replace(/["”“»]+$/, "").trim().replace(/^["„“'-]+\s*/, "");
  return q && q.length > 1 ? q : null;
}

function questionOk(q: string | null): q is string {
  return (
    q !== null &&
    wordCount(q) >= MIN_QUESTION_WORDS &&
    wordCount(q) <= MAX_QUESTION_WORDS &&
    noSlashGender(q) &&
    noCyrillic(q) &&
    !LEAKED_ID.test(q) &&
    noRawKeys(q)
  );
}

/** One Croatian question, at most 25 words, about the weakest decision. Any failure gives the fixed question. */
export function mentorQuestion(input: MentorInput, model?: LanguageModel): Promise<string> {
  return withAi(async () => {
    const prompt = `${factsBlock(input)}\n\nPostavi jedno pitanje o odluci označenoj kao NAJSLABIJA ODLUKA.`;
    for (let attempt = 0; attempt < 2; attempt++) {
      const q = firstQuestion(await ask("mentor-pitanje", MENTOR_QUESTION_SYSTEM, prompt, model));
      if (questionOk(q)) return q;
    }
    return fallbackMentorQuestion(input);
  }, fallbackMentorQuestion(input));
}

const ABBREVIATIONS = /(?:^|\s)(?:npr|tj|itd|itp|tzv|sl|dr|br|ul|mr|sv|pr|tel|vl|ok|cca)\.$/i;
const MAX_SENTENCES = 5;

/** Splits on sentence ends; "npr.", "itd.", "3. kvartal" and "8.400 €" do not end a sentence. */
export function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?]["”“»]?)\s+/);
  const out: string[] = [];
  for (const part of parts) {
    const prev = out[out.length - 1];
    // A sentence that already ended with "?" or "!" is closed: text after it is a new sentence even when it starts with a
    // lowercase letter, a digit or "(" (review PR-INTEGRACIJA-02: "…u srpnju? (Razmisli o konkurenciji.)" gave no question).
    const closed = prev !== undefined && /[?!]["”“»]?$/.test(prev);
    const glue = prev !== undefined && !closed && (ABBREVIATIONS.test(prev) || /^[\p{Ll}\d(]/u.test(part));
    if (glue) out[out.length - 1] = `${prev} ${part}`;
    else out.push(part);
  }
  return out.filter((s) => /\p{L}/u.test(s));
}

/** Removes markdown the model sometimes adds (headings, bullets, bold, numbering) and joins everything into one paragraph. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^\s*(#{1,6}\s+|[-*•]\s+|\d+[.)]\s+)/gm, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/\s*\n+\s*/g, " ")
    .trim();
}

/** Too long is repaired, not rejected: keeps the opening and, when it is a question, the closing sentence. */
export function repairDebrief(raw: string): string {
  const text = stripMarkdown(raw);
  let sentences = splitSentences(text);
  const closing = sentences[sentences.length - 1];
  if (sentences.length > MAX_SENTENCES) {
    const keepQuestion = closing.endsWith("?");
    sentences = keepQuestion ? [...sentences.slice(0, MAX_SENTENCES - 1), closing] : sentences.slice(0, MAX_SENTENCES);
  }
  // Still over the character cap: drop middle sentences (never the first, never a closing question) down to 3.
  while (sentences.join(" ").length > MAX_DEBRIEF_CHARS && sentences.length > 3) {
    sentences.splice(sentences.length - 2, 1);
  }
  return sentences.join(" ");
}

/** Why a debrief is rejected, or null when it passes. */
export function debriefProblem(text: string): string | null {
  const n = splitSentences(text).length;
  if (n < 3 || n > 5) return `sentences:${n}`;
  if (text.length > MAX_DEBRIEF_CHARS) return `length:${text.length}`;
  if (!noSlashGender(text)) return "slash-gender";
  if (!noCyrillic(text)) return "cyrillic";
  if (LEAKED_ID.test(text)) return "leaked-id";
  if (!noRawKeys(text)) return "raw-key";
  return null;
}

/** 3 to 5 sentences building on the reflection. Any failure gives the debrief built from the numbers. */
export function mentorDebrief(
  input: MentorInput & { question: string; reflection: string },
  model?: LanguageModel,
): Promise<string> {
  return withAi(async () => {
    const prompt = `${factsBlock(input)}\n\n<pitanje_mentora>${clean(input.question)}</pitanje_mentora>\n\n<refleksija>${clean(input.reflection)}</refleksija>`;
    for (let attempt = 0; attempt < 2; attempt++) {
      const text = repairDebrief(await ask("mentor-razgovor", MENTOR_DEBRIEF_SYSTEM, prompt, model));
      const problem = debriefProblem(text);
      if (problem === null) return text;
      console.warn("[ai] mentor debrief rejected:", problem);
    }
    return fallbackDebrief(input);
  }, fallbackDebrief(input), DEBRIEF_TIMEOUT_MS);
}

const MAX_REVIEW_SENTENCES = 7; // 4 to 6 sentences plus the closing question
const MAX_REVIEW_CHARS = 1400;
const REVIEW_TIMEOUT_MS = 20_000;

/** Why an automatic review is rejected, or null when it passes. */
export function reviewProblem(text: string): string | null {
  const n = splitSentences(text).length;
  if (n < 3 || n > MAX_REVIEW_SENTENCES) return `sentences:${n}`;
  if (text.length > MAX_REVIEW_CHARS) return `length:${text.length}`;
  if (!noSlashGender(text)) return "slash-gender";
  if (!noCyrillic(text)) return "cyrillic";
  if (LEAKED_ID.test(text)) return "leaked-id";
  if (!noRawKeys(text)) return "raw-key";
  return null;
}

/**
 * The mentor's own review once the month is settled, without the student asking: what went well, what did not
 * (by the numbers), one tip, then the mentor's question if given. Any failure gives the review built from the numbers.
 */
export function mentorReview(input: MentorInput & { question?: string }, model?: LanguageModel): Promise<string> {
  return withAi(async () => {
    const question = input.question?.trim() ? `

<pitanje_mentora>${clean(input.question)}</pitanje_mentora>` : "";
    const prompt = `${factsBlock(input)}${question}

Napiši osvrt na ovaj mjesec.`;
    for (let attempt = 0; attempt < 2; attempt++) {
      const text = stripMarkdown(await ask("mentor-osvrt", MENTOR_REVIEW_SYSTEM, prompt, model));
      const problem = reviewProblem(text);
      if (problem === null) return text;
      console.warn("[ai] mentor review rejected:", problem);
    }
    return fallbackReview(input);
  }, fallbackReview(input), REVIEW_TIMEOUT_MS);
}
