import { createWorld } from "@/lib/game/world";
import { route } from "@/lib/http";
import { readJson, setProfCookie } from "@/lib/session";
import type { CreateWorldRequest, CreateWorldResponse } from "@/lib/types";

// Jedini odgovor u kojem se pojavljuje profesorski kod; dalje ide samo u httpOnly kolačiću.
export const POST = route(async (req): Promise<CreateWorldResponse> => {
  const res = await createWorld((await readJson(req)) as CreateWorldRequest);
  await setProfCookie(res.profCode);
  return res;
});
