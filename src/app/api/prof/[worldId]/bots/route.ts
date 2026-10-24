// ADR-044: profesor dodaje, popunjava i uklanja botove (računalne hotele) u čekaonici.
import { addBot, fillBots, removeBot } from "@/lib/game/bots";
import { loadProfState } from "@/lib/game/world";
import { HttpError, route } from "@/lib/http";
import { readJson, requireProf } from "@/lib/session";
import type { ProfStateResponse } from "@/lib/types";

export const POST = route(async (req, ctx: RouteContext<"/api/prof/[worldId]/bots">): Promise<ProfStateResponse> => {
  const { worldId } = await ctx.params;
  const world = await requireProf(worldId);
  const body = await readJson(req);
  if (body.action === "add") await addBot(world);
  else if (body.action === "fill") await fillBots(world);
  else if (body.action === "remove") {
    if (typeof body.companyId !== "string") throw new HttpError(400, "Nedostaje hotel za uklanjanje");
    await removeBot(world, body.companyId);
  } else throw new HttpError(400, "Nepoznata radnja");
  return loadProfState(world);
});

