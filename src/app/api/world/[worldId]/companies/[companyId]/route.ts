import { loadPublicViews } from "@/lib/game/public";
import { HttpError, route } from "@/lib/http";
import { requireWorldMember } from "@/lib/session";
import type { CompanyPublicView } from "@/lib/types";

// Javni profil jednog hotela (tuđi hotel); hotel iz druge igre ili nepostojeći → 404.
export const GET = route(
  async (_req, ctx: RouteContext<"/api/world/[worldId]/companies/[companyId]">): Promise<CompanyPublicView> => {
    const { worldId, companyId } = await ctx.params;
    const world = await requireWorldMember(worldId);
    const view = (await loadPublicViews(world)).find((v) => v.companyId === companyId);
    if (!view) throw new HttpError(404, "Nepoznat hotel");
    return view;
  },
);
