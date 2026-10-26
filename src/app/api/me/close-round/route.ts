import { closeMyRound, parseCloseRound } from "@/lib/game/round";
import { route } from "@/lib/http";
import { readOptionalJson, requirePlayer } from "@/lib/session";
import type { CloseRoundRequest, RoundReportView } from "@/lib/types";

// Brojke kruga odmah; pitanje mentora stiže iz GET /api/me/report/[round] (S4).
// Tijelo je neobavezno: `round` = mjesec koji student ima na ekranu; ako više nije tekući, 409 (zastarjeli klik).
export const POST = route(async (req): Promise<RoundReportView> => {
  const ctx = await requirePlayer();
  const body = (await readOptionalJson(req)) as CloseRoundRequest;
  return closeMyRound(ctx, parseCloseRound(body.round));
});
