import { markMailRead } from "@/lib/game/mail";
import { route } from "@/lib/http";
import { requirePlayer } from "@/lib/session";

// Označi primljenu poruku pročitanom.
export const POST = route(async (_req, ctx: RouteContext<"/api/me/mail/[id]/read">): Promise<{ ok: true }> => {
  const { id } = await ctx.params;
  const player = await requirePlayer();
  return markMailRead(player.company.id, id);
});
