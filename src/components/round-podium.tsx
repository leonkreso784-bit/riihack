"use client";

import { useEffect } from "react";
import { Trophy, X } from "lucide-react";
import type { LeaderboardRow } from "@/lib/types";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Delta } from "./metric-bar";
import { MEDALS } from "./leaderboard";

const SHOW_MS = 5000;
// Visual order on the podium: 2nd, 1st, 3rd.
const SLOTS = [
  { rank: 2, height: "h-32 md:h-44", low: "h-20 md:h-28" },
  { rank: 1, height: "h-44 md:h-60", low: "h-28 md:h-40" },
  { rank: 3, height: "h-24 md:h-32", low: "h-16 md:h-20" },
];

type By = "roundGain" | "progress";
export const podiumTop = (rows: LeaderboardRow[], by: By = "roundGain") => [...rows].sort((a, b) => b[by] - a[by]).slice(0, 3);

// R10: "Skok mjeseca" for the projector: top 3 by roundGain, full screen for 5 s, then back to the board.
export function RoundPodium({ rows, month, anonymous, onClose }: { rows: LeaderboardRow[]; month: string; anonymous: boolean; onClose: () => void }) {
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
      <Podium rows={rows} by="roundGain" anonymous={anonymous} title="Skok mjeseca" subtitle={`${month}: tko je najviše napredovao`} />
    </div>
  );
}

// BUG-022: the season's final podium stays on the board (the last thing the jury sees), ranked by total progress.
// The whole economy can drift down, so the score is shown plainly, not as a red "loss" next to the winner.
// Compact: on a 1920×1080 projector it sits next to the leaderboard (prof-board, xl).
export function SeasonPodium({ rows, name, anonymous }: { rows: LeaderboardRow[]; name: string; anonymous: boolean }) {
  return (
    <section aria-label="Pobjednici sezone" className="gloss anim-shine relative overflow-hidden rounded-[var(--radius)] px-4 py-6 text-white md:px-8 md:py-8">
      <Podium rows={rows} by="progress" anonymous={anonymous} title="Sezona je gotova" subtitle={`${name} · pobjednici po napretku`} compact />
    </section>
  );
}

function Podium({ rows, by, anonymous, title, subtitle, compact = false }: { rows: LeaderboardRow[]; by: By; anonymous: boolean; title: string; subtitle: string; compact?: boolean }) {
  const top = podiumTop(rows, by);
  return (
    <div className={cn("flex w-full flex-col items-center", compact ? "gap-5 md:gap-7" : "gap-8 md:gap-12")}>
      <div className="anim-pop text-center">
        <p className={cn("flex items-center justify-center gap-3 font-extrabold tracking-tight", compact ? "text-3xl md:text-5xl" : "text-4xl md:text-6xl")}>
          <Trophy className={compact ? "size-8 md:size-11" : "size-9 md:size-14"} aria-hidden /> {title}
        </p>
        <p className={cn("mt-2 opacity-90", compact ? "text-lg md:text-xl" : "text-xl md:text-2xl")}>{subtitle}</p>
      </div>

      <ol className="flex w-full max-w-4xl items-end justify-center gap-3 md:gap-6">
        {SLOTS.map(({ rank, height, low }) => {
          const r = top[rank - 1];
          if (!r) return null;
          return (
            <li key={r.companyId} className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center" style={{ ["--i" as string]: 4 - rank }}>
              <div className="anim-rise min-w-0 max-w-full">
                <p className={cn("line-clamp-2 text-lg font-extrabold break-words", compact ? "md:text-2xl" : "md:text-3xl")}>{r.hotelName}</p>
                {!anonymous && <p className="truncate text-sm opacity-80 md:text-lg">{r.playerName}</p>}
                {by === "roundGain" ? (
                  <Delta value={r.roundGain} neutral className="mt-1 inline-block rounded-full bg-white px-3 py-0.5 text-base md:text-2xl" />
                ) : (
                  <span className={cn("mt-1 inline-block rounded-full bg-white px-3 py-0.5 text-base font-bold whitespace-nowrap text-foreground tabular-nums", compact ? "md:text-xl" : "md:text-2xl")}>
                    napredak{" "}
                    {r.progress > 0 ? "+" : r.progress < 0 ? "−" : ""}
                    {num(Math.abs(r.progress))}
                  </span>
                )}
              </div>
              <div className={cn("anim-rise flex w-full items-start justify-center rounded-t-2xl bg-white/15 pt-4 ring-1 ring-white/25", compact ? low : height)}>
                <span className={cn("grid size-12 place-items-center rounded-full text-2xl font-extrabold md:size-16 md:text-3xl", MEDALS[rank - 1])}>{rank}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
