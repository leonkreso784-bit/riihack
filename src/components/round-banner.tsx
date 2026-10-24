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

// Faint city silhouette in the banner (decoration only).
function Skyline() {
  return (
    <svg aria-hidden viewBox="0 0 400 80" preserveAspectRatio="xMaxYMax meet" className="pointer-events-none absolute right-0 bottom-0 h-full w-auto opacity-[0.13]">
      <path
        fill="#fff"
        d="M170 80V52h18V38h14v14h10V24h22v56zm70 0V44h16V30h20v50zm44 0V18h24v62zm32 0V40h18v40zm24 0V28h22v52zm30 0V48h30v32z"
      />
    </svg>
  );
}

const mmss =(s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function RoundBanner({ world, syncedAt, size = "md" }: { world: WorldView; syncedAt: number; size?: "md" | "xl" }) {
  const left = useSecondsLeft(world, syncedAt);
  const urgent = left !== null && left <= 120;
  const xl = size === "xl";
  return (
    <div
      className={cn(
        "gloss anim-shine relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-[var(--radius)]",
        xl ? "px-8 py-6" : "px-5 py-4",
      )}
    >
      <Skyline />
      <div className="relative flex items-center gap-3">
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
            "relative flex items-center gap-2 rounded-full font-bold tabular-nums shadow-[inset_0_1px_0_rgb(255_255_255_/_0.2)]",
            xl ? "px-5 py-2 text-4xl" : "px-3 py-1 text-base",
            urgent ? "animate-pulse bg-sand text-foreground motion-reduce:animate-none" : "bg-black/20",
          )}
        >
          <Clock className={xl ? "size-8" : "size-4"} aria-hidden />
          {mmss(left)}
        </p>
      )}
    </div>
  );
}
