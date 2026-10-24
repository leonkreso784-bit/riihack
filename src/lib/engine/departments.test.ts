import { describe, expect, it } from "vitest";
import type { Metrics, StaffMember } from "@/lib/types";
import { departmentViews, investmentEffects, investmentTotal, parseInvestments } from "./departments";

describe("departments", () => {
  it("parseInvestments: ispravna ulaganja, bez nula", () => {
    expect(parseInvestments({ reception: 1500, kitchen: 0, maintenance: 3000 })).toEqual({
      reception: 1500,
      maintenance: 3000,
    });
    expect(parseInvestments({})).toEqual({});
  });

  it("parseInvestments: neispravno → null", () => {
    expect(parseInvestments({ kitchen: 5000 })).toBeNull();
    expect(parseInvestments({ management: 9000 })).toBeNull();
    expect(parseInvestments({ kitchen: -1 })).toBeNull();
    expect(parseInvestments({ kitchen: 10.5 })).toBeNull();
    expect(parseInvestments({ kitchen: "100" })).toBeNull();
    expect(parseInvestments({ spa: 100 })).toBeNull();
    expect(parseInvestments(null)).toBeNull();
    expect(parseInvestments([1, 2])).toBeNull();
    expect(parseInvestments(100)).toBeNull();
  });

  it("investmentTotal", () => {
    expect(investmentTotal({ reception: 1500, kitchen: 3000, maintenance: 999 })).toBe(5499);
    expect(investmentTotal({})).toBe(0);
  });

  it("investmentEffects", () => {
    expect(investmentEffects({ reception: 1500, kitchen: 3000, maintenance: 999 })).toEqual({ guests: 4 });
    expect(investmentEffects({ housekeeping: 3000, management: 2500 })).toEqual({ reviews: 3, staff: 2 });
    expect(investmentEffects({ management: 9000 })).toEqual({ staff: 3 }); // strop po odjelu
    expect(investmentEffects({})).toEqual({});
  });

  it("departmentViews", () => {
    const metrics: Metrics = { guests: 55, reviews: 35, staff: 60, operations: 70, finance: 50 };
    const staff: StaffMember[] = [
      { name: "Ana", department: "reception", role: "Recepcionarka", shift: "morning" },
      { name: "Ivo", department: "reception", role: "Recepcioner", shift: "night", note: "traži slobodan vikend" },
      { name: "Maja", department: "housekeeping", role: "Sobarica", shift: "morning" },
      { name: "Petar", department: "maintenance", role: "Domar", shift: "morning" },
    ];
    const rooms = [
      { number: "101", status: "cleaning" as const },
      { number: "102", status: "cleaning" as const },
      { number: "103", status: "broken" as const },
      { number: "104", status: "free" as const },
    ];
    const views = departmentViews({ metrics, staff, rooms, investments: { reception: 1000, maintenance: 2000 } });
    expect(views.map((v) => v.department)).toEqual(["reception", "housekeeping", "kitchen", "maintenance", "management"]);
    expect(views[0]).toEqual({
      department: "reception",
      label: "Recepcija",
      metric: "guests",
      metricValue: 55,
      staffCount: 2,
      alerts: ["Ivo: traži slobodan vikend"],
      investment: 1000,
    });
    expect(views[1].alerts).toEqual(["2 soba čeka čišćenje", "Pokazatelj je nizak (35/100)"]);
    expect(views[1].metric).toBe("reviews");
    expect(views[2]).toMatchObject({ label: "Kuhinja i restoran", staffCount: 0, alerts: [], investment: 0 });
    expect(views[3]).toMatchObject({ metric: "operations", metricValue: 70, alerts: ["1 soba u kvaru"], investment: 2000 });
    expect(views[4]).toMatchObject({ metric: "staff", staffCount: 0, alerts: [] });
  });
});
