import { setAutoDraw } from "@/lib/game/situations";
import { loadProfState } from "@/lib/game/world";
import { HttpError, route } from "@/lib/http";
import { readJson, requireProf } from "@/lib/session";
import type { ProfStateResponse } from "@/lib/types";

// Postavke igre (WorldSettingsRequest): slučajno izvlačenje situacija pri otvaranju kruga.
export const POST = route(async (req, ctx: RouteContext<"/api/prof/[worldId]/settings">): Promise<ProfStateResponse> => {
  const { worldId } = await ctx.params;
  const world = await requireProf(worldId);
  const { autoDraw } = await readJson(req);
  if (typeof autoDraw !== "boolean") throw new HttpError(400, "Slučajno izvlačenje mora biti uključeno ili isključeno");
  return loadProfState(await setAutoDraw(world, autoDraw));
});
