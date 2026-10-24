// S2: the AI judge. Decides which rubric criteria an answer meets; the engine turns that into a quality score.
import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import type { JudgeInput, Verdict } from "@/lib/types";
import { modelFor, withAi } from "./client";
import { JUDGE_SYSTEM } from "./prompts";

/** Neutralise angle brackets so user or character text cannot close or open our prompt tags. */
const clean = (text: string) => text.replace(/</g, "‹").replace(/>/g, "›");

const MAX_REASONING_CHARS = 400;
const LEAKED_ID = /\b(kriterij|k)\s*\d|odgovor\s*\d|\bk\d\b/i;
const SLASH_GENDER = /\p{L}\/(la|a|ica)\b/u; // "ispričao/la": the prompt forbids it, so retry, then replace the text

function reasoningOk(reasoning: string): boolean {
  const text = reasoning.trim();
  return text.length > 0 && text.length <= MAX_REASONING_CHARS && !LEAKED_ID.test(text) && !SLASH_GENDER.test(text);
}

/** Rubric text without the examples in brackets, lower-cased first letter, for a sentence. */
const short = (text: string) => {
  const t = text.replace(/\s*[[(][^\])]*[\])]/g, "").trim();
  return t.charAt(0).toLowerCase() + t.slice(1);
};

/**
 * Deterministic reasoning from the rubric, used when the model's own text fails the style check twice (BUG-009).
 * A style problem must never throw away the criteria the model ticked.
 */
export function rubricReasoning(template: JudgeInput["template"], met: string[]): string {
  const done = template.rubric.filter((c) => met.includes(c.id)).map((c) => short(c.text));
  const missing = template.rubric.filter((c) => !met.includes(c.id)).map((c) => short(c.text));
  const parts: string[] = [];
  if (done.length) parts.push(`Dobro: ${done.join("; ")}.`);
  parts.push(missing.length ? `Nedostaje: ${missing.join("; ")}.` : "Ništa bitno nije nedostajalo.");
  const text = parts.join(" ");
  return text.length <= MAX_REASONING_CHARS ? text : text.slice(0, MAX_REASONING_CHARS - 1).trimEnd() + "…";
}

/** Stable part first (cacheable): rules, situation and rubric. */
function stablePrompt({ template }: JudgeInput): string {
  const rubric = template.rubric.map((c) => `- ${c.id}: ${clean(c.text)}`).join("\n");
  return `${JUDGE_SYSTEM}\n\nSituacija: ${clean(template.title)}\n${clean(template.text)}\nLik: ${clean(template.character.name)}, ${clean(template.character.role)}\n\nRubrika:\n${rubric}`;
}

/** Varying part last: the conversation and the final answer. */
function userPrompt({ transcript, text }: JudgeInput): string {
  const turns = transcript
    .map((t) => (t.role === "student" ? `<student>${clean(t.text)}</student>` : `<lik>${clean(t.text)}</lik>`))
    .join("\n");
  return `<razgovor>\n${turns}\n</razgovor>\n\n<odgovor_studenta>${clean(text)}</odgovor_studenta>`;
}

/**
 * Judges the answer. Returns null (engine then uses FALLBACK_QUALITY) only when the AI fails or times out.
 * If the reasoning fails the style check twice (empty, too long, criterion numbers, "ispričao/la"), the ticked criteria
 * are kept and the reasoning is built from the rubric instead (BUG-009). Errors are handled by `withAi`.
 * No `temperature` is passed: claude-sonnet-5-5 ignores it (AI SDK warns), so the schema and the strict prompt keep it steady.
 */
export function judge(input: JudgeInput, model?: LanguageModel): Promise<Verdict | null> {
  return withAi<Verdict | null>(async () => {
    const ids = input.template.rubric.map((c) => c.id);
    if (ids.length === 0) return null;
    const schema = z.object({
      // Plain strings on purpose: an enum would make one invented id fail the whole call. We filter to rubric ids below.
      criteriaMet: z.array(z.string()).describe(`Samo oznake iz rubrike: ${ids.join(", ")}`),
      reasoning: z.string(),
    });
    const system = stablePrompt(input);
    const user = userPrompt(input);

    let met: string[] = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await generateText({
        model: modelFor("judge", model),
        output: Output.object({ schema }),
        // Cache breakpoint on the stable prefix; the varying answer and transcript come last.
        instructions: { role: "system", content: system, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } },
        prompt: user,
      });
      const { criteriaMet, reasoning } = result.output;
      met = [...new Set(criteriaMet.filter((id) => ids.includes(id)))];
      if (reasoningOk(reasoning)) return { criteriaMet: met, reasoning: reasoning.trim() };
    }
    return { criteriaMet: met, reasoning: rubricReasoning(input.template, met) };
  }, null);
}
