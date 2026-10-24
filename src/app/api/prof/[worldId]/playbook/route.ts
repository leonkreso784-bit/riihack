import { exportPlaybook, importPlaybook } from "@/lib/game/playbook";
import { route } from "@/lib/http";
import { readJson, requireProf } from "@/lib/session";
import type { Playbook, ProfStateResponse } from "@/lib/types";

// Playbook: izvoz profesorovih situacija i postavki igre (GET) i uvoz u ovu igru (POST).
export const GET = route(async (_req, ctx: RouteContext<"/api/prof/[worldId]/playbook">): Promise<Playbook> => {
  const { worldId } = await ctx.params;
  return exportPlaybook(await requireProf(worldId));
});

export const POST = route(async (req, ctx: RouteContext<"/api/prof/[worldId]/playbook">): Promise<ProfStateResponse> => {
  const { worldId } = await ctx.params;
  const world = await requireProf(worldId);
  return importPlaybook(world, await readJson(req));
});
