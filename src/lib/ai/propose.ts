// S9: proposes one hotel situation from the state of the hotel. The professor always reviews and saves the draft;
// nothing from here reaches students and the AI sets no numbers beyond the 1..5 effect hints the professor can edit.
import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import { validateDraft } from "@/lib/engine/draft";
import { METRIC_LABELS, ROUND_LABELS } from "@/lib/rules";
import type { MetricKey, SituationDraft, SituationIdeaInput } from "@/lib/types";
import { aiEnabled, modelFor, withAi } from "./client";
import { fallbackProposal, weakestMetric } from "./fallbacks";
import { PROPOSE_SYSTEM } from "./prompts";

/** Neutralise angle brackets so the professor's hint cannot close or open our prompt tags. */
const clean = (text: string) => text.replace(/</g, "‹").replace(/>/g, "›");

// The professor waits for a draft, not a live student: one Sonnet draft takes ~15 s, so allow a retry.
const PROPOSE_TIMEOUT_MS = 45_000;
const SLASH_GENDER = /\p{L}\/(la|a|ica)\b/u; // "uvažio/la": the prompt forbids it, so retry
const METRICS = ["guests", "reviews", "staff", "operations", "finance"] as const;
const SKILLS = ["empathy", "communication", "finance", "problemSolving", "ethics"] as const;

// No min/max in the schema on purpose: structured output stays simple and validateDraft is the one judge of limits.
const schema = z.object({
  title: z.string(),
  text: z.string(),
  area: z.string(),
  difficulty: z.number().int(),
  character: z.object({ name: z.string(), role: z.string(), personality: z.string(), goal: z.string() }),
  rubric: z.array(z.object({ id: z.string(), text: z.string(), skill: z.enum(SKILLS) })),
  options: z.array(z.object({ id: z.string(), text: z.string(), criteria: z.array(z.string()) })),
  effects: z.array(z.object({ metric: z.enum(METRICS), amount: z.number().int() })),
});
type Raw = z.infer<typeof schema>;

const euros = (n: number) => `${n.toLocaleString("hr-HR")} €`;

function ideaPrompt(input: SituationIdeaInput, error?: string): string {
  const weakest = weakestMetric(input.metrics);
  const metrics = (Object.keys(METRIC_LABELS) as MetricKey[])
    .map((k) => `- ${METRIC_LABELS[k]}: ${input.metrics[k]}/100${k === weakest ? " (NAJSLABIJE)" : ""}`)
    .join("\n");
  const broken = input.rooms.filter((r) => r.status === "broken").length;
  const lines = [
    `Hotel: ${clean(input.hotelName)}, ${clean(input.place)}, ${input.stars} zvjezdice, ${input.rooms.length} soba (${broken} u kvaru)`,
    `Pokazatelji:\n${metrics}`,
  ];
  const f = input.finance;
  if (f) {
    const month = ROUND_LABELS[f.round - 1] ?? `${f.round}. krug`;
    lines.push(
      `Obračun mjeseca (${month}): popunjenost ${f.occupancyPct} %, tržišni udio ${f.marketSharePct} %, prihod ${euros(f.revenue)}, troškovi ${euros(f.costs)}, dobit ${euros(f.profit)}, novac ${euros(f.cashAfter)}`,
    );
  }
  const hint = input.hint?.trim();
  if (hint) lines.push(`<natuknica_profesora>${clean(hint)}</natuknica_profesora>`);
  lines.push(`Predloži jednu situaciju usmjerenu na pokazatelj "${METRIC_LABELS[weakest]}".`);
  if (error) lines.push(`Prethodni nacrt nije prošao provjeru (${error}). Ispravi to.`);
  return lines.join("\n\n");
}

// BUG-017: area as a label like the bank ("Recepcija i smještaj"), never a lowercase key.
const capitalize = (t: string) => (t ? t[0].toLocaleUpperCase("hr") + t.slice(1) : t);

/** Renumber ids (c1.., o1..), remap option criteria, clamp the small numbers. validateDraft then judges the result. */
export function normalizeDraft(raw: Raw): SituationDraft {
  const idMap = new Map<string, string>();
  const rubric = raw.rubric.map((r, i) => {
    idMap.set(r.id, `c${i + 1}`);
    return { id: `c${i + 1}`, text: r.text.trim(), skill: r.skill };
  });
  const options = raw.options.slice(0, 4).map((o, i) => ({
    id: `o${i + 1}`,
    text: o.text.trim(),
    criteria: [...new Set(o.criteria.map((id) => idMap.get(id)).filter((id): id is string => Boolean(id)))],
  }));
  const effects: SituationDraft["effects"] = {};
  for (const { metric, amount } of raw.effects) {
    if (effects[metric] === undefined) effects[metric] = Math.min(5, Math.max(1, amount));
  }
  return {
    title: raw.title.trim(),
    text: raw.text.trim(),
    area: capitalize(raw.area.trim()),
    difficulty: Math.min(5, Math.max(1, raw.difficulty)) as SituationDraft["difficulty"],
    character: {
      name: raw.character.name.trim(),
      role: raw.character.role.trim(),
      personality: raw.character.personality.trim(),
      goal: raw.character.goal.trim(),
    },
    rubric,
    options,
    effects,
  };
}

function problem(draft: SituationDraft): string | null {
  const invalid = validateDraft(draft);
  if (invalid) return invalid;
  const visible = [draft.title, draft.text, draft.character.goal, ...draft.rubric.map((r) => r.text), ...draft.options.map((o) => o.text)];
  return visible.some((t) => SLASH_GENDER.test(t)) ? "oblici s kosom crtom nisu dopušteni" : null;
}

/**
 * One AI-drafted situation, aimed at the hotel's weakest metric. Retries once when the draft fails validation;
 * AI off, error, timeout or two invalid drafts give the deterministic fallback. The professor reviews it either way.
 */
export function proposeSituation(input: SituationIdeaInput, model?: LanguageModel): Promise<SituationDraft> {
  if (!aiEnabled() && !model) return Promise.resolve(fallbackProposal(input));
  return withAi<SituationDraft>(async () => {
    let error: string | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await generateText({
        model: modelFor("mentor", model),
        output: Output.object({ schema }),
        instructions: { role: "system", content: PROPOSE_SYSTEM, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } },
        prompt: ideaPrompt(input, error),
      });
      const draft = normalizeDraft(result.output);
      const found = problem(draft);
      if (!found) return draft;
      error = found;
    }
    return fallbackProposal(input);
  }, fallbackProposal(input), PROPOSE_TIMEOUT_MS);
}
