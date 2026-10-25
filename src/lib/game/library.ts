// Knjižnica situacija (L17): profesorove situacije na računu, ne u igri. Spremaju se kroz validateDraft, a u igru
// se kopiraju kao obična profesorova situacija (createCustomSituation). Brojke i dalje računa samo motor.
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customSituations, librarySituations } from "@/db/schema";
import type { LibrarySituationRow, WorldRow } from "@/db/schema";
import { toTemplate, validateDraft } from "@/lib/engine/draft";
import { rowToDraft } from "@/lib/game/playbook";
import { createCustomSituation } from "@/lib/game/situations";
import { HttpError } from "@/lib/http";
import type { LibraryItem, SituationDraft, SituationSource, SituationSummary, SituationTemplate } from "@/lib/types";

// ---------- Čiste funkcije (testovi u library.test.ts) ----------

/** Id stavke knjižnice: "lib-" + 12 heksadecimalnih znakova. */
export function libraryItemId(random: string = crypto.randomUUID()): string {
  return `lib-${random.replaceAll("-", "").slice(0, 12)}`;
}

/** Izvor u knjižnici: "ai" ostaje, sve ostalo je "custom" ("bank" je samo sadržaj iz repoa). */
export function librarySource(source: string): "custom" | "ai" {
  return source === "ai" ? "ai" : "custom";
}

/** Provjeren nacrt (400 s porukom iz validateDraft) kao redak za upis. */
export function prepareLibraryEntry(
  draft: SituationDraft,
  source: string,
  random?: string,
): { id: string; source: "custom" | "ai"; template: SituationTemplate } {
  const error = validateDraft(draft);
  if (error) throw new HttpError(400, error);
  const id = libraryItemId(random);
  return { id, source: librarySource(source), template: toTemplate(id, draft) };
}

/** Naslov već postoji među situacijama igre (bez razlike u velikim/malim slovima i razmacima). Nema izvornog id-a, pa se uspoređuje naslov. */
export function hasSituationTitle(existingTitles: string[], title: string): boolean {
  const norm = (t: string) => t.trim().replace(/\s+/g, " ").toLowerCase();
  const wanted = norm(title);
  return existingTitles.some((t) => norm(t) === wanted);
}

/** Redak knjižnice kao LibraryItem; id uvijek iz retka. */
export function toLibraryItem(row: Pick<LibrarySituationRow, "id" | "source" | "template" | "createdAt">): LibraryItem {
  const t = row.template;
  return {
    id: row.id,
    title: t.title,
    area: t.area,
    difficulty: t.difficulty,
    source: librarySource(row.source),
    createdAt: row.createdAt.toISOString(),
  };
}

// ---------- Baza ----------

/** POST /api/prof/library: nacrt u knjižnicu prijavljenog profesora. */
export async function saveToLibrary(ownerId: string, draft: SituationDraft, source: SituationSource = "custom"): Promise<LibraryItem> {
  const entry = prepareLibraryEntry(draft, source);
  const [row] = await db
    .insert(librarySituations)
    .values({ id: entry.id, ownerId, source: entry.source, template: entry.template })
    .returning();
  return toLibraryItem(row);
}

/** GET /api/prof/library: profesorova knjižnica, najnovije prvo. */
export async function listLibrary(ownerId: string): Promise<LibraryItem[]> {
  const rows = await db
    .select()
    .from(librarySituations)
    .where(eq(librarySituations.ownerId, ownerId))
    .orderBy(desc(librarySituations.createdAt));
  return rows.map(toLibraryItem);
}

/** POST /api/prof/library/[id]/copy: kopija u igru kao "custom"; tuđa ili nepoznata stavka → 404. */
export async function copyToWorld(ownerId: string, itemId: string, world: WorldRow): Promise<SituationSummary> {
  const [row] = await db
    .select()
    .from(librarySituations)
    .where(and(eq(librarySituations.id, itemId), eq(librarySituations.ownerId, ownerId)))
    .limit(1);
  if (!row) throw new HttpError(404, "Te situacije nema u tvojoj knjižnici");
  const draft = rowToDraft(row);
  const existing = await db.select({ template: customSituations.template }).from(customSituations).where(eq(customSituations.worldId, world.id));
  if (hasSituationTitle(existing.map((e) => e.template.title), draft.title)) {
    throw new HttpError(409, "Ta situacija je već u igri");
  }
  return createCustomSituation(world, draft, "custom");
}

/** POST /api/prof/[worldId]/situations/[templateId]/save: profesorova situacija igre u knjižnicu (izvor ostaje). */
export async function saveFromWorld(ownerId: string, world: WorldRow, templateId: string): Promise<LibraryItem> {
  const [row] = templateId.startsWith("custom-")
    ? await db
        .select()
        .from(customSituations)
        .where(and(eq(customSituations.id, templateId), eq(customSituations.worldId, world.id)))
        .limit(1)
    : [];
  if (!row) throw new HttpError(404, "U ovoj igri nema te tvoje situacije");
  return saveToLibrary(ownerId, rowToDraft(row), librarySource(row.source));
}
