// Čiste funkcije: retci iz baze → oblici odgovora iz src/lib/types.ts. Bez baze, da se mogu testirati.
import type {
  AnswerRow,
  CompanyRow,
  ContractRow,
  FinanceRow,
  PlanRow,
  PlayerRow,
  RoomRow,
  RoundReportRow,
  SituationRow,
  WorldRow,
} from "@/db/schema";
import { SITUATIONS, getHotel } from "@/content";
import { sourceOfTemplateId } from "@/lib/engine/draft";
import { progress } from "@/lib/engine/round";
import { renderSituationText } from "@/lib/engine/text";
import { MAX_ROUNDS } from "@/lib/rules";
import { buildNews, toCityLinks, toCityView, toContractView, toFinance, toPlan, type NewsEvent } from "./city";
import type {
  AnswerMode,
  AnswerView,
  CompanyDetailResponse,
  CompanyView,
  DispatchView,
  LeaderboardRow,
  MeResponse,
  Metrics,
  ProfStateResponse,
  Quality,
  Room,
  RoomStatus,
  RoomType,
  RoomView,
  RoundReportView,
  SituationState,
  SituationSummary,
  SituationTemplate,
  SituationView,
  WorldStatus,
  WorldView,
} from "@/lib/types";

export type CompanyWithPlayer = { company: CompanyRow; player: PlayerRow };
export type SituationWithAnswer = { situation: SituationRow; answer: AnswerRow | null };

const round1 = (n: number) => Math.round(n * 10) / 10 + 0; // + 0: bez −0

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
    progress: progress(company.startMetrics, company.metrics),
    closedRound: company.closedRound,
    cash: company.cash,
    startCash: company.startCash,
  };
}

/** Skok u zadnjem zatvorenom krugu: napredak nakon kruga minus napredak prije njega; bez zatvorenog kruga 0. */
export function roundGain(start: Metrics, last?: Pick<RoundReportRow, "metricsBefore" | "metricsAfter">): number {
  if (!last) return 0;
  return round1(progress(start, last.metricsAfter) - progress(start, last.metricsBefore));
}

/** Zadnji (najveći krug) izvještaj po tvrtki. */
function lastReports(reports: RoundReportRow[]): Map<string, RoundReportRow> {
  const last = new Map<string, RoundReportRow>();
  for (const r of reports) {
    const prev = last.get(r.companyId);
    if (!prev || r.round > prev.round) last.set(r.companyId, r);
  }
  return last;
}

/** Ljestvica: napredak, pa novac (oboje silazno), pa redoslijed ulaska. `reports` = izvještaji svih tvrtki igre. */
export function toLeaderboard(all: CompanyWithPlayer[], reports: RoundReportRow[] = []): LeaderboardRow[] {
  const last = lastReports(reports);
  return all
    .map(({ company, player }) => ({
      joinIndex: company.joinIndex,
      row: {
        companyId: company.id,
        hotelName: company.name,
        playerName: player.displayName,
        place: getHotel(company.templateId).place,
        progress: progress(company.startMetrics, company.metrics),
        closedRound: company.closedRound,
        cash: company.cash,
        roundGain: roundGain(company.startMetrics, last.get(company.id)),
      } satisfies LeaderboardRow,
    }))
    .sort((a, b) => b.row.progress - a.row.progress || b.row.cash - a.row.cash || a.joinIndex - b.joinIndex)
    .map((x) => x.row);
}

/** Predložak s upisanim {soba} i {hotel} u naslovu, tekstu i opcijama (kriteriji ostaju; samo za poslužitelj). */
export function renderTemplate(template: SituationTemplate, vars: { soba?: string; hotel: string }): SituationTemplate {
  const render = (text: string) => renderSituationText(text, vars);
  return {
    ...template,
    title: render(template.title),
    text: render(template.text),
    options: template.options.map((o) => ({ ...o, text: render(o.text) })),
  };
}

export function toAnswerView(a: AnswerRow): AnswerView {
  return {
    mode: a.mode as AnswerMode,
    ...(a.optionId !== null && { optionId: a.optionId }),
    ...(a.text !== null && { text: a.text }),
    quality: a.quality as Quality,
    copied: a.copied,
    ...(a.verdict !== null && { verdict: a.verdict }),
  };
}

/**
 * Situacija za studenta i profesora: tekst s upisanom sobom i hotelom, opcije samo `id` i `text`, lik samo ime i
 * uloga. Kriteriji opcija, rubrika, osobnost i cilj lika ne izlaze s poslužitelja. Nepoznat predložak → null.
 */
export function toSituationView(
  { situation, answer }: SituationWithAnswer,
  hotelName: string,
  pool: SituationTemplate[] = SITUATIONS,
): SituationView | null {
  const found = pool.find((t) => t.id === situation.templateId);
  if (!found) return null;
  const t = renderTemplate(found, { soba: situation.roomNumber ?? undefined, hotel: hotelName });
  return {
    id: situation.id,
    templateId: situation.templateId,
    round: situation.round,
    title: t.title,
    text: t.text,
    area: t.area,
    difficulty: t.difficulty,
    ...(situation.roomNumber !== null && { roomNumber: situation.roomNumber }),
    character: { name: t.character.name, role: t.character.role },
    options: t.options.map((o) => ({ id: o.id, text: o.text })),
    state: situation.state as SituationState,
    transcript: situation.transcript,
    ...(answer && { answer: toAnswerView(answer) }),
    source: sourceOfTemplateId(found.id), // L12: banka, profesor ili AI prijedlog koji je profesor spremio
  };
}

function toSituationViews(rows: SituationWithAnswer[], hotelName: string, pool?: SituationTemplate[]): SituationView[] {
  return rows.map((r) => toSituationView(r, hotelName, pool)).filter((s): s is SituationView => s !== null);
}

export function toReportView(r: RoundReportRow): RoundReportView {
  return {
    round: r.round,
    metricsBefore: r.metricsBefore,
    metricsAfter: r.metricsAfter,
    ...(r.mentorQuestion !== null && { mentorQuestion: r.mentorQuestion }),
    ...(r.reflection !== null && { reflection: r.reflection }),
    ...(r.mentorText !== null && { mentorText: r.mentorText }),
  };
}

const companyReports = (reports: RoundReportRow[], companyId: string) =>
  reports
    .filter((r) => r.companyId === companyId)
    .sort((a, b) => a.round - b.round)
    .map(toReportView);

/** Grad iz redaka: `contracts` = svi ugovori igre (linije karte), `events` = događaji za vijesti (listNewsEvents). */
type CityInput = { contracts?: ContractRow[]; events?: NewsEvent[] };

const hotelNames = (all: CompanyWithPlayer[]) =>
  Object.fromEntries(all.map(({ company }) => [company.id, company.name]));

/**
 * `situations` = situacije tvrtke (u odgovor idu samo one tekućeg kruga); `reports` = izvještaji svih tvrtki igre
 * (tvrtka dobije svoje, ljestvica skok kruga); `plan` = spremljeni plan tekućeg kruga (bez njega zadani);
 * `finances` = obračuni tvrtke.
 */
export function toMeResponse(
  input: {
    world: WorldRow;
    company: CompanyRow;
    player: PlayerRow;
    rooms: RoomRow[];
    all: CompanyWithPlayer[];
    situations?: SituationWithAnswer[];
    reports?: RoundReportRow[];
    plan?: PlanRow | null;
    finances?: FinanceRow[];
  } & CityInput,
  now: Date = new Date(),
  pool?: SituationTemplate[],
): MeResponse {
  const { world, company, player, rooms, all, situations = [], reports = [] } = input;
  const { plan = null, finances = [], contracts = [], events = [] } = input;
  const leaderboard = toLeaderboard(all, reports);
  const current = situations.filter((s) => s.situation.round === world.round);
  return {
    world: toWorldView(world, now),
    company: toCompanyView(company, player, rooms.length),
    situations: toSituationViews(current, company.name, pool),
    leaderboard,
    reports: companyReports(reports, company.id),
    plan: toPlan(world.round, plan, rooms),
    contracts: contracts
      .filter((c) => c.companyId === company.id)
      .sort((a, b) => b.roundOffered - a.roundOffered)
      .map(toContractView),
    finances: [...finances].sort((a, b) => a.round - b.round).map(toFinance),
    city: toCityView(leaderboard, toCityLinks(contracts, world.round)),
    news: buildNews(events, hotelNames(all)),
  };
}

/** `bank` = banka + profesorove situacije (listBank), `dispatches` = profesorova slanja (listDispatches), L12. */
export function toProfState(
  input: {
    world: WorldRow;
    all: CompanyWithPlayer[];
    reports?: RoundReportRow[];
    bank?: SituationSummary[];
    dispatches?: DispatchView[];
  } & CityInput,
  now: Date = new Date(),
): ProfStateResponse {
  const { world, all, reports = [], contracts = [], events = [], bank = [], dispatches = [] } = input;
  const players = toLeaderboard(all, reports);
  return {
    world: { ...toWorldView(world, now), joinCode: world.joinCode, maxPlayers: world.maxPlayers },
    players,
    city: toCityView(players, toCityLinks(contracts, world.round)),
    news: buildNews(events, hotelNames(all)),
    bank,
    dispatches,
    autoDraw: world.autoDraw,
  };
}

/** Uvid profesora u jednu tvrtku: sve situacije (svi krugovi) s odgovorima i presudama, i izvještaji krugova. */
export function toCompanyDetail(
  input: {
    company: CompanyRow;
    player: PlayerRow;
    roomsCount: number;
    situations: SituationWithAnswer[];
    reports: RoundReportRow[];
  },
  pool?: SituationTemplate[],
): CompanyDetailResponse {
  const { company, player, roomsCount, situations, reports } = input;
  const ordered = [...situations].sort((a, b) => a.situation.round - b.situation.round);
  return {
    company: toCompanyView(company, player, roomsCount),
    situations: toSituationViews(ordered, company.name, pool),
    reports: companyReports(reports, company.id),
  };
}
