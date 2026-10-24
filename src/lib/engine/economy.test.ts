import { describe, expect, it } from "vitest";
import type { ContractTemplate } from "@/lib/types";
import { SEASON_DEMAND_BP } from "@/lib/rules";
import { attractiveness, capacityNights, financeEffect, priceBp, refPrice, roundFinance, settleMarket } from "./economy";
import type { MarketInput } from "./economy";

const hotel = (companyId: string, price: number, extra: Partial<MarketInput> = {}): MarketInput => ({
  companyId,
  roomsCount: 20,
  reviews: 50,
  guests: 50,
  price,
  refPrice: 100,
  marketing: 0,
  contractNights: 0,
  ...extra,
});

describe("economy", () => {
  it("capacityNights i refPrice", () => {
    expect(capacityNights(20)).toBe(600);
    expect(refPrice([{ basePrice: 70 }, { basePrice: 90 }, { basePrice: 95 }])).toBe(85);
  });

  it("attractiveness", () => {
    const base = { reviews: 50, guests: 50, price: 80, refPrice: 100, marketing: 0 };
    expect(attractiveness(base)).toBe(125);
    expect(attractiveness({ ...base, price: 100 })).toBe(100);
    expect(attractiveness({ ...base, price: 200 })).toBe(25);
    expect(attractiveness({ ...base, price: 250 })).toBe(16);
    expect(attractiveness({ ...base, price: 300 })).toBe(0);
    expect(attractiveness({ ...base, price: 100, marketing: 5000 })).toBe(150);
    expect(Number.isFinite(attractiveness({ ...base, price: 0 }))).toBe(true);
  });

  it("priceBp: ispod ref najviše ×1,5, iznad ref pada s kvadratom, iznad 2,5× ref nitko ne dolazi (#162)", () => {
    expect(priceBp(50, 100)).toBe(15000);
    expect(priceBp(80, 100)).toBe(12500);
    expect(priceBp(100, 100)).toBe(10000);
    expect(priceBp(150, 100)).toBe(4444);
    expect(priceBp(250, 100)).toBe(1600);
    expect(priceBp(251, 100)).toBe(0);
    expect(priceBp(0, 100)).toBe(15000);
  });

  it("dobit ima vrh blizu referentne cijene, ne na najvišoj cijeni (#162)", () => {
    const others = ["B", "C", "D", "E"].map((id) => hotel(id, 100));
    for (let round = 1; round <= SEASON_DEMAND_BP.length; round++) {
      let best = 0;
      let bestRevenue = -1;
      for (let price = 30; price <= 400; price += 5) {
        const [a] = settleMarket(round, [hotel("A", price), ...others]);
        const revenue = a.nights * price; // troškovi su fiksni, pa vrh prihoda = vrh dobiti
        if (revenue > bestRevenue) [best, bestRevenue] = [price, revenue];
      }
      expect(best, `mjesec ${round}`).toBeGreaterThanOrEqual(80);
      expect(best, `mjesec ${round}`).toBeLessThanOrEqual(150);
    }
  });

  it("svi utječu na sve", () => {
    const [a, b] = settleMarket(2, [hotel("A", 80), hotel("B", 100)]);
    expect(a.nights).toBe(566);
    expect(b.nights).toBe(453);
    const [a2, b2] = settleMarket(2, [hotel("A", 80), hotel("B", 80)]);
    expect(a2.nights).toBe(510);
    expect(b2.nights).toBe(510);
  });

  it("kapacitet i ugovori", () => {
    const [small] = settleMarket(3, [hotel("S", 50, { roomsCount: 2 }), hotel("B", 100, { roomsCount: 200 })]);
    expect(small.nights).toBeLessThanOrEqual(60);
    const [a] = settleMarket(2, [hotel("A", 80, { contractNights: 40 }), hotel("B", 100)]);
    expect(a.nights).toBeLessThanOrEqual(560);
    expect(a.contractNights).toBe(40);
  });

  it("rubovi", () => {
    expect(settleMarket(1, [])).toEqual([]);
    const [z] = settleMarket(1, [hotel("Z", 100, { reviews: 0, guests: 0 })]);
    expect(z.nights).toBe(0);
    expect(settleMarket(1, [hotel("P", 0)])[0].nights).toBeGreaterThanOrEqual(0);
  });

  it("roundFinance", () => {
    const agency = { nights: 40, pricePerNight: 70, monthlyCost: 0 } as ContractTemplate;
    const m = { companyId: "A", nights: 400, contractNights: 40, capacityNights: 600, occupancyPct: 73, marketSharePct: 50 };
    const f = roundFinance(m, {
      round: 2,
      price: 80,
      marketing: 1000,
      staffCost: 9000,
      roomsCount: 20,
      cashBefore: 20000,
      contracts: [agency],
    });
    expect(f.revenue).toBe(34800);
    expect(f.costs).toBe(16000);
    expect(f.profit).toBe(18800);
    expect(f.cashAfter).toBe(38800);
    expect(f.round).toBe(2);
    expect(f.contractNights).toBe(40);
  });

  it("roundFinance: raspodjela prihoda i troškova zbraja se u revenue i costs", () => {
    const agency = { nights: 40, pricePerNight: 70, monthlyCost: 0 } as ContractTemplate;
    const laundry = { nights: 0, pricePerNight: 0, monthlyCost: 1500 } as ContractTemplate;
    const m = { companyId: "A", nights: 400, contractNights: 40, capacityNights: 600, occupancyPct: 73, marketSharePct: 50 };
    const f = roundFinance(m, {
      round: 2,
      price: 80,
      marketing: 1000,
      staffCost: 9000,
      roomsCount: 20,
      cashBefore: 20000,
      contracts: [agency, laundry],
      investments: 2000,
    });
    expect(f.breakdown).toEqual({
      revenueOwn: 32000,
      revenueContracts: 2800,
      costStaff: 9000,
      costRooms: 6000,
      costMarketing: 1000,
      costContracts: 1500,
      costInvestments: 2000,
    });
    expect(f.revenue).toBe(34800);
    expect(f.costs).toBe(19500);
  });

  it("roundFinance s ulaganjem u odjele", () => {
    const agency = { nights: 40, pricePerNight: 70, monthlyCost: 0 } as ContractTemplate;
    const m = { companyId: "A", nights: 400, contractNights: 40, capacityNights: 600, occupancyPct: 73, marketSharePct: 50 };
    const f = roundFinance(m, {
      round: 2,
      price: 80,
      marketing: 1000,
      staffCost: 9000,
      roomsCount: 20,
      cashBefore: 20000,
      contracts: [agency],
      investments: 2000,
    });
    expect(f.costs).toBe(18000);
    expect(f.profit).toBe(16800);
    expect(f.cashAfter).toBe(36800);
    expect(f.investments).toBe(2000);
  });

  it("financeEffect", () => {
    expect(financeEffect(18800)).toBe(5);
    expect(financeEffect(-3000)).toBe(-1);
    expect(financeEffect(1999)).toBe(0);
    expect(financeEffect(-20000)).toBe(-5);
  });
});
