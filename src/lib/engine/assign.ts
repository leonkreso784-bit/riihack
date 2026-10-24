import type { HotelTemplate } from "@/lib/types";

// Prvi neuzeti hotel redom banke; kad su svi uzeti, onaj s najmanje uporaba (izjednačenje redom banke).
export function assignHotel(bank: HotelTemplate[], takenIds: string[]): HotelTemplate {
  const uses = new Map<string, number>();
  for (const id of takenIds) uses.set(id, (uses.get(id) ?? 0) + 1);
  const free = bank.find((h) => !uses.has(h.id));
  if (free) return free;
  let best = bank[0];
  for (const h of bank) {
    if ((uses.get(h.id) ?? 0) < (uses.get(best.id) ?? 0)) best = h;
  }
  return best;
}
