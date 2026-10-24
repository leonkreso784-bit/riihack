import { loadProfState, openNextRound } from "@/lib/game/world";
import { HttpError, route } from "@/lib/http";
import { requireProf } from "@/lib/session";
import type { OpenRoundRequest, ProfStateResponse } from "@/lib/types";

// Tijelo je neobavezno (bez roka kruga); prazno tijelo vrijedi kao {}.
async function readOptionalJson(req: Request): Promise<Record<string, unknown>> {
  const raw = (await req.text()).trim();
  if (!raw) return {};
  try {
    const body: unknown = JSON.parse(raw);
    if (typeof body === "object" && body !== null && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // pada na grešku ispod
  }
  throw new HttpError(400, "Neispravan zahtjev: tijelo mora biti JSON objekt");
}

export const POST = route(async (req, ctx: RouteContext<"/api/prof/[worldId]/round">): Promise<ProfStateResponse> => {
  const { worldId } = await ctx.params;
  const world = await requireProf(worldId);
  const body = (await readOptionalJson(req)) as OpenRoundRequest;
  return loadProfState(await openNextRound(world, body));
});
