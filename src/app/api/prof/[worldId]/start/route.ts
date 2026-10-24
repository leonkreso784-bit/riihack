import { loadProfState, startWorld } from "@/lib/game/world";
import { route } from "@/lib/http";
import { requireProf } from "@/lib/session";
import type { ProfStateResponse } from "@/lib/types";

export const POST = route(async (_req, ctx: RouteContext<"/api/prof/[worldId]/start">): Promise<ProfStateResponse> => {
  const { worldId } = await ctx.params;
  const world = await requireProf(worldId);
  return loadProfState(await startWorld(world.id));
});
