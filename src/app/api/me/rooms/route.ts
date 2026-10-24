import { loadRooms } from "@/lib/game/join";
import { route } from "@/lib/http";
import { requirePlayer } from "@/lib/session";
import type { Room } from "@/lib/types";

export const GET = route(async (): Promise<Room[]> => loadRooms(await requirePlayer()));
