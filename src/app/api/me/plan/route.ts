import { savePlan } from "@/lib/game/city";
import { route } from "@/lib/http";
import { readJson, requirePlayer } from "@/lib/session";
import type { PlanRequest, RoundPlan } from "@/lib/types";

// Plan kruga (cijena noćenja, marketing i ulaganja po odjelu); savePlan provjeri raspon (400) i je li krug otvoren (409).
export const POST = route(async (req): Promise<RoundPlan> => {
  const ctx = await requirePlayer();
  const body = await readJson(req);
  return savePlan(ctx, {
    price: body.price as number,
    marketing: body.marketing as number,
    investments: body.investments as PlanRequest["investments"],
  });
});
