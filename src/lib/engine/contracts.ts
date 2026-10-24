import type { ContractStatus, ContractTemplate, MetricKey } from "@/lib/types";

// mulberry32: mali deterministički generator iz cijelog broja.
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

export function drawOffer(
  seed: number,
  round: number,
  joinIndex: number,
  templates: ContractTemplate[],
): ContractTemplate {
  if (templates.length === 0) throw new Error("Nema predložaka ugovora");
  const mixed = Math.imul(seed | 0, 73856093) ^ Math.imul(round, 19349663) ^ Math.imul(joinIndex, 83492791);
  return templates[Math.floor(mulberry32(mixed)() * templates.length)];
}

export function isActive(
  c: { status: ContractStatus; activeFrom: number | null; activeTo: number | null },
  round: number,
): boolean {
  return (
    c.status === "accepted" &&
    c.activeFrom !== null &&
    c.activeTo !== null &&
    round >= c.activeFrom &&
    round <= c.activeTo
  );
}

export function contractNightsTotal(active: ContractTemplate[]): number {
  return active.reduce((s, c) => s + c.nights, 0);
}

export function contractEffects(active: ContractTemplate[]): Partial<Record<MetricKey, number>> {
  const out: Partial<Record<MetricKey, number>> = {};
  for (const c of active) {
    for (const [k, v] of Object.entries(c.effects) as [MetricKey, number][]) {
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}
