"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BedDouble, Eye, Layers, Wallet } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/panel";
import { FormError } from "@/components/form";
import { ROOM_STATUS, ROOM_TYPE_LABELS, ROOM_VIEW_LABELS } from "@/components/room-tile";

// R3: one room in detail.
export default function RoomDetail() {
  const { broj } = useParams<{ broj: string }>();
  const { data: rooms, error } = usePoll(api.rooms);
  if (error && !rooms) return <FormError>{error.message}</FormError>;
  if (!rooms) return <p className="pt-6 text-muted-foreground">Učitavam…</p>;

  const room = rooms.find((r) => r.number === broj);
  const back = (
    <Link href="/igra/sobe" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-secondary-foreground hover:underline">
      <ArrowLeft className="size-4" aria-hidden /> Sve sobe
    </Link>
  );
  if (!room)
    return (
      <div className="space-y-4 pt-4 md:pt-0">
        {back}
        <p className="text-muted-foreground">Soba {broj} ne postoji u tvom hotelu.</p>
      </div>
    );

  const s = ROOM_STATUS[room.status];
  const StatusIcon = s.icon;
  const facts = [
    { icon: BedDouble, label: "Kreveti", value: `${room.beds}` },
    { icon: Eye, label: "Pogled", value: ROOM_VIEW_LABELS[room.view] },
    { icon: Layers, label: "Kat", value: `${room.floor}.` },
    { icon: Wallet, label: "Cijena", value: `${num(room.basePrice)} € po noći` },
  ];

  return (
    <div className="space-y-5 pt-4 md:pt-0">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{ROOM_TYPE_LABELS[room.type]}</p>
          <h1 className="text-5xl font-extrabold tracking-tight tabular-nums">Soba {room.number}</h1>
        </div>
        <span className={cn("flex items-center gap-2 rounded-full border px-4 py-2 font-bold", s.tile)}>
          <StatusIcon className="size-5" aria-hidden /> {s.label}
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {facts.map(({ icon: Icon, label, value }) => (
          <li key={label} className="surface rounded-[var(--radius)] p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Icon className="size-4" aria-hidden /> {label}
            </p>
            <p className="mt-2 text-xl font-extrabold">{value}</p>
          </li>
        ))}
      </ul>

      {room.note && (
        <Panel title="Bilješka" tone={room.status === "broken" ? "sand" : "plain"}>
          <p>{room.note}</p>
        </Panel>
      )}
    </div>
  );
}
