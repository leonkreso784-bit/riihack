import type { RoomType } from "@/lib/types";

const byNumber = (a: { number: string }, b: { number: string }) =>
  a.number.localeCompare(b.number, undefined, { numeric: true });

// Prva soba te vrste po broju; bez te vrste prva po broju; prazno → null.
export function pickRoom(rooms: { number: string; type: RoomType }[], type: RoomType): string | null {
  if (rooms.length === 0) return null;
  const sorted = [...rooms].sort(byNumber);
  return (sorted.find((r) => r.type === type) ?? sorted[0]).number;
}
