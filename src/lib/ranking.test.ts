import { describe, expect, it } from "vitest";
import { isInsolvent, rankBy, rankByProgress } from "./ranking";

const row = (id: string, progress: number, cash?: number, insolvent?: boolean) => ({ id, progress, cash, insolvent });

describe("isInsolvent", () => {
  it("račun ispod nule ili zastavica; nula i nepoznat iznos su solventni", () => {
    expect(isInsolvent({ cash: -1 })).toBe(true);
    expect(isInsolvent({ cash: 0 })).toBe(false);
    expect(isInsolvent({ cash: 5000 })).toBe(false);
    expect(isInsolvent({})).toBe(false);
    expect(isInsolvent({ insolvent: true })).toBe(true);
    expect(isInsolvent({ insolvent: true, cash: 5000 })).toBe(true); // zastavica poslužitelja je mjerodavna
  });
});

describe("rankByProgress (ADR-059)", () => {
  it("primjer iz #198: račun −51.600 € i napredak 71,7 ne stoji iznad solventnog s napretkom 35,7", () => {
    const ranked = rankByProgress([row("bankrot", 71.7, -51600), row("solventan", 35.7, 104712)]);
    expect(ranked.map((r) => r.id)).toEqual(["solventan", "bankrot"]);
  });

  it("radi i bez iznosa računa, samo sa zastavicom (tuđi redak studentu)", () => {
    const ranked = rankByProgress([row("a", 80, undefined, true), row("b", 10), row("c", 40)]);
    expect(ranked.map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("bez insolventnih ostaje običan poredak po napretku", () => {
    const ranked = rankByProgress([row("a", 10, 100), row("b", 30, 0), row("c", 20, 50)]);
    expect(ranked.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("unutar insolventnih vrijedi napredak", () => {
    const ranked = rankByProgress([row("a", 5, -10), row("b", 50, -10), row("c", -20, 1)]);
    expect(ranked.map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("jednaki napredak zadržava redoslijed poslužitelja (stabilan sort), ulaz se ne mijenja", () => {
    const input = [row("a", 10, 5), row("b", 10, 9), row("c", 10, -1)];
    const ranked = rankByProgress(input);
    expect(ranked.map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect(input.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("nikad insolventan prije solventnog, za sve kombinacije", () => {
    const rows = [row("a", 90, -1), row("b", 80, 0), row("c", 70, -5000), row("d", -30, 10), row("e", 60, undefined, true), row("f", 5)];
    const ranked = rankByProgress(rows);
    const firstInsolvent = ranked.findIndex(isInsolvent);
    expect(ranked.slice(firstInsolvent).every(isInsolvent)).toBe(true);
    expect(ranked.slice(0, firstInsolvent).map((r) => r.id)).toEqual(["b", "f", "d"]);
  });
});

describe("rankBy", () => {
  it("isto pravilo za drugi pokazatelj (skok mjeseca na podiju)", () => {
    const rows = [{ id: "a", gain: 30, cash: -5 }, { id: "b", gain: 4, cash: 100 }, { id: "c", gain: 9, cash: 100 }];
    expect(rankBy(rows, (r) => r.gain).map((r) => r.id)).toEqual(["c", "b", "a"]);
  });
});
