import { dispatchSituation, parseDispatchRequest } from "@/lib/game/situations";
import { loadProfState } from "@/lib/game/world";
import { route } from "@/lib/http";
import { readJson, requireProf } from "@/lib/session";
import type { ProfStateResponse } from "@/lib/types";

// Profesor šalje situaciju (DispatchRequest): bez companyIds svima, bez round odmah u tekući krug.
export const POST = route(async (req, ctx: RouteContext<"/api/prof/[worldId]/dispatch">): Promise<ProfStateResponse> => {
  const { worldId } = await ctx.params;
  const world = await requireProf(worldId);
  await dispatchSituation(world, parseDispatchRequest(await readJson(req)));
  return loadProfState(world);
});
