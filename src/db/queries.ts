// Zajednički upiti. Atomičnost: neon-http nema transakcija, pa jedna SQL naredba po operaciji.
import { and, asc, count, desc, eq, getTableColumns, inArray, isNull, sql } from "drizzle-orm";
import { db } from "./index";
import { answers, companies, contracts, events, finances, players, plans, rooms, roundReports, situations, worlds } from "./schema";
import type { AnswerRow, CompanyRow, PlayerRow, RoomRow, RoundReportRow, SituationRow, WorldRow } from "./schema";
import type { ContractRow, EventRow, FinanceRow, PlanRow } from "./schema";
import { getTemplate } from "@/lib/game/situations";
import type { ChatTurn, SituationTemplate } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Postgres baca grešku na id koji nije uuid; rute zato provjere oblik prije upita (inače bi bio 500). */
export function isUuid(id: unknown): id is string {
  return typeof id === "string" && UUID.test(id);
}

export async function getWorldByJoinCode(joinCode: string): Promise<WorldRow | null> {
  const rows = await db.select().from(worlds).where(eq(worlds.joinCode, joinCode)).limit(1);
  return rows[0] ?? null;
}

export async function getWorldByProfCodeHash(profCodeHash: string): Promise<WorldRow | null> {
  const rows = await db.select().from(worlds).where(eq(worlds.profCodeHash, profCodeHash)).limit(1);
  return rows[0] ?? null;
}

/** Sve tvrtke igre s igračem, redom ulaska. */
export async function listCompanies(
  worldId: string,
): Promise<{ company: CompanyRow; player: PlayerRow }[]> {
  return db
    .select({ company: companies, player: players })
    .from(companies)
    .innerJoin(players, eq(players.companyId, companies.id))
    .where(eq(companies.worldId, worldId))
    .orderBy(asc(companies.joinIndex));
}

/** Sobe tvrtke po katu i broju. */
export async function listRooms(companyId: string): Promise<RoomRow[]> {
  return db
    .select()
    .from(rooms)
    .where(eq(rooms.companyId, companyId))
    .orderBy(asc(rooms.floor), asc(rooms.number));
}

/**
 * Situacija samo ako pripada toj tvrtki (inače null, i za id koji nije uuid). Predložak iz banke ili profesorov iz
 * igre te tvrtke (L12, getTemplate), pa odgovor i razgovor rade i s profesorovim likom i rubrikom.
 */
export async function getSituationForCompany(
  situationId: string,
  companyId: string,
): Promise<{ situation: SituationRow; template: SituationTemplate } | null> {
  if (!isUuid(situationId)) return null;
  const rows = await db
    .select({ situation: situations, worldId: companies.worldId })
    .from(situations)
    .innerJoin(companies, eq(companies.id, situations.companyId))
    .where(and(eq(situations.id, situationId), eq(situations.companyId, companyId)))
    .limit(1);
  const found = rows[0];
  if (!found) return null;
  return { situation: found.situation, template: await getTemplate(found.worldId, found.situation.templateId) };
}

/** Atomično dopisuje poruke u transkript (jedan UPDATE, bez čitanja prije pisanja). */
export async function appendTranscript(
  situationId: string,
  turns: ChatTurn[],
): Promise<void> {
  if (turns.length === 0) return;
  await db
    .update(situations)
    .set({
      transcript: sql`${situations.transcript} || ${JSON.stringify(turns)}::jsonb`,
    })
    .where(eq(situations.id, situationId));
}

export async function getReport(
  companyId: string,
  round: number,
): Promise<RoundReportRow | null> {
  const rows = await db
    .select()
    .from(roundReports)
    .where(and(eq(roundReports.companyId, companyId), eq(roundReports.round, round)))
    .limit(1);
  return rows[0] ?? null;
}

export async function saveReflection(
  companyId: string,
  round: number,
  reflection: string,
  mentorText: string,
): Promise<void> {
  await db
    .update(roundReports)
    .set({ reflection, mentorText })
    .where(and(eq(roundReports.companyId, companyId), eq(roundReports.round, round)));
}

/** Piše pitanje samo ako ga još nema (WHERE mentor_question IS NULL). */
export async function saveMentorQuestion(
  companyId: string,
  round: number,
  question: string,
): Promise<void> {
  await db
    .update(roundReports)
    .set({ mentorQuestion: question })
    .where(
      and(
        eq(roundReports.companyId, companyId),
        eq(roundReports.round, round),
        isNull(roundReports.mentorQuestion),
      ),
    );
}

// ---- L7: krugovi, odgovori, izvještaji ----

export async function getWorld(worldId: string): Promise<WorldRow | null> {
  if (!isUuid(worldId)) return null;
  const rows = await db.select().from(worlds).where(eq(worlds.id, worldId)).limit(1);
  return rows[0] ?? null;
}

/** Tvrtka s igračem samo ako je iz te igre (inače null, i za id koji nije uuid). */
export async function getCompanyInWorld(
  companyId: string,
  worldId: string,
): Promise<{ company: CompanyRow; player: PlayerRow } | null> {
  if (!isUuid(companyId)) return null;
  const rows = await db
    .select({ company: companies, player: players })
    .from(companies)
    .innerJoin(players, eq(players.companyId, companies.id))
    .where(and(eq(companies.id, companyId), eq(companies.worldId, worldId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Sobe svih tvrtki igre (za izbor sobe situacije pri otvaranju kruga). */
export async function listWorldRooms(worldId: string): Promise<RoomRow[]> {
  return db
    .select(getTableColumns(rooms))
    .from(rooms)
    .innerJoin(companies, eq(rooms.companyId, companies.id))
    .where(eq(companies.worldId, worldId));
}

/** Situacije tvrtke s odgovorom (ili null), po krugu; bez `round` sve situacije. */
export async function listSituationsWithAnswers(
  companyId: string,
  round?: number,
): Promise<{ situation: SituationRow; answer: AnswerRow | null }[]> {
  const where =
    round === undefined
      ? eq(situations.companyId, companyId)
      : and(eq(situations.companyId, companyId), eq(situations.round, round));
  return db
    .select({ situation: situations, answer: answers })
    .from(situations)
    .leftJoin(answers, eq(answers.situationId, situations.id))
    .where(where)
    .orderBy(asc(situations.round), asc(situations.templateId));
}

export async function countSituations(companyId: string, round: number): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(situations)
    .where(and(eq(situations.companyId, companyId), eq(situations.round, round)));
  return n;
}

/** Izvještaji svih tvrtki igre (za ljestvicu: skok u zadnjem zatvorenom krugu). */
export async function listWorldReports(worldId: string): Promise<RoundReportRow[]> {
  return db
    .select(getTableColumns(roundReports))
    .from(roundReports)
    .innerJoin(companies, eq(roundReports.companyId, companies.id))
    .where(eq(companies.worldId, worldId))
    .orderBy(asc(roundReports.round));
}

export async function listCompanyReports(companyId: string): Promise<RoundReportRow[]> {
  return db
    .select()
    .from(roundReports)
    .where(eq(roundReports.companyId, companyId))
    .orderBy(asc(roundReports.round));
}

export async function logEvent(e: {
  worldId: string;
  companyId?: string;
  round: number;
  type: string;
  payload: unknown;
}): Promise<void> {
  await db.insert(events).values({
    worldId: e.worldId,
    companyId: e.companyId ?? null,
    round: e.round,
    type: e.type,
    payload: e.payload,
  });
}

// ---------- Grad (L11): planovi kruga, obračuni, ugovori, vijesti ----------

export async function getPlanRow(companyId: string, round: number): Promise<PlanRow | null> {
  const rows = await db
    .select()
    .from(plans)
    .where(and(eq(plans.companyId, companyId), eq(plans.round, round)))
    .limit(1);
  return rows[0] ?? null;
}

/** Jedan plan po tvrtki i krugu: novi zapis ili prepisivanje starog (unique (company_id, round)). */
export async function upsertPlan(p: { companyId: string; round: number; price: number; marketing: number }): Promise<PlanRow> {
  const rows = await db
    .insert(plans)
    .values(p)
    .onConflictDoUpdate({ target: [plans.companyId, plans.round], set: { price: p.price, marketing: p.marketing } })
    .returning();
  return rows[0];
}

/** Spremljeni planovi svih tvrtki igre za jedan krug (tvrtka bez plana nema redak). */
export async function listPlans(worldId: string, round: number): Promise<PlanRow[]> {
  const rows = await db
    .select({ plan: plans })
    .from(plans)
    .innerJoin(companies, eq(companies.id, plans.companyId))
    .where(and(eq(companies.worldId, worldId), eq(plans.round, round)));
  return rows.map((r) => r.plan);
}

/** Osnovne cijene svih soba igre, za broj soba i referentnu cijenu svakog hotela. */
export async function listRoomPrices(worldId: string): Promise<{ companyId: string; basePrice: number }[]> {
  return db
    .select({ companyId: rooms.companyId, basePrice: rooms.basePrice })
    .from(rooms)
    .innerJoin(companies, eq(companies.id, rooms.companyId))
    .where(eq(companies.worldId, worldId));
}

export async function listWorldContracts(worldId: string): Promise<ContractRow[]> {
  return db.select().from(contracts).where(eq(contracts.worldId, worldId));
}

/** Ugovor samo ako pripada toj tvrtki (inače null, i za id koji nije uuid). */
export async function getContractForCompany(contractId: string, companyId: string): Promise<ContractRow | null> {
  if (!isUuid(contractId)) return null;
  const rows = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, contractId), eq(contracts.companyId, companyId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Obračuni tvrtke po mjesecima, redom. */
export async function listFinanceRows(companyId: string): Promise<FinanceRow[]> {
  return db.select().from(finances).where(eq(finances.companyId, companyId)).orderBy(asc(finances.round));
}

/** Zadnji događaji igre zadanih vrsta, najnoviji prvo. */
export async function listEvents(worldId: string, types: string[], limit: number): Promise<EventRow[]> {
  return db
    .select()
    .from(events)
    .where(and(eq(events.worldId, worldId), inArray(events.type, types)))
    .orderBy(desc(events.at))
    .limit(limit);
}
