import { expireRoundIfDue, loadProfState } from "@/lib/game/world";
import { route } from "@/lib/http";
import { requireProf } from "@/lib/session";
import type { ProfStateResponse } from "@/lib/types";

export const GET = route(async (_req, ctx: RouteContext<"/api/prof/[worldId]">): Promise<ProfStateResponse> => {
  const { worldId } = await ctx.params;
  let world = await requireProf(worldId);
  // Prvo istek roka kruga (zatvori krug svima), pa svježe stanje.
  if (await expireRoundIfDue(world.id, world)) world = await requireProf(worldId);
  return loadProfState(world);
});
