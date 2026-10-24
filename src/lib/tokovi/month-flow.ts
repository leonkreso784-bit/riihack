// Tokovi: how a month was settled, as a chain of steps built ONLY from numbers the client already has
// (RoundFinance + breakdown, room prices, hotel count, the season table). Nothing is invented: other hotels'
// reviews and guests are not known here, so the market step shows only the player's own result.
import { financeEffect, priceBp, refPrice, roundFinance, type MarketResult } from "@/lib/engine/economy";
import { eur as eurRaw, num } from "@/lib/format";
import {
  FINANCE_EFFECT_CAP,
  FINANCE_EFFECT_DIVISOR,
  FIXED_COST_PER_ROOM,
  MARKETING_MAX,
  NIGHTS_PER_ROUND,
  ROUND_LABELS,
  SEASON_DEMAND_BP,
} from "@/lib/rules";
import type { ContractTemplate, RoundFinance } from "@/lib/types";

export type StepId = "start" | "ugled" | "plan" | "ugovori" | "privlacnost" | "trziste" | "nocenja" | "prihod" | "troskovi" | "dobit" | "financije" | "novac";
export type FlowRow = { label: string; value: string; strong?: boolean };
export type FlowStep = {
  id: StepId;
  title: string;
  /** Big number on the card; steps without a number have none. */
  big?: string;
  small: string;
  tone?: "dark" | "money" | "up" | "down";
  inputs: FlowRow[];
  rule: string[];
  /** The rule with the real numbers put in. */
  calc?: string;
  note?: string;
  outputs: FlowRow[];
};

export type Scenario = { price: number; marketing: number };
export type MonthBase = { price: number; marketing: number; ref: number; roomsCount: number; cashBefore: number };

export type Estimate =
  | { ok: true; changed: boolean; finance: RoundFinance }
  | { ok: false; reason: string };

export const ESTIMATE_LABEL = "Procjena: ostali hoteli igraju isto kao ovaj mjesec.";

/** Money never breaks across lines: non-breaking space before the euro sign. */
export const eur = (n: number) => eurRaw(n).replace(/\s€$/, "\u00a0€");
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const signed = (n: number) => `${n < 0 ? "−" : n > 0 ? "+" : ""}${eur(Math.abs(n))}`;
const factor = (bp: number) => (bp / 10000).toFixed(2).replace(".", ",");

// The engine's own price factor (#162); reviews and guests are left out because they cancel in a ratio.
export function priceBpOf(price: number, ref: number) {
  return priceBp(price, ref);
}
export function marketingBpOf(marketing: number) {
  return 10000 + Math.floor((clamp(marketing, 0, MARKETING_MAX) * 10000) / (2 * MARKETING_MAX));
}

/** Price and marketing the month was really played with. Null when the month has no breakdown (settled by an old build). */
export function monthBase(finance: RoundFinance, rooms: { basePrice: number }[]): MonthBase | null {
  const b = finance.breakdown;
  if (!b) return null;
  const price = finance.nights > 0 ? Math.round(b.revenueOwn / finance.nights) : 0;
  return {
    price,
    marketing: b.costMarketing,
    ref: refPrice(rooms),
    roomsCount: Math.round(b.costRooms / FIXED_COST_PER_ROOM),
    cashBefore: finance.cashAfter - finance.profit,
  };
}

/** "Što ako?": new month if only price and marketing differ. Others play as they did. */
export function estimateWhatIf(finance: RoundFinance, rooms: { basePrice: number }[], scenario: Scenario): Estimate {
  const base = monthBase(finance, rooms);
  const b = finance.breakdown;
  if (!base || !b) return { ok: false, reason: "Ovaj je mjesec obračunat bez detaljne raspodjele, pa ga ne možemo ponovno izračunati." };
  if (finance.nights === 0) return { ok: false, reason: "Ovaj mjesec nisi imao gostiju preko tržišta, pa nema od čega procijeniti kako bi izgledao s drugom cijenom." };
  if (finance.marketSharePct === 0) return { ok: false, reason: "Tvoj udio turista grada bio je manji od 1 %, a iz tako malog broja ne možemo pošteno procijeniti." };

  const changed = scenario.price !== base.price || scenario.marketing !== base.marketing;
  if (!changed) return { ok: true, changed, finance };

  // Share is stored rounded down to a whole percent, so take the middle of that percent.
  const s = Math.min(0.995, (finance.marketSharePct + 0.5) / 100);
  const r = (priceBpOf(scenario.price, base.ref) * marketingBpOf(scenario.marketing)) / (priceBpOf(base.price, base.ref) * marketingBpOf(base.marketing));
  const freeTourists = finance.nights / s; // all free tourists in the city, from our own share
  const others = (1 - s) / s; // other hotels' weight, in units of our old weight
  const room = Math.max(0, finance.capacityNights - finance.contractNights);
  const nights = Math.min(room, Math.floor((freeTourists * r) / (r + others)));

  const market: MarketResult = {
    companyId: "me",
    nights,
    contractNights: finance.contractNights,
    capacityNights: finance.capacityNights,
    occupancyPct: finance.capacityNights > 0 ? Math.floor((100 * (nights + finance.contractNights)) / finance.capacityNights) : 0,
    marketSharePct: Math.floor((100 * nights) / Math.max(1, Math.floor(freeTourists))),
  };
  // Contracts are fixed for the month, so they enter as one lump with the same revenue and cost.
  const lump = { nights: 1, pricePerNight: b.revenueContracts, monthlyCost: b.costContracts } as ContractTemplate;
  const next = roundFinance(market, {
    round: finance.round,
    price: scenario.price,
    marketing: scenario.marketing,
    staffCost: b.costStaff,
    roomsCount: base.roomsCount,
    cashBefore: base.cashBefore,
    contracts: [lump],
    investments: b.costInvestments,
  });
  return { ok: true, changed, finance: next };
}

/** Steps of the flow for one (real or estimated) month. */
export function buildMonthFlow(
  finance: RoundFinance,
  rooms: { basePrice: number }[],
  hotelsInCity: number,
  round: number,
  scenario?: Scenario,
): { steps: FlowStep[]; base: MonthBase } | null {
  const base = monthBase(finance, rooms);
  if (!base) return null;
  const est = scenario ? estimateWhatIf(finance, rooms, scenario) : undefined;
  const f = est && est.ok ? est.finance : finance;
  const b = f.breakdown!;
  const price = scenario && est?.ok ? scenario.price : base.price;
  const marketing = b.costMarketing;
  const month = ROUND_LABELS[round - 1] ?? `Krug ${round}`;
  const demandBp = SEASON_DEMAND_BP[clamp(round, 1, SEASON_DEMAND_BP.length) - 1];
  const pBp = priceBpOf(price, base.ref);
  const mBp = marketingBpOf(marketing);
  const effectRaw = f.profit / FINANCE_EFFECT_DIVISOR;
  const effect = financeEffect(f.profit);
  const effectText = effect > 0 ? `+${effect}` : effect < 0 ? `−${-effect}` : "0";
  const occupied = f.nights + f.contractNights;
  const costsSum = [b.costStaff, b.costRooms, b.costMarketing, b.costContracts, b.costInvestments];

  const steps: FlowStep[] = [
    {
      id: "start",
      title: `Početak: ${month}`,
      big: month,
      small: "Mjesec se zatvara",
      tone: "dark",
      inputs: [
        { label: "Mjesec", value: `${month} (${round}. krug)` },
        { label: "Hotela u gradu", value: num(hotelsInCity) },
        { label: "Soba u tvom hotelu", value: num(base.roomsCount) },
        { label: "Novac prije mjeseca", value: eur(base.cashBefore) },
      ],
      rule: ["Ovaj korak ništa ne računa. Kad profesor zatvori mjesec, pravila igre računaju sve redom, uvijek istim redoslijedom."],
      note: "Isti plan i isto stanje uvijek daju iste brojke. Nema slučajnosti.",
      outputs: [{ label: "Kapacitet hotela", value: `${num(f.capacityNights)} noćenja`, strong: true }],
    },
    {
      id: "ugled",
      title: "Ugled",
      small: "Nije spremljeno uz obračun",
      inputs: [{ label: "Recenzije i zadovoljstvo gostiju", value: "nije spremljeno uz obračun" }],
      rule: ["Ugled = pokazatelj Recenzije + pokazatelj Zadovoljstvo gostiju (u trenutku zatvaranja mjeseca)."],
      note: "Točan zbroj nije spremljen uz obračun, pa ga ovdje ne izmišljamo. Što je veći, to si zanimljiviji turistima, a gradi se kroz mjesece.",
      outputs: [{ label: "Ugled", value: "ulazi u sljedeći korak" }],
    },
    {
      id: "plan",
      title: "Tvoj plan",
      big: price > 0 ? eur(price) : "bez gostiju",
      small: `cijena po noći · marketing ${eur(marketing)}`,
      inputs: [
        { label: "Cijena po noći", value: price > 0 ? eur(price) : "nije poznata (mjesec bez gostiju s tržišta)" },
        { label: "Prosječna cijena tvojih soba", value: eur(base.ref) },
        { label: "Marketing", value: eur(marketing) },
        { label: "Ulaganja u odjele", value: eur(b.costInvestments) },
      ],
      rule: [
        "Faktor cijene: do prosječne cijene soba = prosječna ÷ tvoja (najviše 1,50); iznad nje (prosječna ÷ tvoja)², a iznad 2,5× prosječne nitko ne dolazi.",
        `Faktor marketinga = 1 + marketing ÷ ${num(2 * MARKETING_MAX)} (najviše 1,50).`,
      ],
      calc: price > 0 ? `${num(base.ref)} ÷ ${num(price)} → ${factor(pBp)} · 1 + ${num(marketing)} ÷ ${num(2 * MARKETING_MAX)} → ${factor(mBp)}` : undefined,
      note: "Ovo su tvoje odluke. Sve ostalo slijedi iz pravila. Cijena po noći je izračunata iz prihoda i noćenja tog mjeseca.",
      outputs: [
        { label: "Faktor cijene", value: `× ${factor(pBp)}` },
        { label: "Faktor marketinga", value: `× ${factor(mBp)}`, strong: true },
      ],
    },
    {
      id: "ugovori",
      title: "Ugovori",
      big: `${num(f.contractNights)} noći`,
      small: `prihod ${eur(b.revenueContracts)} · trošak ${eur(b.costContracts)}`,
      inputs: [
        { label: "Ugovorena noćenja", value: num(f.contractNights) },
        { label: "Prihod ugovora", value: eur(b.revenueContracts) },
        { label: "Mjesečni trošak ugovora", value: eur(b.costContracts) },
      ],
      rule: ["Ugovorena noćenja popune se prva, prije ostalih turista.", "Prihod ugovora = noćenja × cijena ugovora. Trošak ugovora plaća se svaki mjesec."],
      outputs: [
        { label: "Prihod ugovora", value: eur(b.revenueContracts) },
        { label: "Trošak ugovora", value: eur(b.costContracts) },
      ],
    },
    {
      id: "privlacnost",
      title: "Koliko si zanimljiv turistima",
      big: `× ${factor(Math.floor((pBp * mBp) / 10000))}`,
      small: "cijena i marketing zajedno",
      inputs: [
        { label: "Ugled", value: "iz koraka Ugled" },
        { label: "Faktor cijene", value: `× ${factor(pBp)}` },
        { label: "Faktor marketinga", value: `× ${factor(mBp)}` },
      ],
      rule: ["Zanimljivost turistima = ugled × faktor cijene × faktor marketinga."],
      calc: `ugled × ${factor(pBp)} × ${factor(mBp)}`,
      note: "Igra to zove privlačnost. Bodovi sami ništa ne znače, važno je koliko ih imaš u odnosu na druge hotele. Bodove ostalih hotela ovdje ne znamo.",
      outputs: [{ label: "Tvoj faktor (bez ugleda)", value: `× ${factor(Math.floor((pBp * mBp) / 10000))}`, strong: true }],
    },
    {
      id: "trziste",
      title: "Tržište grada",
      big: `${f.marketSharePct} %`,
      small: "tvoj dio slobodnih turista",
      inputs: [
        { label: "Hotela u gradu", value: num(hotelsInCity) },
        { label: `Turisti u mjesecu: ${month.toLowerCase()}`, value: `${SEASON_DEMAND_BP[clamp(round, 1, SEASON_DEMAND_BP.length) - 1] / 100} % kapaciteta grada` },
        { label: "Tvoja ugovorena noćenja", value: num(f.contractNights) },
      ],
      rule: [
        `Turisti u gradu = ${demandBp / 100} % svih noćenja u gradu u ovom mjesecu.`,
        "Slobodni turisti = turisti − ugovorena noćenja svih hotela.",
        "Tvoj dio = slobodni turisti × tvoji bodovi ÷ zbroj bodova svih hotela.",
      ],
      note: "Turisti se ne množe kad spustiš cijenu. Samo otimaš dio iste torte od drugih hotela. Brojke ostalih hotela ovdje ne prikazujemo.",
      outputs: [
        { label: "Tvoja slobodna noćenja", value: num(f.nights) },
        { label: "Udio turista grada", value: `${f.marketSharePct} %`, strong: true },
      ],
    },
    {
      id: "nocenja",
      title: "Noćenja i popunjenost",
      big: `${f.occupancyPct} %`,
      small: `${num(f.nights)} + ${num(f.contractNights)} od ${num(f.capacityNights)}`,
      inputs: [
        { label: "Slobodna noćenja", value: num(f.nights) },
        { label: "Ugovorena noćenja", value: num(f.contractNights) },
        { label: `Kapacitet (${num(base.roomsCount)} soba × ${NIGHTS_PER_ROUND})`, value: num(f.capacityNights) },
      ],
      rule: ["Popunjenost = (slobodna + ugovorena noćenja) ÷ kapacitet.", "Nikad više od kapaciteta soba."],
      calc: `(${num(f.nights)} + ${num(f.contractNights)}) ÷ ${num(f.capacityNights)} = ${f.occupancyPct} %`,
      outputs: [
        { label: "Popunjenost", value: `${f.occupancyPct} %`, strong: true },
        { label: "Zauzeta noćenja", value: num(occupied) },
      ],
    },
    {
      id: "prihod",
      title: "Prihod",
      big: eur(f.revenue),
      small: `gosti ${eur(b.revenueOwn)} + ugovori ${eur(b.revenueContracts)}`,
      inputs: [
        { label: "Slobodna noćenja × cijena", value: price > 0 ? `${num(f.nights)} × ${eur(price)} = ${eur(b.revenueOwn)}` : `0 noćenja = ${eur(0)}` },
        { label: "Ugovori", value: eur(b.revenueContracts) },
      ],
      rule: ["Prihod = slobodna noćenja × tvoja cijena + prihod ugovora."],
      calc: `${num(b.revenueOwn)} + ${num(b.revenueContracts)} = ${num(f.revenue)}`,
      note: "Veća cijena po noći često vrijedi više od dodatnih gostiju. Pomakni klizač cijene i provjeri.",
      outputs: [{ label: "Prihod", value: eur(f.revenue), strong: true }],
    },
    {
      id: "troskovi",
      title: "Troškovi",
      big: eur(f.costs),
      small: "osoblje, sobe, marketing, ugovori, ulaganja",
      inputs: [
        { label: "Plaće osoblja", value: eur(b.costStaff) },
        { label: `Sobe: ${num(base.roomsCount)} × ${eur(FIXED_COST_PER_ROOM)}`, value: eur(b.costRooms) },
        { label: "Marketing", value: eur(b.costMarketing) },
        { label: "Trošak ugovora", value: eur(b.costContracts) },
        { label: "Ulaganja u odjele", value: eur(b.costInvestments) },
      ],
      rule: [`Troškovi = osoblje + sobe × ${num(FIXED_COST_PER_ROOM)} € + marketing + trošak ugovora + ulaganja.`],
      calc: `${costsSum.map(num).join(" + ")} = ${num(f.costs)}`,
      note: "Osoblje i sobe plaćaš uvijek, pune ili prazne. Marketing i ulaganja su troškovi koje biraš.",
      outputs: [{ label: "Troškovi", value: eur(f.costs), strong: true }],
    },
    {
      id: "dobit",
      title: "Dobit",
      big: signed(f.profit),
      small: `${eur(f.revenue)} − ${eur(f.costs)}`,
      tone: f.profit < 0 ? "down" : "up",
      inputs: [
        { label: "Prihod", value: eur(f.revenue) },
        { label: "Troškovi", value: eur(f.costs) },
      ],
      rule: ["Dobit = prihod − troškovi."],
      calc: `${num(f.revenue)} − ${num(f.costs)} = ${num(f.profit)}`,
      outputs: [{ label: `Dobit za ${month.toLowerCase()}`, value: signed(f.profit), strong: true }],
    },
    {
      id: "financije",
      title: "Pokazatelj Financije",
      big: effectText,
      small: `bodovi = dobit ÷ ${num(FINANCE_EFFECT_DIVISOR)}, najviše ±${FINANCE_EFFECT_CAP}`,
      inputs: [
        { label: "Dobit", value: signed(f.profit) },
        { label: "Dijelimo s", value: eur(FINANCE_EFFECT_DIVISOR) },
      ],
      rule: [`Pokazatelj Financije = dobit ÷ ${num(FINANCE_EFFECT_DIVISOR)}, samo cijeli dio, najviše +${FINANCE_EFFECT_CAP} i najmanje −${FINANCE_EFFECT_CAP}.`],
      calc: `${num(f.profit)} ÷ ${num(FINANCE_EFFECT_DIVISOR)} = ${effectRaw.toFixed(1).replace(".", ",")} → ${effectText}`,
      note: "Pokazatelj nije novac. To su bodovi koji ulaze u tvoj ukupni uspjeh. Novac je zaseban račun, vidi sljedeći korak.",
      outputs: [{ label: "Bodovi Financije", value: effectText, strong: true }],
    },
    {
      id: "novac",
      title: "Novac na računu",
      big: eur(f.cashAfter),
      small: `${eur(base.cashBefore)} ${f.profit < 0 ? "−" : "+"} ${eur(Math.abs(f.profit))}`,
      tone: "money",
      inputs: [
        { label: "Novac prije mjeseca", value: eur(base.cashBefore) },
        { label: "Dobit mjeseca", value: signed(f.profit) },
      ],
      rule: ["Novac poslije = novac prije + dobit."],
      calc: `${num(base.cashBefore)} ${f.profit < 0 ? "−" : "+"} ${num(Math.abs(f.profit))} = ${num(f.cashAfter)}`,
      note: "Ovaj iznos postaje početno stanje sljedećeg mjeseca.",
      outputs: [{ label: "Novac na računu", value: eur(f.cashAfter), strong: true }],
    },
  ];
  return { steps, base };
}
