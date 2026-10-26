// Igra (svijet) na poslužitelju: stvaranje, prijava profesora, pokretanje, krugovi, kraj sezone i stanja za ekrane.
import { and, count, desc, eq, isNotNull, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { companies, players, worlds } from "@/db/schema";
import type { WorldRow } from "@/db/schema";
import {
  getCompanyInWorld,
  getPlanRow,
  getWorld,
  getWorldByProfCodeHash,
  listCompanies,
  listCompanyReports,
  listFinanceRows,
  listRooms,
  listSituationsWithAnswers,
  listWorldContracts,
  listWorldReports,
  logEvent,
} from "@/db/queries";
import { generateCode, hashCode, normalizeCode } from "@/lib/engine/codes";
import { HttpError } from "@/lib/http";
import { JOIN_CODE_LENGTH, MAX_ROUNDS, PROF_CODE_LENGTH } from "@/lib/rules";
import type { requirePlayer } from "@/lib/session";
import type {
  CompanyDetailResponse,
  CreateWorldRequest,
  CreateWorldResponse,
  MeResponse,
  OpenRoundRequest,
  ProfLoginRequest,
  ProfLoginResponse,
  ProfGameSummary,
  ProfStateResponse,
} from "@/lib/types";
import { playBots } from "./bots";
import { carryPlansForward, createOffers, listNewsEvents, settleCityRound } from "./city";
import { countUnreadMail, listMailWindow } from "./mail";
import { closeRoundForAll, openRound } from "./round";
import { listBank, listDispatches, loadTemplates } from "./situations";
import { toCompanyDetail, toMeResponse, toProfGameSummary, toProfState } from "./views";

type PlayerCtx = Awaited<ReturnType<typeof requirePlayer>>;

const MAX_DEADLINE_MINUTES = 180;

const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] & 0x7fffffff; // stane u Postgres integer

/** ownerId = prijavljeni profesorski račun (L16); bez njega igra radi samo s profesorskim kodom. */
export async function createWorld(req: CreateWorldRequest, ownerId: string | null = null): Promise<CreateWorldResponse> {
  const name = typeof req.name === "string" ? req.name.trim() : "";
  if (name.length < 2 || name.length > 60) throw new HttpError(400, "Naziv igre mora imati od 2 do 60 znakova");
  const maxPlayers = req.maxPlayers;
  if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 60) {
    throw new HttpError(400, "Broj studenata mora biti cijeli broj od 1 do 60");
  }

  // Kod igre je kratak pa se može sudariti s postojećim (unique); tada pokušaj s novim.
  for (let attempt = 0; attempt < 5; attempt++) {
    const joinCode = generateCode(JOIN_CODE_LENGTH);
    const profCode = generateCode(PROF_CODE_LENGTH);
    const rows = await db
      .insert(worlds)
      .values({ name, maxPlayers, joinCode, profCodeHash: await hashCode(profCode), seed: randomSeed(), ownerId })
      .onConflictDoNothing()
      .returning({ id: worlds.id });
    if (rows[0]) {
      await logEvent({ worldId: rows[0].id, round: 0, type: "world.created", payload: { name, maxPlayers } });
      return { worldId: rows[0].id, joinCode, profCode };
    }
  }
  throw new HttpError(503, "Nije uspjelo napraviti kod igre. Pokušaj ponovno.");
}

/** Igre prijavljenog profesora, najnovije prvo, s brojem studenata (jedan upit). */
export async function listProfGames(ownerId: string): Promise<ProfGameSummary[]> {
  const rows = await db
    .select({ world: worlds, players: count(players.id) })
    .from(worlds)
    .leftJoin(companies, eq(companies.worldId, worlds.id))
    .leftJoin(players, and(eq(players.companyId, companies.id), ne(companies.kind, "bot"))) // botovi nisu studenti (ADR-044)
    .where(eq(worlds.ownerId, ownerId))
    .groupBy(worlds.id)
    .orderBy(desc(worlds.createdAt));
  return rows.map((r) => toProfGameSummary(r.world, r.players));
}

/** Profesor na drugom uređaju upiše svoj kod; ruta postavi kolačić s normaliziranim kodom. */
export async function loginProf(req: ProfLoginRequest): Promise<{ profCode: string; res: ProfLoginResponse }> {
  if (typeof req.profCode !== "string") throw new HttpError(400, "Upiši profesorski kod");
  const profCode = normalizeCode(req.profCode);
  const world = profCode ? await getWorldByProfCodeHash(await hashCode(profCode)) : null;
  if (!world) throw new HttpError(404, "Nepoznat profesorski kod");
  return { profCode, res: { worldId: world.id } };
}

/** Lobby → krug 1 sa situacijama. Prijelaz je atomičan (WHERE status = 'lobby'), pa drugi klik dobije 409. */
export async function startWorld(worldId: string): Promise<WorldRow> {
  const [{ n }] = await db.select({ n: count() }).from(companies).where(eq(companies.worldId, worldId));
  // Studenti samo ulaze, nikad ne izlaze, pa provjera prije UPDATE-a ne može zastarjeti.
  if (n === 0) throw new HttpError(409, "Nema studenata u igri");
  const rows = await db
    .update(worlds)
    .set({ status: "running", round: 1, roundDeadline: null })
    .where(and(eq(worlds.id, worldId), eq(worlds.status, "lobby")))
    .returning();
  if (!rows[0]) throw new HttpError(409, "Igra je već krenula");
  await logEvent({ worldId, round: 1, type: "world.started", payload: { players: n } });
  const opened = await openRound(rows[0], 1);
  await createOffers(opened, 1);
  return opened;
}

/** Rok u minutama iz OpenRoundRequest: bez roka null, inače cijeli broj 1–180. */
export function parseDeadlineMinutes(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_DEADLINE_MINUTES) {
    throw new HttpError(400, `Rok kruga mora biti cijeli broj minuta od 1 do ${MAX_DEADLINE_MINUTES}`);
  }
  return value;
}

/** Mjesec koji profesor zatvara (OpenRoundRequest.fromRound): bez polja undefined, inače cijeli broj od 1. */
export function parseFromRound(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new HttpError(400, "Neispravan mjesec za zatvaranje");
  }
  return value;
}

/** Drugi klik (dvoklik, dvije funkcije na Vercelu) stigao je nakon prvog: igra je već prešla mjesec fromRound. */
export function isStaleRoundRequest(world: Pick<WorldRow, "round">, fromRound: number | undefined): boolean {
  return fromRound !== undefined && world.round !== fromRound;
}

/**
 * Profesor zatvara mjesec k i otvara k + 1: prvo zatvori krug k svima, zatim prijelaz kruga sa zaštitom
 * (UPDATE … WHERE round = k), pa openRound. Dva istodobna klika: oba zatvaraju (zaštita po tvrtki), krug poraste
 * točno jednom, a drugi klik dobije trenutno stanje.
 */
export async function openNextRound(world: WorldRow, req: OpenRoundRequest): Promise<WorldRow> {
  const deadlineMinutes = parseDeadlineMinutes(req.deadlineMinutes);
  const fromRound = parseFromRound(req.fromRound);
  if (world.status === "lobby") throw new HttpError(409, "Igra još nije krenula");
  // Mjesec je već zatvorio drugi klik: vrati trenutno stanje, bez drugog prelaska i bez 409 „Sezona je gotova".
  if (isStaleRoundRequest(world, fromRound)) return world;
  if (world.status === "finished" || world.round >= MAX_ROUNDS) throw new HttpError(409, "Sezona je gotova");
  const k = world.round;

  await playBots(world, k); // ADR-044: botovi igraju mjesec k prije zatvaranja
  await closeRoundForAll(world, k);
  // Obračun mjeseca k za cijeli grad, nakon zatvaranja krugova i prije prelaska u k + 1. Ima vlastitu zaštitu
  // (settled_round), pa smije biti pozvan i iz drugog istodobnog klika.
  await settleCityRound(world, k);

  const [next] = await db
    .update(worlds)
    .set({ round: k + 1, roundDeadline: null })
    .where(and(eq(worlds.id, world.id), eq(worlds.round, k), eq(worlds.status, "running")))
    .returning();
  if (!next) return (await getWorld(world.id)) ?? world; // drugi istodobni klik: krug je već otvoren

  const opened = await openRound(next, k + 1, deadlineMinutes);
  await Promise.all([createOffers(opened, k + 1), carryPlansForward(opened.id, k + 1)]);
  return opened;
}

/** Kraj sezone: zatvori tekući krug svima, status finished, bez roka. Ponovni poziv vrati isto stanje. */
export async function finishWorld(world: WorldRow): Promise<WorldRow> {
  if (world.status === "lobby") throw new HttpError(409, "Igra još nije krenula");
  if (world.status === "finished") return world;
  await playBots(world, world.round); // ADR-044
  await closeRoundForAll(world, world.round);
  await settleCityRound(world, world.round); // obračun zadnjeg mjeseca
  const [done] = await db
    .update(worlds)
    .set({ status: "finished", roundDeadline: null })
    .where(and(eq(worlds.id, world.id), eq(worlds.status, "running")))
    .returning();
  return done ?? (await getWorld(world.id)) ?? world;
}

/**
 * Istekao rok kruga: zatvori krug svima; sljedeći krug otvara profesor. GET /api/me i GET /api/prof/[worldId] ovo
 * zovu prije čitanja. Rok uzme samo jedan poziv (polling 30 studenata u istoj sekundi): atomičan UPDATE briše rok samo
 * ako je igra running i rok u bazi stvarno prošao, pa ostali pozivi ne rade ništa. `known` (već pročitana igra)
 * preskoči upit kad rok sigurno nije prošao. Vraća true ako je ovaj poziv zatvorio krug.
 */
export async function expireRoundIfDue(
  worldId: string,
  known?: Pick<WorldRow, "status" | "roundDeadline">,
): Promise<boolean> {
  const now = new Date();
  if (known && !(known.status === "running" && known.roundDeadline && known.roundDeadline <= now)) return false;
  const [world] = await db
    .update(worlds)
    .set({ roundDeadline: null })
    .where(
      and(
        eq(worlds.id, worldId),
        eq(worlds.status, "running"),
        isNotNull(worlds.roundDeadline),
        lte(worlds.roundDeadline, now),
      ),
    )
    .returning();
  if (!world) return false;
  await playBots(world, world.round); // ADR-044: i istek roka zatvara mjesec, botovi ne smiju ostati bez poteza
  await closeRoundForAll(world, world.round);
  await settleCityRound(world, world.round); // rok je zatvorio mjesec
  await logEvent({ worldId, round: world.round, type: "round.expired", payload: { round: world.round } });
  return true;
}

export async function loadProfState(world: WorldRow): Promise<ProfStateResponse> {
  const [all, reports, contracts, events, bank, dispatches] = await Promise.all([
    listCompanies(world.id),
    listWorldReports(world.id),
    listWorldContracts(world.id),
    listNewsEvents(world.id),
    listBank(world.id), // L12: banka + profesorove situacije
    listDispatches(world.id),
  ]);
  return toProfState({ world, all, reports, contracts, events, bank, dispatches });
}

/** GET /api/me: tvrtka, situacije tekućeg kruga (i vlastite prošle, #239), izvještaji, ljestvica, plan, ugovori, obračuni, grad i vijesti. */
export async function loadMeState(ctx: PlayerCtx): Promise<MeResponse> {
  const [rooms, all, situations, reports, plan, contracts, finances, events, pool, mail, unreadMail] = await Promise.all([
    listRooms(ctx.company.id),
    listCompanies(ctx.world.id),
    listSituationsWithAnswers(ctx.company.id), // svi mjeseci ove tvrtke; toMeResponse ih razdvoji na tekući i prošle
    listWorldReports(ctx.world.id),
    getPlanRow(ctx.company.id, ctx.world.round),
    listWorldContracts(ctx.world.id),
    listFinanceRows(ctx.company.id),
    listNewsEvents(ctx.world.id),
    loadTemplates(ctx.world.id), // L12: i profesorove situacije
    listMailWindow(ctx.company.id), // L15: pošta (poruke hotela i ponude agencija u odvojenim prozorima)
    countUnreadMail(ctx.company.id),
  ]);
  return toMeResponse(
    { ...ctx, rooms, all, situations, reports, plan, contracts, finances, events, mail, unreadMail },
    new Date(),
    pool,
  );
}

/** GET /api/prof/[worldId]/companies/[id]: uvid u jednu tvrtku; tvrtka iz druge igre → 404. */
export async function loadCompanyDetail(world: WorldRow, companyId: string): Promise<CompanyDetailResponse> {
  const found = await getCompanyInWorld(companyId, world.id);
  if (!found) throw new HttpError(404, "Ta tvrtka nije u ovoj igri");
  const [rooms, situations, reports, pool] = await Promise.all([
    listRooms(found.company.id),
    listSituationsWithAnswers(found.company.id),
    listCompanyReports(found.company.id),
    loadTemplates(world.id), // L12: i profesorove situacije
  ]);
  return toCompanyDetail({ ...found, roomsCount: rooms.length, situations, reports }, pool);
}
