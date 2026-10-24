import { describe, expect, it } from "vitest";
import { HOTELS } from "@/content";
import { roundFinance } from "./engine/economy";
import { FIXED_COST_PER_ROOM } from "./rules";
import { activeIn, breakdown, growthPct } from "./finance-view";
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
    const expected = {
      costs: { staff: hotel.staffCost, rooms: 16 * FIXED_COST_PER_ROOM, marketing: 1200, contracts: 900, investments: 2000 },
      revenue: { rooms: 300 * 90, contracts: 40 * 70 },
    };
    // From the server's breakdown, and rebuilt for an old month that has only totals: both the same.
    expect(breakdown(f, { templateId: hotel.id, roomsCount: 16 }, [k])).toEqual(expected);
    expect(breakdown({ ...f, breakdown: undefined }, { templateId: hotel.id, roomsCount: 16 }, [k])).toEqual(expected);
  });

  it("counts a contract only in its active months", () => {
    const k = contract({ roundOffered: 2, activeUntilRound: 3 });
    expect([1, 2, 3, 4].map((r) => activeIn([k], r).length)).toEqual([0, 1, 1, 0]);
    expect(activeIn([contract({ status: "offered" })], 1)).toEqual([]);
  });
});

describe("growthPct", () => {
  it("compares with the month before", () => {
    expect(growthPct(15800, 18900)).toBe(20);
    expect(growthPct(undefined, 100)).toBeNull();
  });
});
