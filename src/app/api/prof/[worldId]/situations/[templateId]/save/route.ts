import { saveFromWorld } from "@/lib/game/library";
import { route } from "@/lib/http";
import { requireProf, requireProfUser } from "@/lib/session";
import type { LibraryItem } from "@/lib/types";

// Profesorova situacija iz igre (custom ili ai) u knjižnicu prijavljenog računa. Banka ili tuđa situacija → 404.
export const POST = route(
  async (_req, ctx: RouteContext<"/api/prof/[worldId]/situations/[templateId]/save">): Promise<LibraryItem> => {
    const { worldId, templateId } = await ctx.params;
    const user = await requireProfUser();
    const world = await requireProf(worldId);
    return saveFromWorld(user.id, world, templateId);
  },
);
