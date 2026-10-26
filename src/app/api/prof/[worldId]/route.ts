import { assertNotDemoGame } from "@/lib/game/demo-guard";
import { deleteGame } from "@/lib/game/erase";
import { matchesDeleteConfirmation } from "@/lib/game/erase-plan";
import { expireRoundIfDue, loadProfState } from "@/lib/game/world";
import { HttpError, route } from "@/lib/http";
import { readJson, requireProf } from "@/lib/session";
import type { ProfStateResponse } from "@/lib/types";

export const GET = route(async (_req, ctx: RouteContext<"/api/prof/[worldId]">): Promise<ProfStateResponse> => {
  const { worldId } = await ctx.params;
  let world = await requireProf(worldId);
  // Prvo istek roka kruga (zatvori krug svima), pa svježe stanje.
  if (await expireRoundIfDue(world.id, world)) world = await requireProf(worldId);
  return loadProfState(world);
});

// Brisanje igre i svih podataka studenata (#297). Samo profesor igre (requireProf, prije svega ostalog), demo igra se
// ne briše (409, ADR-060), a tijelo { confirm } mora biti naziv ili kod igre: bez toga zahtjev (npr. s tuđe stranice) ne može obrisati igru.
export const DELETE = route(async (req, ctx: RouteContext<"/api/prof/[worldId]">): Promise<{ ok: true }> => {
  const { worldId } = await ctx.params;
  const world = await requireProf(worldId);
  await assertNotDemoGame(world);
  const { confirm } = await readJson(req);
  if (!matchesDeleteConfirmation(world, confirm)) throw new HttpError(400, "Upiši naziv ili kod igre da potvrdiš brisanje");
  await deleteGame(world);
  return { ok: true };
});
