// Profesorove situacije (L12): banka + profesorove, spremanje nacrta, slanje odabranim studentima (odmah ili u krug k)
// i prekidač slučajnog izvlačenja. Brojke i dalje računa samo motor; ovdje se samo upisuje tko što dobiva.
import { and, asc, eq, inArray } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/db";
import { companies, customSituations, dispatches, events, rooms, situations, worlds } from "@/db/schema";
import type { CustomSituationRow, DispatchRow, WorldRow } from "@/db/schema";
import { isUuid } from "@/db/queries";
import { SITUATIONS } from "@/content";
import { toTemplate, validateDraft } from "@/lib/engine/draft";
import { pickRoom } from "@/lib/engine/rooms";
import { HttpError } from "@/lib/http";
import { MAX_ROUNDS } from "@/lib/rules";
import type {
  DispatchRequest,
  DispatchView,
  RoomType,
  SituationDraft,
  SituationSource,
  SituationSummary,
  SituationTemplate,
} from "@/lib/types";

// ---------- Čiste funkcije (testovi u situations.test.ts) ----------

export function toSummary(t: SituationTemplate, source: SituationSource): SituationSummary {
  return { id: t.id, title: t.title, area: t.area, difficulty: t.difficulty, source };
}

/** Predložak iz retka profesorove situacije; id uvijek iz retka. */
export function customTemplate(row: Pick<CustomSituationRow, "id" | "template">): SituationTemplate {
  return { ...row.template, id: row.id };
}

export function toDispatchView(row: DispatchRow, title: string): DispatchView {
  return {
    id: row.id,
    templateId: row.templateId,
    title,
    round: row.round,
    companyIds: row.companyIds ?? null,
    status: row.status === "sent" ? "sent" : "scheduled",
  };
}

/** DispatchRequest iz nepouzdanog JSON-a; neispravan oblik → 400. */
export function parseDispatchRequest(body: Record<string, unknown>): DispatchRequest {
  const { templateId, companyIds, round, roomNumber } = body;
  if (typeof templateId !== "string" || !templateId.trim() || templateId.length > 80) {
    throw new HttpError(400, "Odaberi situaciju koju šalješ");
  }
  const req: DispatchRequest = { templateId: templateId.trim() };
  if (companyIds !== undefined && companyIds !== null) {
    if (!Array.isArray(companyIds) || !companyIds.every((c) => typeof c === "string")) {
      throw new HttpError(400, "Neispravan popis studenata");
    }
    if (companyIds.length === 0) throw new HttpError(400, "Odaberi barem jednog studenta");
    req.companyIds = [...new Set(companyIds as string[])];
  }
  if (round !== undefined && round !== null) {
    if (typeof round !== "number" || !Number.isInteger(round)) {
      throw new HttpError(400, `Krug mora biti cijeli broj od 1 do ${MAX_ROUNDS}`);
    }
    req.round = round;
  }
  if (roomNumber !== undefined && roomNumber !== null && roomNumber !== "") {
    if (typeof roomNumber !== "string" || !roomNumber.trim() || roomNumber.trim().length > 10) {
      throw new HttpError(400, "Neispravan broj sobe");
    }
    req.roomNumber = roomNumber.trim();
  }
  return req;
}

export type DispatchTiming = { kind: "now" | "scheduled"; round: number };

/**
 * Kada slanje stiže: bez kruga ili tekući krug → odmah (igra mora teći); budući krug do MAX_ROUNDS → zakazano
 * (izvršava ga openRound); prošli krug ili iza sezone → 409.
 */
export function dispatchTiming(world: Pick<WorldRow, "status" | "round">, round?: number): DispatchTiming {
  if (world.status === "finished") throw new HttpError(409, "Sezona je gotova");
  if (round === undefined || round === world.round) {
    if (world.status !== "running") throw new HttpError(409, "Igra još nije počela");
    return { kind: "now", round: world.round };
  }
  if (round > world.round && round <= MAX_ROUNDS) return { kind: "scheduled", round };
  throw new HttpError(409, "Krug je izvan sezone");
}

export type SituationInsert = { companyId: string; round: number; templateId: string; roomNumber: string | null };

/**
 * Retci situacija za slanje odmah, kao u openRound (L7): soba iz `roomNumber` ako je hotel ima, inače pickRoom po
 * template.room među sobama koje u tom krugu još nemaju situaciju (sve zauzete → bilo koja). Bez sobe u predlošku i
 * bez `roomNumber` → bez sobe.
 */
export function planImmediateRows(
  template: SituationTemplate,
  companyIds: string[],
  round: number,
  roomNumber: string | undefined,
  worldRooms: { companyId: string; number: string; type: string }[],
  taken: { companyId: string; roomNumber: string | null }[],
): SituationInsert[] {
  return companyIds.map((companyId) => {
    const own = worldRooms
      .filter((r) => r.companyId === companyId)
      .map((r) => ({ number: r.number, type: r.type as RoomType }));
    let room: string | null = null;
    if (roomNumber && own.some((r) => r.number === roomNumber)) {
      room = roomNumber;
    } else if (template.room) {
      const used = new Set(taken.filter((s) => s.companyId === companyId).map((s) => s.roomNumber));
      const free = own.filter((r) => !used.has(r.number));
      room = pickRoom(free.length ? free : own, template.room.type);
    }
    return { companyId, round, templateId: template.id, roomNumber: room };
  });
}

// ---------- Baza ----------

/** db.batch traži nepraznu n-torku; jedna transakcija (neon-http nema db.transaction()). */
function runBatch(items: BatchItem<"pg">[]) {
  if (items.length === 0) return Promise.resolve([]);
  return db.batch([items[0], ...items.slice(1)]);
}

async function listCustomRows(worldId: string): Promise<CustomSituationRow[]> {
  if (!isUuid(worldId)) return [];
  return db
    .select()
    .from(customSituations)
    .where(eq(customSituations.worldId, worldId))
    .orderBy(asc(customSituations.createdAt));
}

/** Svi predlošci koje igra smije koristiti: banka iz sadržaja + profesorove situacije te igre. */
export async function loadTemplates(worldId: string): Promise<SituationTemplate[]> {
  const custom = await listCustomRows(worldId);
  return [...SITUATIONS, ...custom.map(customTemplate)];
}

/** Predložak iz banke ili profesorov iz te igre; nepoznat → HttpError 404 (i za situaciju druge igre). */
export async function getTemplate(worldId: string, templateId: string): Promise<SituationTemplate> {
  const bank = SITUATIONS.find((t) => t.id === templateId);
  if (bank) return bank;
  if (isUuid(worldId) && templateId.startsWith("custom-")) {
    const rows = await db
      .select()
      .from(customSituations)
      .where(and(eq(customSituations.id, templateId), eq(customSituations.worldId, worldId)))
      .limit(1);
    if (rows[0]) return customTemplate(rows[0]);
  }
  throw new HttpError(404, "Ta situacija ne postoji");
}

/** Banka za profesora: situacije iz sadržaja pa profesorove (redom spremanja). */
export async function listBank(worldId: string): Promise<SituationSummary[]> {
  const custom = await listCustomRows(worldId);
  return [
    ...SITUATIONS.map((t) => toSummary(t, "bank")),
    ...custom.map((r) => toSummary(customTemplate(r), r.source === "ai" ? "ai" : "custom")),
  ];
}

/** Slanja igre redom kako su nastala, s naslovom situacije. */
export async function listDispatches(worldId: string): Promise<DispatchView[]> {
  if (!isUuid(worldId)) return [];
  const [rows, templates] = await Promise.all([
    db.select().from(dispatches).where(eq(dispatches.worldId, worldId)).orderBy(asc(dispatches.createdAt)),
    loadTemplates(worldId),
  ]);
  const titles = new Map(templates.map((t) => [t.id, t.title]));
  return rows.map((r) => toDispatchView(r, titles.get(r.templateId) ?? "Nepoznata situacija"));
}

/** POST /api/prof/[worldId]/situations: provjeri nacrt (400), spremi kao "custom-…", događaj situation.created. */
export async function createCustomSituation(
  world: WorldRow,
  draft: SituationDraft,
  source: SituationSource = "custom",
): Promise<SituationSummary> {
  const error = validateDraft(draft);
  if (error) throw new HttpError(400, error);
  const kind: SituationSource = source === "ai" ? "ai" : "custom"; // "bank" je samo sadržaj iz repoa
  const id = `custom-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const template = toTemplate(id, draft);
  await runBatch([
    db.insert(customSituations).values({ id, worldId: world.id, source: kind, template }),
    db.insert(events).values({
      worldId: world.id,
      round: world.round,
      type: "situation.created",
      payload: { id, title: template.title, source: kind },
    }),
  ]);
  return toSummary(template, kind);
}

/**
 * POST /api/prof/[worldId]/dispatch. Nepoznata situacija ili student druge igre → 404. Odmah: situacija se upiše u
 * tekući krug svim ciljanim tvrtkama koje ga još nisu zatvorile (unique (companyId, round, templateId) +
 * onConflictDoNothing), soba dobije problemStatus kao u openRound, redak slanja "sent". Budući krug: redak
 * "scheduled" koji izvrši openRound. Oba upišu događaj situation.sent.
 */
export async function dispatchSituation(world: WorldRow, req: DispatchRequest): Promise<void> {
  const template = await getTemplate(world.id, req.templateId);
  const all = await db
    .select({ id: companies.id, closedRound: companies.closedRound })
    .from(companies)
    .where(eq(companies.worldId, world.id));
  const known = new Set(all.map((c) => c.id));
  if (req.companyIds?.some((id) => !known.has(id))) throw new HttpError(404, "Taj student nije u ovoj igri");
  const timing = dispatchTiming(world, req.round);
  const companyIds = req.companyIds ?? null;
  const roomNumber = req.roomNumber ?? null;
  const event = (status: "sent" | "scheduled", delivered?: number) =>
    db.insert(events).values({
      worldId: world.id,
      round: world.round,
      type: "situation.sent",
      payload: { templateId: template.id, title: template.title, round: timing.round, companyIds, status, delivered },
    });

  if (timing.kind === "scheduled") {
    await runBatch([
      db.insert(dispatches).values({ worldId: world.id, templateId: template.id, round: timing.round, companyIds, roomNumber, status: "scheduled" }),
      event("scheduled"),
    ]);
    return;
  }

  const targets = all
    .filter((c) => (companyIds === null || companyIds.includes(c.id)) && c.closedRound < timing.round)
    .map((c) => c.id);
  if (targets.length === 0) throw new HttpError(409, "Odabrani studenti su već zatvorili ovaj krug");

  const [worldRooms, taken] = await Promise.all([
    db
      .select({ companyId: rooms.companyId, number: rooms.number, type: rooms.type })
      .from(rooms)
      .where(inArray(rooms.companyId, targets)),
    db
      .select({ companyId: situations.companyId, roomNumber: situations.roomNumber })
      .from(situations)
      .where(and(inArray(situations.companyId, targets), eq(situations.round, timing.round))),
  ]);
  const rows = planImmediateRows(template, targets, timing.round, req.roomNumber, worldRooms, taken);
  const inserted = await db
    .insert(situations)
    .values(rows)
    .onConflictDoNothing()
    .returning({ companyId: situations.companyId, roomNumber: situations.roomNumber });

  const items: BatchItem<"pg">[] = [];
  if (template.room) {
    for (const s of inserted) {
      if (!s.roomNumber) continue;
      items.push(
        db
          .update(rooms)
          .set({ status: template.room.problemStatus })
          .where(and(eq(rooms.companyId, s.companyId), eq(rooms.number, s.roomNumber))),
      );
    }
  }
  items.push(
    db.insert(dispatches).values({ worldId: world.id, templateId: template.id, round: timing.round, companyIds, roomNumber, status: "sent" }),
    event("sent", inserted.length),
  );
  await runBatch(items);
}

/** POST /api/prof/[worldId]/settings: slučajno izvlačenje situacija pri otvaranju kruga (uključeno ili ne). */
export async function setAutoDraw(world: WorldRow, on: boolean): Promise<WorldRow> {
  const [updated] = await db.update(worlds).set({ autoDraw: on }).where(eq(worlds.id, world.id)).returning();
  return updated ?? { ...world, autoDraw: on };
}
