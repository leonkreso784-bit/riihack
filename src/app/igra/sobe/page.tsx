"use client";

import { useState } from "react";
import { api, usePoll } from "@/lib/client";
import type { RoomStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { FormError } from "@/components/form";
import { ROOM_STATUS, RoomTile } from "@/components/room-tile";

const FILTERS: (RoomStatus | "all")[] = ["all", "free", "occupied", "cleaning", "broken"];

// R3: rooms grouped by floor, colour + word per status, filter by status.
export default function RoomsPage() {
  const { data: rooms, error } = usePoll(api.rooms);
  const [filter, setFilter] = useState<RoomStatus | "all">("all");
  if (error && !rooms) return <FormError>{error.message}</FormError>;
  if (!rooms) return <p className="pt-6 text-muted-foreground">Učitavam…</p>;

  const count = (s: RoomStatus) => rooms.filter((r) => r.status === s).length;
  const shown = filter === "all" ? rooms : rooms.filter((r) => r.status === filter);
  const floors = [...new Set(shown.map((r) => r.floor))].sort((a, b) => a - b);

  return (
    <div className="space-y-6 pt-4 md:pt-0">
      <PageHeader
        title="Sobe"
        subtitle={`${rooms.length} soba · ${count("occupied")} zauzeto · ${count("free")} slobodno · ${count("broken")} u kvaru`}
      />

      <div role="group" aria-label="Prikaži sobe" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f)}
              className={cn(
                "min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                active ? "gloss border-transparent" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? `Sve (${rooms.length})` : `${ROOM_STATUS[f].label} (${count(f)})`}
            </button>
          );
        })}
      </div>

      {floors.length === 0 && <p className="text-muted-foreground">Nema soba s tim stanjem.</p>}
      {floors.map((floor) => (
        <section key={floor} className="space-y-3">
          <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">{floor}. kat</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
            {shown
              .filter((r) => r.floor === floor)
              .map((r, i) => (
                <li key={r.id} className="anim-rise" style={{ ["--i" as string]: i }}>
                  <RoomTile room={r} />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
