import { closeMyRound } from "@/lib/game/round";
import { route } from "@/lib/http";
import { requirePlayer } from "@/lib/session";
import type { RoundReportView } from "@/lib/types";

// Brojke kruga odmah; pitanje mentora stiže iz GET /api/me/report/[round] (S4).
export const POST = route(async (): Promise<RoundReportView> => closeMyRound(await requirePlayer()));
