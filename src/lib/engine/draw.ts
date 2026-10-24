import { SITUATIONS_PER_ROUND } from "@/lib/rules";
import type { SituationTemplate } from "@/lib/types";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Miješa kopiju poola sjemenom (Fisher-Yates), krug r uzima redom [(r-1)·perRound, r·perRound) modulo duljina.
export function drawSituations(
  seed: number,
  round: number,
  pool: SituationTemplate[],
  perRound: number = SITUATIONS_PER_ROUND,
): SituationTemplate[] {
  if (pool.length === 0) return [];
  const shuffled = [...pool];
  const rand = mulberry32(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const start = (round - 1) * perRound;
  const out: SituationTemplate[] = [];
  for (let k = 0; k < perRound; k++) out.push(shuffled[(start + k) % shuffled.length]);
  return out;
}
