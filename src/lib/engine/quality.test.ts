import { describe, expect, it } from "vitest";
import type { RubricCriterion, SituationOption, Verdict } from "@/lib/types";
import { qualityForOwn, qualityFromClick, qualityFromVerdict } from "./quality";

const rubric5 = ["c1", "c2", "c3", "c4", "c5"].map((id) => ({ id, text: id, skill: "empathy" })) as RubricCriterion[];
const opt = (criteria: string[]) => ({ id: "o", text: "", criteria }) as SituationOption;
const verdict = (criteriaMet: string[]): Verdict => ({ criteriaMet, reasoning: "" });

describe("qualityFromClick", () => {
  it("5 kriterija -> 4 (strop)", () => expect(qualityFromClick(opt(["a", "b", "c", "d", "e"]))).toBe(4));
  it("0 kriterija -> 1", () => expect(qualityFromClick(opt([]))).toBe(1));
  it("2 kriterija -> 2", () => expect(qualityFromClick(opt(["a", "b"]))).toBe(2));
});

describe("qualityFromVerdict", () => {
  it("broji jedinstvene id-eve iz rubrike", () => expect(qualityFromVerdict(["c1", "c2", "c2", "x9"], rubric5)).toBe(2));
  it("prazno -> 1", () => expect(qualityFromVerdict([], rubric5)).toBe(1));
  it("svih 5 -> 5", () => expect(qualityFromVerdict(["c1", "c2", "c3", "c4", "c5"], rubric5)).toBe(5));
});

describe("qualityForOwn", () => {
  it("null -> FALLBACK_QUALITY (3)", () => expect(qualityForOwn(null, rubric5, false)).toBe(3));
  it("5 kriterija s capped -> 4", () =>
    expect(qualityForOwn(verdict(["c1", "c2", "c3", "c4", "c5"]), rubric5, true)).toBe(4));
  it("5 kriterija bez capped -> 5", () =>
    expect(qualityForOwn(verdict(["c1", "c2", "c3", "c4", "c5"]), rubric5, false)).toBe(5));
});
