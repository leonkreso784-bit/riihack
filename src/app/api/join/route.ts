import { joinWorld } from "@/lib/game/join";
import { route } from "@/lib/http";
import { readJson, setPlayerCookie } from "@/lib/session";
import type { JoinRequest, JoinResponse } from "@/lib/types";

export const POST = route(async (req): Promise<JoinResponse> => {
  const { token, res } = await joinWorld((await readJson(req)) as JoinRequest);
  await setPlayerCookie(token);
  return res;
});
