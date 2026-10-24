import { expireRoundIfDue, loadMeState } from "@/lib/game/world";
import { route } from "@/lib/http";
import { requirePlayer } from "@/lib/session";
import type { MeResponse } from "@/lib/types";

// Prvo istek roka kruga (zatvori krug svima), pa svježe stanje.
export const GET = route(async (): Promise<MeResponse> => {
  let ctx = await requirePlayer();
  if (await expireRoundIfDue(ctx.world.id, ctx.world)) ctx = await requirePlayer();
  return loadMeState(ctx);
});
