import { exportGrades } from "@/lib/game/grades";
import { gradesContentDisposition } from "@/lib/game/grades-csv";
import { expireRoundIfDue } from "@/lib/game/world";
import { route } from "@/lib/http";
import { requireProf } from "@/lib/session";

// Izvoz ocjena (CSV, #298): jedan redak po studentu, po situaciji ocjena, vrsta odgovora i mjesec. Samo profesor ove
// igre (kod ili račun vlasnika, requireProf), inače 403. Podaci studenata se ne smiju čuvati u međuspremniku.
export const GET = route(async (_req, ctx: RouteContext<"/api/prof/[worldId]/grades">): Promise<Response> => {
  const { worldId } = await ctx.params;
  let world = await requireProf(worldId);
  // Isto kao GET /api/prof/[worldId]: prvo istek roka kruga, pa svježe stanje (inače bi neodgovoreni bili „u tijeku").
  if (await expireRoundIfDue(world.id, world)) world = await requireProf(worldId);
  const { filename, csv } = await exportGrades(world);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": gradesContentDisposition(filename),
      "Cache-Control": "private, no-store",
    },
  });
});
