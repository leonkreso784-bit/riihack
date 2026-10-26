import { CLICK_QUALITY_CAP, FALLBACK_QUALITY } from "@/lib/rules";
import type { Quality, RubricCriterion, SituationOption, Verdict } from "@/lib/types";

const MAX_QUALITY = 5;

function toQuality(n: number, max: number): Quality {
  return Math.min(Math.max(n, 1), max) as Quality;
}

/**
 * Broj pokrivenih kriterija preračunat na ljestvicu od 1 do 5, razmjerno duljini rubrike (#266, točka 5): ispunjena
 * rubrika bilo koje duljine daje 5, a rubrika od 5 kriterija daje isto što i prije (3 od 5 → 3, 0 → 1). Zaokružuje na
 * najbliže cijelo, pola naviše; najmanje 1. Prazna rubrika nema što ispuniti pa daje 1.
 */
export function scaleToQuality(met: number, total: number): Quality {
  if (total <= 0) return toQuality(1, MAX_QUALITY);
  return toQuality(Math.round((met * MAX_QUALITY) / total), MAX_QUALITY);
}

/** Klik: udio kriterija rubrike koje opcija pokriva, najviše CLICK_QUALITY_CAP (strop za ponuđene odgovore ne ovisi o duljini rubrike). */
export function qualityFromClick(option: SituationOption, rubricLength: number): Quality {
  return toQuality(scaleToQuality(new Set(option.criteria).size, rubricLength), CLICK_QUALITY_CAP);
}

// Udio jedinstvenih id-eva koji postoje u rubrici, najmanje 1; ispunjena rubrika daje 5.
export function qualityFromVerdict(criteriaMet: string[], rubric: RubricCriterion[]): Quality {
  const known = new Set(rubric.map((c) => c.id));
  const met = new Set(criteriaMet.filter((id) => known.has(id)));
  return scaleToQuality(met.size, known.size);
}

export function qualityForOwn(verdict: Verdict | null, rubric: RubricCriterion[], capped: boolean): Quality {
  if (!verdict) return FALLBACK_QUALITY as Quality;
  const q = qualityFromVerdict(verdict.criteriaMet, rubric);
  return capped ? toQuality(q, CLICK_QUALITY_CAP) : q;
}
