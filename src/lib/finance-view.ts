// Cost and revenue breakdown of a month. The server sends it (RoundFinance.breakdown, #144); months settled before that
// have only totals, so for them it is rebuilt from the same items as the engine (economy.ts roundFinance), with
// marketing as the remainder because past months' plans are not in MeResponse.
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
  const b = f.breakdown;
  if (b)
    return {
      revenue: { rooms: b.revenueOwn, contracts: b.revenueContracts },
      costs: { staff: b.costStaff, rooms: b.costRooms, marketing: b.costMarketing, contracts: b.costContracts, investments: b.costInvestments },
    };
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
