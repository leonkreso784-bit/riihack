import { describe, expect, it } from "vitest";
import { listCostUsd, PRICES, priceFor } from "./pricing";

const tokens = (input: number | null, cachedInput: number | null, cacheWrite: number | null, output: number | null) => ({
  input,
  cachedInput,
  cacheWrite,
  output,
});

describe("listCostUsd", () => {
  it("prices Haiku input and output per million tokens", () => {
    // 1000 * 0.10 + 200 * 0.50 = 200 per million
    expect(listCostUsd("anthropic", "claude-haiku-5-5", tokens(1000, 0, 0, 200))).toBeCloseTo(0.0002, 10);
  });

  it("bills cache reads and writes at their own rates and the rest as plain input", () => {
    // total 1500 = 200 plain + 1000 read + 300 written, 100 out on Sonnet
    const per = 200 * 2.0 + 1000 * 0.1 + 300 * 2.5 + 100 * 10.0;
    expect(listCostUsd("anthropic", "claude-sonnet-5-5", tokens(1500, 1000, 300, 100))).toBeCloseTo(per / 1e6, 10);
  });

  it("uses the Groq cached-input price and has no cache write price", () => {
    const per = 600 * 0.15 + 400 * 0.075 + 50 * 0.6;
    expect(listCostUsd("groq", "openai/gpt-oss-120b", tokens(1000, 400, 0, 50))).toBeCloseTo(per / 1e6, 10);
  });

  it("prices Mistral from the docs and bills cached tokens at 10% of the input price", () => {
    // 500 plain + 500 cached on Small 4: 500 * 0.15 + 500 * 0.015 + 100 * 0.6
    expect(listCostUsd("mistral", "mistral-small-latest", tokens(1000, 500, 0, 100))).toBeCloseTo((500 * 0.15 + 500 * 0.015 + 100 * 0.6) / 1e6, 10);
    expect(listCostUsd("mistral", "mistral-medium-latest", tokens(1000, 400, 0, 100))).toBeCloseTo((600 * 1.5 + 400 * 0.15 + 100 * 7.5) / 1e6, 10);
    expect(listCostUsd("mistral", "mistral-medium-latest", tokens(1000, 0, 0, 100))).toBeCloseTo((1000 * 1.5 + 100 * 7.5) / 1e6, 10);
  });

  it("gives an alias the price of its model", () => {
    expect(priceFor("mistral", "mistral-small-2603")).toEqual(priceFor("mistral", "mistral-small-latest"));
    expect(priceFor("mistral", "mistral-medium-2604")).toEqual(priceFor("mistral", "mistral-medium-latest"));
  });

  it("returns null for an unknown model, never a guess", () => {
    expect(listCostUsd("mistral", "mistral-large-latest", tokens(1000, 0, 0, 100))).toBeNull();
    expect(priceFor("groq", "llama-3.1-8b-instant")).toBeNull();
  });

  it("returns null when the call reported no usage at all", () => {
    expect(listCostUsd("anthropic", "claude-haiku-5-5", tokens(null, null, null, null))).toBeNull();
  });

  it("counts output alone when input is unknown, and never goes negative on odd numbers", () => {
    expect(listCostUsd("anthropic", "claude-haiku-5-5", tokens(null, null, null, 1000))).toBeCloseTo(0.0005, 10);
    // cache numbers larger than the total (provider quirk): plain input is clamped to 0
    expect(listCostUsd("anthropic", "claude-haiku-5-5", tokens(100, 80, 80, 0))).toBeGreaterThan(0);
  });

  it("keeps the agreed Claude numbers", () => {
    expect(PRICES["anthropic/claude-haiku-5-5"]).toEqual({ in: 0.1, cacheWrite: 0.125, cacheRead: 0.01, out: 0.5 });
    expect(PRICES["anthropic/claude-sonnet-5-5"]).toEqual({ in: 2.0, cacheWrite: 2.5, cacheRead: 0.1, out: 10.0 });
    expect(PRICES["groq/openai/gpt-oss-120b"]).toEqual({ in: 0.15, cacheRead: 0.075, out: 0.6 });
  });
});
