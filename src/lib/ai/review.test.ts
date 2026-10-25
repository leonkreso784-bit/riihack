import { describe, expect, it } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { mentorReview, reviewProblem } from "./mentor";
import { fallbackReview } from "./fallbacks";
import { MENTOR_REVIEW_SYSTEM } from "./prompts";
import type { MentorInput } from "@/lib/types";

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 10, text: 10, reasoning: 0 },
};
const reply = (text: string) => ({ content: [{ type: "text" as const, text }], finishReason: { unified: "stop" as const, raw: "stop" }, usage, warnings: [] });

const input: MentorInput = {
  hotelName: "Hotel Test",
  round: 1,
  metricsBefore: { guests: 58, reviews: 61, staff: 48, operations: 68, finance: 53 },
  metricsAfter: { guests: 64, reviews: 58, staff: 41, operations: 70, finance: 52 },
  items: [
    { title: "Ljutit gost u sobi 204", mode: "own", quality: 2, answerText: "Ispričavam se.", criteriaMissed: ["Ponudi konkretnu naknadu [npr. popust, besplatan doručak]"] },
    { title: "Recepcionerka traži slobodan vikend", mode: "click", quality: 4, criteriaMissed: [] },
  ],
};

describe("fallbackReview", () => {
  it("names the best decision, the biggest fall, the weakest decision and one tip, only from the input", () => {
    const text = fallbackReview(input);
    expect(text).toContain("„Recepcionerka traži slobodan vikend“, kvaliteta 4 od 5");
    expect(text).toContain("zaposlenici (−7/100)");
    expect(text).toContain("„Ljutit gost u sobi 204“ (kvaliteta 2 od 5)");
    expect(text).toContain("u sličnoj situaciji ponudi konkretnu naknadu.");
    expect(text).not.toContain("[");
    expect(text).not.toContain("\n");
  });
  it("ends with the mentor's question when given", () => {
    expect(fallbackReview({ ...input, question: "Što bi gostu ponudio?" }).endsWith("Što bi gostu ponudio?")).toBe(true);
  });
  it("falls back to the biggest rise and a metric tip without good decisions", () => {
    const text = fallbackReview({ ...input, items: [] });
    expect(text).toContain("porastao (+6/100)");
    expect(text).toContain("Savjet za sljedeći mjesec");
  });
  it("mentions the engine's finance when present", () => {
    const finance = { round: 1, nights: 300, contractNights: 0, capacityNights: 600, occupancyPct: 50, marketSharePct: 20, revenue: 30000, costs: 25000, profit: 5000, cashAfter: 55000 };
    expect(fallbackReview({ ...input, finance })).toContain("Popunjenost je bila 50 %");
  });
  it("passes its own review checks", () => {
    expect(reviewProblem(fallbackReview({ ...input, question: "Što bi gostu ponudio?" }))).toBeNull();
  });
});

describe("mentorReview", () => {
  it("returns the model's review in one paragraph when it passes the checks", async () => {
    const text = "Dobro je riješena situacija s recepcionerkom.\n\nZaposlenici su pali za 7.\n- Gostu nije ponuđena naknada.\nSljedeći mjesec ponudi gostu nešto konkretno. Što bi gostu ponudio?";
    const model = new MockLanguageModelV4({ doGenerate: async () => reply(text) });
    const out = await mentorReview({ ...input, question: "Što bi gostu ponudio?" }, model);
    expect(out).not.toContain("\n");
    expect(out.endsWith("Što bi gostu ponudio?")).toBe(true);
    expect(model.doGenerateCalls[0].prompt.some((m) => m.role === "system" && m.content === MENTOR_REVIEW_SYSTEM)).toBe(true);
  });
  it("uses the fallback when the model twice breaks the rules", async () => {
    const model = new MockLanguageModelV4({ doGenerate: async () => reply("Bravo.") });
    expect(await mentorReview(input, model)).toBe(fallbackReview(input));
  });
});
