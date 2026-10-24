// Fixed texts used when the AI is off, slow or failing (plan, S1).
import { METRIC_LABELS } from "@/lib/rules";
import type { MentorInput, MetricKey } from "@/lib/types";

export const CHARACTER_FALLBACK = "Ispričavam se, trenutno ne mogu razgovarati. Odgovorite mi pisano, molim vas.";
export const MENTOR_FALLBACK_QUESTION = "Koju bi odluku iz ovog kruga sljedeći put donio drukčije i zašto?";

export function fallbackMentorQuestion(_input: MentorInput): string {
  return MENTOR_FALLBACK_QUESTION;
}

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");
const lower = (key: MetricKey) => METRIC_LABELS[key].toLowerCase();

/** Debrief built only from the numbers: the metric that rose most and the one that fell most. */
export function fallbackDebrief(input: MentorInput): string {
  const deltas = (Object.keys(input.metricsAfter) as MetricKey[]).map((key) => ({
    key,
    delta: input.metricsAfter[key] - input.metricsBefore[key],
  }));
  const best = deltas.reduce((a, b) => (b.delta > a.delta ? b : a));
  const worst = deltas.reduce((a, b) => (b.delta < a.delta ? b : a));

  const parts: string[] = [];
  if (best.delta > 0) parts.push(`Najviše si podigao ${lower(best.key)} (${signed(best.delta)}/100).`);
  if (worst.delta < 0) parts.push(`Najviše su pali ${lower(worst.key)} (${signed(worst.delta)}/100).`);
  if (parts.length === 0) return "U ovom krugu se pokazatelji nisu promijenili. Što bi sljedeći put pokušao drukčije?";
  if (worst.delta < 0) parts.push(`Što bi sljedeći put napravio da ${lower(worst.key)} ne padnu?`);
  return parts.join(" ");
}
