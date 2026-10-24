import type { HotelTemplate, SituationTemplate } from "@/lib/types";
import hotelsJson from "./hotels.json";
import situationsJson from "./situations.json";

export const HOTELS = hotelsJson as HotelTemplate[];
export const SITUATIONS = situationsJson as SituationTemplate[];

export function getHotel(id: string): HotelTemplate {
  const hotel = HOTELS.find((h) => h.id === id);
  if (!hotel) throw new Error(`Hotel ne postoji: ${id}`);
  return hotel;
}

export function getSituation(id: string): SituationTemplate {
  const situation = SITUATIONS.find((s) => s.id === id);
  if (!situation) throw new Error(`Situacija ne postoji: ${id}`);
  return situation;
}
