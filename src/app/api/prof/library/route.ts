import { listLibrary, saveToLibrary } from "@/lib/game/library";
import { route } from "@/lib/http";
import { readJson, requireProfUser } from "@/lib/session";
import type { LibraryItem, SituationDraft } from "@/lib/types";

// Knjižnica situacija (L17): samo za prijavljeni profesorski račun, inače 401.
export const GET = route(async (): Promise<LibraryItem[]> => {
  const user = await requireProfUser();
  return listLibrary(user.id);
});

// Nacrt (SituationDraft) u knjižnicu; neobavezno `source: "ai"`. Neispravan nacrt → 400 s porukom iz validateDraft.
export const POST = route(async (req): Promise<LibraryItem> => {
  const user = await requireProfUser();
  const body = await readJson(req);
  return saveToLibrary(user.id, body as unknown as SituationDraft, body.source === "ai" ? "ai" : "custom");
});
