// AI prices and the cost of one call. Pure: no env, no I/O (the Groq free-tier switch is applied in usage.ts).
import type { AiProvider } from "./providers";

/** USD per million tokens. `cacheRead` and `cacheWrite` default to the plain input price when the provider has no discount. */
export type ModelPrice = { in: number; out: number; cacheRead?: number; cacheWrite?: number };

/** Token counts of one call. `input` is the TOTAL prompt size; `cachedInput` and `cacheWrite` are parts of it. */
export type TokenCounts = {
  input: number | null;
  cachedInput: number | null;
  cacheWrite: number | null;
  output: number | null;
};

const MISTRAL_SMALL: ModelPrice = { in: 0.15, cacheRead: 0.015, out: 0.6 };
const MISTRAL_MEDIUM: ModelPrice = { in: 1.5, cacheRead: 0.15, out: 7.5 };

/**
 * One table for every price, keyed "provider/model". Unknown model: cost is recorded as null, never guessed.
 * Anthropic and Groq: the numbers the team agreed on. Sonnet 5.5 cache hits are 0.05x input (0.10 USD), unlike the
 * 0.1x of Haiku 5.5 (platform pricing page). Mistral: docs.mistral.ai/inference/pricing (checked 26.10.2026); cached
 * input is billed at 10% of input. The /v1/models list has no prices. Aliases ("-latest", dated ids) share one price.
 */
export const PRICES: Record<string, ModelPrice> = {
  "anthropic/claude-haiku-5-5": { in: 0.1, cacheWrite: 0.125, cacheRead: 0.01, out: 0.5 },
  "anthropic/claude-sonnet-5-5": { in: 2.0, cacheWrite: 2.5, cacheRead: 0.1, out: 10.0 },
  "groq/openai/gpt-oss-120b": { in: 0.15, cacheRead: 0.075, out: 0.6 },
  "mistral/mistral-small-latest": MISTRAL_SMALL,
  "mistral/mistral-small-2603": MISTRAL_SMALL,
  "mistral/mistral-medium-latest": MISTRAL_MEDIUM,
  "mistral/mistral-medium-2604": MISTRAL_MEDIUM,
  "mistral/mistral-medium-3-5": MISTRAL_MEDIUM,
  "mistral/mistral-medium-3.5": MISTRAL_MEDIUM,
};

export function priceFor(provider: AiProvider, model: string): ModelPrice | null {
  return PRICES[`${provider}/${model}`] ?? null;
}

/**
 * Cost in USD at list price, or null when the model has no price or the call reported no usage at all (a failed call).
 * Non-cached input = total - cache reads - cache writes; each part is billed at its own rate.
 */
export function listCostUsd(provider: AiProvider, model: string, tokens: TokenCounts): number | null {
  const price = priceFor(provider, model);
  if (!price) return null;
  const { input, cachedInput, cacheWrite, output } = tokens;
  if (input === null && cachedInput === null && cacheWrite === null && output === null) return null;
  const read = cachedInput ?? 0;
  const write = cacheWrite ?? 0;
  const plain = Math.max(0, (input ?? 0) - read - write);
  const perMillion = plain * price.in + read * (price.cacheRead ?? price.in) + write * (price.cacheWrite ?? price.in) + (output ?? 0) * price.out;
  return perMillion / 1_000_000;
}
