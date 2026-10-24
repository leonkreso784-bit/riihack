import { describe, expect, it } from "vitest";
import type { Metrics } from "@/lib/types";
import { applyRound, progress, qualityFactor, roomStatusAfter } from "./round";

const all50: Metrics = { guests: 50, reviews: 50, staff: 50, operations: 50, finance: 50 };

describe("applyRound", () => {
  it("množitelj po kvaliteti: 1 → −2, 2 → 0, 3 → +1, 4 → +2, 5 → +3 (BUG-026)", () => {
    expect([1, 2, 3, 4, 5].map(qualityFactor)).toEqual([-2, 0, 1, 2, 3]);
  });
  it("računa množitelj × učinak po rezultatu", () => {
    const out = applyRound(all50, [
      { quality: 5, effects: { guests: 4 } },
      { quality: 1, effects: { guests: 3, finance: 2 } },
    ]);
    expect(out.guests).toBe(56);
    expect(out.finance).toBe(46);
    expect(out.reviews).toBe(50);
  });
  it("odgovor 3/5 na sve podiže pokazatelje, a propuštene ih spuštaju (BUG-026)", () => {
    const eff = { guests: 3, staff: 4 };
    const fair = applyRound(all50, [{ quality: 3, effects: eff }, { quality: 3, effects: eff }]);
    expect(fair.guests).toBeGreaterThan(50);
    expect(fair.staff).toBeGreaterThan(50);
    const missed = applyRound(all50, [{ quality: 1, effects: eff }]);
    expect(missed.guests).toBeLessThan(50);
    expect(applyRound(all50, [{ quality: 2, effects: eff }])).toEqual(all50);
  });
  it("reže na 100", () => {
    expect(applyRound({ ...all50, guests: 99 }, [{ quality: 5, effects: { guests: 4 } }]).guests).toBe(100);
  });
  it("reže na 0", () => {
    expect(applyRound({ ...all50, guests: 2 }, [{ quality: 1, effects: { guests: 3 } }]).guests).toBe(0);
  });
  it("ne mijenja ulazne metrike", () => {
    applyRound(all50, [{ quality: 5, effects: { guests: 4 } }]);
    expect(all50.guests).toBe(50);
  });
});

describe("progress", () => {
  it("guests 55 -> 2", () => expect(progress(all50, { ...all50, guests: 55 })).toBe(2));
  it("reviews 75 -> 80 -> 4", () =>
    expect(progress({ ...all50, reviews: 75 }, { ...all50, reviews: 80 })).toBe(4));
  it("staff 30 -> 27 -> -2", () => expect(progress({ ...all50, staff: 30 }, { ...all50, staff: 27 })).toBe(-2));
  it("bez promjene -> 0", () => expect(progress(all50, all50)).toBe(0));
  it("start 0 i pad -> 0 (bez dijeljenja nulom)", () =>
    expect(progress({ ...all50, guests: 0 }, { ...all50, guests: 0 })).toBe(0));
  it("start 100 -> 0", () =>
    expect(progress({ ...all50, guests: 100 }, { ...all50, guests: 100 })).toBe(0));
  it("raspon: sve na 100 od 0 -> 100, sve na 0 od 100 -> -100", () => {
    const z: Metrics = { guests: 0, reviews: 0, staff: 0, operations: 0, finance: 0 };
    const h: Metrics = { guests: 100, reviews: 100, staff: 100, operations: 100, finance: 100 };
    expect(progress(z, h)).toBe(100);
    expect(progress(h, z)).toBe(-100);
  });
});

describe("roomStatusAfter", () => {
  it("3 -> free", () => expect(roomStatusAfter(3, "broken")).toBe("free"));
  it("2 -> problemStatus", () => expect(roomStatusAfter(2, "broken")).toBe("broken"));
});
