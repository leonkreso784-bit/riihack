import { savePlan } from "@/lib/game/city";
import { route } from "@/lib/http";
import { readJson, requirePlayer } from "@/lib/session";
import type { RoundPlan } from "@/lib/types";

// Plan kruga (cijena noćenja i marketing); savePlan provjeri raspon (400) i je li krug otvoren (409).
export const POST = route(async (req): Promise<RoundPlan> => {
  const ctx = await requirePlayer();
  const body = await readJson(req);
  return savePlan(ctx, { price: body.price as number, marketing: body.marketing as number });
});
