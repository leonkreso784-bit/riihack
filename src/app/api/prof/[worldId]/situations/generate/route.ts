import { proposeSituation } from "@/lib/ai";
import { assertProposalAllowed, parseGenerateRequest, recordProposal, situationIdeaInput } from "@/lib/game/idea";
import { route } from "@/lib/http";
import { readJson, requireProf } from "@/lib/session";
import type { SituationDraft } from "@/lib/types";

// AI prijedlog situacije (S9) iz stanja hotela; ništa ne sprema ni ne šalje. Profesor nacrt pregleda i spremi preko
// POST situations sa `source: "ai"`. Bez AI-ja proposeSituation vraća rezervni nacrt. Tuđi student → 404.
// Plaćeni poziv modela: granica po igri i po minuti (idea.ts), preko → 429.
export const POST = route(
  async (req, ctx: RouteContext<"/api/prof/[worldId]/situations/generate">): Promise<SituationDraft> => {
    const { worldId } = await ctx.params;
    const world = await requireProf(worldId);
    const request = parseGenerateRequest(await readJson(req));
    await assertProposalAllowed(world.id);
    const input = await situationIdeaInput(world, request);
    const draft = await proposeSituation(input);
    await recordProposal(world, request.companyId);
    return draft;
  },
);
