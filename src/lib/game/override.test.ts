import { describe, expect, it } from "vitest";
import type { AnswerRow } from "@/db/schema";
import { applyRound } from "@/lib/engine/round";
import { HttpError } from "@/lib/http";
import type { Metrics, Quality } from "@/lib/types";
import { overrideDelta, parseQualityOverride, shiftMetrics } from "./override";
import { toAnswerView } from "./views";

const M: Metrics = { guests: 50, reviews: 60, staff: 70, operations: 40, finance: 55 };

describe("parseQualityOverride", () => {
  it("prima cijeli broj 1–5", () => {
    expect(parseQualityOverride({ quality: 1 })).toBe(1);
    expect(parseQualityOverride({ quality: 5 })).toBe(5);
  });

  it.each([7, 0, 3.5, "4", null, undefined])("odbija %s s 400", (quality) => {
    expect(() => parseQualityOverride({ quality })).toThrow(HttpError);
    try {
      parseQualityOverride({ quality });
    } catch (e) {
      expect((e as HttpError).status).toBe(400);
    }
  });
});

describe("overrideDelta", () => {
  it("(množitelj nove − množitelj stare) × učinak za svaki ključ učinaka, kao applyRound", () => {
    expect(overrideDelta(5, 1, { guests: 4, finance: 3 })).toEqual({ guests: -20, finance: -15 });
    expect(overrideDelta(2, 5, { reviews: 2 })).toEqual({ reviews: 6 });
  });

  it("ključevi bez učinka ostaju bez pomaka", () => {
    expect(overrideDelta(1, 4, { staff: 5 })).toEqual({ staff: 20 });
  });

  it("napisan odgovor: 1 vrijedi 0, pa 1 → 3 pomakne samo za +1 × učinak (ADR-046)", () => {
    expect(overrideDelta(1, 3, { guests: 4 }, true)).toEqual({ guests: 4 });
    expect(overrideDelta(3, 1, { guests: 4 }, true)).toEqual({ guests: -4 });
    expect(overrideDelta(1, 3, { guests: 4 }, false)).toEqual({ guests: 12 });
  });

  it("zatvaranje sa starom ocjenom + pomak = zatvaranje s novom, za sve parove, napisan i ne", () => {
    const effects = { guests: 3, operations: 2 };
    for (const written of [true, false]) {
      for (const from of [1, 2, 3, 4, 5] as Quality[]) {
        for (const to of [1, 2, 3, 4, 5] as Quality[]) {
          const closedOld = applyRound(M, [{ quality: from, effects, written }]);
          const closedNew = applyRound(M, [{ quality: to, effects, written }]);
          expect(shiftMetrics(closedOld, overrideDelta(from, to, effects, written))).toEqual(closedNew);
        }
      }
    }
  });
});

describe("shiftMetrics", () => {
  it("pomiče samo ključeve iz pomaka", () => {
    expect(shiftMetrics(M, { guests: -16, finance: 6 })).toEqual({ ...M, guests: 34, finance: 61 });
  });

  it("reže na 0–100", () => {
    const low = { ...M, guests: 10, reviews: 95 };
    expect(shiftMetrics(low, overrideDelta(5, 1, { guests: 5 }))).toMatchObject({ guests: 0 });
    expect(shiftMetrics(low, overrideDelta(1, 5, { reviews: 4 }))).toMatchObject({ reviews: 100 });
  });

  it("bez rezanja: zatvaranje sa starom ocjenom + pomak = zatvaranje s novom", () => {
    const effects = { guests: 4, operations: 2 };
    const closedOld = applyRound(M, [{ quality: 2, effects }]);
    const closedNew = applyRound(M, [{ quality: 5, effects }]);
    expect(shiftMetrics(closedOld, overrideDelta(2, 5, effects))).toEqual(closedNew);
  });
});

describe("toAnswerView: overridden", () => {
  const row: AnswerRow = {
    id: "a1",
    situationId: "s1",
    mode: "click",
    optionId: "o1",
    text: null,
    pastedChars: 0,
    verdict: null,
    quality: 5,
    copied: false,
    overridden: true,
    createdAt: new Date("2026-10-24T12:00:00Z"),
  };

  it("profesorova ocjena nosi overridden: true", () => {
    expect(toAnswerView(row)).toEqual({ mode: "click", optionId: "o1", quality: 5, copied: false, overridden: true });
  });

  it("bez promjene polja nema", () => {
    expect(toAnswerView({ ...row, overridden: false })).not.toHaveProperty("overridden");
  });
});
