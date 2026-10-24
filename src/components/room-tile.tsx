import Link from "next/link";
import { BedDouble, Brush, CircleCheck, Wrench, type LucideIcon } from "lucide-react";
import type { Room, RoomStatus, RoomType, RoomView } from "@/lib/types";
import { cn } from "@/lib/utils";

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  single: "Jednokrevetna",
  double: "Dvokrevetna",
  suite: "Apartman",
  family: "Obiteljska",
};

export const ROOM_VIEW_LABELS: Record<RoomView, string> = { more: "more", park: "park", ulica: "ulica" };

// Status colour + icon + word (never colour alone).
export const ROOM_STATUS: Record<RoomStatus, { label: string; tile: string; icon: LucideIcon }> = {
  free: { label: "Slobodna", tile: "bg-mint text-up border-[#bfe4df]", icon: CircleCheck },
  occupied: { label: "Zauzeta", tile: "bg-secondary text-secondary-foreground border-[#cfdfff]", icon: BedDouble },
  cleaning: { label: "Čišćenje", tile: "bg-sand text-foreground border-[#ead9bd]", icon: Brush },
  broken: { label: "U kvaru", tile: "bg-down-soft text-down border-[#f6caca]", icon: Wrench },
};

export function RoomTile({ room }: { room: Room }) {
  const s = ROOM_STATUS[room.status];
  const Icon = s.icon;
  return (
    <Link
      href={`/igra/sobe/${room.number}`}
      className={cn(
        "lift flex min-h-28 flex-col justify-between rounded-2xl border p-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        s.tile,
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-2xl font-extrabold tracking-tight tabular-nums">{room.number}</span>
        <Icon className={cn("size-5 shrink-0", room.status === "broken" && "anim-wiggle")} aria-hidden />
      </span>
      <span>
        <span className="block text-xs font-semibold text-foreground/80">{ROOM_TYPE_LABELS[room.type]}</span>
        <span className="block text-sm font-bold">{s.label}</span>
      </span>
    </Link>
  );
}
