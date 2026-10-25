// Review 25.10. (IGRA-B-08/LIB-INFRA-02/GAP1-05/GAP4-06, LIB-INFRA-03/GAP1-01, LIB-INFRA-09/GAP4-09): the city card must agree with the leaderboard.
import { describe, expect, it } from "vitest";
import type { MeResponse } from "@/lib/types";
import { bonitet, profilesFromMe, publicBonitet } from "./karta";

const row = (companyId: string, hotelName: string, progress: number) => ({ companyId, hotelName, playerName: `Igrač ${companyId}`, place: "Rijeka", progress, closedRound: 0, roundGain: 0 });
const me = (over: Partial<MeResponse> = {}) =>
  ({
    world: { round: 2 },
    company: { id: "z", hotelName: "Zora", playerName: "Ja", place: "Rijeka", stars: 4, roomsCount: 12, startCash: 20000, cash: 20000, metrics: { guests: 50, reviews: 50, staff: 50, operations: 50, finance: 50 }, templateId: "nepoznat" },
    plan: { round: 2, price: 99, marketing: 0 },
    finances: [],
    contracts: [],
    leaderboard: [],
    // Server order (views.ts toLeaderboard): progress, then cash, then join order. Zora joined first.
    city: { businesses: [{ id: "b-adria", name: "Agencija Adria", kind: "agency", description: "" }], links: [], hotels: [row("z", "Zora", 0), row("a", "Adria", 0)] },
    ...over,
  }) as unknown as MeResponse;

describe("rank on the company card", () => {
  it("equal progress keeps the leaderboard order instead of the hotel name", () => {
    const ps = profilesFromMe(me());
    expect(ps.z.rank).toBe(1); // first on the leaderboard and on Financije
    expect(ps.a.rank).toBe(2);
  });
});

describe("partners on the own card", () => {
  it("an ended contract is not shown as a partner (the map link is already gone)", () => {
    const ended = { id: "k1", templateId: "adria-sezonski-paket", businessName: "Agencija Adria", businessKind: "agency", title: "t", text: "t", monthlyCost: 0, nights: 60, pricePerNight: 70, durationRounds: 1, roundOffered: 1, status: "accepted", activeUntilRound: 1 };
    const ps = profilesFromMe(me({ contracts: [ended] } as unknown as Partial<MeResponse>));
    expect(ps.z.partners).toEqual([]);
  });
});

describe("bonitet texts", () => {
  it("profit 0 is not a loss", () => {
    expect(bonitet(30000, 20000, 0).text).not.toMatch(/gubitkom/);
    expect(publicBonitet([{ round: 1, revenue: 9, profit: 0 }]).text).not.toMatch(/gubitkom/);
  });
  it("one closed month is not called growth", () => {
    expect(publicBonitet([{ round: 1, revenue: 9, profit: 5 }]).text).not.toMatch(/raste/);
  });
});
