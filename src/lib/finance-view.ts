// Čiste pomoćne funkcije za prikaz financija (stranice Financije i Plan). Bez ovisnosti o Reactu.
// Formula troškova je ista kao u roundFinance (lib/engine/economy.ts); test to provjerava.
import { HOTELS } from "@/content";
import { FIXED_COST_PER_ROOM, STAFF_COST_PER_ROOM } from "@/lib/rules";
import type { ContractView, DepartmentInvestments, DepartmentView, RoundFinance } from "@/lib/types";

export const inBlockade = (cash: number) => cash < 0;

// Rast prihoda zadnjeg mjeseca prema prošlom, u %; null kad nema dva zatvorena mjeseca.
export function growthPct(prev: number | undefined, cur: number): number | null {
  if (prev === undefined || prev <= 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

export type Bonitet = { grade: string; text: string; tone: "up" | "warn" | "down" | "neutral" };
export function bonitet(cash: number, startCash: number, lastProfit: number | null): Bonitet {
  if (inBlockade(cash)) return { grade: "D", text: "U blokadi: novac na računu ispod nule", tone: "down" };
  if (lastProfit === null) return { grade: "–", text: "Još nema zatvorenog mjeseca", tone: "neutral" };
  if (cash >= startCash * 1.2 && lastProfit > 0) return { grade: "A+", text: "Izvrsno: stabilan rast i rezerve", tone: "up" };
  if (cash >= startCash && lastProfit > 0) return { grade: "A", text: "Dobro: posluje s dobiti", tone: "up" };
  if (lastProfit > 0) return { grade: "B", text: "Srednje: dobit, ali niže rezerve", tone: "warn" };
  return { grade: "C", text: "Niže: posluje s gubitkom", tone: "down" };
}

// Ugovor je aktivan u krugu `round` kad je prihvaćen i krug upada u njegovo trajanje.
export function activeContracts(contracts: ContractView[], round: number): ContractView[] {
  return contracts.filter((c) => {
    if (c.status !== "accepted") return false;
    const until = c.activeUntilRound ?? c.roundOffered + c.durationRounds - 1;
    return round >= until - c.durationRounds + 1 && round <= until;
  });
}

export const sumInvestments = (inv: DepartmentInvestments | number | undefined): number =>
  typeof inv === "number" ? inv : Object.values(inv ?? {}).reduce<number>((s, v) => s + (v ?? 0), 0);

// Ulaganja za prikaz: plan ako ga ima, inače zbroj iz stanja odjela.
export function planInvestments(plan: { investments?: DepartmentInvestments }, departments?: DepartmentView[]): number {
  if (plan.investments) return sumInvestments(plan.investments);
  return (departments ?? []).reduce((s, d) => s + d.investment, 0);
}

export type CostInput = {
  staffCost: number;
  roomsCount: number;
  marketing: number;
  contractsCost: number; // zbroj monthlyCost aktivnih ugovora
  investments: number;
};
export type CostBreakdown = { staff: number; fixed: number; marketing: number; contracts: number; investments: number; total: number };

export function monthlyCosts(i: CostInput): CostBreakdown {
  const staff = i.staffCost;
  const fixed = i.roomsCount * FIXED_COST_PER_ROOM;
  const total = staff + fixed + i.marketing + i.contractsCost + i.investments;
  return { staff, fixed, marketing: i.marketing, contracts: i.contractsCost, investments: i.investments, total };
}

export const COST_LABELS: Record<keyof Omit<CostBreakdown, "total">, string> = {
  staff: "Plaće osoblja",
  fixed: "Fiksni trošak soba",
  marketing: "Marketing",
  contracts: "Ugovori",
  investments: "Ulaganja u odjele",
};

export type Part = { key: string; label: string; amount: number };

// Troškovi završenog mjeseca iz poznatih stavki; marketing je ostatak (ne ide ispod nule).
export function estimateCostParts(f: RoundFinance, o: { staffCost: number; roomsCount: number; contractsCost: number }): Part[] {
  const investments = f.investments ?? 0;
  const known = o.staffCost + o.roomsCount * FIXED_COST_PER_ROOM + o.contractsCost + investments;
  const marketing = Math.max(0, f.costs - known);
  const b = monthlyCosts({ staffCost: o.staffCost, roomsCount: o.roomsCount, marketing, contractsCost: o.contractsCost, investments });
  return (Object.keys(COST_LABELS) as (keyof typeof COST_LABELS)[]).map((k) => ({ key: k, label: COST_LABELS[k], amount: b[k] }));
}

// Prihod završenog mjeseca: ugovori (noćenja po cijeni iz ugovora) i vlastita prodaja (ostatak).
export function estimateRevenueParts(f: RoundFinance, contractRevenue: number): Part[] {
  const contracts = Math.min(f.revenue, Math.max(0, contractRevenue));
  return [
    { key: "own", label: "Vlastita prodaja noćenja", amount: f.revenue - contracts },
    { key: "contracts", label: "Ugovorena noćenja", amount: contracts },
  ];
}

export const contractRevenue = (cs: ContractView[]): number => cs.reduce((s, c) => s + c.nights * c.pricePerNight, 0);

// Opcionalna raspodjela koju motor može dodati u RoundFinance (issue #141): objekt ili lista.
export type FinanceExt = RoundFinance & {
  costBreakdown?: Record<string, number> | { label?: string; key?: string; amount?: number; value?: number }[];
  revenueBreakdown?: Record<string, number> | { label?: string; key?: string; amount?: number; value?: number }[];
};
export function readParts(raw: FinanceExt["costBreakdown"]): Part[] | null {
  if (!raw) return null;
  const parts: Part[] = Array.isArray(raw)
    ? raw.map((p, i) => ({ key: p.key ?? String(i), label: p.label ?? p.key ?? `Stavka ${i + 1}`, amount: p.amount ?? p.value ?? 0 }))
    : Object.entries(raw).map(([k, v]) => ({ key: k, label: COST_LABELS[k as keyof typeof COST_LABELS] ?? k, amount: Number(v) || 0 }));
  const clean = parts.filter((p) => p.amount > 0);
  return clean.length ? clean : null;
}

// Razlika dvije vrijednosti za prikaz ▲/▼.
export function delta(cur: number, prev: number | undefined): { diff: number; arrow: "▲" | "▼" | "" } | null {
  if (prev === undefined) return null;
  const diff = cur - prev;
  return { diff, arrow: diff > 0 ? "▲" : diff < 0 ? "▼" : "" };
}

// Plaće iz predloška hotela; ako predložak ne postoji (npr. mock), rooms * STAFF_COST_PER_ROOM kao u sadržaju.
export const staffCostFor = (templateId: string, roomsCount: number): number =>
  HOTELS.find((h) => h.id === templateId)?.staffCost ?? roomsCount * STAFF_COST_PER_ROOM;
