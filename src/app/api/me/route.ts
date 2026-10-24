import { loadMe } from "@/lib/game/join";
import { route } from "@/lib/http";
import { requirePlayer } from "@/lib/session";
import type { MeResponse } from "@/lib/types";

// L7: prije čitanja pozvati expireRoundIfDue(world.id).
export const GET = route(async (): Promise<MeResponse> => loadMe(await requirePlayer()));
