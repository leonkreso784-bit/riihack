// Krugovi na poslužitelju: otvaranje kruga (izvlačenje situacija) i zatvaranje kruga jedne tvrtke ili svih.
// Bez AI-ja: zatvaranje upiše samo brojke; pitanje mentora generira GET /api/me/report/[round] (S4).
import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/db";
import { answers, companies, dispatches, events, roundReports, rooms, situations, worlds } from "@/db/schema";
import type { WorldRow } from "@/db/schema";
import { countSituations, getWorld, listRooms, listSituationsWithAnswers, listWorldRooms } from "@/db/queries";
import { SITUATIONS } from "@/content";
import { drawSituations } from "@/lib/engine/draw";
import { pickRoom } from "@/lib/engine/rooms";
import { applyRound, isWrittenAnswer } from "@/lib/engine/round";
import { HttpError } from "@/lib/http";
import { MISSED_QUALITY, SITUATIONS_PER_ROUND } from "@/lib/rules";
import type { MetricKey, Metrics, Quality, RoomType, RoundReportView, SituationTemplate } from "@/lib/types";
import type { requirePlayer } from "@/lib/session";
import {
  listScheduledDispatches,
  listUsedTemplateIds,
  loadTemplates,
  planImmediateRows,
  type SituationInsert,
} from "./situations";
import type { SituationWithAnswer } from "./views";

type PlayerCtx = Awaited<ReturnType<typeof requirePlayer>>;

const KEYS: MetricKey[] = ["guests", "reviews", "staff", "operations", "finance"];

/** db.batch traži nepraznu n-torku; ovo je jedna transakcija (neon-http nema db.transaction()). */
function runBatch(items: BatchItem<"pg">[]) {
  if (items.length === 0) return Promise.resolve([]);
  return db.batch([items[0], ...items.slice(1)]);
}

/**
 * Pokazatelji tvrtke + `delta`, rezano na 0–100, kao jedan SQL izraz nad trenutnom vrijednošću u bazi. Zato se dva
 * istodobna upisa (zatvaranje kruga i obračun mjeseca, koji isto piše relativno: metricsPlus u city.ts) ne gaze.
 */
export function addMetricsSql(delta: Partial<Record<MetricKey, number>>) {
  const parts = KEYS.map(
    (k) =>
      sql`${k}::text, least(100, greatest(0, (${companies.metrics} ->> ${k})::int + ${Math.round(delta[k] ?? 0)}::int))`,
  );
  return sql`jsonb_build_object(${sql.join(parts, sql`, `)})`;
}

/**
 * Otvori krug `round` svim tvrtkama igre: situacije iz drawSituations (iste za sve) i profesorova slanja zakazana za
 * ovaj krug (L12), soba situacije iz pickRoom dobije problemStatus, rok kruga, događaj round.opened. Zove ga samo onaj
 * tko je prošao zaštitu prelaska kruga (startWorld, openNextRound). Ponovni poziv je bezopasan: unique (companyId,
 * round, templateId) + onConflictDoNothing, sobe se kvare samo za nove situacije, slanje se izvrši samo dok je
 * "scheduled", a rok se upisuje samo dok ga nema.
 */
/**
 * Kasni ulaz (BUG-027): situacije koje u tekućem mjesecu ima SVAKA tvrtka (izvučene i poslane svima), bez ciljanih
 * slanja pojedinim studentima. Redoslijed prvog pojavljivanja.
 */
export function lateJoinTemplateIds(rows: { companyId: string; templateId: string }[]): string[] {
  const companiesWith = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!companiesWith.has(r.templateId)) companiesWith.set(r.templateId, new Set());
    companiesWith.get(r.templateId)!.add(r.companyId);
  }
  const total = new Set(rows.map((r) => r.companyId)).size;
  return [...companiesWith].filter(([, ids]) => ids.size === total).map(([id]) => id);
}

/**
 * Kasni ulaz (BUG-027): tvrtka koja uđe dok igra traje dobije situacije tekućeg mjeseca kao i ostali (isti predlošci,
 * sobe iz svog hotela). Ponovni poziv ne radi ništa (unique company, round, template).
 */
export async function openRoundForLateJoin(world: WorldRow, companyId: string): Promise<void> {
  const [current, own, pool] = await Promise.all([
    db
      .select({ companyId: situations.companyId, templateId: situations.templateId })
      .from(situations)
      .innerJoin(companies, eq(companies.id, situations.companyId))
      .where(and(eq(companies.worldId, world.id), eq(situations.round, world.round))),
    listRooms(companyId),
    loadTemplates(world.id),
  ]);
  const others = current.filter((r) => r.companyId !== companyId);
  const byId = new Map(pool.map((t) => [t.id, t]));
  const ownRooms = own.map((r) => ({ number: r.number, type: r.type as RoomType }));
  const used = new Set<string>();
  const rows: SituationInsert[] = lateJoinTemplateIds(others).flatMap((templateId) => {
    const t = byId.get(templateId);
    if (!t) return [];
    let roomNumber: string | null = null;
    if (t.room) {
      const free = ownRooms.filter((r) => !used.has(r.number));
      roomNumber = pickRoom(free.length ? free : ownRooms, t.room.type);
      if (roomNumber) used.add(roomNumber);
    }
    return [{ companyId, round: world.round, templateId, roomNumber }];
  });
  if (rows.length) await db.insert(situations).values(rows).onConflictDoNothing();
}

export async function openRound(world: WorldRow, round: number, deadlineMinutes?: number): Promise<WorldRow> {
  const [all, worldRooms, pool, usedBefore, scheduled] = await Promise.all([
    db.select({ id: companies.id }).from(companies).where(eq(companies.worldId, world.id)),
    listWorldRooms(world.id),
    loadTemplates(world.id), // L12: banka + profesorove situacije te igre
    listUsedTemplateIds(world.id, round),
    listScheduledDispatches(world.id, round),
  ]);
  const byId = new Map(pool.map((t) => [t.id, t]));
  // L12: slučajno izvlačenje samo dok ga profesor nije isključio (autoDraw). Ne ponavlja situacije prijašnjih krugova
  // ni one zakazane za ovaj krug; kad novih nema dovoljno, izvlači iz cijelog poola.
  const scheduledIds = new Set(scheduled.map((d) => d.templateId));
  const fresh = pool.filter((t) => !usedBefore.has(t.id) && !scheduledIds.has(t.id));
  const drawPool = fresh.length >= SITUATIONS_PER_ROUND ? fresh : pool;
  // Mali pool (manje od SITUATIONS_PER_ROUND) vrati istu situaciju dvaput; dovoljna je jednom.
  const drawn = world.autoDraw
    ? [...new Map(drawSituations(world.seed + round, 1, drawPool, SITUATIONS_PER_ROUND).map((t) => [t.id, t])).values()]
    : [];

  const rows: SituationInsert[] = all.flatMap(({ id: companyId }) => {
    const own = worldRooms
      .filter((r) => r.companyId === companyId)
      .map((r) => ({ number: r.number, type: r.type as RoomType }));
    const used = new Set<string>();
    return drawn.map((t) => {
      let roomNumber: string | null = null;
      if (t.room) {
        const free = own.filter((r) => !used.has(r.number));
        roomNumber = pickRoom(free.length ? free : own, t.room.type);
        if (roomNumber) used.add(roomNumber);
      }
      return { companyId, round, templateId: t.id, roomNumber };
    });
  });

  // L12: zakazana slanja (ciljani studenti ili svi), sobe mimo već izvučenih situacija.
  const companyIds = all.map((c) => c.id);
  const executed: string[] = [];
  for (const d of scheduled) {
    const t = byId.get(d.templateId);
    if (!t) continue;
    const targets = d.companyIds ? d.companyIds.filter((id) => companyIds.includes(id)) : companyIds;
    rows.push(...planImmediateRows(t, targets, round, d.roomNumber ?? undefined, worldRooms, rows));
    executed.push(d.id);
  }
  // Ista situacija dvaput istoj tvrtki (dva slanja) → jedan redak.
  const unique = [...new Map(rows.map((r) => [`${r.companyId}|${r.templateId}`, r])).values()];

  const inserted = unique.length
    ? await db.insert(situations).values(unique).onConflictDoNothing().returning()
    : [];

  const deadline = deadlineMinutes ? new Date(Date.now() + deadlineMinutes * 60_000) : null;
  const items: BatchItem<"pg">[] = [];
  if (executed.length) {
    items.push(
      db
        .update(dispatches)
        .set({ status: "sent" })
        .where(and(inArray(dispatches.id, executed), eq(dispatches.status, "scheduled"))),
    );
  }
  for (const s of inserted) {
    const t = byId.get(s.templateId);
    if (!t?.room || !s.roomNumber) continue;
    items.push(
      db
        .update(rooms)
        .set({ status: t.room.problemStatus })
        .where(and(eq(rooms.companyId, s.companyId), eq(rooms.number, s.roomNumber))),
    );
  }
  items.push(
    db
      .update(worlds)
      .set({ roundDeadline: deadline })
      .where(and(eq(worlds.id, world.id), eq(worlds.round, round), eq(worlds.status, "running"), isNull(worlds.roundDeadline))),
    db.insert(events).values({
      worldId: world.id,
      round,
      type: "round.opened",
      payload: {
        round,
        situations: drawn.map((t) => t.id),
        dispatched: scheduled.filter((d) => executed.includes(d.id)).map((d) => d.templateId),
        deadline: deadline?.toISOString() ?? null,
      },
    }),
  );
  await runBatch(items);
  return (await getWorld(world.id)) ?? world;
}

/**
 * Rezultati kruga za applyRound: odgovorene s kvalitetom odgovora, ostale MISSED_QUALITY; učinci iz predloška igre.
 * `written` = napisan svoj tekst (ADR-046): takav odgovor s kvalitetom 1 ne spušta pokazatelje.
 */
export function roundResults(rows: SituationWithAnswer[], templates: SituationTemplate[]) {
  return rows.map(({ situation, answer }) => ({
    quality: (answer?.quality ?? MISSED_QUALITY) as Quality,
    effects: templates.find((t) => t.id === situation.templateId)?.effects ?? {},
    written: isWrittenAnswer(answer),
  }));
}

/**
 * Zatvori krug `round` jednoj tvrtki: neodgovorene situacije → expired i odgovor "none" s MISSED_QUALITY, pokazatelji
 * kroz applyRound, izvještaj kruga (bez pitanja mentora), događaj round.closed. Vraća null ako je krug već zatvoren
 * (drugi klik, druga kartica, rok i profesor u istoj sekundi). `pool` = predlošci igre (loadTemplates); bez njega se
 * učitaju ovdje, a closeRoundForAll ih učita jednom za sve tvrtke.
 */
export async function closeCompanyRound(
  companyId: string,
  round: number,
  pool?: SituationTemplate[],
): Promise<RoundReportView | null> {
  // 1. Zaštita od dvostrukog zatvaranja: ovaj UPDATE prođe točno jednom po (tvrtka, krug).
  const [company] = await db
    .update(companies)
    .set({ closedRound: round })
    .where(and(eq(companies.id, companyId), lt(companies.closedRound, round)))
    .returning();
  if (!company) return null;

  // 2. Neodgovorene situacije uzme zatvaranje (open → expired). Odgovor spremljen prije ovoga se broji; odgovor koji
  //    stigne poslije ne prođe, jer submitAnswer sprema samo dok je situacija open (isti redak, isti uvjet).
  await db
    .update(situations)
    .set({ state: "expired" })
    .where(and(eq(situations.companyId, companyId), eq(situations.round, round), eq(situations.state, "open")));

  // 3. Svi rezultati kruga: odgovorene s kvalitetom odgovora, ostale MISSED_QUALITY.
  //    Učinci iz predloška igre (banka ili profesorova situacija, L12).
  const [rows, templates] = await Promise.all([
    listSituationsWithAnswers(companyId, round),
    pool ?? loadTemplates(company.worldId),
  ]);
  const results = roundResults(rows, templates);
  const metricsBefore = company.metrics;
  const metricsAfter = applyRound(metricsBefore, results);
  const delta = Object.fromEntries(KEYS.map((k) => [k, metricsAfter[k] - metricsBefore[k]])) as Metrics;
  const missed = rows.filter((r) => !r.answer);

  // 4. Ostali zapisi zatvaranja u jednoj transakciji.
  const items: BatchItem<"pg">[] = [
    db.update(companies).set({ metrics: addMetricsSql(delta) }).where(eq(companies.id, companyId)),
    db.insert(roundReports).values({ companyId, round, metricsBefore, metricsAfter }).onConflictDoNothing(),
    db.insert(events).values({
      worldId: company.worldId,
      companyId,
      round,
      type: "round.closed",
      payload: { metricsBefore, metricsAfter, answered: rows.length - missed.length, missed: missed.length },
    }),
  ];
  if (missed.length) {
    items.push(
      db
        .insert(answers)
        .values(
          missed.map(({ situation }) => ({
            situationId: situation.id,
            mode: "none",
            quality: MISSED_QUALITY,
            copied: false,
          })),
        )
        .onConflictDoNothing(),
    );
  }
  await runBatch(items);
  return { round, metricsBefore, metricsAfter };
}

/** Zatvori krug svim tvrtkama koje ga još nisu zatvorile. Greška jedne tvrtke ne zaustavlja ostale. */
export async function closeRoundForAll(world: WorldRow, round: number): Promise<number> {
  if (round < 1) return 0;
  const open = await db
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.worldId, world.id), lt(companies.closedRound, round)));
  if (open.length === 0) return 0;
  const pool = await loadTemplates(world.id);
  const results = await Promise.allSettled(open.map((c) => closeCompanyRound(c.id, round, pool)));
  let closed = 0;
  for (const r of results) {
    if (r.status === "rejected") console.error("[round] zatvaranje kruga nije uspjelo", r.reason);
    else if (r.value) closed++;
  }
  return closed;
}

/** POST /api/me/close-round: student sam zatvara tekući krug. */
export async function closeMyRound(ctx: PlayerCtx): Promise<RoundReportView> {
  const { world, company } = ctx;
  if (world.status === "lobby") throw new HttpError(409, "Igra još nije počela");
  if (world.status === "finished") throw new HttpError(409, "Sezona je gotova");
  if (company.closedRound >= world.round) throw new HttpError(409, "Ovaj krug si već zatvorio");
  // Krug je upravo prešao u sljedeći, a situacije se još upisuju (milisekunde): ne zatvaraj prazan krug. Bez
  // slučajnog izvlačenja (L12, autoDraw = false) krug smije biti prazan, pa se tada smije zatvoriti.
  if (world.autoDraw && SITUATIONS.length > 0 && (await countSituations(company.id, world.round)) === 0) {
    throw new HttpError(409, "Krug se još otvara. Pokušaj za trenutak.");
  }
  const report = await closeCompanyRound(company.id, world.round);
  if (!report) throw new HttpError(409, "Ovaj krug si već zatvorio");
  return report;
}
