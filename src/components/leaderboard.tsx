import type { LeaderboardRow } from "@/lib/types";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Delta } from "./metric-bar";

const MEDAL = "text-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7),0_2px_6px_-2px_rgb(21_27_43_/_0.3)]";
const MEDALS = [
  `bg-gradient-to-b from-[#ffe08a] to-[#e9b730] ${MEDAL}`,
  `bg-gradient-to-b from-[#f1f4f9] to-[#c3ccda] ${MEDAL}`,
  `bg-gradient-to-b from-[#f3c39f] to-[#c98552] ${MEDAL}`,
];

// Ranked by progress (not money): top `limit`, plus your own row below if you are further down.
export function Leaderboard({ rows, youId, limit = 5 }: { rows: LeaderboardRow[]; youId?: string; limit?: number }) {
  const ranked = [...rows].sort((a, b) => b.progress - a.progress);
  const youRank = ranked.findIndex((r) => r.companyId === youId);
  const shown = ranked.slice(0, limit);
  return (
    <ol className="divide-y">
      {shown.map((r, i) => (
        <Row key={r.companyId} row={r} rank={i + 1} you={r.companyId === youId} />
      ))}
      {youRank >= limit && (
        <>
          <li aria-hidden className="py-1 text-center text-muted-foreground">⋯</li>
          <Row row={ranked[youRank]} rank={youRank + 1} you />
        </>
      )}
    </ol>
  );
}

function Row({ row, rank, you }: { row: LeaderboardRow; rank: number; you: boolean }) {
  return (
    <li
      style={{ ["--i" as string]: rank }}
      className={cn("anim-rise flex items-center gap-3 py-3", you && "-mx-3 rounded-xl border-0 bg-gradient-to-r from-[#eaf1ff] to-[#f4f8ff] px-3 ring-1 ring-primary/20")}>
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold tabular-nums",
          MEDALS[rank - 1] ?? "bg-muted text-muted-foreground",
        )}
      >
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">
          {row.hotelName}
          {you && <span className="ml-2 text-xs font-bold text-secondary-foreground">ti</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {row.playerName} · {row.place}
        </p>
      </div>
      <div className="text-right">
        <Delta value={row.progress} className="text-sm" />
        <p className="text-xs text-muted-foreground tabular-nums">{num(row.cash)} €</p>
      </div>
    </li>
  );
}
