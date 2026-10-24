"use client";

import { useEffect } from "react";
import { Trophy, X } from "lucide-react";
import type { LeaderboardRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Delta } from "./metric-bar";
import { MEDALS } from "./leaderboard";

const SHOW_MS = 5000;
// Visual order on the podium: 2nd, 1st, 3rd.
const SLOTS = [
  { rank: 2, height: "h-32 md:h-44" },
  { rank: 1, height: "h-44 md:h-60" },
  { rank: 3, height: "h-24 md:h-32" },
];

export const podiumTop = (rows: LeaderboardRow[]) => [...rows].sort((a, b) => b.roundGain - a.roundGain).slice(0, 3);

// R10: "Skok mjeseca" for the projector: top 3 by roundGain, full screen for 5 s, then back to the board.
export function RoundPodium({ rows, month, anonymous, onClose }: { rows: LeaderboardRow[]; month: string; anonymous: boolean; onClose: () => void }) {
  const top = podiumTop(rows);

  useEffect(() => {
    const timer = setTimeout(onClose, SHOW_MS);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Skok mjeseca: ${month}`} className="gloss fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 p-6 text-white md:gap-12">
      <button
        type="button"
        onClick={onClose}
        autoFocus
        className="absolute top-4 right-4 flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
      >
        <X className="size-5" aria-hidden /> Nastavi
      </button>

      <div className="anim-pop text-center">
        <p className="flex items-center justify-center gap-3 text-4xl font-extrabold tracking-tight md:text-6xl">
          <Trophy className="size-9 md:size-14" aria-hidden /> Skok mjeseca
        </p>
        <p className="mt-2 text-xl opacity-90 md:text-2xl">{month}: tko je najviše napredovao</p>
      </div>

      <ol className="flex w-full max-w-4xl items-end justify-center gap-3 md:gap-6">
        {SLOTS.map(({ rank, height }) => {
          const r = top[rank - 1];
          if (!r) return null;
          return (
            <li key={r.companyId} className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center" style={{ ["--i" as string]: 4 - rank }}>
              <div className="anim-rise min-w-0 max-w-full">
                <p className="line-clamp-2 text-lg font-extrabold break-words md:text-3xl">{r.hotelName}</p>
                {!anonymous && <p className="truncate text-sm opacity-80 md:text-lg">{r.playerName}</p>}
                <Delta value={r.roundGain} className="mt-1 inline-block rounded-full bg-white px-3 py-0.5 text-base md:text-2xl" />
              </div>
              <div className={cn("anim-rise flex w-full items-start justify-center rounded-t-2xl bg-white/15 pt-4 ring-1 ring-white/25", height)}>
                <span className={cn("grid size-12 place-items-center rounded-full text-2xl font-extrabold md:size-16 md:text-3xl", MEDALS[rank - 1])}>{rank}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
