import { describe, expect, it } from "vitest";
import { financeEffect, refPrice, roundFinance, settleMarket, type MarketInput } from "@/lib/engine/economy";
import { MARKETING_MAX, PRICE_MAX, PRICE_MIN } from "@/lib/rules";
import type { ContractTemplate, RoundFinance } from "@/lib/types";
import { buildMonthFlow, estimateWhatIf, monthBase } from "./month-flow";

const rooms = (n: number, basePrice: number) => Array.from({ length: n }, () => ({ basePrice }));
const MY_ROOMS = rooms(14, 75);
const contract = { nights: 40, pricePerNight: 60, monthlyCost: 250 } as ContractTemplate;

// A small city: the player (index 0) and three others, all settled by the real engine.
function city(price: number, marketing: number) {
  const hotels: MarketInput[] = [
    { companyId: "me", roomsCount: 14, reviews: 52, guests: 57, price, refPrice: 75, marketing, contractNights: 40 },
    { companyId: "a", roomsCount: 16, reviews: 70, guests: 60, price: 80, refPrice: 80, marketing: 800, contractNights: 0 },
    { companyId: "b", roomsCount: 12, reviews: 60, guests: 50, price: 70, refPrice: 72, marketing: 300, contractNights: 0 },
    { companyId: "c", roomsCount: 14, reviews: 50, guests: 60, price: 78, refPrice: 78, marketing: 500, contractNights: 30 },
  ];
  const market = settleMarket(2, hotels);
  const finance = roundFinance(market[0], {
    round: 2, price, marketing, staffCost: 6300, roomsCount: 14, cashBefore: 18400, contracts: [contract], investments: 500,
  });
  return { hotels, market, finance };
}
const realWith = (price: number, marketing: number) => city(price, marketing).finance;

describe("monthBase", () => {
  it("rebuilds price, marketing and starting cash from the finance row", () => {
    const base = monthBase(realWith(75, 1000), MY_ROOMS)!;
    expect(base).toMatchObject({ price: 75, marketing: 1000, ref: 75, roomsCount: 14, cashBefore: 18400 });
  });
  it("is null without a breakdown", () => {
    expect(monthBase({ ...realWith(75, 1000), breakdown: undefined }, MY_ROOMS)).toBeNull();
  });
});

describe("estimateWhatIf", () => {
  it("with unchanged price and marketing gives back the real month", () => {
    const real = realWith(75, 1000);
    const est = estimateWhatIf(real, MY_ROOMS, { price: 75, marketing: 1000 });
    expect(est).toEqual({ ok: true, changed: false, finance: real });
  });

  it("stays within rounding of the real engine when the other hotels do not change", () => {
    const real = realWith(75, 1000);
    for (const [price, marketing] of [[85, 1000], [70, 1000], [75, 2500], [90, 0]] as const) {
      const est = estimateWhatIf(real, MY_ROOMS, { price, marketing });
      const truth = realWith(price, marketing);
      expect(est.ok).toBe(true);
      if (!est.ok) continue;
      // The share is a whole percent, so allow about 8 % on nights and the profit that follows from them.
      expect(Math.abs(est.finance.nights - truth.nights)).toBeLessThanOrEqual(Math.ceil(truth.nights * 0.08));
      expect(Math.abs(est.finance.profit - truth.profit)).toBeLessThanOrEqual(Math.ceil(Math.abs(truth.revenue) * 0.1));
      // Costs are exact, not estimated.
      expect(est.finance.breakdown!.costMarketing).toBe(marketing);
      expect(est.finance.costs).toBe(truth.costs);
    }
  });

  it("uses the engine's own finance maths for the rest of the chain", () => {
    const real = realWith(75, 1000);
    const est = estimateWhatIf(real, MY_ROOMS, { price: 80, marketing: 1000 });
    if (!est.ok) throw new Error("expected an estimate");
    const f = est.finance;
    expect(f.revenue).toBe(f.nights * 80 + 40 * 60);
    expect(f.profit).toBe(f.revenue - f.costs);
    expect(f.cashAfter).toBe(18400 + f.profit);
    expect(financeEffect(f.profit)).toBe(financeEffect(f.revenue - f.costs));
  });

  it("never lowers nights when marketing goes up", () => {
    const real = realWith(75, 1000);
    let last = -1;
    for (let m = 0; m <= MARKETING_MAX; m += 250) {
      const est = estimateWhatIf(real, MY_ROOMS, { price: 75, marketing: m });
      if (!est.ok) throw new Error("expected an estimate");
      expect(est.finance.nights).toBeGreaterThanOrEqual(last);
      last = est.finance.nights;
    }
  });

  it("never gives more nights than free capacity", () => {
    const real = realWith(75, 1000);
    const est = estimateWhatIf(real, MY_ROOMS, { price: PRICE_MIN, marketing: MARKETING_MAX });
    if (!est.ok) throw new Error("expected an estimate");
    expect(est.finance.nights).toBeLessThanOrEqual(real.capacityNights - real.contractNights);
  });

  it("treats prices at the clamps like the engine: below half the reference and above 1.5 times add nothing", () => {
    const real = realWith(75, 1000);
    const nights = (p: number) => {
      const e = estimateWhatIf(real, MY_ROOMS, { price: p, marketing: 1000 });
      if (!e.ok) throw new Error("expected an estimate");
      return e.finance.nights;
    };
    // priceBp is clamped to 5000..15000: ref 75 means <= 50 EUR is the top (x1.5), >= 150 EUR the bottom (x0.5).
    expect(nights(PRICE_MIN)).toBe(nights(50));
    expect(nights(PRICE_MAX)).toBe(nights(150));
    expect(nights(200)).toBe(nights(PRICE_MAX));
  });

  // KNOWN EXPLOIT (issue #162, engine left as is on purpose): priceBp floors at 0.5, so a very high price loses
  // at most half of the attractiveness while revenue per night keeps growing. The estimate mirrors the engine,
  // so it shows the same thing: at 400 EUR the profit is higher than at the real 75 EUR.
  it("shows the #162 exploit the same way the engine does (very high price is over-profitable)", () => {
    const real = realWith(75, 1000);
    const high = estimateWhatIf(real, MY_ROOMS, { price: 400, marketing: 1000 });
    const truth = realWith(400, 1000);
    if (!high.ok) throw new Error("expected an estimate");
    expect(truth.profit).toBeGreaterThan(real.profit);
    expect(high.finance.profit).toBeGreaterThan(real.profit);
  });

  it("is disabled with a reason when there are no market nights or no share", () => {
    const real = realWith(75, 1000);
    const none = estimateWhatIf({ ...real, nights: 0, marketSharePct: 0 }, MY_ROOMS, { price: 80, marketing: 0 });
    expect(none.ok).toBe(false);
    const noShare = estimateWhatIf({ ...real, marketSharePct: 0 }, MY_ROOMS, { price: 80, marketing: 0 });
    expect(noShare).toMatchObject({ ok: false });
    const noBreakdown = estimateWhatIf({ ...real, breakdown: undefined }, MY_ROOMS, { price: 80, marketing: 0 });
    expect(noBreakdown).toMatchObject({ ok: false });
  });
});

describe("buildMonthFlow", () => {
  const real = realWith(75, 1000);

  it("lists the twelve steps with the exact numbers from the finance row", () => {
    const flow = buildMonthFlow(real, MY_ROOMS, 4, 2)!;
    expect(flow.steps.map((s) => s.id)).toEqual([
      "start", "ugled", "plan", "ugovori", "privlacnost", "trziste", "nocenja", "prihod", "troskovi", "dobit", "financije", "novac",
    ]);
    const by = Object.fromEntries(flow.steps.map((s) => [s.id, s]));
    expect(by.dobit.big).toContain(String(Math.abs(real.profit)).slice(0, 1));
    expect(by.nocenja.big).toBe(`${real.occupancyPct} %`);
    expect(by.trziste.big).toBe(`${real.marketSharePct} %`);
    expect(by.prihod.calc).toContain(real.revenue.toLocaleString("hr-HR"));
    expect(by.novac.outputs[0].value).toContain(real.cashAfter.toLocaleString("hr-HR"));
    expect(refPrice(MY_ROOMS)).toBe(flow.base.ref);
  });

  it("returns null when the month has no breakdown", () => {
    expect(buildMonthFlow({ ...real, breakdown: undefined } as RoundFinance, MY_ROOMS, 4, 2)).toBeNull();
  });

  it("recomputes the chain for a scenario", () => {
    const flow = buildMonthFlow(real, MY_ROOMS, 4, 2, { price: 90, marketing: 1000 })!;
    const est = estimateWhatIf(real, MY_ROOMS, { price: 90, marketing: 1000 });
    if (!est.ok) throw new Error("expected an estimate");
    expect(flow.steps.find((s) => s.id === "novac")!.outputs[0].value).toContain(est.finance.cashAfter.toLocaleString("hr-HR"));
  });
});
