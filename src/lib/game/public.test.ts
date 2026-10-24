import { describe, expect, it } from "vitest";
import type { CompanyRow, ContractRow, FinanceRow, PlanRow } from "@/db/schema";
import { CONTRACTS, getBusiness, getHotel } from "@/content";
import { toPublicView, toPublicViews } from "./public";

const template = getHotel("rijeka-centar");
const agency = CONTRACTS.find((c) => c.nights > 0)!;
const metrics = { guests: 61, reviews: 72, staff: 50, operations: 50, finance: 40 };

const company: CompanyRow = {
  id: "ana",
  worldId: "w",
  kind: "hotel",
  name: "Hotel Ana",
  templateId: template.id,
  startMetrics: metrics,
  metrics,
  closedRound: 1,
  cash: 38800,
  startCash: 40000,
  joinIndex: 0,
  createdAt: new Date(),
};
const plan = { id: "p", companyId: "ana", round: 2, price: 94, marketing: 500, investments: {} } as PlanRow;
const finance = (round: number, occupancyPct: number) =>
  ({
    id: `f${round}`,
    companyId: "ana",
    round,
    nights: 300,
    contractNights: 0,
    capacityNights: 600,
    occupancyPct,
    marketSharePct: 50,
    revenue: 28000,
    costs: 20000,
    profit: 8000,
    cashAfter: 48000,
    investments: 0,
  }) as FinanceRow;
const contract = {
  id: "k",
  worldId: "w",
  companyId: "ana",
  templateId: agency.id,
  roundOffered: 1,
  status: "accepted",
  activeFrom: 1,
  activeTo: 1 + agency.durationRounds - 1,
} as ContractRow;
const rooms = template.rooms.map((r) => ({ basePrice: r.basePrice }));
const base = { company, playerName: "Ana", template, round: 2, settledRound: 1, plan, rooms, finances: [], contracts: [] };

describe("toPublicView", () => {
  it("cijena iz plana tekućeg kruga, popunjenost iz zadnjeg obračunatog mjeseca", () => {
    const v = toPublicView({ ...base, finances: [finance(1, 50)] });
    expect(v.price).toBe(94);
    expect(v.occupancyPct).toBe(50);
    expect(v.reviews).toBe(72);
    expect(v.guests).toBe(61);
    expect(v.roomsCount).toBe(template.rooms.length);
    expect(v.place).toBe(template.place);
  });

  it("uzima najviši obračunati krug, bez obzira na redoslijed", () => {
    expect(toPublicView({ ...base, round: 3, settledRound: 2, finances: [finance(2, 70), finance(1, 50)] }).occupancyPct).toBe(70);
  });

  it("bez obračuna nema ključa occupancyPct; bez plana cijena je referentna", () => {
    const v = toPublicView({ ...base, plan: null });
    expect("occupancyPct" in v).toBe(false);
    expect(v.price).toBeGreaterThan(0);
  });

  it("bez novca, pokazatelja i napretka", () => {
    const v = toPublicView({ ...base, finances: [finance(1, 50)] }) as Record<string, unknown>;
    for (const k of ["cash", "startCash", "metrics", "startMetrics", "progress", "revenue", "profit", "situations"]) {
      expect(k in v).toBe(false);
    }
    expect(JSON.stringify(v)).not.toContain("38800");
  });

  it("prihod i dobit zatvorenih mjeseci, najstariji prvi; tekući neobračunati mjesec nije javan", () => {
    const f2 = { ...finance(2, 70), revenue: 31000, profit: 9500 } as FinanceRow;
    const f3 = { ...finance(3, 80), revenue: 99999, profit: 77777 } as FinanceRow;
    const v = toPublicView({ ...base, round: 3, settledRound: 2, finances: [f3, f2, finance(1, 50)] });
    expect(v.finances).toEqual([
      { round: 1, revenue: 28000, profit: 8000 },
      { round: 2, revenue: 31000, profit: 9500 },
    ]);
    expect(v.occupancyPct).toBe(70);
    expect(JSON.stringify(v)).not.toContain("99999");
  });

  it("bez zatvorenog mjeseca financije su prazne", () => {
    expect(toPublicView({ ...base, settledRound: 0, finances: [finance(1, 50)] }).finances).toEqual([]);
  });

  it("financije bez stanja novca, troškova, raspodjele i ulaganja", () => {
    const withBreakdown = { ...finance(1, 50), costs: 20001, cashAfter: 48123, investments: 1234, breakdown: { revenueOwn: 28000, revenueContracts: 0, costStaff: 14321, costRooms: 2000, costMarketing: 500, costContracts: 0, costInvestments: 1234 } } as FinanceRow;
    const v = toPublicView({ ...base, finances: [withBreakdown] });
    for (const row of v.finances ?? []) expect(Object.keys(row).sort()).toEqual(["profit", "revenue", "round"]);
    const json = JSON.stringify(v);
    for (const k of ["cash", "cashAfter", "costs", "breakdown", "investments", "startCash"]) expect(json).not.toContain(`"${k}"`);
    for (const n of ["20001", "48123", "1234", "14321", "38800"]) expect(json).not.toContain(n);
  });

  it("zaposleni po svim odjelima i aktivni ugovori s imenom tvrtke", () => {
    const v = toPublicView({ ...base, contracts: [contract, { ...contract, id: "x", status: "rejected" }] });
    const total = Object.values(v.staffByDepartment).reduce((a, b) => a + b, 0);
    expect(total).toBe(template.staff.length);
    expect(Object.keys(v.staffByDepartment).sort()).toEqual(["housekeeping", "kitchen", "maintenance", "management", "reception"]);
    expect(v.contracts).toEqual([{ businessId: agency.businessId, businessName: getBusiness(agency.businessId).name, title: agency.title }]);
  });
});

describe("toPublicViews", () => {
  it("svakoj tvrtki samo njezini retci", () => {
    const other = { ...company, id: "ivo", name: "Hotel Ivo" };
    const views = toPublicViews({
      round: 2,
      settledRound: 1,
      companies: [{ company, playerName: "Ana" }, { company: other, playerName: "Ivo" }],
      plans: [plan],
      rooms: [{ companyId: "ana", basePrice: 80 }, { companyId: "ivo", basePrice: 60 }, { companyId: "ivo", basePrice: 60 }],
      finances: [finance(1, 50)],
      contracts: [contract],
    });
    expect(views.map((v) => [v.companyId, v.price, v.roomsCount, v.occupancyPct, v.contracts.length])).toEqual([
      ["ana", 94, 1, 50, 1],
      ["ivo", 60, 2, undefined, 0],
    ]);
  });
});
