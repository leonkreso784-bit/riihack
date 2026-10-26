// Zaštita demo igre od brisanja (#297, ADR-060). Isto pravilo kao scripts/cleanup-test-data.ts (protectedSet):
// zaštićena je igra s kodom DEMO_JOIN_CODE (zadano KVRNDM) i svaka igra računa DEMO_PROF_EMAIL (ako je postavljen).
// Varijable se čitaju pri svakom pozivu, ne pri učitavanju modula, da test može promijeniti okolinu.
// DEMO_PROF_EMAIL treba postaviti i na poslužitelju (Vercel), inače je zaštićena samo igra s demo kodom.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { HttpError } from "@/lib/http";

/** Poruka uz 409. Vrijedi i za brisanje igre i za uklanjanje studenta iz nje. */
export const DEMO_GAME_PROTECTED_MESSAGE = "Demo igra je zaštićena od brisanja.";

type Env = Record<string, string | undefined>;
type WorldKey = { joinCode: string; ownerId: string | null };

/** Kod demo igre, kao u skripti: prazno ili nepostavljeno znači KVRNDM. */
export function demoJoinCode(env: Env = process.env): string {
  return (env.DEMO_JOIN_CODE || "KVRNDM").trim().toUpperCase();
}

/** E-pošta demo profesora (mala slova) ili null ako nije postavljena. */
export function demoProfEmail(env: Env = process.env): string | null {
  return env.DEMO_PROF_EMAIL?.trim().toLowerCase() || null;
}

/**
 * Čista provjera: je li igra demo. `ownerEmail` je e-pošta vlasnika igre (null ako igra nema vlasnika ili se ne zna).
 * Kod igre odlučuje sam; vlasnik tek ako je DEMO_PROF_EMAIL postavljen i jednak.
 */
export function isDemoGame(world: WorldKey, ownerEmail: string | null, env: Env = process.env): boolean {
  if (world.joinCode.trim().toUpperCase() === demoJoinCode(env)) return true;
  const demoEmail = demoProfEmail(env);
  return demoEmail !== null && ownerEmail !== null && ownerEmail.trim().toLowerCase() === demoEmail;
}

async function ownerEmailOf(ownerId: string): Promise<string | null> {
  const [row] = await db.select({ email: user.email }).from(user).where(eq(user.id, ownerId)).limit(1);
  return row?.email ?? null;
}

/** Je li igra zaštićena. Bazu pita samo kad kod igre ne odlučuje, a DEMO_PROF_EMAIL je postavljen i igra ima vlasnika. */
export async function isProtectedDemoGame(
  world: WorldKey,
  lookupOwnerEmail: (ownerId: string) => Promise<string | null> = ownerEmailOf,
  env: Env = process.env,
): Promise<boolean> {
  if (isDemoGame(world, null, env)) return true;
  if (!world.ownerId || demoProfEmail(env) === null) return false;
  return isDemoGame(world, await lookupOwnerEmail(world.ownerId), env);
}

/**
 * 409 ako je igra demo. Zovi tek nakon requireProf (tuđa igra mora ostati 403, ne smije otkriti je li demo) i prije svakog brisanja.
 * Ako provjera vlasnika padne (baza), rezultat je 500 i ništa se ne briše.
 */
export async function assertNotDemoGame(world: WorldKey): Promise<void> {
  if (await isProtectedDemoGame(world)) throw new HttpError(409, DEMO_GAME_PROTECTED_MESSAGE);
}
