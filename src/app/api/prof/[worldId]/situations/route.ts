import { createCustomSituation } from "@/lib/game/situations";
import { route } from "@/lib/http";
import { readJson, requireProf } from "@/lib/session";
import type { SituationDraft, SituationSummary } from "@/lib/types";

// Profesor sprema svoju situaciju (CreateSituationRequest = SituationDraft). Neobavezno `source: "ai"` kad sprema
// AI prijedlog (S9) koji je pregledao; sve ostalo je "custom". Neispravan nacrt → 400 s porukom iz validateDraft.
export const POST = route(async (req, ctx: RouteContext<"/api/prof/[worldId]/situations">): Promise<SituationSummary> => {
  const { worldId } = await ctx.params;
  const world = await requireProf(worldId);
  const body = await readJson(req);
  return createCustomSituation(world, body as unknown as SituationDraft, body.source === "ai" ? "ai" : "custom");
});
