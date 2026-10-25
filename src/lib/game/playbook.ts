// Playbook (L12): profesor izveze svoje situacije i postavke igre u datoteku i uveze ih u novu igru. Mehaniku motora
// ne mijenja: uvezene situacije prolaze istu provjeru kao ručno spremljene (validateDraft), a motor i dalje računa brojke.
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customSituations, events, worlds } from "@/db/schema";
import type { CustomSituationRow, WorldRow } from "@/db/schema";
import { customSituationId, toTemplate, validateDraft } from "@/lib/engine/draft";
import { hasSituationTitle } from "@/lib/game/library";
import { loadProfState } from "@/lib/game/world";
import { HttpError } from "@/lib/http";
import type { Playbook, ProfStateResponse, SituationDraft } from "@/lib/types";

export const MAX_PLAYBOOK_SITUATIONS = 30;

// ---------- Čiste funkcije (testovi u playbook.test.ts) ----------

/** Redak profesorove situacije kao nacrt: predložak bez id-a. */
export function rowToDraft(row: Pick<CustomSituationRow, "template">): SituationDraft {
  const { id: _id, ...draft } = row.template;
  void _id;
  return draft;
}

/** Playbook iz imena igre, postavki i redaka (redom stvaranja). */
export function buildPlaybook(name: string, autoDraw: boolean, rows: Pick<CustomSituationRow, "template">[]): Playbook {
  return { version: 1, name, settings: { autoDraw }, situations: rows.map(rowToDraft) };
}

/**
 * Provjera nepouzdanog tijela: oblik playbooka pa svaka situacija kroz validateDraft ("Situacija N: poruka", N od 1).
 * Neispravno → HttpError 400.
 */
export function parsePlaybook(body: Record<string, unknown>): Playbook {
  if (body.version !== 1) throw new HttpError(400, "Nepoznata inačica playbooka (očekujem version 1)");
  if (typeof body.name !== "string") throw new HttpError(400, "Playbook treba ime (tekst)");
  const settings = body.settings as Record<string, unknown> | null | undefined;
  if (typeof settings !== "object" || settings === null || typeof settings.autoDraw !== "boolean") {
    throw new HttpError(400, "Postavke playbooka trebaju autoDraw (uključeno ili isključeno)");
  }
  const situations = body.situations;
  if (!Array.isArray(situations) || situations.length > MAX_PLAYBOOK_SITUATIONS) {
    throw new HttpError(400, `Playbook smije imati od 0 do ${MAX_PLAYBOOK_SITUATIONS} situacija`);
  }
  situations.forEach((s, i) => {
    const error = validateDraft(s as SituationDraft);
    if (error) throw new HttpError(400, `Situacija ${i + 1}: ${error}`);
  });
  return { version: 1, name: body.name, settings: { autoDraw: settings.autoDraw }, situations: situations as SituationDraft[] };
}

/** Situacije kojih naslov još nije u igri (ni ranije u istom playbooku); ostale se preskaču da ponovni uvoz ne udvostruči popis. */
export function splitNewDrafts(existingTitles: string[], drafts: SituationDraft[]): { fresh: SituationDraft[]; skipped: number } {
  const titles = [...existingTitles];
  const fresh: SituationDraft[] = [];
  for (const d of drafts) {
    if (hasSituationTitle(titles, d.title)) continue;
    titles.push(d.title);
    fresh.push(d);
  }
  return { fresh, skipped: drafts.length - fresh.length };
}

// ---------- Baza ----------

/** GET /api/prof/[worldId]/playbook: profesorove situacije igre (redom stvaranja) i postavke. */
export async function exportPlaybook(world: WorldRow): Promise<Playbook> {
  const rows = await db
    .select()
    .from(customSituations)
    .where(eq(customSituations.worldId, world.id))
    .orderBy(asc(customSituations.createdAt));
  return buildPlaybook(world.name, world.autoDraw, rows);
}

/**
 * POST /api/prof/[worldId]/playbook: tek kad su sve situacije ispravne, jedan db.batch upiše sve kao profesorove,
 * postavi autoDraw i događaj playbook.imported. Situacije s naslovom koji već postoji u igri preskaču se (broj ide u događaj). Studentima se ništa ne šalje.
 */
export async function importPlaybook(world: WorldRow, body: Record<string, unknown>): Promise<ProfStateResponse> {
  const playbook = parsePlaybook(body);
  const existing = await db.select({ template: customSituations.template }).from(customSituations).where(eq(customSituations.worldId, world.id));
  const { fresh, skipped } = splitNewDrafts(existing.map((e) => e.template.title), playbook.situations);
  const now = Date.now(); // isti upit bi svima dao isti now(): razmak od 1 ms čuva redoslijed stvaranja pri izvozu
  const rows = fresh.map((d, i) => {
    const id = customSituationId("custom");
    return { id, worldId: world.id, source: "custom", template: toTemplate(id, d), createdAt: new Date(now + i) };
  });
  const event = db.insert(events).values({
    worldId: world.id,
    round: world.round,
    type: "playbook.imported",
    payload: { count: rows.length, skipped, name: playbook.name },
  });
  const setDraw = db.update(worlds).set({ autoDraw: playbook.settings.autoDraw }).where(eq(worlds.id, world.id)).returning();
  const [updated] =
    rows.length > 0
      ? (await db.batch([db.insert(customSituations).values(rows), setDraw, event]))[1]
      : (await db.batch([setDraw, event]))[0];
  return loadProfState(updated ?? { ...world, autoDraw: playbook.settings.autoDraw });
}
