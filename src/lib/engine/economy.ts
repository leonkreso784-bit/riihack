import type { ContractTemplate, FinanceBreakdown, RoundFinance } from "@/lib/types";
import {
  FINANCE_EFFECT_CAP,
  FINANCE_EFFECT_DIVISOR,
  FIXED_COST_PER_ROOM,
  MARKETING_MAX,
  NIGHTS_PER_ROUND,
  PRICE_MIN,
  SEASON_DEMAND_BP,
} from "@/lib/rules";

export type MarketInput = {
  companyId: string;
  roomsCount: number;
  reviews: number;
  guests: number;
  price: number;
  refPrice: number;
  marketing: number;
  contractNights: number;
};

export type MarketResult = {
  companyId: string;
  nights: number;
  contractNights: number;
  capacityNights: number;
  occupancyPct: number;
  marketSharePct: number;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function capacityNights(roomsCount: number): number {
  return Math.max(0, roomsCount) * NIGHTS_PER_ROUND;
}

// Zaokružen prosjek osnovnih cijena soba; bez soba PRICE_MIN.
export function refPrice(rooms: { basePrice: number }[]): number {
  if (rooms.length === 0) return PRICE_MIN;
  return Math.round(rooms.reduce((s, r) => s + r.basePrice, 0) / rooms.length);
}

export function attractiveness(i: {
  reviews: number;
  guests: number;
  price: number;
  refPrice: number;
  marketing: number;
}): number {
  const price = i.price > 0 ? i.price : PRICE_MIN;
  const priceBp = clamp(Math.floor((10000 * i.refPrice) / price), 5000, 15000);
  const marketing = clamp(i.marketing, 0, MARKETING_MAX);
  const marketingBp = 10000 + Math.floor((marketing * 10000) / (2 * MARKETING_MAX));
  return Math.max(0, Math.floor(((i.reviews + i.guests) * priceBp * marketingBp) / 1e8));
}

// Zajedničko tržište: svi hoteli grada dijele istu potražnju.
export function settleMarket(round: number, hotels: MarketInput[]): MarketResult[] {
  if (hotels.length === 0) return [];
  const demandBp = SEASON_DEMAND_BP[clamp(round, 1, SEASON_DEMAND_BP.length) - 1];
  const caps = hotels.map((h) => capacityNights(h.roomsCount));
  const contracts = hotels.map((h, k) => clamp(Math.floor(h.contractNights), 0, caps[k]));
  const attrs = hotels.map((h) => attractiveness(h));
  const totalCap = caps.reduce((s, c) => s + c, 0);
  const totalContract = contracts.reduce((s, c) => s + c, 0);
  const totalAttr = attrs.reduce((s, a) => s + a, 0);
  const demand = Math.floor((totalCap * demandBp) / 10000);
  const free = Math.max(0, demand - totalContract);

  const nights = hotels.map((_, k) => {
    if (totalAttr === 0) return 0;
    return Math.max(0, Math.min(caps[k] - contracts[k], Math.floor((free * attrs[k]) / totalAttr)));
  });
  const totalNights = nights.reduce((s, n) => s + n, 0);

  return hotels.map((h, k) => ({
    companyId: h.companyId,
    nights: nights[k],
    contractNights: contracts[k],
    capacityNights: caps[k],
    occupancyPct: caps[k] > 0 ? Math.floor((100 * (nights[k] + contracts[k])) / caps[k]) : 0,
    marketSharePct: Math.floor((100 * nights[k]) / Math.max(1, totalNights)),
  }));
}

export function roundFinance(
  m: MarketResult,
  i: {
    round: number;
    price: number;
    marketing: number;
    staffCost: number;
    roomsCount: number;
    cashBefore: number;
    contracts: ContractTemplate[];
    investments?: number; // zbroj ulaganja u odjele
  },
): RoundFinance {
  const investments = i.investments ?? 0;
  const breakdown: FinanceBreakdown = {
    revenueOwn: m.nights * i.price,
    revenueContracts: i.contracts.reduce((s, c) => s + c.nights * c.pricePerNight, 0),
    costStaff: i.staffCost,
    costRooms: i.roomsCount * FIXED_COST_PER_ROOM,
    costMarketing: i.marketing,
    costContracts: i.contracts.reduce((s, c) => s + c.monthlyCost, 0),
    costInvestments: investments,
  };
  const revenue = breakdown.revenueOwn + breakdown.revenueContracts;
  const costs =
    breakdown.costStaff + breakdown.costRooms + breakdown.costMarketing + breakdown.costContracts + breakdown.costInvestments;
  const profit = revenue - costs;
  return {
    round: i.round,
    nights: m.nights,
    contractNights: m.contractNights,
    capacityNights: m.capacityNights,
    occupancyPct: m.occupancyPct,
    marketSharePct: m.marketSharePct,
    revenue,
    costs,
    profit,
    cashAfter: i.cashBefore + profit,
    investments,
    breakdown,
  };
}

export function financeEffect(profit: number): number {
  const e = clamp(Math.trunc(profit / FINANCE_EFFECT_DIVISOR), -FINANCE_EFFECT_CAP, FINANCE_EFFECT_CAP);
  return e + 0; // gasi -0
}
