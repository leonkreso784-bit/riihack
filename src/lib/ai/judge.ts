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

function reasoningOk(reasoning: string): boolean {
  const text = reasoning.trim();
  return text.length > 0 && text.length <= MAX_REASONING_CHARS && !LEAKED_ID.test(text);
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
 * Judges the answer. Returns null (engine then uses FALLBACK_QUALITY) when the AI fails, times out, or twice in a row
 * returns a reasoning that is empty, too long or names criterion numbers. Errors are handled by `withAi`.
 * No `temperature` is passed: Claude 5.5 models reject sampling parameters, so the schema and the strict prompt keep it steady.
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

    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await generateText({
        model: modelFor("judge", model),
        output: Output.object({ schema }),
        // Cache breakpoint on the stable prefix; the varying answer and transcript come last.
        instructions: { role: "system", content: system, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } },
        prompt: user,
      });
      const { criteriaMet, reasoning } = result.output;
      if (reasoningOk(reasoning)) {
        return {
          criteriaMet: [...new Set(criteriaMet.filter((id) => ids.includes(id)))],
          reasoning: reasoning.trim(),
        };
      }
    }
    return null;
  }, null);
}
