import { describe, expect, it } from "vitest";
import { dayKey, formatReport, NO_WORLD, parseDays, summarize, type ReportRow } from "./report";

const row = (over: Partial<ReportRow> = {}): ReportRow => ({
  createdAt: new Date("2026-10-26T10:00:00Z"),
  action: "sudac",
  provider: "anthropic",
  model: "claude-sonnet-5-5",
  inputTokens: 1000,
  cachedInputTokens: 600,
  cacheWriteTokens: 0,
  outputTokens: 100,
  costUsd: 0.002,
  listCostUsd: 0.002,
  durationMs: 1000,
  ok: true,
  fallbackUsed: false,
  worldId: "aaaaaaaa-0000-4000-8000-000000000001",
  ...over,
});

describe("summarize", () => {
  it("sums calls, failures, fallbacks, tokens, cost and time", () => {
    const r = summarize([row(), row({ ok: false, fallbackUsed: true, inputTokens: null, cachedInputTokens: null, outputTokens: null, costUsd: null, listCostUsd: null, durationMs: 3000 })]);
    expect(r.total).toMatchObject({
      calls: 2, failed: 1, fallbacks: 1, inputTokens: 1000, cachedInputTokens: 600, outputTokens: 100, totalMs: 4000, unpriced: 0,
    });
    expect(r.total.costUsd).toBeCloseTo(0.002, 10);
  });

  it("keeps actual and list cost apart (Groq free tier)", () => {
    const r = summarize([row({ provider: "groq", model: "openai/gpt-oss-120b", costUsd: 0, listCostUsd: 0.0005 })]);
    expect(r.total.costUsd).toBe(0);
    expect(r.total.listCostUsd).toBeCloseTo(0.0005, 10);
  });

  it("counts successful calls of an unpriced model, not failed ones", () => {
    const r = summarize([
      row({ model: "mistral-large-latest", provider: "mistral", costUsd: null, listCostUsd: null }),
      row({ ok: false, costUsd: null, listCostUsd: null }),
    ]);
    expect(r.total.unpriced).toBe(1);
  });

  it("groups by day in Zagreb time, oldest first", () => {
    const r = summarize([
      row({ createdAt: new Date("2026-10-26T12:00:00Z") }),
      row({ createdAt: new Date("2026-10-25T23:30:00Z") }), // 00:30 on 26.10. in Zagreb (CET)
      row({ createdAt: new Date("2026-10-25T22:30:00Z") }), // 23:30 on 25.10.
    ]);
    expect(r.byDay.map((g) => [g.key, g.calls])).toEqual([["2026-10-25", 1], ["2026-10-26", 2]]);
  });

  it("groups by action and by provider/model, most expensive first", () => {
    const r = summarize([
      row({ action: "lik", model: "claude-haiku-5-5", costUsd: 0.0001, listCostUsd: 0.0001 }),
      row({ action: "sudac", costUsd: 0.01, listCostUsd: 0.01 }),
      row({ action: "sudac", costUsd: 0.01, listCostUsd: 0.01 }),
      row({ action: "agencija", costUsd: 0.001, listCostUsd: 0.001 }),
    ]);
    expect(r.byAction.map((g) => [g.key, g.calls])).toEqual([["sudac", 2], ["agencija", 1], ["lik", 1]]);
    expect(r.byModel.map((g) => g.key)).toEqual(["anthropic/claude-sonnet-5-5", "anthropic/claude-haiku-5-5"]);
  });

  it("ranks games by list cost, so free-tier games still rank, and cuts to the top N", () => {
    const rows = [
      row({ worldId: "w-small", costUsd: 0, listCostUsd: 0.001 }),
      row({ worldId: "w-big", costUsd: 0, listCostUsd: 0.05 }),
      row({ worldId: "w-big", costUsd: 0, listCostUsd: 0.05 }),
      row({ worldId: null, costUsd: 0, listCostUsd: 0.002 }),
    ];
    expect(summarize(rows).topWorlds.map((g) => g.key)).toEqual(["w-big", NO_WORLD, "w-small"]);
    expect(summarize(rows, { topWorlds: 1 }).topWorlds.map((g) => g.key)).toEqual(["w-big"]);
  });

  it("is empty-safe", () => {
    const r = summarize([]);
    expect(r.total.calls).toBe(0);
    expect(r.byDay).toEqual([]);
    expect(r.topWorlds).toEqual([]);
  });
});

describe("dayKey", () => {
  it("uses the Zagreb calendar day", () => {
    expect(dayKey(new Date("2026-10-26T22:30:00Z"))).toBe("2026-10-26"); // 23:30 CET
    expect(dayKey(new Date("2026-10-26T23:30:00Z"))).toBe("2026-10-27"); // 00:30 CET next day
    expect(dayKey(new Date("2026-10-26T23:30:00Z"), "UTC")).toBe("2026-10-26");
  });
});

describe("parseDays", () => {
  it("defaults to 7 and reads the common spellings", () => {
    expect(parseDays([])).toBe(7);
    expect(parseDays(["14"])).toBe(14);
    expect(parseDays(["--days", "3"])).toBe(3);
    expect(parseDays(["--days=30"])).toBe(30);
    expect(parseDays(["-d", "1"])).toBe(1);
  });
  it("rejects nonsense", () => {
    expect(() => parseDays(["--days", "0"])).toThrow(/od 1 do 365/);
    expect(() => parseDays(["--days=abc"])).toThrow(/od 1 do 365/);
    expect(() => parseDays(["400"])).toThrow(/od 1 do 365/);
  });
});

describe("formatReport", () => {
  const since = new Date("2026-10-19T10:00:00Z");

  it("prints the headline, the four tables and the game name with a short id", () => {
    const rows = [row(), row({ action: "lik", worldId: null })];
    const text = formatReport(summarize(rows), { days: 7, since, worldNames: new Map([["aaaaaaaa-0000-4000-8000-000000000001", "FIDIT 1"]]) });
    expect(text).toContain("AI potrošnja, zadnjih 7 dana (od 2026-10-19)");
    expect(text).toContain("Ukupno: 2 poziva (0 neuspjelih, 0 s rezervnim tekstom)");
    for (const title of ["Po danu", "Po akciji", "Po modelu", "Najskuplje igre"]) expect(text).toContain(title);
    expect(text).toContain("FIDIT 1 (aaaaaaaa)");
    expect(text).toContain(NO_WORLD);
    expect(text).toContain("anthropic/claude-sonnet-5-5");
  });

  it("warns about unpriced calls and says so when there is no data", () => {
    const unpriced = formatReport(summarize([row({ costUsd: null, listCostUsd: null })]), { days: 1, since });
    expect(unpriced).toContain("nema cijenu u pricing.ts");
    const none = formatReport(summarize([]), { days: 7, since });
    expect(none).toContain("Nema zapisa u tom razdoblju.");
    expect(none).not.toContain("Po danu");
  });

  it("has no dashes as punctuation", () => {
    expect(formatReport(summarize([row()]), { days: 7, since })).not.toMatch(/[\u2013\u2014]/);
  });
});
