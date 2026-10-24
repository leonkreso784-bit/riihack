import { describe, expect, it } from "vitest";
import type { SituationTemplate } from "@/lib/types";
import { drawSituations } from "./draw";

const pool8 = Array.from({ length: 8 }, (_, i) => ({ id: `s${i + 1}` })) as SituationTemplate[];
const ids = (l: SituationTemplate[]) => l.map((s) => s.id);

describe("drawSituations", () => {
  it("daje 2 situacije po krugu", () => {
    expect(drawSituations(42, 1, pool8)).toHaveLength(2);
  });
  it("isto sjeme daje isti rezultat", () => {
    expect(ids(drawSituations(42, 1, pool8))).toEqual(ids(drawSituations(42, 1, pool8)));
  });
  it("krugovi 1-4 zajedno daju 8 različitih id-eva", () => {
    const all = [1, 2, 3, 4].flatMap((r) => ids(drawSituations(42, r, pool8)));
    expect(new Set(all).size).toBe(8);
  });
  it("drugo sjeme daje drugi poredak", () => {
    const a = [1, 2, 3, 4].flatMap((r) => ids(drawSituations(42, r, pool8)));
    const b = [1, 2, 3, 4].flatMap((r) => ids(drawSituations(43, r, pool8)));
    expect(a).not.toEqual(b);
  });
  it("ne mijenja ulazni niz", () => {
    const copy = ids(pool8);
    drawSituations(42, 2, pool8);
    expect(ids(pool8)).toEqual(copy);
  });
});
