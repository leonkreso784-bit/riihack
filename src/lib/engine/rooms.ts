import type { RoomType } from "@/lib/types";

// Brojevi soba su tekst ("6", "10", "101"): tekstualno bi "10" došlo prije "6", pa se broji brojčano.
const byNumber = (a: { number: string }, b: { number: string }) =>
  a.number.localeCompare(b.number, undefined, { numeric: true });

/** Poredak soba u prikazu: kat, pa broj sobe brojčano (kat 2: 6, 7, 8, 9, 10). */
export const compareRooms = (a: { floor: number; number: string }, b: { floor: number; number: string }) =>
  a.floor - b.floor || byNumber(a, b);

// Prva soba te vrste po broju; bez te vrste prva po broju; prazno → null.
export function pickRoom(rooms: { number: string; type: RoomType }[], type: RoomType): string | null {
  if (rooms.length === 0) return null;
  const sorted = [...rooms].sort(byNumber);
  return (sorted.find((r) => r.type === type) ?? sorted[0]).number;
}
