// Igra (svijet) na poslužitelju: stvaranje, prijava profesora, pokretanje i stanje za profesora.
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, worlds } from "@/db/schema";
import type { WorldRow } from "@/db/schema";
import { getWorldByProfCodeHash, listCompanies, logEvent } from "@/db/queries";
import { generateCode, hashCode, normalizeCode } from "@/lib/engine/codes";
import { HttpError } from "@/lib/http";
import { JOIN_CODE_LENGTH, PROF_CODE_LENGTH } from "@/lib/rules";
import type { CreateWorldRequest, CreateWorldResponse, ProfLoginRequest, ProfLoginResponse, ProfStateResponse } from "@/lib/types";
import { toProfState } from "./views";

const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] & 0x7fffffff; // stane u Postgres integer

export async function createWorld(req: CreateWorldRequest): Promise<CreateWorldResponse> {
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
      .values({ name, maxPlayers, joinCode, profCodeHash: await hashCode(profCode), seed: randomSeed() })
      .onConflictDoNothing()
      .returning({ id: worlds.id });
    if (rows[0]) {
      await logEvent({ worldId: rows[0].id, round: 0, type: "world.created", payload: { name, maxPlayers } });
      return { worldId: rows[0].id, joinCode, profCode };
    }
  }
  throw new HttpError(503, "Nije uspjelo napraviti kod igre. Pokušaj ponovno.");
}

/** Profesor na drugom uređaju upiše svoj kod; ruta postavi kolačić s normaliziranim kodom. */
export async function loginProf(req: ProfLoginRequest): Promise<{ profCode: string; res: ProfLoginResponse }> {
  if (typeof req.profCode !== "string") throw new HttpError(400, "Upiši profesorski kod");
  const profCode = normalizeCode(req.profCode);
  const world = profCode ? await getWorldByProfCodeHash(await hashCode(profCode)) : null;
  if (!world) throw new HttpError(404, "Nepoznat profesorski kod");
  return { profCode, res: { worldId: world.id } };
}

/** Lobby → krug 1. Za M1 samo status i krug; L7 ovdje izvlači situacije kruga 1. */
export async function startWorld(worldId: string): Promise<WorldRow> {
  const [{ n }] = await db.select({ n: count() }).from(companies).where(eq(companies.worldId, worldId));
  // Studenti samo ulaze, nikad ne izlaze, pa provjera prije UPDATE-a ne može zastarjeti.
  if (n === 0) throw new HttpError(409, "Nema studenata u igri");
  const rows = await db
    .update(worlds)
    .set({ status: "running", round: 1 })
    .where(and(eq(worlds.id, worldId), eq(worlds.status, "lobby")))
    .returning();
  if (!rows[0]) throw new HttpError(409, "Igra je već krenula");
  await logEvent({ worldId, round: 1, type: "world.started", payload: { players: n } });
  return rows[0];
}

export async function loadProfState(world: WorldRow): Promise<ProfStateResponse> {
  return toProfState({ world, all: await listCompanies(world.id) });
}
