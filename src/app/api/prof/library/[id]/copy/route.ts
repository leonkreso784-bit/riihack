import { copyToWorld } from "@/lib/game/library";
import { HttpError, route } from "@/lib/http";
import { readJson, requireProf, requireProfUser } from "@/lib/session";
import type { SituationSummary } from "@/lib/types";

// Kopija stavke knjižnice u igru `{ worldId }` (izvor "custom"). Igra mora biti baš ovog računa (403), stavka njegova (404).
export const POST = route(async (req, ctx: RouteContext<"/api/prof/library/[id]/copy">): Promise<SituationSummary> => {
  const { id } = await ctx.params;
  const user = await requireProfUser();
  const { worldId } = await readJson(req);
  if (typeof worldId !== "string" || !worldId) throw new HttpError(400, "Odaberi igru u koju kopiraš");
  const world = await requireProf(worldId);
  if (world.ownerId !== user.id) throw new HttpError(403, "Samo profesor ove igre");
  return copyToWorld(user.id, id, world);
});
