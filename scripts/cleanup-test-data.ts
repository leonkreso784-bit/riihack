// Čišćenje testnih podataka iz baze. Pokretanje: npx tsx scripts/cleanup-test-data.ts [--apply]
// Bez --apply je SUHI PROLAZ: samo ispiše što bi obrisao i ništa ne dira.
// S --apply briše sve odabrano u JEDNOM batchu (neon-http batch = jedna transakcija).
// Demo igra (DEMO_JOIN_CODE, zadano KVRNDM) i igre profesora DEMO_PROF_EMAIL (ako je postavljen) su zaštićene:
// ako bi ijedna završila u skupu za brisanje, cijelo pokretanje se prekida.
import { config } from "dotenv";
config({ path: ".env.local" });
import { count, eq, inArray, or, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "../src/db";
import {
  account, answers, companies, contracts, customSituations, dispatches, events, finances, librarySituations, mail,
  plans, players, rooms, roundReports, session, situations, user, worlds,
} from "../src/db/schema";

// ── Uzorci testnih podataka (uredi po potrebi) ──────────────────────────────────────────────
/** Igra je testna ako joj ime POČINJE jednim od ovih (jednako se računa kao početak). Velika/mala slova se razlikuju. */
const TEST_WORLD_NAME_PREFIXES = ["Smoke ", "QA ", "L16 test", "L17 test", "L18 test", "Integrator test"] as const;
/** Račun je testni ako mu e-mail završava ovim (bez obzira na velika/mala slova). */
const TEST_EMAIL_SUFFIXES = ["@example.test"] as const;
/** Račun je testni ako mu e-mail počinje ovim (bez obzira na velika/mala slova). */
const TEST_EMAIL_PREFIXES = ["integrator-test-", "smoke-", "qa-"] as const;
// ─────────────────────────────────────────────────────────────────────────────────────────────

const APPLY = process.argv.includes("--apply");
const DEMO_JOIN_CODE = (process.env.DEMO_JOIN_CODE || "KVRNDM").trim().toUpperCase();
const DEMO_PROF_EMAIL = process.env.DEMO_PROF_EMAIL?.trim().toLowerCase() || null;

export function isTestWorldName(name: string): boolean {
  return TEST_WORLD_NAME_PREFIXES.some((p) => name.startsWith(p));
}

export function isTestEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return TEST_EMAIL_SUFFIXES.some((s) => e.endsWith(s)) || TEST_EMAIL_PREFIXES.some((p) => e.startsWith(p));
}

type WorldInfo = { id: string; name: string; joinCode: string; createdAt: Date; ownerId: string | null };
type Target = { label: string; table: PgTable; where: SQL };

function fail(msg: string): never {
  console.error(`\nPREKID: ${msg}\nNišta nije obrisano.`);
  process.exit(1);
}

/** Retci koji pripadaju odabranim igrama, redom brisanja (djeca prije roditelja, FK bez cascade). */
function worldTargets(worldIds: string[]): Target[] {
  const cIds = db.select({ id: companies.id }).from(companies).where(inArray(companies.worldId, worldIds));
  const sIds = db.select({ id: situations.id }).from(situations).where(inArray(situations.companyId, cIds));
  const kIds = db.select({ id: contracts.id }).from(contracts).where(inArray(contracts.worldId, worldIds));
  return [
    {
      label: "mail",
      table: mail,
      // i pošta iz drugih igara koja bi pokazivala na ove tvrtke/ugovore, da FK ne pukne
      where: or(
        inArray(mail.worldId, worldIds),
        inArray(mail.fromCompanyId, cIds),
        inArray(mail.toCompanyId, cIds),
        inArray(mail.contractId, kIds),
      )!,
    },
    { label: "answers", table: answers, where: inArray(answers.situationId, sIds) },
    { label: "situations", table: situations, where: inArray(situations.companyId, cIds) },
    { label: "round_reports", table: roundReports, where: inArray(roundReports.companyId, cIds) },
    { label: "events", table: events, where: or(inArray(events.worldId, worldIds), inArray(events.companyId, cIds))! },
    {
      label: "contracts",
      table: contracts,
      where: or(inArray(contracts.worldId, worldIds), inArray(contracts.companyId, cIds))!,
    },
    { label: "finances", table: finances, where: inArray(finances.companyId, cIds) },
    { label: "plans", table: plans, where: inArray(plans.companyId, cIds) },
    { label: "rooms", table: rooms, where: inArray(rooms.companyId, cIds) },
    { label: "players", table: players, where: inArray(players.companyId, cIds) },
    { label: "custom_situations", table: customSituations, where: inArray(customSituations.worldId, worldIds) },
    { label: "dispatches", table: dispatches, where: inArray(dispatches.worldId, worldIds) },
    { label: "companies", table: companies, where: inArray(companies.worldId, worldIds) },
    { label: "worlds", table: worlds, where: inArray(worlds.id, worldIds) },
  ];
}

/** Testni računi; session, account i library_situations idu s njima (onDelete: cascade). */
function userTargets(userIds: string[]): Target[] {
  return [
    { label: "library_situations", table: librarySituations, where: inArray(librarySituations.ownerId, userIds) },
    { label: "session", table: session, where: inArray(session.userId, userIds) },
    { label: "account", table: account, where: inArray(account.userId, userIds) },
    { label: "user", table: user, where: inArray(user.id, userIds) },
  ];
}

const ALL_TABLES: { label: string; table: PgTable }[] = [
  { label: "worlds", table: worlds },
  { label: "companies", table: companies },
  { label: "players", table: players },
  { label: "rooms", table: rooms },
  { label: "situations", table: situations },
  { label: "answers", table: answers },
  { label: "round_reports", table: roundReports },
  { label: "events", table: events },
  { label: "plans", table: plans },
  { label: "finances", table: finances },
  { label: "contracts", table: contracts },
  { label: "custom_situations", table: customSituations },
  { label: "dispatches", table: dispatches },
  { label: "mail", table: mail },
  { label: "library_situations", table: librarySituations },
  { label: "user", table: user },
  { label: "session", table: session },
  { label: "account", table: account },
];

async function countWhere(table: PgTable, where?: SQL): Promise<number> {
  const q = db.select({ n: count() }).from(table);
  const [row] = where ? await q.where(where) : await q;
  return Number(row?.n ?? 0);
}

async function tableTotals(): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  for (const t of ALL_TABLES) totals.set(t.label, await countWhere(t.table));
  return totals;
}

async function demoState(): Promise<{ id: string; companies: number } | null> {
  const [w] = await db.select({ id: worlds.id }).from(worlds).where(eq(worlds.joinCode, DEMO_JOIN_CODE));
  if (!w) return null;
  return { id: w.id, companies: await countWhere(companies, eq(companies.worldId, w.id)) };
}

/** Zaštićeni: demo igra i sve igre profesora DEMO_PROF_EMAIL. Vraća id-eve igara i id profesora. */
async function protectedSet(): Promise<{ worldIds: Set<string>; profUserId: string | null }> {
  const ids = new Set<string>();
  const demo = await db.select({ id: worlds.id }).from(worlds).where(eq(worlds.joinCode, DEMO_JOIN_CODE));
  for (const w of demo) ids.add(w.id);
  let profUserId: string | null = null;
  if (DEMO_PROF_EMAIL) {
    const users = await db.select({ id: user.id, email: user.email }).from(user);
    profUserId = users.find((u) => u.email.trim().toLowerCase() === DEMO_PROF_EMAIL)?.id ?? null;
    if (profUserId) {
      const owned = await db.select({ id: worlds.id }).from(worlds).where(eq(worlds.ownerId, profUserId));
      for (const w of owned) ids.add(w.id);
    }
  }
  return { worldIds: ids, profUserId };
}

function assertNothingProtected(
  worldIds: string[],
  userIds: string[],
  prot: { worldIds: Set<string>; profUserId: string | null },
): void {
  const hit = worldIds.filter((id) => prot.worldIds.has(id));
  if (hit.length > 0) fail(`zaštićena igra je u skupu za brisanje (${hit.length}).`);
  if (prot.profUserId && userIds.includes(prot.profUserId)) fail("račun DEMO_PROF_EMAIL je u skupu za brisanje.");
}

function fmtDate(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 16);
}

async function main(): Promise<void> {
  console.log(APPLY ? "Način: BRISANJE (--apply)\n" : "Način: SUHI PROLAZ (ništa se ne briše; za brisanje dodaj --apply)\n");
  console.log(`Zaštićena demo igra: kod ${DEMO_JOIN_CODE}`);
  console.log(DEMO_PROF_EMAIL ? "Zaštićene i igre računa DEMO_PROF_EMAIL." : "DEMO_PROF_EMAIL nije postavljen.");

  const prot = await protectedSet();
  if (DEMO_PROF_EMAIL && !prot.profUserId) console.log("Upozorenje: račun DEMO_PROF_EMAIL ne postoji u bazi.");
  if (prot.profUserId && DEMO_PROF_EMAIL && isTestEmail(DEMO_PROF_EMAIL)) {
    fail("DEMO_PROF_EMAIL odgovara uzorku testnog računa; makni ga iz uzoraka ili promijeni e-mail.");
  }
  const demoBefore = await demoState();
  console.log(demoBefore ? `Demo igra postoji (${demoBefore.companies} hotela).` : "Upozorenje: demo igra ne postoji u bazi.");

  // 1. Testni računi
  const allUsers = await db.select({ id: user.id, email: user.email, createdAt: user.createdAt }).from(user);
  const testUsers = allUsers.filter((u) => isTestEmail(u.email));
  const testUserIds = new Set(testUsers.map((u) => u.id));

  // 2. Testne igre: po imenu ili po vlasniku
  const allWorlds: WorldInfo[] = await db
    .select({ id: worlds.id, name: worlds.name, joinCode: worlds.joinCode, createdAt: worlds.createdAt, ownerId: worlds.ownerId })
    .from(worlds);
  const testWorlds = allWorlds.filter((w) => isTestWorldName(w.name) || (w.ownerId !== null && testUserIds.has(w.ownerId)));
  const worldIds = testWorlds.map((w) => w.id);
  const userIds = testUsers.map((u) => u.id);

  assertNothingProtected(worldIds, userIds, prot);

  // 3. Ispis
  console.log(`\nIgre za brisanje: ${testWorlds.length}`);
  for (const w of [...testWorlds].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    const why = isTestWorldName(w.name) ? "ime" : "vlasnik testni račun";
    console.log(`  - ${w.name}  [${w.joinCode}]  ${fmtDate(w.createdAt)}  (${why})`);
  }
  console.log(`Ostaje igara: ${allWorlds.length - testWorlds.length} (od ${allWorlds.length})`);
  console.log(`\nRačuni za brisanje: ${testUsers.length}`);
  for (const u of testUsers) console.log(`  - ${u.email}  ${fmtDate(u.createdAt)}`);

  const targets = [...(worldIds.length ? worldTargets(worldIds) : []), ...(userIds.length ? userTargets(userIds) : [])];
  console.log("\nRetci po tablici:");
  for (const t of targets) console.log(`  ${t.label.padEnd(20)} ${await countWhere(t.table, t.where)}`);

  if (targets.length === 0) {
    console.log("\nNema testnih podataka. Gotovo.");
    return;
  }
  if (!APPLY) {
    console.log("\nSuhi prolaz: ništa nije obrisano. Za brisanje pokreni s --apply.");
    return;
  }

  // 4. Ponovna provjera zaštite neposredno prije brisanja
  const protNow = await protectedSet();
  assertNothingProtected(worldIds, userIds, protNow);
  const stillOwned = await db.select({ id: worlds.id, ownerId: worlds.ownerId }).from(worlds);
  const orphanOwner = stillOwned.find((w) => w.ownerId && testUserIds.has(w.ownerId) && !worldIds.includes(w.id));
  if (orphanOwner) fail("u međuvremenu je nastala nova igra testnog računa; pokreni ponovno.");

  const before = await tableTotals();
  // session i account brišu se kaskadom s user (onDelete: cascade); library_situations brišemo izričito
  const deletes = targets
    .filter((t) => t.label !== "session" && t.label !== "account")
    .map((t) => db.delete(t.table).where(t.where) as BatchItem<"pg">);
  await db.batch([deletes[0], ...deletes.slice(1)]);
  const after = await tableTotals();

  console.log("\nTablica               prije    poslije");
  for (const t of ALL_TABLES) {
    console.log(`  ${t.label.padEnd(20)} ${String(before.get(t.label)).padStart(6)} ${String(after.get(t.label)).padStart(9)}`);
  }

  const demoAfter = await demoState();
  if (demoBefore && (!demoAfter || demoAfter.id !== demoBefore.id || demoAfter.companies !== demoBefore.companies)) {
    console.error("\nUPOZORENJE: demo igra se promijenila! Provjeri bazu.");
    process.exit(1);
  }
  console.log(demoAfter ? `\nDemo igra netaknuta (${demoAfter.companies} hotela). Gotovo.` : "\nGotovo (demo igre nema).");
}

main().catch((err: unknown) => {
  console.error("Greška:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
