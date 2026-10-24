import { describe, expect, it } from "vitest";
import { roundFinance } from "@/lib/engine/economy";
import { FIXED_COST_PER_ROOM } from "@/lib/rules";
import type { ContractTemplate, ContractView } from "@/lib/types";
import { activeContracts, bonitet, delta, estimateCostParts, growthPct, monthlyCosts, planInvestments, readParts } from "./finance-view";

const tpl = (monthlyCost: number): ContractTemplate => ({ monthlyCost, nights: 10, pricePerNight: 60 }) as unknown as ContractTemplate;

describe("monthlyCosts", () => {
  it("jednako je troškovima motora (roundFinance)", () => {
    const m = { companyId: "a", nights: 200, contractNights: 10, capacityNights: 480, occupancyPct: 50, marketSharePct: 20 };
    const f = roundFinance(m, { round: 1, price: 80, marketing: 1200, staffCost: 6300, roomsCount: 16, cashBefore: 20000, contracts: [tpl(900), tpl(300)], investments: 1500 });
    const b = monthlyCosts({ staffCost: 6300, roomsCount: 16, marketing: 1200, contractsCost: 1200, investments: 1500 });
    expect(b.total).toBe(f.costs);
    expect(b.fixed).toBe(16 * FIXED_COST_PER_ROOM);
  });
  it("procjena marketinga iz ostatka vraća marketing", () => {
    const m = { companyId: "a", nights: 100, contractNights: 0, capacityNights: 480, occupancyPct: 20, marketSharePct: 10 };
    const f = roundFinance(m, { round: 1, price: 80, marketing: 700, staffCost: 6300, roomsCount: 16, cashBefore: 0, contracts: [tpl(900)], investments: 500 });
    const parts = estimateCostParts(f, { staffCost: 6300, roomsCount: 16, contractsCost: 900 });
    expect(parts.find((p) => p.key === "marketing")?.amount).toBe(700);
    expect(parts.reduce((s, p) => s + p.amount, 0)).toBe(f.costs);
  });
});

describe("pomoćne", () => {
  it("bonitet", () => {
    expect(bonitet(-1, 10000, 5).grade).toBe("D");
    expect(bonitet(5000, 10000, null).grade).toBe("–");
    expect(bonitet(12000, 10000, 100).grade).toBe("A+");
    expect(bonitet(10000, 10000, 100).grade).toBe("A");
    expect(bonitet(9000, 10000, 100).grade).toBe("B");
    expect(bonitet(9000, 10000, -100).grade).toBe("C");
  });
  it("rast i delta", () => {
    expect(growthPct(100, 125)).toBe(25);
    expect(growthPct(undefined, 125)).toBeNull();
    expect(delta(5, 8)).toEqual({ diff: -3, arrow: "▼" });
    expect(delta(5, undefined)).toBeNull();
  });
  it("aktivni ugovori i ulaganja", () => {
    const c = { status: "accepted", roundOffered: 1, durationRounds: 3, activeUntilRound: 3 } as ContractView;
    expect(activeContracts([c], 2)).toHaveLength(1);
    expect(activeContracts([c], 4)).toHaveLength(0);
    expect(activeContracts([{ ...c, status: "offered" }], 2)).toHaveLength(0);
    expect(planInvestments({ investments: { kitchen: 500, reception: 250 } })).toBe(750);
    expect(planInvestments({}, [{ investment: 300 } as never])).toBe(300);
  });
  it("readParts čita objekt i listu", () => {
    expect(readParts({ marketing: 5, staff: 0 })).toEqual([{ key: "marketing", label: "Marketing", amount: 5 }]);
    expect(readParts([{ label: "X", amount: 3 }])?.[0].amount).toBe(3);
    expect(readParts(undefined)).toBeNull();
  });
});
