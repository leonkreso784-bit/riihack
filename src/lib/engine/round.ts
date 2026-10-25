import type { MetricKey, Metrics, Quality, RoomStatus } from "@/lib/types";

const KEYS: MetricKey[] = ["guests", "reviews", "staff", "operations", "finance"];

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/**
 * Množitelj učinka po kvaliteti (BUG-026, Leon sub ~22:55): odgovoriti se uvijek isplati, preskočiti boli.
 * 1 (loše ili propušteno) → −2, 2 → 0, 3 → +1, 4 → +2, 5 → +3.
 * Napisan vlastiti odgovor (`written`) s kvalitetom 1 → 0 (Leon ned ~01:30, ADR-046): student koji napiše bilo što
 * nikad ne završi ispod onoga koji nije odgovorio. Propušten i prazan odgovor ostaju −2, klik ide po tablici.
 */
export function qualityFactor(quality: number, written = false): number {
  if (quality <= 1) return written ? 0 : -2;
  return quality - 2;
}

/**
 * Napisan odgovor: svoj tekst (mode "own") koji nije prazan i nije zalijepljen. Klik, propušten, prazan i zalijepljen
 * (`copied`) odgovor nisu napisani: lijepljenje nije vlastiti rad, pa zalijepljen s kvalitetom 1 ostaje −2.
 */
export function isWrittenAnswer(answer: { mode: string; text?: string | null; copied?: boolean } | null | undefined): boolean {
  return answer?.mode === "own" && !answer.copied && (answer.text ?? "").trim() !== "";
}

// Za svaki rezultat qualityFactor(kvaliteta, napisan) × učinak, cijeli brojevi, rezanje na 0–100.
export function applyRound(
  metrics: Metrics,
  results: { quality: Quality; effects: Partial<Record<MetricKey, number>>; written?: boolean }[],
): Metrics {
  const out: Metrics = { ...metrics };
  for (const r of results) {
    for (const k of KEYS) {
      const e = r.effects[k];
      if (e) out[k] += Math.round(qualityFactor(r.quality, r.written) * e);
    }
  }
  for (const k of KEYS) out[k] = clamp(Math.round(out[k]), 0, 100);
  return out;
}

// Normalizirani dobitak (Hake 1998), raspon −100 do +100, jedna decimala.
export function progress(start: Metrics, now: Metrics): number {
  let sum = 0;
  for (const k of KEYS) {
    const s = start[k];
    const n = now[k];
    let g = 0;
    if (n >= s) g = s >= 100 ? 0 : (n - s) / (100 - s);
    else g = s <= 0 ? 0 : (n - s) / s;
    sum += 0.2 * g;
  }
  return Math.round(100 * sum * 10) / 10 + 0;
}

export function roomStatusAfter(quality: Quality, problemStatus: RoomStatus): RoomStatus {
  return quality >= 3 ? "free" : problemStatus;
}
