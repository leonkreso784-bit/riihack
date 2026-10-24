import { overrideQuality, parseQualityOverride } from "@/lib/game/override";
import { route } from "@/lib/http";
import { readJson, requireProf } from "@/lib/session";
import type { AnswerView } from "@/lib/types";

// Profesor mijenja ocjenu mentora (QualityOverrideRequest). Tuđi profesor 403, kvaliteta izvan 1–5 400,
// situacija druge igre 404, bez odgovora 409.
export const POST = route(
  async (req, ctx: RouteContext<"/api/prof/[worldId]/answers/[situationId]/quality">): Promise<AnswerView> => {
    const { worldId, situationId } = await ctx.params;
    const world = await requireProf(worldId);
    const quality = parseQualityOverride(await readJson(req));
    return overrideQuality(world, situationId, quality);
  },
);
