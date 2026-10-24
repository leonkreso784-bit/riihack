import { counterOffer } from "@/lib/game/city";
import { route } from "@/lib/http";
import { readJson, requirePlayer } from "@/lib/session";
import type { CounterOfferRequest, NegotiationResult } from "@/lib/types";

// Protuponuda na ponudu ugovora tekućeg kruga (jednom po ponudi); motor odlučuje, agencija odgovara e-mailom.
export const POST = route(async (req, ctx: RouteContext<"/api/contracts/[id]/counter">): Promise<NegotiationResult> => {
  const { id } = await ctx.params;
  const player = await requirePlayer();
  const body = await readJson(req);
  const counter = {
    pricePerNight: body.pricePerNight,
    monthlyCost: body.monthlyCost,
    message: body.message,
  } as CounterOfferRequest; // oblik i raspon provjerava counterError (400)
  return counterOffer(player, id, counter);
});
