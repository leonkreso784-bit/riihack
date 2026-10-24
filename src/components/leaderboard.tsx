import type { LeaderboardRow } from "@/lib/types";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Delta } from "./metric-bar";

const MEDALS = ["bg-[#f5c542] text-foreground", "bg-[#cfd6e1] text-foreground", "bg-[#e0a57a] text-foreground"];

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
    <li className={cn("flex items-center gap-3 py-3", you && "-mx-3 rounded-xl border-0 bg-secondary px-3")}>
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
