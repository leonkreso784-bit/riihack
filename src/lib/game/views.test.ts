import { describe, expect, it } from "vitest";
import type { CompanyRow, PlayerRow, RoomRow, WorldRow } from "@/db/schema";
import { HOTELS } from "@/content";
import { PRICE_MIN } from "@/lib/rules";
import type { Metrics } from "@/lib/types";
import { toLeaderboard, toMeResponse, toProfState, toRoom, type CompanyWithPlayer } from "./views";

const NOW = new Date("2026-10-24T14:30:00.000Z");
const hotel = HOTELS[0];
const metrics: Metrics = { guests: 50, reviews: 50, staff: 50, operations: 50, finance: 50 };

const world: WorldRow = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Test L4",
  maxPlayers: 3,
  joinCode: "KVRN26",
  profCodeHash: "x".repeat(64),
  round: 0,
  roundDeadline: null,
  status: "lobby",
  seed: 42,
  settledRound: 0,
  createdAt: NOW,
};

function bundle(id: string, joinIndex: number, cash: number, templateId = hotel.id): CompanyWithPlayer {
  const company: CompanyRow = {
    id,
    worldId: world.id,
    kind: "hotel",
    name: `Hotel ${id}`,
    templateId,
    startMetrics: metrics,
    metrics,
    closedRound: 0,
    cash,
    startCash: 20000,
    joinIndex,
    createdAt: NOW,
  };
  const player: PlayerRow = { id: `p-${id}`, companyId: id, displayName: `Igrač ${id}`, tokenHash: `h-${id}` };
  return { company, player };
}

function room(number: string, basePrice: number, note: string | null = null): RoomRow {
  return {
    id: `r-${number}`,
    companyId: "a",
    number,
    floor: Number(number[0]),
    type: "double",
    beds: 2,
    view: "more",
    basePrice,
    status: "free",
    note,
  };
}

describe("toRoom", () => {
  it("izostavi note kad je null", () => {
    const r = toRoom(room("101", 80));
    expect("note" in r).toBe(false);
    expect(r).toEqual({ id: "r-101", number: "101", floor: 1, type: "double", beds: 2, view: "more", basePrice: 80, status: "free" });
  });

  it("zadrži note kad postoji", () => {
    expect(toRoom(room("204", 180, "Klima ne radi")).note).toBe("Klima ne radi");
  });
});

describe("toLeaderboard", () => {
  it("sortira po napretku, pa novcu, pa redoslijedu ulaska", () => {
    const rows = toLeaderboard([bundle("c", 3, 20000), bundle("a", 1, 20000), bundle("b", 2, 25000)]);
    expect(rows.map((r) => r.companyId)).toEqual(["b", "a", "c"]);
    expect(rows[0]).toEqual({
      companyId: "b",
      hotelName: "Hotel b",
      playerName: "Igrač b",
      place: hotel.place,
      progress: 0,
      closedRound: 0,
      cash: 25000,
      roundGain: 0,
    });
  });
});

describe("toMeResponse", () => {
  const a = bundle("a", 1, 20000);
  const me = toMeResponse({ world, ...a, rooms: [room("101", 70), room("102", 90), room("103", 95)], all: [a, bundle("b", 2, 20000)] }, NOW);

  it("svijet sa serverNow i rokom", () => {
    expect(me.world).toEqual({
      id: world.id,
      name: "Test L4",
      round: 0,
      maxRounds: 4,
      status: "lobby",
      roundDeadline: null,
      serverNow: "2026-10-24T14:30:00.000Z",
    });
    const deadline = new Date("2026-10-24T14:40:00.000Z");
    const running = toMeResponse({ world: { ...world, roundDeadline: deadline }, ...a, rooms: [], all: [a] }, NOW);
    expect(running.world.roundDeadline).toBe("2026-10-24T14:40:00.000Z");
  });

  it("tvrtka iz predloška hotela, napredak 0", () => {
    expect(me.company).toEqual({
      id: "a",
      hotelName: "Hotel a",
      playerName: "Igrač a",
      templateId: hotel.id,
      place: hotel.place,
      stars: hotel.stars,
      roomsCount: 3,
      startMetrics: metrics,
      metrics,
      progress: 0,
      closedRound: 0,
      cash: 20000,
      startCash: 20000,
    });
  });

  it("plan s prosjekom cijene soba (zaokruženo), prazni dijelovi do L7/L11", () => {
    expect(me.plan).toEqual({ round: 0, price: 85, marketing: 0 });
    expect(me.situations).toEqual([]);
    expect(me.reports).toEqual([]);
    expect(me.contracts).toEqual([]);
    expect(me.finances).toEqual([]);
    expect(me.news).toEqual([]);
    expect(me.leaderboard).toHaveLength(2);
    expect(me.city).toEqual({ businesses: [], hotels: me.leaderboard, links: [] });
  });

  it("prosjek se zaokružuje, bez soba najniža cijena", () => {
    const odd = toMeResponse({ world, ...a, rooms: [room("101", 70), room("102", 71)], all: [a] }, NOW);
    expect(odd.plan.price).toBe(71);
    expect(toMeResponse({ world, ...a, rooms: [], all: [a] }, NOW).plan.price).toBe(PRICE_MIN);
  });
});

describe("toProfState", () => {
  it("kod igre i broj mjesta, igrači redom, bez profesorskog koda", () => {
    const s = toProfState({ world, all: [bundle("a", 1, 20000), bundle("b", 2, 20000)] }, NOW);
    expect(s.world).toMatchObject({ id: world.id, joinCode: "KVRN26", maxPlayers: 3, serverNow: NOW.toISOString() });
    expect(s.players.map((p) => p.companyId)).toEqual(["a", "b"]);
    expect(s.city.hotels).toEqual(s.players);
    expect(s.news).toEqual([]);
    expect(JSON.stringify(s)).not.toContain(world.profCodeHash);
  });
});
