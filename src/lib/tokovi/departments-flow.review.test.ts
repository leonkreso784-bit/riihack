// Review 25.10. (AI-TOKOVI-01, GAP1-03): after the student closes the month the situation effects are already inside
// company.metrics (closeCompanyRound), and after the city settlement the investments are too. The Tok must not add them again.
import { describe, expect, it } from "vitest";
import { investmentEffects } from "@/lib/engine/departments";
import { applyRound } from "@/lib/engine/round";
import type { Metrics, Quality, SituationView } from "@/lib/types";
import { buildDepartmentsBoard, whatIfDepartment, type DepartmentsFlowInput } from "./departments-flow";

const START: Metrics = { guests: 50, reviews: 50, staff: 50, operations: 50, finance: 50 };
const sit = (id: string, quality: Quality | null, effects: SituationView["effects"]): SituationView =>
  ({
    id, templateId: id, round: 1, title: `Situacija ${id}`, text: "", area: "Recepcija", difficulty: 2, character: { name: "X", role: "Y" }, options: [],
    state: quality ? "answered" : "open", transcript: [], answer: quality ? { mode: "click", quality, copied: false } : undefined, effects,
  }) as SituationView;
const PLAN = { reception: 2000 }; // +2 on guests (investmentEffects)
const ANSWERED = [sit("a", 5, { guests: 4 })]; // quality 5 x effect 4 = +12
const input = (over: Partial<DepartmentsFlowInput>): DepartmentsFlowInput => ({ metrics: START, plan: PLAN, staff: [], rooms: [], situations: ANSWERED, round: 1, ...over });
const guests = (i: DepartmentsFlowInput) => buildDepartmentsBoard(i).results.find((r) => r.metric === "guests")!;

// What the engine stores: closing applies the answers, the settlement adds the investment effect.
const afterClose = applyRound(START, [{ quality: 5, effects: { guests: 4 } }]);
const afterSettle = { ...afterClose, guests: afterClose.guests + (investmentEffects(PLAN).guests ?? 0) };

describe("departments Tok after the month is closed", () => {
  it("before closing: answers and investment are still to come (unchanged behaviour)", () => {
    expect(guests(input({})).expected).toBe(50 + 12 + 2);
  });

  it("closed, not yet settled: only the investment is still to come", () => {
    expect(afterClose.guests).toBe(62);
    expect(guests(input({ metrics: afterClose, closed: true } as Partial<DepartmentsFlowInput>)).expected).toBe(62 + 2);
  });

  it("closed and settled: nothing is added again", () => {
    expect(guests(input({ metrics: afterSettle, closed: true, settled: true } as Partial<DepartmentsFlowInput>)).expected).toBe(afterSettle.guests);
  });

  it("the reception lane does not send the situation to the metric a second time", () => {
    const board = buildDepartmentsBoard(input({ metrics: afterClose, closed: true } as Partial<DepartmentsFlowInput>));
    expect(board.lanes.find((l) => l.department === "reception")!.contribution).toBe(2);
  });

  it("what-if after closing does not count the answers twice", () => {
    const w = whatIfDepartment({ metrics: afterClose, plan: PLAN, situations: ANSWERED, round: 1, closed: true } as Parameters<typeof whatIfDepartment>[0], "reception", 3000);
    expect(w.expected).toBe(62 + 3);
  });
});

describe("open, unanswered situations (GAP1-03 b)", () => {
  it("the board does not say that the month is empty while situations wait for an answer", () => {
    const board = buildDepartmentsBoard(input({ plan: {}, situations: [sit("a", null, { guests: 4 }), sit("b", null, { reviews: 5 })] }));
    expect(board.summary.waiting).toBe(2);
    expect(board.summary.empty).toBe(false);
  });
});
