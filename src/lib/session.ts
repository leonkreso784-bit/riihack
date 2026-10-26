// Tko zove API: igrač po kolačiću sp_player (slučajni token, u bazi samo hash), profesor po sp_prof (profesorski kod)
// ili po Better Auth sesiji (profesorski račun, vlasnik igre).
import { cookies, headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, players, worlds } from "@/db/schema";
import type { CompanyRow, PlayerRow, WorldRow } from "@/db/schema";
import { isUuid } from "@/db/queries";
import { getAuth } from "@/lib/auth";
import { hashCode, normalizeCode } from "@/lib/engine/codes";
import { HttpError } from "@/lib/http";

const PLAYER_COOKIE = "sp_player";
const PROF_COOKIE = "sp_prof";
const COOKIE_MAX_AGE = 2 * 24 * 60 * 60; // 2 dana, dovoljno za cijeli hackathon i demo

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: COOKIE_MAX_AGE,
});

export async function setPlayerCookie(token: string): Promise<void> {
  (await cookies()).set(PLAYER_COOKIE, token, cookieOptions());
}

export async function setProfCookie(profCode: string): Promise<void> {
  (await cookies()).set(PROF_COOKIE, profCode, cookieOptions());
}

/** Odjava: briše oba kolačića (student i profesor) na ovom uređaju; podaci igre ostaju, ponovni ulaz vraća isti hotel. */
export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete({ name: PLAYER_COOKIE, path: "/" });
  jar.delete({ name: PROF_COOKIE, path: "/" });
}

/** Igrač iz kolačića s tvrtkom i igrom; bez kolačića ili s nepoznatim tokenom 401. */
export async function requirePlayer(): Promise<{ player: PlayerRow; company: CompanyRow; world: WorldRow }> {
  const token = (await cookies()).get(PLAYER_COOKIE)?.value;
  if (!token) throw new HttpError(401, "Uđi u igru kodom");
  const rows = await db
    .select({ player: players, company: companies, world: worlds })
    .from(players)
    .innerJoin(companies, eq(players.companyId, companies.id))
    .innerJoin(worlds, eq(companies.worldId, worlds.id))
    .where(eq(players.tokenHash, await hashCode(token)))
    .limit(1);
  if (!rows[0]) throw new HttpError(401, "Uđi u igru kodom");
  return rows[0];
}

export type ProfUser = { id: string; name: string; email: string };

/** Prijavljeni profesor (Better Auth sesija) ili null. */
export async function getProfUser(): Promise<ProfUser | null> {
  // Bez BETTER_AUTH_SECRET nema računa (Better Auth bi u produkciji bacio grešku); igra radi s profesorskim kodom.
  if (!process.env.BETTER_AUTH_SECRET) return null;
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email } = session.user;
  return { id, name, email };
}

/** Prijavljeni profesor ili 401. */
export async function requireProfUser(): Promise<ProfUser> {
  const user = await getProfUser();
  if (!user) throw new HttpError(401, "Prijavi se kao profesor");
  return user;
}

/**
 * Igra samo za njezinog profesora: hash kolačića sp_prof odgovara baš njoj ILI je prijavljeni račun vlasnik (owner_id).
 * Inače 403 (i za worldId koji nije uuid).
 */
export async function requireProf(worldId: string): Promise<WorldRow> {
  if (!isUuid(worldId)) throw new HttpError(403, "Samo profesor ove igre");
  const code = (await cookies()).get(PROF_COOKIE)?.value;
  if (code) {
    const rows = await db
      .select()
      .from(worlds)
      .where(and(eq(worlds.id, worldId), eq(worlds.profCodeHash, await hashCode(normalizeCode(code)))))
      .limit(1);
    if (rows[0]) return rows[0];
  }
  const user = await getProfUser();
  if (user) {
    const rows = await db
      .select()
      .from(worlds)
      .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, user.id)))
      .limit(1);
    if (rows[0]) return rows[0];
  }
  throw new HttpError(403, "Samo profesor ove igre");
}

/** Igra za člana: igrač čija je tvrtka u toj igri ili profesor te igre (kod ili račun vlasnika; javni podaci, npr. karta); inače 401. */
export async function requireWorldMember(worldId: string): Promise<WorldRow> {
  const jar = await cookies();
  const token = jar.get(PLAYER_COOKIE)?.value;
  const code = jar.get(PROF_COOKIE)?.value;
  if (isUuid(worldId) && token) {
    const rows = await db
      .select({ world: worlds })
      .from(players)
      .innerJoin(companies, eq(players.companyId, companies.id))
      .innerJoin(worlds, eq(companies.worldId, worlds.id))
      .where(and(eq(players.tokenHash, await hashCode(token)), eq(worlds.id, worldId)))
      .limit(1);
    if (rows[0]) return rows[0].world;
  }
  if (isUuid(worldId) && code) {
    const rows = await db
      .select()
      .from(worlds)
      .where(and(eq(worlds.id, worldId), eq(worlds.profCodeHash, await hashCode(normalizeCode(code)))))
      .limit(1);
    if (rows[0]) return rows[0];
  }
  if (isUuid(worldId)) {
    const user = await getProfUser(); // L16: vlasnik igre s profesorskim računom
    if (user) {
      const rows = await db
        .select()
        .from(worlds)
        .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, user.id)))
        .limit(1);
      if (rows[0]) return rows[0];
    }
  }
  throw new HttpError(401, "Uđi u igru kodom");
}

/** Tijelo zahtjeva kao JSON objekt; neispravan JSON ili nešto drugo od objekta → 400. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Neispravan zahtjev: tijelo mora biti JSON");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "Neispravan zahtjev: tijelo mora biti JSON objekt");
  }
  return body as Record<string, unknown>;
}

/** Tijelo zahtjeva kao JSON objekt; bez tijela {} (neobavezna polja), a neispravan JSON ili nešto drugo od objekta → 400. */
export async function readOptionalJson(req: Request): Promise<Record<string, unknown>> {
  const raw = (await req.text()).trim();
  if (!raw) return {};
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Neispravan zahtjev: tijelo mora biti JSON");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "Neispravan zahtjev: tijelo mora biti JSON objekt");
  }
  return body as Record<string, unknown>;
}
