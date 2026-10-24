// Student ulazi kodom igre, imenom i imenom hotela; dobije hotel iz banke ili, pri ponovnom ulazu, svoj stari.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, players, rooms } from "@/db/schema";
import { getWorldByJoinCode, listCompanies, listRooms, logEvent } from "@/db/queries";
import { HOTELS, getHotel } from "@/content";
import { assignHotel } from "@/lib/engine/assign";
import { hashCode, normalizeCode } from "@/lib/engine/codes";
import { validateJoin } from "@/lib/engine/validate";
import { HttpError } from "@/lib/http";
import type { JoinRequest, JoinResponse, Room } from "@/lib/types";
import type { requirePlayer } from "@/lib/session";
import { toRoom } from "./views";

type PlayerCtx = Awaited<ReturnType<typeof requirePlayer>>;

// 32 slučajna bajta kao hex (64 znaka); u bazi je samo hash.
function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Ponovni ulaz: ista imena bez obzira na velika slova i razmake na rubovima.
const sameName = (a: string, b: string) => a.trim().toLocaleLowerCase("hr") === b.trim().toLocaleLowerCase("hr");

export async function joinWorld(req: JoinRequest): Promise<{ token: string; res: JoinResponse }> {
  if (typeof req.joinCode !== "string") throw new HttpError(400, "Upiši kod igre");
  const joinCode = normalizeCode(req.joinCode);
  const world = joinCode ? await getWorldByJoinCode(joinCode) : null;
  if (!world) throw new HttpError(404, "Nepoznat kod igre");
  const invalid = validateJoin(req);
  if (invalid) throw new HttpError(400, invalid);
  const name = req.name.trim();
  const hotelName = req.hotelName.trim();

  const token = randomToken();
  const tokenHash = await hashCode(token);
  const all = await listCompanies(world.id);

  // Izgubljen kolačić (osvježavanje, drugi preglednik): isti hotel i novi token, i kad je igra krenula ili puna.
  // ADR-044: botovi se ne mogu preuzeti upisom njihovih imena
  const back = all.find((c) => c.company.kind !== "bot" && sameName(c.company.name, hotelName) && sameName(c.player.displayName, name));
  if (back) {
    await db.update(players).set({ tokenHash }).where(eq(players.id, back.player.id));
    const hotel = getHotel(back.company.templateId);
    return { token, res: { companyId: back.company.id, hotelName: back.company.name, place: hotel.place, stars: hotel.stars } };
  }

  if (world.status !== "lobby") throw new HttpError(409, "Igra je već počela");
  if (all.length >= world.maxPlayers) throw new HttpError(409, "Igra je puna");

  const hotel = assignHotel(HOTELS, all.map((c) => c.company.templateId));
  const companyId = crypto.randomUUID();
  // neon-http nema db.transaction(); batch je jedna transakcija, pa nema tvrtke bez soba ili igrača.
  await db.batch([
    db.insert(companies).values({
      id: companyId,
      worldId: world.id,
      name: hotelName,
      templateId: hotel.id,
      startMetrics: hotel.startMetrics,
      metrics: hotel.startMetrics,
      cash: hotel.startCash,
      startCash: hotel.startCash,
      joinIndex: all.length + 1,
    }),
    db.insert(rooms).values(
      hotel.rooms.map((r) => ({
        companyId,
        number: r.number,
        floor: r.floor,
        type: r.type,
        beds: r.beds,
        view: r.view,
        basePrice: r.basePrice,
        status: r.status,
        note: r.note ?? null,
      })),
    ),
    db.insert(players).values({ companyId, displayName: name, tokenHash }),
  ]);
  await logEvent({
    worldId: world.id,
    companyId,
    round: world.round,
    type: "player.joined",
    payload: { name, hotelName, templateId: hotel.id, place: hotel.place },
  });
  return { token, res: { companyId, hotelName, place: hotel.place, stars: hotel.stars } };
}

export async function loadRooms(ctx: PlayerCtx): Promise<Room[]> {
  return (await listRooms(ctx.company.id)).map(toRoom);
}
