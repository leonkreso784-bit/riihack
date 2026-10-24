// Čiste funkcije: retci iz baze → oblici odgovora iz src/lib/types.ts. Bez baze, da se mogu testirati.
import type { CompanyRow, PlayerRow, RoomRow, WorldRow } from "@/db/schema";
import { getHotel } from "@/content";
import { refPrice } from "@/lib/engine/economy";
import { MAX_ROUNDS } from "@/lib/rules";
import type {
  CityView,
  CompanyView,
  LeaderboardRow,
  MeResponse,
  ProfStateResponse,
  Room,
  RoomStatus,
  RoomType,
  RoomView,
  WorldStatus,
  WorldView,
} from "@/lib/types";

export type CompanyWithPlayer = { company: CompanyRow; player: PlayerRow };

export function toWorldView(world: WorldRow, now: Date = new Date()): WorldView {
  return {
    id: world.id,
    name: world.name,
    round: world.round,
    maxRounds: MAX_ROUNDS,
    status: world.status as WorldStatus,
    roundDeadline: world.roundDeadline ? world.roundDeadline.toISOString() : null,
    serverNow: now.toISOString(),
  };
}

export function toRoom(row: RoomRow): Room {
  return {
    id: row.id,
    number: row.number,
    floor: row.floor,
    type: row.type as RoomType,
    beds: row.beds,
    view: row.view as RoomView,
    basePrice: row.basePrice,
    status: row.status as RoomStatus,
    ...(row.note !== null && { note: row.note }),
  };
}

export function toCompanyView(company: CompanyRow, player: PlayerRow, roomsCount: number): CompanyView {
  const hotel = getHotel(company.templateId);
  return {
    id: company.id,
    hotelName: company.name,
    playerName: player.displayName,
    templateId: company.templateId,
    place: hotel.place,
    stars: hotel.stars,
    roomsCount,
    startMetrics: company.startMetrics,
    metrics: company.metrics,
    progress: 0, // L5/L7: progress(startMetrics, metrics) iz motora
    closedRound: company.closedRound,
    cash: company.cash,
    startCash: company.startCash,
  };
}

/** Ljestvica: napredak, pa novac (oboje silazno), pa redoslijed ulaska. */
export function toLeaderboard(all: CompanyWithPlayer[]): LeaderboardRow[] {
  return all
    .map(({ company, player }) => ({
      joinIndex: company.joinIndex,
      row: {
        companyId: company.id,
        hotelName: company.name,
        playerName: player.displayName,
        place: getHotel(company.templateId).place,
        progress: 0, // L5/L7: progress(startMetrics, metrics)
        closedRound: company.closedRound,
        cash: company.cash,
        roundGain: 0, // L7: napredak u zadnjem zatvorenom krugu (iz roundReports)
      } satisfies LeaderboardRow,
    }))
    .sort((a, b) => b.row.progress - a.row.progress || b.row.cash - a.row.cash || a.joinIndex - b.joinIndex)
    .map((x) => x.row);
}

// L11: gradske tvrtke i aktivni ugovori.
const toCityView = (leaderboard: LeaderboardRow[]): CityView => ({ businesses: [], hotels: leaderboard, links: [] });

export function toMeResponse(
  input: { world: WorldRow; company: CompanyRow; player: PlayerRow; rooms: RoomRow[]; all: CompanyWithPlayer[] },
  now: Date = new Date(),
): MeResponse {
  const { world, company, player, rooms, all } = input;
  const leaderboard = toLeaderboard(all);
  return {
    world: toWorldView(world, now),
    company: toCompanyView(company, player, rooms.length),
    situations: [], // L7
    leaderboard,
    reports: [], // L7
    plan: { round: world.round, price: refPrice(rooms), marketing: 0 }, // L11: spremljeni plan (getPlan)
    contracts: [], // L11
    finances: [], // L11
    city: toCityView(leaderboard),
    news: [], // L11
  };
}

export function toProfState(
  input: { world: WorldRow; all: CompanyWithPlayer[] },
  now: Date = new Date(),
): ProfStateResponse {
  const { world, all } = input;
  const players = toLeaderboard(all);
  return {
    world: { ...toWorldView(world, now), joinCode: world.joinCode, maxPlayers: world.maxPlayers },
    players,
    city: toCityView(players),
    news: [], // L11
  };
}
