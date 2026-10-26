// Brisanje podataka (#297, GDPR): cijela igra ili jedan student. Trajno je, bez koša i bez poništavanja.
// Plan (tablice i redoslijed) je u erase-plan.ts; ovdje se plan pretvara u naredbe i izvršava u jednom db.batch,
// što je na neon-http jedna transakcija: ili nestane sve ili ništa.
import { and, eq, inArray, or, sql, type SQL, type SQLWrapper } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/db";
import {
  answers,
  companies,
  contracts,
  customSituations,
  dispatches,
  events,
  finances,
  mail,
  plans,
  players,
  rooms,
  roundReports,
  situations,
  worlds,
} from "@/db/schema";
import type { WorldRow } from "@/db/schema";
import { isUuid } from "@/db/queries";
import { HttpError } from "@/lib/http";
import { erasurePlan, type EraseScope, type EraseStep } from "./erase-plan";

type Db = typeof db;

type Ctx = {
  db: Db;
  scope: EraseScope;
  worldId: string;
  companyId: string;
  /** Podupiti: tvrtke, njihove situacije i njihovi ugovori (iz igre ili samo jedan student). Vrijede dok roditelji još postoje. */
  cIds: SQLWrapper;
  sIds: SQLWrapper;
  kIds: SQLWrapper;
};

/** Uvjet "pripada igri" vrijedi samo pri brisanju cijele igre; pri uklanjanju studenta ostaje samo ono što upire na njegovu tvrtku. */
function orWorld(ctx: Ctx, worldColumn: PgColumn, ...byCompany: SQL[]): SQL {
  const clauses = ctx.scope === "game" ? [eq(worldColumn, ctx.worldId), ...byCompany] : byCompany;
  return or(...clauses)!;
}

/** Tvrtke koje se brišu: sve iz igre ili samo jedna (i tada samo ako je u toj igri). */
const companyScope = (scope: EraseScope, worldId: string, companyId: string): SQL =>
  scope === "game" ? eq(companies.worldId, worldId) : and(eq(companies.id, companyId), eq(companies.worldId, worldId))!;

function build(step: EraseStep, ctx: Ctx): BatchItem<"pg">[] {
  const { db: d, worldId, companyId, cIds, sIds, kIds } = ctx;
  switch (step.table) {
    case "mail":
      // i pošta drugih hotela koja pokazuje na ove tvrtke ili njihove ugovore, da strani ključ ne pukne
      return [
        d.delete(mail).where(
          orWorld(
            ctx,
            mail.worldId,
            inArray(mail.fromCompanyId, cIds),
            inArray(mail.toCompanyId, cIds),
            inArray(mail.contractId, kIds),
          ),
        ),
      ];
    case "answers":
      return [d.delete(answers).where(inArray(answers.situationId, sIds))];
    case "situations":
      return [d.delete(situations).where(inArray(situations.companyId, cIds))];
    case "round_reports":
      return [d.delete(roundReports).where(inArray(roundReports.companyId, cIds))];
    case "events":
      if (step.action === "delete") return [d.delete(events).where(orWorld(ctx, events.worldId, inArray(events.companyId, cIds)))];
      // Student: vijest o najpopunjenijem hotelu pamti njegovo ime u payloadu; ime i id se brišu, ostatak vijesti ostaje.
      return [
        d
          .update(events)
          .set({ payload: sql`${events.payload} || '{"topCompanyId": null, "topHotelName": null}'::jsonb` })
          .where(and(eq(events.worldId, worldId), sql`${events.payload} ->> 'topCompanyId' = ${companyId}`)),
      ];
    case "contracts":
      return [d.delete(contracts).where(orWorld(ctx, contracts.worldId, inArray(contracts.companyId, cIds)))];
    case "finances":
      return [d.delete(finances).where(inArray(finances.companyId, cIds))];
    case "plans":
      return [d.delete(plans).where(inArray(plans.companyId, cIds))];
    case "rooms":
      return [d.delete(rooms).where(inArray(rooms.companyId, cIds))];
    case "players":
      return [d.delete(players).where(inArray(players.companyId, cIds))];
    case "custom_situations":
      return [d.delete(customSituations).where(eq(customSituations.worldId, worldId))];
    case "dispatches":
      if (step.action === "delete") return [d.delete(dispatches).where(eq(dispatches.worldId, worldId))];
      // Student: izbaci njegov id iz ciljanih slanja ove igre, pa obriši slanja koja su time ostala bez ijednog cilja.
      return [
        d
          .update(dispatches)
          .set({
            companyIds: sql`coalesce((select jsonb_agg(e.value) from jsonb_array_elements(${dispatches.companyIds}) as e where e.value #>> '{}' <> ${companyId}), '[]'::jsonb)`,
          })
          .where(and(eq(dispatches.worldId, worldId), sql`${dispatches.companyIds} @> jsonb_build_array(${companyId}::text)`)),
        d.delete(dispatches).where(and(eq(dispatches.worldId, worldId), sql`${dispatches.companyIds} = '[]'::jsonb`)),
      ];
    case "companies":
      return [
        d
          .delete(companies)
          .where(companyScope(ctx.scope, worldId, companyId)),
      ];
    case "worlds":
      return [d.delete(worlds).where(eq(worlds.id, worldId))];
  }
}

/**
 * Naredbe za brisanje redom plana. Uvijek su ograničene na igru `worldId`: student se briše samo ako pripada toj igri,
 * pa ni pogrešan `companyId` iz druge igre ne može ništa obrisati. `client` je zadan za testiranje na drugoj bazi.
 */
export function eraseStatements(scopeName: EraseScope, worldId: string, companyId = "", client: Db = db): BatchItem<"pg">[] {
  const cIds = client.select({ id: companies.id }).from(companies).where(companyScope(scopeName, worldId, companyId));
  const ctx: Ctx = {
    db: client,
    scope: scopeName,
    worldId,
    companyId,
    cIds,
    sIds: client.select({ id: situations.id }).from(situations).where(inArray(situations.companyId, cIds)),
    kIds: client.select({ id: contracts.id }).from(contracts).where(inArray(contracts.companyId, cIds)),
  };
  return erasurePlan(scopeName).flatMap((step) => build(step, ctx));
}

function runBatch(items: BatchItem<"pg">[]) {
  return db.batch([items[0], ...items.slice(1)]); // db.batch traži nepraznu n-torku
}

/** Obriši igru sa svim studentima i njihovim podacima. Pozivatelj je već provjerio da je korisnik profesor te igre (requireProf). */
export async function deleteGame(world: WorldRow): Promise<void> {
  await runBatch(eraseStatements("game", world.id));
}

/** Ukloni jednog studenta (njegov hotel i sve što na njega upire). 404 ako tvrtka nije u toj igri; vrijedi i za bota. */
export async function removeStudent(world: WorldRow, companyId: string): Promise<void> {
  if (!isUuid(companyId)) throw new HttpError(404, "Ta tvrtka nije u ovoj igri");
  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.worldId, world.id)))
    .limit(1);
  if (!company) throw new HttpError(404, "Ta tvrtka nije u ovoj igri");
  await runBatch(eraseStatements("student", world.id, companyId));
}
