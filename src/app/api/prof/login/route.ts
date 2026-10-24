import { loginProf } from "@/lib/game/world";
import { route } from "@/lib/http";
import { readJson, setProfCookie } from "@/lib/session";
import type { ProfLoginRequest, ProfLoginResponse } from "@/lib/types";

export const POST = route(async (req): Promise<ProfLoginResponse> => {
  const { profCode, res } = await loginProf((await readJson(req)) as ProfLoginRequest);
  await setProfCookie(profCode);
  return res;
});
