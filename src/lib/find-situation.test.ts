import { describe, expect, it } from "vitest";
import { findSituation } from "./find-situation";
import type { SituationView } from "./types";

const sit = (id: string, round: number) => ({ id, round }) as SituationView;

describe("findSituation (#239)", () => {
  const me = { situations: [sit("tekuca", 3)], pastSituations: [sit("lipanj", 1), sit("srpanj", 2)] };

  it("nalazi situaciju tekućeg mjeseca", () => {
    expect(findSituation(me, "tekuca")?.round).toBe(3);
  });

  it("nalazi situaciju iz zatvorenog mjeseca, pa stranica toka ne javlja da nije tvoja", () => {
    expect(findSituation(me, "lipanj")?.round).toBe(1);
    expect(findSituation(me, "srpanj")?.round).toBe(2);
  });

  it("nepoznat id daje undefined", () => {
    expect(findSituation(me, "tudja")).toBeUndefined();
  });

  it("bez pastSituations (prvi mjesec, stariji poslužitelj) radi samo s tekućim", () => {
    expect(findSituation({ situations: [sit("tekuca", 1)] }, "tekuca")?.round).toBe(1);
    expect(findSituation({ situations: [sit("tekuca", 1)] }, "lipanj")).toBeUndefined();
  });
});
