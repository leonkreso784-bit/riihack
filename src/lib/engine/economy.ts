import type { ContractTemplate, FinanceBreakdown, Metrics, RoundFinance } from "@/lib/types";
import {
  DEMAND_ELASTICITY_PCT,
  FINANCE_EFFECT_CAP,
  FINANCE_EFFECT_DIVISOR,
  COMMISSION_PCT,
  FIXED_COST_PER_ROOM,
  MARKET_QUALITY_WEIGHTS,
  MARKETING_MAX,
  MATERIALS_PCT,
  NIGHTS_PER_ROUND,
  PRICE_MIN,
  SEASON_DEMAND_BP,
  VAT_PCT,
} from "@/lib/rules";

export type MarketInput = {
  companyId: string;
  roomsCount: number;
  reviews: number;
  guests: number;
  staff: number;
  operations: number;
  finance: number;
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

/**
 * Faktor cijene u baznim bodovima (#162). Ispod referentne cijene raste do ×1,5; iznad nje pada s kvadratom
 * (ref/cijena)², pa se previsoka cijena ne isplati; iznad 2,5× ref nitko ne dolazi (0).
 */
export function priceBp(price: number, refPrice: number): number {
  const p = price > 0 ? price : PRICE_MIN;
  if (p <= refPrice) return clamp(Math.floor((10000 * refPrice) / p), 10000, 15000);
  if (2 * p > 5 * refPrice) return 0;
  return Math.floor((10000 * refPrice * refPrice) / (p * p));
}

/**
 * Kvaliteta hotela u baznim bodovima (BUG-024, ADR-045): ponderirani prosjek svih pet pokazatelja (q, 0–100).
 * Od 50 naviše raste linearno (50 → ×1,0, 70 → ×1,4, 100 → ×2,0); ispod 50 pada s kvadratom (q / 50)²,
 * pa hotel koji ne rješava situacije brzo gubi goste (36 → ×0,52, 25 → ×0,25).
 */
export function qualityBp(m: Metrics): number {
  const keys = Object.keys(MARKET_QUALITY_WEIGHTS) as (keyof Metrics)[];
  const q = keys.reduce((s, k) => s + MARKET_QUALITY_WEIGHTS[k] * clamp(m[k], 0, 100), 0); // q × 100, 0–10000
  if (q >= 5000) return 10000 + (q - 5000) * 2;
  return Math.floor((q * q) / 2500);
}

export function attractiveness(i: Metrics & { price: number; refPrice: number; marketing: number }): number {
  const marketing = clamp(i.marketing, 0, MARKETING_MAX);
  const marketingBp = 10000 + Math.floor((marketing * 10000) / (2 * MARKETING_MAX));
  return Math.max(0, Math.floor((qualityBp(i) * priceBp(i.price, i.refPrice) * marketingBp) / 1e10));
}

/**
 * Elastičnost ukupne potražnje (ADR-059), u baznim bodovima: cijena na ili ispod referentne daje 10000 (×1,00),
 * a svakih 100 % iznad nje oduzima DEMAND_ELASTICITY_PCT % (na 2× ref ×0,80, na 2,5× ref ×0,70). Nikad iznad ×1,00:
 * jeftiniji hotel ne dovodi nove turiste, samo otima udio drugima. Ako svi hoteli dignu cijenu, grad ima manje turista.
 * Poznata praznina (ADR-059, Otvoreno): iznad 2,5× ref hotel ne prodaje ništa (priceBp je 0), ali u gradsku potražnju
 * i dalje ulazi sa ×0,70 svojeg kapaciteta, pa tu potražnju dijele ostali hoteli.
 */
export function demandPriceBp(price: number, refPrice: number): number {
  const ref = Math.max(1, refPrice);
  const over = clamp(Math.floor((10000 * Math.max(price, PRICE_MIN)) / ref) - 10000, 0, 15000); // iznad 2,5× ref pad se ne produbljuje
  return 10000 - Math.floor((over * DEMAND_ELASTICITY_PCT) / 100);
}

// Turisti dolaze u grad koliko ga vrijede njegovi hoteli: hotel slabiji od 50 dovodi manje turista (najviše ×1,0),
// a skup hotel (cijena iznad referentne) isto tako manje (demandPriceBp).
export function demandNights(round: number, roomsCount: number, m: Metrics, price: number, refPrice: number): number {
  const demandBp = SEASON_DEMAND_BP[clamp(round, 1, SEASON_DEMAND_BP.length) - 1];
  const base = Math.floor((capacityNights(roomsCount) * Math.min(10000, qualityBp(m))) / 10000);
  return Math.floor((Math.floor((base * demandPriceBp(price, refPrice)) / 10000) * demandBp) / 10000);
}

// Zajedničko tržište: svi hoteli grada dijele istu potražnju.
export function settleMarket(round: number, hotels: MarketInput[]): MarketResult[] {
  if (hotels.length === 0) return [];
  const caps = hotels.map((h) => capacityNights(h.roomsCount));
  const contracts = hotels.map((h, k) => clamp(Math.floor(h.contractNights), 0, caps[k]));
  const attrs = hotels.map((h) => attractiveness(h));
  const totalContract = contracts.reduce((s, c) => s + c, 0);
  const totalAttr = attrs.reduce((s, a) => s + a, 0);
  const demand = hotels.reduce((s, h) => s + demandNights(round, h.roomsCount, h, h.price, h.refPrice), 0);
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

// PDV sadržan u iznosu koji gost plati (cijena uključuje PDV): iznos × 13 / 113.
export const vatIn = (gross: number) => Math.round((gross * VAT_PCT) / (100 + VAT_PCT));

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
  const revenueOwn = m.nights * i.price;
  const revenueContracts = i.contracts.reduce((s, c) => s + c.nights * c.pricePerNight, 0);
  // Prihod ostaje ono što gost plati; PDV se vidi kao trošak (hotel zadržava bruto / 1,13). Provizija portala samo na
  // slobodno tržište (agencijski ugovori idu bez portala), materijal na sav neto prihod.
  const vatOwn = vatIn(revenueOwn);
  const costVat = vatOwn + vatIn(revenueContracts);
  const costCommission = Math.round(((revenueOwn - vatOwn) * COMMISSION_PCT) / 100);
  const costMaterials = Math.round(((revenueOwn + revenueContracts - costVat) * MATERIALS_PCT) / 100);
  const breakdown: FinanceBreakdown = {
    revenueOwn,
    revenueContracts,
    costStaff: i.staffCost,
    costRooms: i.roomsCount * FIXED_COST_PER_ROOM,
    costMarketing: i.marketing,
    costContracts: i.contracts.reduce((s, c) => s + c.monthlyCost, 0),
    costInvestments: investments,
    costVat,
    costCommission,
    costMaterials,
  };
  const revenue = breakdown.revenueOwn + breakdown.revenueContracts;
  const costs =
    breakdown.costStaff +
    breakdown.costRooms +
    breakdown.costMarketing +
    breakdown.costContracts +
    breakdown.costInvestments +
    costVat +
    costCommission +
    costMaterials;
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
