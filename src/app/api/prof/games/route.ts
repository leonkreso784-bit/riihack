import { listProfGames } from "@/lib/game/world";
import { route } from "@/lib/http";
import { requireProfUser } from "@/lib/session";
import type { ProfGameSummary } from "@/lib/types";

// Moje igre (L16): samo za prijavljeni profesorski račun, inače 401.
export const GET = route(async (): Promise<ProfGameSummary[]> => {
  const user = await requireProfUser();
  return listProfGames(user.id);
});
