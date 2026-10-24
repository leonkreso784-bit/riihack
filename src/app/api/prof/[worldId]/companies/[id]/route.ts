import { loadCompanyDetail } from "@/lib/game/world";
import { route } from "@/lib/http";
import { requireProf } from "@/lib/session";
import type { CompanyDetailResponse } from "@/lib/types";

// Tuđi profesor → 403 (requireProf), tvrtka iz druge igre ili nepostojeća → 404.
export const GET = route(
  async (_req, ctx: RouteContext<"/api/prof/[worldId]/companies/[id]">): Promise<CompanyDetailResponse> => {
    const { worldId, id } = await ctx.params;
    return loadCompanyDetail(await requireProf(worldId), id);
  },
);
