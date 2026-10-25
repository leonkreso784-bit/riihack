import { describe, expect, it } from "vitest";
import type { FinanceRow, RoomRow } from "@/db/schema";
import { HOTELS } from "@/content";
import { HttpError } from "@/lib/http";
import {
  AI_PROPOSALS_PER_GAME,
  AI_PROPOSALS_PER_MINUTE,
  MAX_HINT,
  checkProposalLimit,
  ideaFromBank,
  ideaFromCompany,
  parseGenerateRequest,
} from "./idea";

const HOTEL = HOTELS[0];
const METRICS = { guests: 40, reviews: 60, staff: 50, operations: 55, finance: 30 };

const room = (number: string, status = "free"): RoomRow =>
  ({ id: `r-${number}`, companyId: "c1", number, floor: 1, type: "double", beds: 2, view: "more", basePrice: 80, status, note: null }) as RoomRow;

const finance = (round: number, profit: number): FinanceRow =>
  ({
    id: `f${round}`,
    companyId: "c1",
    round,
    nights: 100,
    contractNights: 10,
    capacityNights: 300,
    occupancyPct: 33,
    marketSharePct: 25,
    revenue: 8000,
    costs: 7000,
    profit,
    cashAfter: 21000,
  }) as FinanceRow;

describe("parseGenerateRequest", () => {
  it("prazno tijelo je grad bez natuknice", () => {
    expect(parseGenerateRequest({})).toEqual({});
    expect(parseGenerateRequest({ companyId: "", hint: "   " })).toEqual({});
  });

  it("skraćuje natuknicu i obrezuje razmake", () => {
    const req = parseGenerateRequest({ companyId: " abc ", hint: `  ${"x".repeat(MAX_HINT + 50)}  ` });
    expect(req.companyId).toBe("abc");
    expect(req.hint).toHaveLength(MAX_HINT);
  });

  it("tip koji nije tekst → 400", () => {
    expect(() => parseGenerateRequest({ companyId: 5 })).toThrow(HttpError);
    expect(() => parseGenerateRequest({ hint: ["a"] })).toThrow(HttpError);
  });
});

describe("ideaFromCompany", () => {
  it("uzima mjesto i zvjezdice predloška, sobe i zadnji obračun", () => {
    const input = ideaFromCompany(
      { name: "Hotel Ana", templateId: HOTEL.id, metrics: METRICS },
      [room("101"), room("102", "broken")],
      [finance(2, 500), finance(1, -200)],
      "gost se žali na buku",
    );
    expect(input).toMatchObject({ hotelName: "Hotel Ana", place: HOTEL.place, stars: HOTEL.stars, metrics: METRICS, hint: "gost se žali na buku" });
    expect(input.rooms.map((r) => r.status)).toEqual(["free", "broken"]);
    expect(input.finance?.round).toBe(2);
    expect(input.finance?.profit).toBe(500);
  });

  it("bez obračuna i natuknice nema tih polja", () => {
    const input = ideaFromCompany({ name: "H", templateId: HOTEL.id, metrics: METRICS }, [], []);
    expect(input).not.toHaveProperty("finance");
    expect(input).not.toHaveProperty("hint");
  });
});

describe("ideaFromBank", () => {
  it("prvi hotel banke s imenom igre", () => {
    const input = ideaFromBank("Moja igra");
    expect(input.hotelName).toBe("Moja igra");
    expect(input.metrics).toEqual(HOTEL.startMetrics);
    expect(input.rooms).toHaveLength(HOTEL.rooms.length);
    expect(input.rooms[0].id).toBe(HOTEL.rooms[0].number);
  });
});

describe("checkProposalLimit", () => {
  it("ispod obje granice → null", () => {
    expect(checkProposalLimit(0, 0)).toBeNull();
    expect(checkProposalLimit(AI_PROPOSALS_PER_GAME - 1, AI_PROPOSALS_PER_MINUTE - 1)).toBeNull();
  });

  it("dosegnut broj prijedloga za igru → poruka", () => {
    expect(checkProposalLimit(AI_PROPOSALS_PER_GAME, 0)).toBe("Dosegnut je broj AI prijedloga za ovu igru");
    expect(checkProposalLimit(AI_PROPOSALS_PER_GAME + 5, 0)).toBe("Dosegnut je broj AI prijedloga za ovu igru");
  });

  it("previše prijedloga u zadnjoj minuti → poruka o čekanju", () => {
    expect(checkProposalLimit(AI_PROPOSALS_PER_MINUTE, AI_PROPOSALS_PER_MINUTE)).toMatch(/minut/);
  });

  it("granica igre ima prednost pred minutnom", () => {
    expect(checkProposalLimit(AI_PROPOSALS_PER_GAME, AI_PROPOSALS_PER_MINUTE)).toBe(
      "Dosegnut je broj AI prijedloga za ovu igru",
    );
  });

  it("granice su razumne: minutna manja od ukupne", () => {
    expect(AI_PROPOSALS_PER_GAME).toBe(30);
    expect(AI_PROPOSALS_PER_MINUTE).toBeLessThan(AI_PROPOSALS_PER_GAME);
  });
});
