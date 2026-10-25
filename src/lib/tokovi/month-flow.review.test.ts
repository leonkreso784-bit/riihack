// Review 25.10. (AI-TOKOVI-05/06/09/13, GAP1-04, GAP4-03/05): Tokovi month flow must not show numbers the engine did not use.
import { describe, expect, it } from "vitest";
import { roundFinance, settleMarket, type MarketInput } from "@/lib/engine/economy";
import type { ContractTemplate, RoundFinance } from "@/lib/types";
import { buildMonthFlow, estimateWhatIf } from "./month-flow";

const rooms = (n: number, basePrice: number) => Array.from({ length: n }, () => ({ basePrice }));
const MY_ROOMS = rooms(14, 75);
const contract = { nights: 40, pricePerNight: 60, monthlyCost: 250 } as ContractTemplate;
const other = (id: string, price: number): MarketInput => ({
  companyId: id, roomsCount: 14, reviews: 50, guests: 50, staff: 50, operations: 50, finance: 50, price, refPrice: 75, marketing: 0, contractNights: 0,
});

/** My hotel (index 0) plus `others`, settled by the real engine. */
function month(round: number, price: number, marketing: number, others: MarketInput[], contractNights = 40, q = 60): RoundFinance {
  const me: MarketInput = { companyId: "me", roomsCount: 14, reviews: q, guests: q, staff: q, operations: q, finance: q, price, refPrice: 75, marketing, contractNights };
  const market = settleMarket(round, [me, ...others]);
  return roundFinance(market[0], {
    round, price, marketing, staffCost: 6300, roomsCount: 14, cashBefore: 18400, contracts: contractNights ? [contract] : [], investments: 0,
  });
}
const step = (flow: ReturnType<typeof buildMonthFlow>, id: string) => flow!.steps.find((s) => s.id === id)!;

describe("month without market guests (AI-TOKOVI-05, GAP4-05)", () => {
  // 400 € on a 75 € hotel is above 2,5x the reference: the engine price factor is 0 and nobody comes.
  const real = month(2, 400, 0, [other("a", 75), other("b", 75)]);

  it("the engine really sold 0 market nights", () => {
    expect(real.nights).toBe(0);
  });

  it("does not show the best price factor (1,50) for a month whose real factor was 0", () => {
    const flow = buildMonthFlow(real, MY_ROOMS, 3, 2);
    const plan = step(flow, "plan");
    const attract = step(flow, "privlacnost");
    expect(plan.outputs.find((o) => o.label === "Faktor cijene")!.value).not.toBe("× 1,50");
    expect(attract.big ?? "").not.toContain("1,50");
    expect(attract.calc ?? "").not.toContain("1,50");
  });
});

describe("finance points line (AI-TOKOVI-06)", () => {
  it("does not round the quotient up next to a truncated result", () => {
    const real = month(2, 75, 1000, [other("a", 80)]);
    const fake = { ...real, profit: 3960 };
    const fin = step(buildMonthFlow(fake, MY_ROOMS, 2, 2), "financije");
    expect(fin.calc).not.toMatch(/= 2,0 → \+1/);
    expect(fin.calc).toMatch(/1,98 → \+1/);
  });
});

describe("price factor above the average (AI-TOKOVI-13)", () => {
  it("shows the square that the engine uses", () => {
    const real = month(2, 100, 1000, [other("a", 75), other("b", 75)]);
    const plan = step(buildMonthFlow(real, MY_ROOMS, 3, 2), "plan");
    expect(plan.calc).toMatch(/\(75 ÷ 100\)²/);
  });
});

describe("what-if for a hotel that was full (GAP1-04)", () => {
  // August, a good hotel (all metrics 75) at the reference price next to two average ones: demand is above its capacity.
  const others = [other("a", 80), other("b", 80)];
  const real = month(3, 75, 1500, others, 0, 75);

  it("the hotel really was full", () => {
    expect(real.nights + real.contractNights).toBe(real.capacityNights);
  });

  it("does not predict the opposite of the engine when the price rises", () => {
    const est = estimateWhatIf(real, MY_ROOMS, { price: 85, marketing: 1500 });
    const engine = month(3, 85, 1500, others, 0, 75); // re-settle the whole city with only my price changed
    // Either the estimate refuses (hotel was full), or it agrees with the engine in direction.
    if (est.ok) expect(Math.sign(est.finance.profit - real.profit)).toBe(Math.sign(engine.profit - real.profit));
    else expect(est.reason).toMatch(/pun/);
  });
});

describe("what-if float floor (AI-TOKOVI-09)", () => {
  it("keeps the nights when the price factor does not change", () => {
    // Share 29 % and 480 nights: 480 / 0,295 * 1 / (1 + 0,705 / 0,295) is 479,99999999999994 in floating point.
    const real = month(2, 40, 1000, [other("a", 75)]);
    const fake: RoundFinance = {
      ...real, nights: 480, marketSharePct: 29, capacityNights: 900, contractNights: 0, occupancyPct: 53,
      breakdown: { ...real.breakdown!, revenueOwn: 480 * 40 },
    };
    // 40 € and 42 € are both below 2/3 of 75 €, so both have the capped factor 1,50.
    const est = estimateWhatIf(fake, MY_ROOMS, { price: 42, marketing: 1000 });
    if (!est.ok) throw new Error(est.reason);
    expect(est.finance.nights).toBe(480);
  });
});

describe("last month (GAP4-03)", () => {
  it("does not promise a next month after the last one", () => {
    const real = month(4, 75, 1000, [other("a", 80)]);
    const cash = step(buildMonthFlow(real, MY_ROOMS, 2, 4), "novac");
    expect(cash.note ?? "").not.toMatch(/sljedećeg mjeseca/);
  });
});
