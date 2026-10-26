import { describe, expect, it } from "vitest";
import type { RubricCriterion, SituationOption, Verdict } from "@/lib/types";
import { qualityForOwn, qualityFromClick, qualityFromVerdict, scaleToQuality } from "./quality";

const rubricOf = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `c${i + 1}`, text: `c${i + 1}`, skill: "empathy" })) as RubricCriterion[];
const idsOf = (n: number) => rubricOf(n).map((c) => c.id);
const rubric3 = rubricOf(3);
const rubric4 = rubricOf(4);
const rubric5 = rubricOf(5);
const opt = (criteria: string[]) => ({ id: "o", text: "", criteria }) as SituationOption;
const verdict = (criteriaMet: string[]): Verdict => ({ criteriaMet, reasoning: "" });

describe("scaleToQuality", () => {
  it("rubrika od 5 kriterija: kao i prije, broj kriterija, najmanje 1", () =>
    expect([0, 1, 2, 3, 4, 5].map((m) => scaleToQuality(m, 5))).toEqual([1, 1, 2, 3, 4, 5]));
  it("rubrika od 4 kriterija: razmjerno, sve ispunjeno daje 5", () =>
    expect([0, 1, 2, 3, 4].map((m) => scaleToQuality(m, 4))).toEqual([1, 1, 3, 4, 5]));
  it("rubrika od 3 kriterija: razmjerno, sve ispunjeno daje 5", () =>
    expect([0, 1, 2, 3].map((m) => scaleToQuality(m, 3))).toEqual([1, 2, 3, 5]));
  it("ispunjena rubrika bilo koje duljine daje 5, prazna 1, a rast je monoton", () => {
    for (let n = 1; n <= 10; n++) {
      const row = Array.from({ length: n + 1 }, (_, m) => scaleToQuality(m, n));
      expect(row[0]).toBe(1);
      expect(row[n]).toBe(5);
      for (let m = 1; m <= n; m++) expect(row[m]).toBeGreaterThanOrEqual(row[m - 1]);
    }
  });
  it("više od rubrike se reže na 5, prazna rubrika daje 1", () => {
    expect(scaleToQuality(7, 5)).toBe(5);
    expect(scaleToQuality(0, 0)).toBe(1);
    expect(scaleToQuality(2, 0)).toBe(1);
  });
});

describe("qualityFromClick", () => {
  it("5 kriterija -> 4 (strop)", () => expect(qualityFromClick(opt(["a", "b", "c", "d", "e"]), 5)).toBe(4));
  it("0 kriterija -> 1", () => expect(qualityFromClick(opt([]), 5)).toBe(1));
  it("2 kriterija -> 2", () => expect(qualityFromClick(opt(["a", "b"]), 5)).toBe(2));
  it("rubrika od 5: 3 -> 3, 4 -> 4 kao prije", () => {
    expect(qualityFromClick(opt(["a", "b", "c"]), 5)).toBe(3);
    expect(qualityFromClick(opt(["a", "b", "c", "d"]), 5)).toBe(4);
  });
  it("rubrika od 3: razmjerno, a ponuđeni odgovor i dalje ne prelazi 4", () => {
    expect([[], ["a"], ["a", "b"], ["a", "b", "c"]].map((c) => qualityFromClick(opt(c), 3))).toEqual([1, 2, 3, 4]);
  });
  it("rubrika od 4: razmjerno, a ponuđeni odgovor i dalje ne prelazi 4", () => {
    expect([[], ["a"], ["a", "b"], ["a", "b", "c"], ["a", "b", "c", "d"]].map((c) => qualityFromClick(opt(c), 4))).toEqual([1, 1, 3, 4, 4]);
  });
  it("ponovljena oznaka kriterija ne broji se dvaput", () => expect(qualityFromClick(opt(["a", "a", "a"]), 3)).toBe(2));
});

describe("qualityFromVerdict", () => {
  it("broji jedinstvene id-eve iz rubrike", () => expect(qualityFromVerdict(["c1", "c2", "c2", "x9"], rubric5)).toBe(2));
  it("prazno -> 1", () => expect(qualityFromVerdict([], rubric5)).toBe(1));
  it("svih 5 -> 5", () => expect(qualityFromVerdict(["c1", "c2", "c3", "c4", "c5"], rubric5)).toBe(5));
  it("5 kriterija: 0 do 5 ispunjenih daje 1, 1, 2, 3, 4, 5", () =>
    expect([0, 1, 2, 3, 4, 5].map((m) => qualityFromVerdict(idsOf(m), rubric5))).toEqual([1, 1, 2, 3, 4, 5]));
  it("4 kriterija: sve ispunjeno daje 5, ne 4", () => {
    expect(qualityFromVerdict(idsOf(4), rubric4)).toBe(5);
    expect([0, 1, 2, 3, 4].map((m) => qualityFromVerdict(idsOf(m), rubric4))).toEqual([1, 1, 3, 4, 5]);
  });
  it("3 kriterija: sve ispunjeno daje 5, ne 3", () => {
    expect(qualityFromVerdict(idsOf(3), rubric3)).toBe(5);
    expect([0, 1, 2, 3].map((m) => qualityFromVerdict(idsOf(m), rubric3))).toEqual([1, 2, 3, 5]);
  });
  it("tuđe oznake i duplikati ne dižu kvalitetu ni na kraćoj rubrici", () => {
    expect(qualityFromVerdict(["c1", "c1", "c1", "x9", "x8"], rubric3)).toBe(2);
    expect(qualityFromVerdict(["x1", "x2", "x3"], rubric3)).toBe(1);
  });
});

describe("qualityForOwn", () => {
  it("null -> FALLBACK_QUALITY (3)", () => expect(qualityForOwn(null, rubric5, false)).toBe(3));
  it("5 kriterija s capped -> 4", () =>
    expect(qualityForOwn(verdict(["c1", "c2", "c3", "c4", "c5"]), rubric5, true)).toBe(4));
  it("5 kriterija bez capped -> 5", () =>
    expect(qualityForOwn(verdict(["c1", "c2", "c3", "c4", "c5"]), rubric5, false)).toBe(5));
  it("rubrika od 3 i od 4 kriterija: savršen vlastiti odgovor daje 5, zalijepljen 4", () => {
    expect(qualityForOwn(verdict(idsOf(3)), rubric3, false)).toBe(5);
    expect(qualityForOwn(verdict(idsOf(3)), rubric3, true)).toBe(4);
    expect(qualityForOwn(verdict(idsOf(4)), rubric4, false)).toBe(5);
    expect(qualityForOwn(verdict(idsOf(4)), rubric4, true)).toBe(4);
  });
  it("djelomično ispunjena kraća rubrika ne dobiva 5, a zalijepljena ne prelazi 4", () => {
    expect(qualityForOwn(verdict(idsOf(2)), rubric3, false)).toBe(3);
    expect(qualityForOwn(verdict(idsOf(3)), rubric4, false)).toBe(4);
    expect(qualityForOwn(verdict(idsOf(3)), rubric4, true)).toBe(4);
  });
});
