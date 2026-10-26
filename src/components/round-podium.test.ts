import { describe, expect, it } from "vitest";
import type { LeaderboardRow } from "@/lib/types";
import { podiumTop, seasonSubtitle } from "./round-podium";

const row = (companyId: string, progress: number, roundGain: number, extra: Partial<LeaderboardRow> = {}): LeaderboardRow => ({
  companyId, hotelName: companyId, playerName: companyId, place: "Rijeka", progress, closedRound: 1, roundGain, ...extra,
});

describe("podiumTop (ADR-059)", () => {
  it("podij sezone: insolventan hotel s najvećim napretkom ne uzima mjesto ispred solventnih", () => {
    const rows = [row("bankrot", 71.7, 20, { insolvent: true }), row("a", 35.7, 5, { cash: 1000 }), row("b", 30, 4), row("c", 20, 3), row("d", 10, 2)];
    expect(podiumTop(rows, "progress").map((r) => r.companyId)).toEqual(["a", "b", "c"]);
  });
  it("skok mjeseca: isto pravilo", () => {
    const rows = [row("bankrot", 0, 40, { cash: -1 }), row("a", 0, 5), row("b", 0, 9)];
    expect(podiumTop(rows).map((r) => r.companyId)).toEqual(["b", "a", "bankrot"]);
  });
});

describe("seasonSubtitle (ADR-059)", () => {
  it("bez hotela u blokadi podnaslov ostaje kratak", () => {
    expect(seasonSubtitle("Razred A", [row("a", 10, 1, { cash: 0 }), row("b", 5, 1)])).toBe("Razred A · pobjednici po napretku");
  });
  it("s hotelom u blokadi (zastavica ili vlastiti novac) podnaslov kaže da takvi idu iza ostalih", () => {
    const text = "Razred A · pobjednici po napretku, hoteli u blokadi idu iza ostalih";
    expect(seasonSubtitle("Razred A", [row("a", 10, 1), row("b", 50, 1, { insolvent: true })])).toBe(text);
    expect(seasonSubtitle("Razred A", [row("a", 10, 1, { cash: -1 })])).toBe(text);
  });
});
