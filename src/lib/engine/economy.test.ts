import { describe, expect, it } from "vitest";
import type { ContractTemplate } from "@/lib/types";
import { SEASON_DEMAND_BP } from "@/lib/rules";
import { attractiveness, capacityNights, financeEffect, priceBp, qualityBp, refPrice, roundFinance, settleMarket } from "./economy";
import type { MarketInput } from "./economy";

const hotel = (companyId: string, price: number, extra: Partial<MarketInput> = {}): MarketInput => ({
  companyId,
  roomsCount: 20,
  reviews: 50,
  guests: 50,
  staff: 50,
  operations: 50,
  finance: 50,
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
    const base = { reviews: 50, guests: 50, staff: 50, operations: 50, finance: 50, price: 80, refPrice: 100, marketing: 0 };
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
    const [z] = settleMarket(1, [hotel("Z", 100, { reviews: 0, guests: 0, staff: 0, operations: 0, finance: 0 })]);
    expect(z.nights).toBe(0);
    expect(settleMarket(1, [hotel("P", 0)])[0].nights).toBeGreaterThanOrEqual(0);
  });

  // BUG-024 (ADR-045): hotel koji ne rješava situacije mora gubiti goste, i u kolovozu.
  const POOR = { guests: 34, reviews: 40, staff: 26, operations: 40, finance: 40 };
  const GOOD = { guests: 70, reviews: 70, staff: 70, operations: 70, finance: 70 };

  it("qualityBp: ponderirani prosjek svih pet pokazatelja, strmo ispod 50 (BUG-024)", () => {
    const all = (n: number) => ({ guests: n, reviews: n, staff: n, operations: n, finance: n });
    expect(qualityBp(all(50))).toBe(10000);
    expect(qualityBp(all(70))).toBe(14000);
    expect(qualityBp(all(100))).toBe(20000);
    expect(qualityBp(all(25))).toBe(2500);
    expect(qualityBp(all(0))).toBe(0);
    expect(qualityBp(POOR)).toBe(5212);
    // osoblje, rad i financije se računaju, ne samo gosti i recenzije
    expect(qualityBp({ ...all(50), staff: 20 })).toBeLessThan(qualityBp(all(50)));
    expect(qualityBp({ ...all(50), operations: 20 })).toBeLessThan(qualityBp(all(50)));
    expect(qualityBp({ ...all(50), finance: 20 })).toBeLessThan(qualityBp(all(50)));
    expect(attractiveness({ ...POOR, price: 100, refPrice: 100, marketing: 0 })).toBe(52);
    expect(attractiveness({ ...GOOD, price: 100, refPrice: 100, marketing: 0 })).toBe(140);
  });

  it("slabi pokazatelji: manje noćenja i prihoda u svim mjesecima, isti grad i odvojeni gradovi (BUG-024)", () => {
    for (let round = 1; round <= SEASON_DEMAND_BP.length; round++) {
      // isti grad: slab i dobar hotel uz tri prosječna, ista cijena
      const [poor, good] = settleMarket(round, [hotel("P", 100, POOR), hotel("G", 100, GOOD), ...["B", "C", "D"].map((id) => hotel(id, 100))]);
      expect(poor.nights, `mjesec ${round}`).toBeLessThan(good.nights);
      expect(poor.nights * 100, `mjesec ${round}`).toBeLessThan(good.nights * 100);
      // odvojeni gradovi: pet slabih protiv pet dobrih hotela
      const [p] = settleMarket(round, ["A", "B", "C", "D", "E"].map((id) => hotel(id, 100, POOR)));
      const [g] = settleMarket(round, ["A", "B", "C", "D", "E"].map((id) => hotel(id, 100, GOOD)));
      expect(p.nights, `mjesec ${round}`).toBeLessThan(g.nights);
      expect(p.nights * 100, `mjesec ${round}`).toBeLessThan(g.nights * 100);
    }
  });

  it("kolovoz: slab hotel nije pun ni kad je grad pun, dobar grad ostaje pun (BUG-024)", () => {
    const [poor, ...good] = settleMarket(3, [hotel("P", 100, POOR), ...["B", "C", "D", "E"].map((id) => hotel(id, 100, GOOD))]);
    expect(poor.occupancyPct).toBeLessThanOrEqual(40);
    for (const g of good) expect(g.occupancyPct).toBeGreaterThanOrEqual(90);
    const [alonePoor] = settleMarket(3, ["A", "B", "C", "D", "E"].map((id) => hotel(id, 100, POOR)));
    expect(alonePoor.occupancyPct).toBeLessThanOrEqual(55);
    for (const g of settleMarket(3, ["A", "B", "C", "D", "E"].map((id) => hotel(id, 100, GOOD)))) {
      expect(g.occupancyPct).toBeGreaterThanOrEqual(90);
    }
    // prosječan grad (svi pokazatelji 50) puni se kao i prije: potražnja kolovoza
    for (const a of settleMarket(3, ["A", "B", "C", "D", "E"].map((id) => hotel(id, 100)))) expect(a.occupancyPct).toBe(95);
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
    // PDV 13/113: 32.000 -> 3.681, 2.800 -> 322; provizija 8 % od (32.000 - 3.681) = 2.266; materijal 17 % od (34.800 - 4.003) = 5.235
    expect(f.revenue).toBe(34800);
    expect(f.costs).toBe(9000 + 9000 + 1000 + 4003 + 2266 + 5235);
    expect(f.profit).toBe(34800 - f.costs);
    expect(f.cashAfter).toBe(20000 + f.profit);
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
      costRooms: 9000,
      costMarketing: 1000,
      costContracts: 1500,
      costInvestments: 2000,
      costVat: 4003,
      costCommission: 2266,
      costMaterials: 5235,
    });
    expect(f.revenue).toBe(34800);
    expect(f.costs).toBe(9000 + 9000 + 1000 + 1500 + 2000 + 4003 + 2266 + 5235);
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
    expect(f.costs).toBe(9000 + 9000 + 1000 + 2000 + 4003 + 2266 + 5235);
    expect(f.profit).toBe(34800 - f.costs);
    expect(f.cashAfter).toBe(20000 + f.profit);
    expect(f.investments).toBe(2000);
  });

  it("roundFinance: bez prihoda nema PDV-a, provizije ni materijala; provizija samo na slobodno tržište", () => {
    const m = { companyId: "A", nights: 0, contractNights: 0, capacityNights: 600, occupancyPct: 0, marketSharePct: 0 };
    const f = roundFinance(m, { round: 1, price: 80, marketing: 0, staffCost: 1000, roomsCount: 2, cashBefore: 0, contracts: [] });
    expect([f.breakdown!.costVat, f.breakdown!.costCommission, f.breakdown!.costMaterials]).toEqual([0, 0, 0]);
    const agency = { nights: 10, pricePerNight: 113, monthlyCost: 0 } as ContractTemplate;
    const g = roundFinance(m, { round: 1, price: 80, marketing: 0, staffCost: 0, roomsCount: 0, cashBefore: 0, contracts: [agency] });
    expect([g.breakdown!.costVat, g.breakdown!.costCommission, g.breakdown!.costMaterials]).toEqual([130, 0, 170]); // 1.130 € s PDV-om: PDV 130, neto 1.000, materijal 17 %
  });

  it("financeEffect", () => {
    expect(financeEffect(18800)).toBe(5);
    expect(financeEffect(-3000)).toBe(-1);
    expect(financeEffect(1999)).toBe(0);
    expect(financeEffect(-20000)).toBe(-5);
  });
});
