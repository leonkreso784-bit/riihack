// Javni profil hotela (L14): ono što drugi igrači i profesor vide na karti. Bez novca, odgovora i ocjena.
import type { CompanyRow, ContractRow, FinanceRow, PlanRow, WorldRow } from "@/db/schema";
import { listCompanies, listPlans, listRoomPrices, listWorldContracts, listWorldFinances } from "@/db/queries";
import { getBusiness, getHotel } from "@/content";
import { STAFF_DEPARTMENT_LABELS } from "@/lib/rules";
import type { CompanyPublicView, HotelTemplate, StaffDepartment } from "@/lib/types";
import { activeTemplates, toPlan } from "./city";

/** Broj zaposlenih po odjelu iz predloška hotela (svaki odjel, i s nulom). */
export function staffByDepartment(template: HotelTemplate): Record<StaffDepartment, number> {
  const out = Object.fromEntries(Object.keys(STAFF_DEPARTMENT_LABELS).map((d) => [d, 0])) as Record<StaffDepartment, number>;
  for (const s of template.staff) out[s.department] += 1;
  return out;
}

/**
 * Javni pogled na hotel. Cijena iz plana tekućeg kruga (bez plana referentna cijena soba), popunjenost samo iz
 * zadnjeg obračunatog mjeseca, ugovori koji vrijede u tom krugu.
 */
export function toPublicView(p: {
  company: CompanyRow;
  playerName: string;
  template: HotelTemplate;
  round: number;
  plan: PlanRow | null;
  rooms: { basePrice: number }[];
  finances: FinanceRow[];
  contracts: ContractRow[];
}): CompanyPublicView {
  const last = p.finances.reduce<FinanceRow | undefined>((best, f) => (!best || f.round > best.round ? f : best), undefined);
  return {
    companyId: p.company.id,
    hotelName: p.company.name,
    playerName: p.playerName,
    place: p.template.place,
    stars: p.template.stars,
    roomsCount: p.rooms.length,
    price: toPlan(p.round, p.plan, p.rooms).price,
    reviews: p.company.metrics.reviews,
    guests: p.company.metrics.guests,
    ...(last && { occupancyPct: last.occupancyPct }),
    staffByDepartment: staffByDepartment(p.template),
    contracts: activeTemplates(p.contracts, p.round).map((t) => ({
      businessId: t.businessId,
      businessName: getBusiness(t.businessId).name,
      title: t.title,
    })),
  };
}

/** Javni pogledi za sve tvrtke igre iz skupnih upita (retci cijele igre, filtrirani po tvrtki). */
export function toPublicViews(d: {
  round: number;
  companies: { company: CompanyRow; playerName: string }[];
  plans: PlanRow[];
  rooms: { companyId: string; basePrice: number }[];
  finances: FinanceRow[];
  contracts: ContractRow[];
}): CompanyPublicView[] {
  return d.companies.map(({ company, playerName }) =>
    toPublicView({
      company,
      playerName,
      template: getHotel(company.templateId),
      round: d.round,
      plan: d.plans.find((x) => x.companyId === company.id) ?? null,
      rooms: d.rooms.filter((r) => r.companyId === company.id),
      finances: d.finances.filter((f) => f.companyId === company.id),
      contracts: d.contracts.filter((c) => c.companyId === company.id),
    }),
  );
}

/** Javni profili svih hotela igre: pet skupnih upita za cijelu igru, ne po tvrtki. */
export async function loadPublicViews(world: WorldRow): Promise<CompanyPublicView[]> {
  const [all, plans, rooms, finances, contracts] = await Promise.all([
    listCompanies(world.id),
    listPlans(world.id, world.round),
    listRoomPrices(world.id),
    listWorldFinances(world.id),
    listWorldContracts(world.id),
  ]);
  return toPublicViews({
    round: world.round,
    companies: all.map(({ company, player }) => ({ company, playerName: player.displayName })),
    plans,
    rooms,
    finances,
    contracts,
  });
}
