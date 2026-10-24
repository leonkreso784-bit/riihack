import { decideContract } from "@/lib/game/city";
import { HttpError, route } from "@/lib/http";
import { readJson, requirePlayer } from "@/lib/session";
import type { ContractView } from "@/lib/types";

// Prihvati ili odbij ponudu ugovora tekućeg kruga.
export const POST = route(async (req, ctx: RouteContext<"/api/contracts/[id]/decide">): Promise<ContractView> => {
  const { id } = await ctx.params;
  const player = await requirePlayer();
  const body = await readJson(req);
  if (typeof body.accept !== "boolean") throw new HttpError(400, "Odaberi prihvaćaš li ponudu ili je odbijaš");
  return decideContract(player, id, body.accept);
});
