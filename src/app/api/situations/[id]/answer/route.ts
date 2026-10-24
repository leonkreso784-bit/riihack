import { submitAnswer } from "@/lib/game/answer";
import { route } from "@/lib/http";
import { readJson, requirePlayer } from "@/lib/session";
import type { AnswerRequest, AnswerView } from "@/lib/types";

export const POST = route(async (req, ctx: RouteContext<"/api/situations/[id]/answer">): Promise<AnswerView> => {
  const { id } = await ctx.params;
  const player = await requirePlayer();
  return submitAnswer(player, id, (await readJson(req)) as AnswerRequest);
});
