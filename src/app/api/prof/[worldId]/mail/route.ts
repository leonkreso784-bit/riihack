import { loadWorldMail } from "@/lib/game/mail";
import { route } from "@/lib/http";
import { requireProf } from "@/lib/session";
import type { MailMessage } from "@/lib/types";

// Sve poruke među hotelima igre (L18); tuđi profesor → 403.
export const GET = route(async (_req, ctx: RouteContext<"/api/prof/[worldId]/mail">): Promise<MailMessage[]> => {
  const world = await requireProf((await ctx.params).worldId);
  return loadWorldMail(world.id);
});
