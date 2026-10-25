import type { LeaderboardRow } from "@/lib/types";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Delta } from "./metric-bar";

const MEDAL = "text-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7),0_2px_6px_-2px_rgb(21_27_43_/_0.3)]";
export const MEDALS = [
  `bg-gradient-to-b from-[#ffe08a] to-[#e9b730] ${MEDAL}`,
  `bg-gradient-to-b from-[#f1f4f9] to-[#c3ccda] ${MEDAL}`,
  `bg-gradient-to-b from-[#f3c39f] to-[#c98552] ${MEDAL}`,
];

// Ranked by progress (not money): top `limit`, plus your own row below if you are further down.
// anonymous (R10, projector): only hotel names, no student names.
// Money only where the server sends it: the student sees only their own, the professor everyone's (ADR-040).
export function Leaderboard({ rows, youId, limit = 5, anonymous = false }: { rows: LeaderboardRow[]; youId?: string; limit?: number; anonymous?: boolean }) {
  const ranked = [...rows].sort((a, b) => b.progress - a.progress);
  const youRank = ranked.findIndex((r) => r.companyId === youId);
  const shown = ranked.slice(0, limit);
  return (
    <ol className="divide-y">
      {shown.map((r, i) => (
        <Row key={r.companyId} row={r} rank={i + 1} you={r.companyId === youId} anonymous={anonymous} />
      ))}
      {youRank >= limit && (
        <>
          <li aria-hidden className="py-1 text-center text-muted-foreground">⋯</li>
          <Row row={ranked[youRank]} rank={youRank + 1} you anonymous={anonymous} />
        </>
      )}
    </ol>
  );
}

function Row({ row, rank, you, anonymous }: { row: LeaderboardRow; rank: number; you: boolean; anonymous: boolean }) {
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
          {row.isBot && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 align-middle text-xs font-bold text-muted-foreground">bot</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {anonymous ? row.place : `${row.playerName} · ${row.place}`}
        </p>
      </div>
      <div className="text-right">
        <Delta value={row.progress} className="text-sm" />
        {row.cash !== undefined && <p className="text-xs text-muted-foreground tabular-nums">{num(row.cash)} €</p>}
      </div>
    </li>
  );
}
