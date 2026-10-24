import { finishWorld, loadProfState } from "@/lib/game/world";
import { route } from "@/lib/http";
import { requireProf } from "@/lib/session";
import type { ProfStateResponse } from "@/lib/types";

export const POST = route(async (_req, ctx: RouteContext<"/api/prof/[worldId]/finish">): Promise<ProfStateResponse> => {
  const { worldId } = await ctx.params;
  return loadProfState(await finishWorld(await requireProf(worldId)));
});
