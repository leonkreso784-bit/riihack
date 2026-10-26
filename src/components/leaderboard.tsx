import type { LeaderboardRow } from "@/lib/types";
import { num } from "@/lib/format";
import { BLOCKADE_RANK_RULE } from "@/lib/hints";
import { isInsolvent, rankByProgress } from "@/lib/ranking";
import { cn } from "@/lib/utils";
import { Delta } from "./metric-bar";

const MEDAL = "text-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7),0_2px_6px_-2px_rgb(21_27_43_/_0.3)]";
export const MEDALS = [
  `bg-gradient-to-b from-[#ffe08a] to-[#e9b730] ${MEDAL}`,
  `bg-gradient-to-b from-[#f1f4f9] to-[#c3ccda] ${MEDAL}`,
  `bg-gradient-to-b from-[#f3c39f] to-[#c98552] ${MEDAL}`,
];

// Ranked by progress (not money), but a hotel with a negative account never stands above a solvent one (ADR-059, ranking.ts):
// top `limit`, plus your own row below if you are further down.
// anonymous (R10, projector): only hotel names, no student names.
// Money only where the server sends it: the student sees only their own, the professor everyone's (ADR-040).
// big (projector): larger text on xl only. neutral (season end, BUG-022): progress without green/red.
type Look = { anonymous: boolean; big: boolean; neutral: boolean };
export function Leaderboard({
  rows,
  youId,
  limit = 5,
  anonymous = false,
  big = false,
  neutral = false,
}: { rows: LeaderboardRow[]; youId?: string; limit?: number } & Partial<Look>) {
  const ranked = rankByProgress(rows);
  const youRank = ranked.findIndex((r) => r.companyId === youId);
  const shown = ranked.slice(0, limit);
  const look = { anonymous, big, neutral };
  return (
    <ol className="divide-y">
      {shown.map((r, i) => (
        <Row key={r.companyId} row={r} rank={i + 1} you={r.companyId === youId} {...look} />
      ))}
      {youRank >= limit && (
        <>
          <li aria-hidden className="py-1 text-center text-muted-foreground">⋯</li>
          <Row row={ranked[youRank]} rank={youRank + 1} you {...look} />
        </>
      )}
    </ol>
  );
}

function Row({ row, rank, you, anonymous, big, neutral }: { row: LeaderboardRow; rank: number; you: boolean } & Look) {
  return (
    <li
      style={{ ["--i" as string]: rank }}
      className={cn("anim-rise flex items-center gap-3 py-3", big && "xl:gap-4 xl:py-2", you && "-mx-3 rounded-xl border-0 bg-gradient-to-r from-[#eaf1ff] to-[#f4f8ff] px-3 ring-1 ring-primary/20")}>
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold tabular-nums",
          big && "xl:size-10 xl:text-base",
          MEDALS[rank - 1] ?? "bg-muted text-muted-foreground",
        )}
      >
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        {/* Only the name truncates; the pills stay visible next to it, also for a long name at 375 px. */}
        <div className={cn("flex min-w-0 items-center gap-2 font-bold", big && "xl:text-xl")}>
          <span className="truncate">{row.hotelName}</span>
          {you && <span className="shrink-0 text-xs font-bold text-secondary-foreground">ti</span>}
          {row.isBot && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">bot</span>}
          {isInsolvent(row) && (
            <span title={BLOCKADE_RANK_RULE} className="shrink-0 rounded-full bg-down-soft px-2 py-0.5 text-xs font-bold text-down">
              u blokadi
            </span>
          )}
        </div>
        <p className={cn("truncate text-xs text-muted-foreground", big && "xl:text-sm")}>
          {anonymous ? row.place : `${row.playerName} · ${row.place}`}
        </p>
      </div>
      <div className="text-right">
        <Delta value={row.progress} neutral={neutral} className={cn("text-sm", big && "xl:text-lg")} />
        {row.cash !== undefined && <p className={cn("text-xs text-muted-foreground tabular-nums", big && "xl:text-sm")}>{num(row.cash)} €</p>}
      </div>
    </li>
  );
}
