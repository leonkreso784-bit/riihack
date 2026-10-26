// Simulacija cijele sezone bez baze (ADR-059, #198): hoteli igraju čiste funkcije motora istim redom kao zatvaranje
// mjeseca u igri (situacije -> applyRound -> settleMarket -> roundFinance -> pokazatelji). Određeno je sve (isto sjeme,
// bez slučajnosti), pa je ishod provjerljiv testom (season-sim.test.ts) i ispisuje se skriptom scripts/sim-sezona.ts (npx tsx scripts/sim-sezona.ts).
// Služi za kalibraciju ekonomije i za provjeru da nijedna jednostavna strategija ne pobjeđuje igru.
import { CONTRACTS, SITUATIONS } from "@/content";
import { botAcceptsContract, botOptionIndex, botPlan, type BotLevel } from "@/lib/game/bots";
import { contractEffects, contractNightsTotal, drawOffer } from "@/lib/engine/contracts";
import { investmentEffects, investmentTotal } from "@/lib/engine/departments";
import { drawSituations } from "@/lib/engine/draw";
import { financeEffect, refPrice, roundFinance, settleMarket } from "@/lib/engine/economy";
import { qualityFromClick } from "@/lib/engine/quality";
import { applyRound, progress } from "@/lib/engine/round";
import { isInsolvent, rankByProgress } from "@/lib/ranking";
import { MAX_ROUNDS, PRICE_MAX, PRICE_MIN, SITUATIONS_PER_ROUND } from "@/lib/rules";
import type { ContractTemplate, DepartmentInvestments, HotelTemplate, MetricKey, Metrics, PlanRequest, Quality, RoundFinance } from "@/lib/types";

const KEYS: MetricKey[] = ["guests", "reviews", "staff", "operations", "finance"];
export const SIM_SEED = 12345;

/** Odstupanje jednog hotela od bota: igrač s drugačijom strategijom (npr. ulaže u sve ili piše dobre odgovore). */
export type SimOverride = {
  /** Cijena kao množitelj referentne cijene hotela (zaokruženo, u rasponu PRICE_MIN..PRICE_MAX). Zadano: kao bot. */
  priceFactor?: number;
  marketing?: number;
  investments?: DepartmentInvestments;
  /** Vlastiti odgovori ove kvalitete umjesto klika (napisan tekst, kvaliteta 1 do 5). Zadano: klik kao bot. */
  writtenQuality?: Quality;
  /** Ne odgovara na situacije (propušteno, kvaliteta 1). */
  skipAnswers?: boolean;
};

export type SimHotel = { template: HotelTemplate; level: BotLevel; override?: SimOverride };

export type SimMonth = {
  round: number;
  occupancyPct: number;
  revenue: number;
  /** Prihod bez PDV-a (prihod − costVat). */
  netRevenue: number;
  costs: number;
  profit: number;
  /** Dobit kao postotak prihoda bez PDV-a: usporediv s GOP maržom stvarnih hotela. */
  marginPct: number;
  cashAfter: number;
};

export type SimHotelResult = {
  companyId: string;
  hotelName: string;
  stars: number;
  level: BotLevel;
  months: SimMonth[];
  metrics: Metrics;
  progress: number;
  cash: number;
  insolvent: boolean;
};

export type SimResult = {
  hotels: SimHotelResult[];
  /** Ljestvica po pravilu igre: solventni prije insolventnih, pa napredak (ADR-059). */
  ranking: SimHotelResult[];
  /** Ljestvica samo po napretku, kakva je bila prije ADR-059 (za usporedbu). */
  naiveRanking: SimHotelResult[];
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function add(metrics: Metrics, delta: Partial<Record<MetricKey, number>>): Metrics {
  const out = { ...metrics };
  for (const k of KEYS) out[k] = clamp(out[k] + (delta[k] ?? 0), 0, 100);
  return out;
}

function sumEffects(...parts: Partial<Record<MetricKey, number>>[]): Partial<Record<MetricKey, number>> {
  const out: Partial<Record<MetricKey, number>> = {};
  for (const part of parts) for (const k of KEYS) if (part[k]) out[k] = (out[k] ?? 0) + part[k]!;
  return out;
}

type State = {
  hotel: SimHotel;
  companyId: string;
  joinIndex: number;
  ref: number;
  metrics: Metrics;
  cash: number;
  accepted: { template: ContractTemplate; from: number; to: number }[];
  months: SimMonth[];
};

/** Odigra sezonu (po zadanom broju mjeseci) za zadane hotele, svi u istom gradu. */
export function simulateSeason(hotels: SimHotel[], opts: { seed?: number; rounds?: number } = {}): SimResult {
  const seed = opts.seed ?? SIM_SEED;
  const rounds = opts.rounds ?? MAX_ROUNDS;
  const states: State[] = hotels.map((hotel, i) => ({
    hotel,
    companyId: `h${i + 1}`,
    joinIndex: i + 1,
    ref: refPrice(hotel.template.rooms),
    metrics: { ...hotel.template.startMetrics },
    cash: hotel.template.startCash,
    accepted: [],
    months: [],
  }));
  const used = new Set<string>();

  for (let round = 1; round <= rounds; round++) {
    // Situacije kruga: iste za sve, ne ponavljaju se (round.ts openRound).
    const fresh = SITUATIONS.filter((t) => !used.has(t.id));
    const pool = fresh.length >= SITUATIONS_PER_ROUND ? fresh : SITUATIONS;
    const drawn = [...new Map(drawSituations(seed + round, 1, pool, SITUATIONS_PER_ROUND).map((t) => [t.id, t])).values()];
    drawn.forEach((t) => used.add(t.id));

    // Ponude ugovora: jedna po hotelu; bot prihvaća ako mu je isplativa.
    for (const s of states) {
      const offer = drawOffer(seed, round, s.joinIndex, CONTRACTS);
      if (botAcceptsContract({ pricePerNight: offer.pricePerNight, nights: offer.nights, monthlyCost: offer.monthlyCost })) {
        s.accepted.push({ template: offer, from: round, to: round + offer.durationRounds - 1 });
      }
    }

    // Plan i odgovori (prije zatvaranja mjeseca).
    const plans = states.map((s, k): PlanRequest => {
      const o = s.hotel.override;
      const last = s.months.at(-1);
      const bot = botPlan(k, s.ref, last?.occupancyPct, s.hotel.level);
      const price = o?.priceFactor !== undefined ? clamp(Math.round(s.ref * o.priceFactor), PRICE_MIN, PRICE_MAX) : bot.price;
      return { price, marketing: o?.marketing ?? bot.marketing, ...(o?.investments && { investments: o.investments }) };
    });
    states.forEach((s, k) => {
      const o = s.hotel.override;
      const results = drawn.map((t) => {
        if (o?.skipAnswers) return { quality: 1 as Quality, effects: t.effects, written: false };
        if (o?.writtenQuality) return { quality: o.writtenQuality, effects: t.effects, written: true };
        const idx = botOptionIndex(k, `${s.companyId}:${t.id}:${round}`, t.options.map((opt) => opt.criteria.length), s.hotel.level);
        return { quality: qualityFromClick(t.options[idx], t.rubric.length), effects: t.effects, written: false };
      });
      s.metrics = applyRound(s.metrics, results);
    });

    // Obračun grada (settleCityRound): tržište, novac, pokazatelji.
    const active = states.map((s) => s.accepted.filter((c) => round >= c.from && round <= c.to).map((c) => c.template));
    const market = settleMarket(
      round,
      states.map((s, k) => ({
        companyId: s.companyId,
        roomsCount: s.hotel.template.rooms.length,
        ...s.metrics,
        price: plans[k].price,
        refPrice: s.ref,
        marketing: plans[k].marketing,
        contractNights: contractNightsTotal(active[k]),
      })),
    );
    states.forEach((s, k) => {
      const inv = plans[k].investments ?? {};
      const f: RoundFinance = roundFinance(market[k], {
        round,
        price: plans[k].price,
        marketing: plans[k].marketing,
        staffCost: s.hotel.template.staffCost,
        roomsCount: s.hotel.template.rooms.length,
        cashBefore: s.cash,
        contracts: active[k],
        investments: investmentTotal(inv),
      });
      s.metrics = add(s.metrics, sumEffects(contractEffects(active[k]), { finance: financeEffect(f.profit) }, investmentEffects(inv)));
      s.cash = f.cashAfter;
      const netRevenue = f.revenue - (f.breakdown?.costVat ?? 0);
      s.months.push({
        round,
        occupancyPct: f.occupancyPct,
        revenue: f.revenue,
        netRevenue,
        costs: f.costs,
        profit: f.profit,
        marginPct: netRevenue > 0 ? Math.round((1000 * f.profit) / netRevenue) / 10 : 0,
        cashAfter: f.cashAfter,
      });
    });
  }

  const results = states.map<SimHotelResult>((s) => ({
    companyId: s.companyId,
    hotelName: s.hotel.template.place,
    stars: s.hotel.template.stars,
    level: s.hotel.level,
    months: s.months,
    metrics: s.metrics,
    progress: progress(s.hotel.template.startMetrics, s.metrics),
    cash: s.cash,
    insolvent: isInsolvent({ cash: s.cash }),
  }));
  return {
    hotels: results,
    ranking: rankByProgress(results),
    naiveRanking: [...results].sort((a, b) => b.progress - a.progress),
  };
}

/** Prosjek postotaka (jedna decimala). */
export const avg = (xs: number[]) => (xs.length ? Math.round((10 * xs.reduce((s, x) => s + x, 0)) / xs.length) / 10 : 0);

/** Marža cijele sezone jednog hotela ili skupa hotela: zbroj dobiti / zbroj prihoda bez PDV-a, u postocima. */
export function seasonMarginPct(hotels: SimHotelResult[]): number {
  const months = hotels.flatMap((h) => h.months);
  const net = months.reduce((s, m) => s + m.netRevenue, 0);
  return net > 0 ? Math.round((1000 * months.reduce((s, m) => s + m.profit, 0)) / net) / 10 : 0;
}
