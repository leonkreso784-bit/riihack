import { CLICK_QUALITY_CAP, FALLBACK_QUALITY } from "@/lib/rules";
import type { Quality, RubricCriterion, SituationOption, Verdict } from "@/lib/types";

function toQuality(n: number, max: number): Quality {
  return Math.min(Math.max(n, 1), max) as Quality;
}

export function qualityFromClick(option: SituationOption): Quality {
  return toQuality(option.criteria.length, CLICK_QUALITY_CAP);
}

// Broj jedinstvenih id-eva koji postoje u rubrici, najmanje 1.
export function qualityFromVerdict(criteriaMet: string[], rubric: RubricCriterion[]): Quality {
  const known = new Set(rubric.map((c) => c.id));
  const met = new Set(criteriaMet.filter((id) => known.has(id)));
  return toQuality(met.size, 5);
}

export function qualityForOwn(verdict: Verdict | null, rubric: RubricCriterion[], capped: boolean): Quality {
  if (!verdict) return FALLBACK_QUALITY as Quality;
  const q = qualityFromVerdict(verdict.criteriaMet, rubric);
  return capped ? toQuality(q, CLICK_QUALITY_CAP) : q;
}
