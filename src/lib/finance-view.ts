// Cost and revenue breakdown of a month, rebuilt in the browser from what the API already sends. Same items as the
// engine (economy.ts roundFinance): staff + fixed per room + marketing + contracts + department investments.
// ponytail: marketing is the remainder (costs minus the rest), because past months' plans are not in MeResponse.
// If the engine adds a cost item, it shows up here as marketing; then ask Leon for the breakdown in RoundFinance.
import { HOTELS } from "@/content";
import { FIXED_COST_PER_ROOM } from "./rules";
import type { CompanyView, ContractView, RoundFinance } from "./types";

export type Breakdown = {
  revenue: { rooms: number; contracts: number };
  costs: { staff: number; rooms: number; marketing: number; contracts: number; investments: number };
};

/** Contracts that count in `round`: accepted, from the round they were offered until activeUntilRound. */
export const activeIn = (contracts: ContractView[], round: number) =>
  contracts.filter((c) => c.status === "accepted" && c.roundOffered <= round && round <= (c.activeUntilRound ?? c.roundOffered + c.durationRounds - 1));

export const staffCostOf = (company: Pick<CompanyView, "templateId">) => HOTELS.find((h) => h.id === company.templateId)?.staffCost ?? 0;

export function breakdown(f: RoundFinance, company: Pick<CompanyView, "templateId" | "roomsCount">, contracts: ContractView[]): Breakdown {
  const active = activeIn(contracts, f.round);
  const contractRevenue = Math.min(f.revenue, active.reduce((s, c) => s + c.nights * c.pricePerNight, 0));
  const staff = staffCostOf(company);
  const rooms = company.roomsCount * FIXED_COST_PER_ROOM;
  const contractCosts = active.reduce((s, c) => s + c.monthlyCost, 0);
  const investments = f.investments ?? 0;
  return {
    revenue: { rooms: f.revenue - contractRevenue, contracts: contractRevenue },
    costs: { staff, rooms, contracts: contractCosts, investments, marketing: Math.max(0, f.costs - staff - rooms - contractCosts - investments) },
  };
}

/** Percent change from a to b, rounded; null when there is nothing to compare with. */
export const growthPct = (a: number | undefined, b: number) => (a ? Math.round(((b - a) / Math.abs(a)) * 100) : null);
