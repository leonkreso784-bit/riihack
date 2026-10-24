import { loadPublicViews } from "@/lib/game/public";
import { route } from "@/lib/http";
import { requireWorldMember } from "@/lib/session";
import type { CompanyPublicView } from "@/lib/types";

// Javni profili svih hotela igre (karta). Igrač iz te igre ili njezin profesor, inače 401.
export const GET = route(
  async (_req, ctx: RouteContext<"/api/world/[worldId]/companies">): Promise<CompanyPublicView[]> => {
    const { worldId } = await ctx.params;
    return loadPublicViews(await requireWorldMember(worldId));
  },
);
