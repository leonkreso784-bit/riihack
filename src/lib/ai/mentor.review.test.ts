// Review 25.10.: mentor input and texts (AI-TOKOVI-03/TESTOVI-06, AI-TOKOVI-04, AI-TOKOVI-07, AI-TOKOVI-08,
// PR-INTEGRACIJA-02/GAP3-03, UI-PROF-12).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SITUATIONS } from "@/content";
import type { MentorInput } from "@/lib/types";

// buildMentorInput runs three selects in this order: situations + answers, the company, the month's finance row.
const results = vi.hoisted(() => ({ queue: [] as unknown[][] }));
vi.mock("@/db", () => {
  const select = () => {
    const out = results.queue.shift() ?? [];
    const q: Record<string, unknown> = {};
    for (const m of ["from", "leftJoin", "where", "limit", "orderBy"]) q[m] = () => q;
    q.then = (ok: (v: unknown) => unknown) => Promise.resolve(out).then(ok);
    return q;
  };
  return { db: { select } };
});
const template = SITUATIONS[0];
vi.mock("@/lib/game/situations", () => ({ getTemplate: async () => template }));

import { buildMentorInput } from "./mentor-input";
import { factsBlock, financeBlock, firstQuestion } from "./mentor";
import { fallbackDebrief, fallbackProposal, isFallbackProposal } from "./fallbacks";

const metrics = { guests: 50, reviews: 50, staff: 50, operations: 50, finance: 50 };
const report = { id: "r", companyId: "c", round: 1, metricsBefore: metrics, metricsAfter: metrics } as never;

describe("buildMentorInput for a skipped situation (AI-TOKOVI-03)", () => {
  beforeEach(() => {
    // closeCompanyRound stores a 'none' answer with no verdict for every unanswered situation.
    results.queue = [
      [{ situation: { id: "s1", templateId: template.id }, answer: { mode: "none", quality: 1, verdict: null, optionId: null, text: null } }],
      [{ worldId: "w" }],
      [],
    ];
  });

  it("lists every rubric criterion as missed", async () => {
    const input = await buildMentorInput(report, "Hotel Ana");
    expect(input.items[0].criteriaMissed).toEqual(template.rubric.map((c) => c.text));
  });

  it("the facts say 'Student nije odgovorio', not 'Student je nije odgovorio'", async () => {
    const facts = factsBlock(await buildMentorInput(report, "Hotel Ana"));
    expect(facts).toContain("Student nije odgovorio");
    expect(facts).not.toContain("Student je nije");
  });
});

describe("finance block (AI-TOKOVI-04)", () => {
  it("counts contract nights in the occupied nights, like the occupancy percent", () => {
    // Engine semantics: nights = market nights only; occupancy = (nights + contractNights) / capacity.
    const f = { round: 1, nights: 331, contractNights: 60, capacityNights: 420, occupancyPct: 93, marketSharePct: 30, revenue: 1, costs: 1, profit: 0, cashAfter: 1 };
    expect(financeBlock(f)).toContain("Noćenja: 391 od 420");
  });
});

describe("firstQuestion with text after the question (PR-INTEGRACIJA-02, GAP3-03)", () => {
  it.each([
    ["Što bi se dogodilo kad biste povisili cijenu u srpnju? (Razmisli o konkurenciji.)", "Što bi se dogodilo kad biste povisili cijenu u srpnju?"],
    ["Zašto je popunjenost pala u srpnju? 45 % je ispod prosjeka grada.", "Zašto je popunjenost pala u srpnju?"],
    ["Zašto ste snizili cijenu na 70 €? i što je s marketingom?", "Zašto ste snizili cijenu na 70 €?"],
  ])("%s", (text, question) => {
    expect(firstQuestion(text)).toBe(question);
  });

  it("still keeps thousands separators and 'npr.' inside the question", () => {
    expect(firstQuestion("Zašto je dobit pala na 2.300 € u srpnju?")).toBe("Zašto je dobit pala na 2.300 € u srpnju?");
    expect(firstQuestion("Što bi npr. mogao ponuditi gostu osim isprike?")).toBe("Što bi npr. mogao ponuditi gostu osim isprike?");
  });
});

describe("fallback texts", () => {
  const idea = { hotelName: "Hotel Ana", stars: 3, rooms: 12, metrics: { ...metrics, guests: 10 }, round: 1 } as never;

  it("fallback proposal uses a bank-style area label (AI-TOKOVI-07, BUG-017)", () => {
    const areas = new Set(SITUATIONS.map((s) => s.area));
    for (const weakest of ["guests", "reviews", "staff", "operations", "finance"] as const) {
      const draft = fallbackProposal({ hotelName: "H", stars: 3, rooms: 12, metrics: { ...metrics, [weakest]: 1 }, round: 1 } as never);
      expect(areas.has(draft.area)).toBe(true);
    }
  });

  it("fixed debrief is gender neutral (AI-TOKOVI-08)", () => {
    const input = { hotelName: "H", round: 1, items: [], metricsBefore: metrics, metricsAfter: metrics } as MentorInput;
    expect(fallbackDebrief(input)).not.toMatch(/pokušao\b/);
  });

  it("a fallback draft can be told apart from an AI draft (UI-PROF-12)", () => {
    expect(isFallbackProposal(fallbackProposal(idea))).toBe(true);
    expect(isFallbackProposal({ ...fallbackProposal(idea), title: "Kvar klime u sobi 204" })).toBe(false);
  });
});
