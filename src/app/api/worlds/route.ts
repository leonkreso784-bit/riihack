import { createWorld } from "@/lib/game/world";
import { route } from "@/lib/http";
import { getProfUser, readJson, setProfCookie } from "@/lib/session";
import type { CreateWorldRequest, CreateWorldResponse } from "@/lib/types";

// Jedini odgovor u kojem se pojavljuje profesorski kod; dalje ide samo u httpOnly kolačiću.
// Prijavljeni profesor (L16) postaje vlasnik igre, pa mu kod ne treba; prijava kodom radi i dalje.
export const POST = route(async (req): Promise<CreateWorldResponse> => {
  const body = (await readJson(req)) as CreateWorldRequest;
  const user = await getProfUser();
  const res = await createWorld(body, user?.id ?? null);
  await setProfCookie(res.profCode);
  return res;
});
