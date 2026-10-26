import { assertNotDemoGame } from "@/lib/game/demo-guard";
import { removeStudent } from "@/lib/game/erase";
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

// Uklanjanje studenta iz igre (#297): briše njegov hotel i sve podatke. Isti pristup kao GET, a demo igra je zaštićena
// (409, ADR-060); removeStudent dodatno briše samo tvrtku koja je u ovoj igri, pa tuđi id ne radi ništa (404).
export const DELETE = route(
  async (_req, ctx: RouteContext<"/api/prof/[worldId]/companies/[id]">): Promise<{ ok: true }> => {
    const { worldId, id } = await ctx.params;
    const world = await requireProf(worldId);
    await assertNotDemoGame(world);
    await removeStudent(world, id);
    return { ok: true };
  },
);
