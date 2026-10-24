import { describe, expect, it } from "vitest";
import type { ContractTemplate } from "@/lib/types";
import { contractEffects, contractNightsTotal, drawOffer, isActive } from "./contracts";

const t = (i: number, extra: Partial<ContractTemplate> = {}): ContractTemplate => ({
  id: `t${i}`,
  businessId: "b",
  title: "t",
  text: "",
  durationRounds: 1,
  monthlyCost: 0,
  nights: 10,
  pricePerNight: 50,
  effects: {},
  ...extra,
});
const t8 = Array.from({ length: 8 }, (_, i) => t(i));

describe("contracts", () => {
  it("drawOffer je deterministički i iz popisa", () => {
    const a = drawOffer(42, 2, 0, t8);
    expect(drawOffer(42, 2, 0, t8)).toBe(a);
    expect(t8).toContain(a);
  });

  it("isActive", () => {
    expect(isActive({ status: "accepted", activeFrom: 2, activeTo: 3 }, 3)).toBe(true);
    expect(isActive({ status: "accepted", activeFrom: 2, activeTo: 3 }, 4)).toBe(false);
    expect(isActive({ status: "offered", activeFrom: 2, activeTo: 3 }, 3)).toBe(false);
    expect(isActive({ status: "accepted", activeFrom: null, activeTo: null }, 3)).toBe(false);
  });

  it("zbrojevi", () => {
    const list = [t(1, { nights: 40, effects: { guests: 2, staff: 1 } }), t(2, { nights: 5, effects: { guests: 3 } })];
    expect(contractNightsTotal(list)).toBe(45);
    expect(contractEffects(list)).toEqual({ guests: 5, staff: 1 });
    expect(contractEffects([])).toEqual({});
  });
});
