"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { ROUND_LABELS } from "@/lib/rules";
import type { WorldView } from "@/lib/types";
import { cn } from "@/lib/utils";

// Seconds left = (deadline − serverNow) − time passed on this device since the data arrived; immune to wrong clocks.
function useSecondsLeft(world: WorldView, syncedAt: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  if (!world.roundDeadline || now === null) return null;
  const ms = Date.parse(world.roundDeadline) - Date.parse(world.serverNow) - (now - syncedAt);
  return Math.max(0, Math.ceil(ms / 1000));
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function RoundBanner({ world, syncedAt, size = "md" }: { world: WorldView; syncedAt: number; size?: "md" | "xl" }) {
  const left = useSecondsLeft(world, syncedAt);
  const urgent = left !== null && left <= 120;
  const xl = size === "xl";
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] bg-primary text-primary-foreground shadow-card",
        xl ? "px-8 py-6" : "px-5 py-4",
      )}
    >
      <div className="flex items-center gap-3">
        <CalendarDays className={xl ? "size-8" : "size-5"} aria-hidden />
        <p className={cn("font-extrabold tracking-tight", xl ? "text-4xl" : "text-lg")}>
          Krug {world.round} od {world.maxRounds}
          <span className="font-semibold opacity-80"> · {ROUND_LABELS[world.round - 1]}</span>
        </p>
      </div>
      {left !== null && (
        <p
          role="timer"
          aria-label={`Do kraja kruga ${mmss(left)}`}
          className={cn(
            "flex items-center gap-2 rounded-full font-bold tabular-nums",
            xl ? "px-5 py-2 text-4xl" : "px-3 py-1 text-base",
            urgent ? "bg-sand text-foreground" : "bg-white/15",
          )}
        >
          <Clock className={xl ? "size-8" : "size-4"} aria-hidden />
          {mmss(left)}
        </p>
      )}
    </div>
  );
}
