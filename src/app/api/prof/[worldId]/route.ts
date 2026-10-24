import { loadProfState } from "@/lib/game/world";
import { route } from "@/lib/http";
import { requireProf } from "@/lib/session";
import type { ProfStateResponse } from "@/lib/types";

export const GET = route(async (_req, ctx: RouteContext<"/api/prof/[worldId]">): Promise<ProfStateResponse> => {
  const { worldId } = await ctx.params;
  return loadProfState(await requireProf(worldId));
});
