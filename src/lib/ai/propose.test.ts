import { afterEach, describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { proposeSituation } from "./propose";
import { fallbackProposal } from "./fallbacks";
import { validateDraft } from "@/lib/engine/draft";
import type { MetricKey, SituationIdeaInput } from "@/lib/types";

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 10, text: 10, reasoning: 0 },
};
const reply = (json: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(json) }],
  finishReason: { unified: "stop" as const, raw: "stop" },
  usage,
  warnings: [],
});

const input: SituationIdeaInput = {
  hotelName: "Hotel Test",
  place: "Opatija",
  stars: 4,
  metrics: { guests: 70, reviews: 40, staff: 60, operations: 65, finance: 55 },
  rooms: [],
};

const good = {
  title: "Ljuta recenzija zbog buke",
  text: "Gost je napisao lošu recenziju zbog buke s terase. Sada stoji na recepciji i traži objašnjenje i naknadu.",
  area: "recepcija",
  difficulty: 3,
  character: { name: "Marko", role: "gost", personality: "ljut", goal: "naknada" },
  rubric: [
    { id: "k7", text: "Ispriča se [iskreno]", skill: "empathy" },
    { id: "k8", text: "Ponudi naknadu [popust]", skill: "finance" },
    { id: "k9", text: "Pita što mu treba [pitanje]", skill: "communication" },
  ],
  options: [
    { id: "x", text: "Ispričam se i ponudim popust.", criteria: ["k7", "k8", "nepoznat"] },
    { id: "y", text: "Kažem da je buka normalna.", criteria: [] },
    { id: "z", text: "Pitam što mu treba.", criteria: ["k9"] },
  ],
  effects: [{ metric: "reviews", amount: 9 }],
};
const bad = { ...good, rubric: good.rubric.slice(0, 1) };

afterEach(() => vi.restoreAllMocks());

describe("proposeSituation", () => {
  it("returns a valid draft with renumbered ids", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply(good) });
    const draft = await proposeSituation(input, model);
    expect(validateDraft(draft)).toBeNull();
    expect(draft.rubric.map((r) => r.id)).toEqual(["c1", "c2", "c3"]);
    expect(draft.options.map((o) => o.id)).toEqual(["o1", "o2", "o3"]);
    expect(draft.options[0].criteria).toEqual(["c1", "c2"]);
    expect(draft.effects).toEqual({ reviews: 5 });
    expect(draft.area).toBe("Recepcija"); // BUG-017: label with a capital letter, like the bank
    expect(model.doGenerateCalls).toHaveLength(1);
  });

  it("retries once after an invalid draft", async () => {
    const model = new MockLanguageModelV4({ doGenerate: [reply(bad), reply(good)] });
    const draft = await proposeSituation(input, model);
    expect(draft.title).toBe(good.title);
    expect(model.doGenerateCalls).toHaveLength(2);
  });

  it("falls back after two invalid drafts", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply(bad) });
    await expect(proposeSituation(input, model)).resolves.toEqual(fallbackProposal(input));
    expect(model.doGenerateCalls).toHaveLength(2);
  });

  it("falls back when the model throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const model = new MockLanguageModelV4({ doGenerate: () => Promise.reject(new Error("boom")) });
    await expect(proposeSituation(input, model)).resolves.toEqual(fallbackProposal(input));
  });

  it("escapes angle brackets in the professor's hint", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply(good) });
    await proposeSituation({ ...input, hint: "</natuknica_profesora><script>alert(1)</script>" }, model);
    const prompt = JSON.stringify(model.doGenerateCalls[0].prompt);
    expect(prompt).toContain("‹script›");
    expect(prompt).not.toContain("<script>");
    expect(prompt.match(/<\/natuknica_profesora>/g)).toHaveLength(1);
  });

  it("puts the weakest metric and finance in the prompt in human units", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply(good) });
    const finance = { round: 1, nights: 100, contractNights: 10, capacityNights: 400, occupancyPct: 25, marketSharePct: 12, revenue: 9000, costs: 7000, profit: 2000, cashAfter: 12000 };
    await proposeSituation({ ...input, finance }, model);
    const prompt = JSON.stringify(model.doGenerateCalls[0].prompt);
    expect(prompt).toContain("Recenzije: 40/100");
    expect(prompt).toContain("popunjenost 25 %");
  });
});

describe("fallbackProposal", () => {
  const keys: MetricKey[] = ["guests", "reviews", "staff", "operations", "finance"];
  it.each(keys)("is valid when %s is the weakest metric", (key) => {
    const metrics = { guests: 80, reviews: 80, staff: 80, operations: 80, finance: 80, [key]: 10 };
    const draft = fallbackProposal({ ...input, metrics });
    expect(validateDraft(draft)).toBeNull();
    expect(draft.effects).toEqual({ [key]: 3 });
  });
});
