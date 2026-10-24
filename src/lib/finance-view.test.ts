import { describe, expect, it } from "vitest";
import { HOTELS } from "@/content";
import { roundFinance } from "./engine/economy";
import { FIXED_COST_PER_ROOM } from "./rules";
import { activeIn, breakdown, contractMargin, growthPct, nightMargin } from "./finance-view";
import type { ContractView } from "./types";

const hotel = HOTELS[0];
const contract = (over: Partial<ContractView>): ContractView => ({
  id: "k", templateId: "t", businessName: "B", businessKind: "agency", title: "", text: "",
  monthlyCost: 900, nights: 40, pricePerNight: 70, durationRounds: 2, roundOffered: 1, status: "accepted", ...over,
});

describe("breakdown", () => {
  it("splits the engine's totals back into the same items", () => {
    const k = contract({ activeUntilRound: 2 });
    const f = roundFinance(
      { nights: 300, contractNights: 40, capacityNights: 480, occupancyPct: 71, marketSharePct: 20 } as never,
      { round: 2, price: 90, marketing: 1200, staffCost: hotel.staffCost, roomsCount: 16, cashBefore: 20000, contracts: [k as never], investments: 2000 },
    );
    const vat = f.breakdown!.costVat!, commission = f.breakdown!.costCommission!, materials = f.breakdown!.costMaterials!;
    expect(vat + commission + materials).toBeGreaterThan(0);
    const expected = {
      costs: { staff: hotel.staffCost, rooms: 16 * FIXED_COST_PER_ROOM, marketing: 1200, contracts: 900, investments: 2000, vat, commission, materials },
      revenue: { rooms: 300 * 90, contracts: 40 * 70 },
    };
    // From the server's breakdown: all items.
    expect(breakdown(f, { templateId: hotel.id, roomsCount: 16 }, [k])).toEqual(expected);
    // Rebuilt for an old month that has only totals: the calibration items are unknown there and stay in the marketing remainder.
    expect(breakdown({ ...f, breakdown: undefined }, { templateId: hotel.id, roomsCount: 16 }, [k])).toEqual({
      ...expected,
      costs: { ...expected.costs, marketing: 1200 + vat + commission + materials, vat: 0, commission: 0, materials: 0 },
    });
  });

  it("counts a contract only in its active months", () => {
    const k = contract({ roundOffered: 2, activeUntilRound: 3 });
    expect([1, 2, 3, 4].map((r) => activeIn([k], r).length)).toEqual([0, 1, 1, 0]);
    expect(activeIn([contract({ status: "offered" })], 1)).toEqual([]);
  });
});

describe("nightMargin and contractMargin", () => {
  it("match the engine: what a night or a contract leaves after PDV, provizija and materijal", () => {
    const m = { companyId: "A", nights: 100, contractNights: 0, capacityNights: 600, occupancyPct: 50, marketSharePct: 10 };
    const f = roundFinance(m, { round: 1, price: 113, marketing: 0, staffCost: 0, roomsCount: 0, cashBefore: 0, contracts: [] });
    expect(f.revenue - f.costs).toBe(100 * nightMargin(113)); // 113 € -> neto 100, provizija 8, materijal 17 = 75
    expect(nightMargin(113)).toBe(75);
    expect(contractMargin(1130)).toBe(1000 - 170);
  });
});

describe("growthPct", () => {
  it("compares with the month before", () => {
    expect(growthPct(15800, 18900)).toBe(20);
    expect(growthPct(undefined, 100)).toBeNull();
  });
});
