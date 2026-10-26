"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Flag, Hourglass, MessageSquarePlus, SkipForward, Trophy } from "lucide-react";
import { api } from "@/lib/client";
import { closeMonthConfirm, podiumReplayIsClean } from "@/lib/podium";
import { MISSED_QUALITY, ROUND_LABELS } from "@/lib/rules";
import type { LeaderboardRow, ProfStateResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Panel } from "./panel";
import { Pill } from "./pill";
import { FormError } from "./form";
import { RoundBanner } from "./round-banner";
import { Leaderboard } from "./leaderboard";
import { RoundPodium, SeasonPodium } from "./round-podium";
import { Dots } from "./loading";
import { ExportGradesButton } from "./prof/export-grades-button";

const DEADLINES = [
  { label: "Ručno", minutes: undefined },
  { label: "5 min", minutes: 5 },
  { label: "10 min", minutes: 10 },
  { label: "15 min", minutes: 15 },
];

// R6: the professor's live board for the projector: who still plays this month and the class ranking.
// The city (map, news) is Simon's (S5) and is not part of this board. Students see a new month on their next poll (≤ POLL_MS).
export function ProfBoard({ state, syncedAt, onChange }: { state: ProfStateResponse; syncedAt: number; onChange: () => void }) {
  const { world, players } = state;
  const finished = world.status === "finished";
  const last = world.round >= world.maxRounds;
  // ADR-044: botovi igraju sami pri zatvaranju mjeseca, pa nisu na popisu „još igra"
  const humans = players.filter((p) => !p.isBot);
  const done = humans.filter((p) => p.closedRound >= world.round);
  const playing = humans.filter((p) => p.closedRound < world.round);
  const [anonymous, setAnonymous] = useState(false);
  // R10: the podium shows the month that was just closed (after "Zatvori … i otvori …", "Završi sezonu" or "Pokaži podij").
  const [podium, setPodium] = useState<{ rows: LeaderboardRow[]; month: string } | null>(null);
  const closePodium = useCallback(() => setPodium(null), []);
  const closedMonth = (s: ProfStateResponse) => ROUND_LABELS[s.world.status === "finished" ? s.world.round - 1 : s.world.round - 2];
  const showPodium = (s: ProfStateResponse) => {
    const month = closedMonth(s);
    if (month && s.players.length) setPodium({ rows: s.players, month });
  };
  const toggle = "flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary";

  return (
    // Season end on xl (1920×1080 projector): podium and leaderboard side by side, so the ranking is above the fold.
    <div className={cn("space-y-6", finished && "xl:grid xl:grid-cols-2 xl:items-start xl:gap-6 xl:space-y-0")}>
      {finished ? (
        <div className="xl:sticky xl:top-22">
          <SeasonPodium rows={players} name={world.name} anonymous={anonymous} />
        </div>
      ) : (
        <>
          <RoundBanner world={world} syncedAt={syncedAt} size="xl" />
          <RoundControls worldId={world.id} round={world.round} last={last} playing={playing.length} onChange={onChange} onClosed={showPodium} />
        </>
      )}

      <div className={cn("grid grid-cols-[minmax(0,1fr)] gap-6", !finished && "lg:grid-cols-2")}>
        {!finished && (
          <Panel
            title={`${ROUND_LABELS[world.round - 1]}: zatvorilo ${done.length} od ${humans.length}`}
            action={<Pill tone={playing.length ? "accent" : "up"}>{playing.length ? `${playing.length} još igra` : "svi gotovi"}</Pill>}
          >
            <ul className="flex flex-wrap gap-2">
              {[...playing, ...done].map((p) => {
                const closed = p.closedRound >= world.round;
                return (
                  <li key={p.companyId}>
                    {/* R8: open the student's answers, verdicts and mentor talk */}
                    <Link
                      href={`/profesor/${world.id}/tvrtka/${p.companyId}`}
                      className={cn("flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-primary", closed ? "bg-mint text-up" : "bg-muted")}
                    >
                      {closed ? <CheckCircle2 className="size-4" aria-hidden /> : <Hourglass className="size-4 text-muted-foreground" aria-hidden />}
                      {p.hotelName}
                      <span className="sr-only">{closed ? "zatvorio mjesec" : "još igra"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}
        <Panel>
          {/* Own header instead of Panel title/action: three buttons must wrap under the title on a phone (375 px). */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h2 className="text-[0.95rem] font-bold tracking-tight">Ljestvica po napretku</h2>
            <div className="flex flex-wrap items-center gap-1">
              <button type="button" aria-pressed={anonymous} onClick={() => setAnonymous((a) => !a)} className={cn(toggle, anonymous ? "bg-secondary text-secondary-foreground" : "hover:bg-muted")}>
                Anonimno
              </button>
              {/* #266, 14: once someone has closed the new month the board mixes two months, so no replay of the old podium. */}
              {closedMonth(state) && podiumReplayIsClean(world, players) && (
                <button type="button" onClick={() => showPodium(state)} className={cn(toggle, "text-secondary-foreground hover:bg-muted")}>
                  <Trophy className="size-4" aria-hidden /> Pokaži podij
                </button>
              )}
              <ExportGradesButton worldId={world.id} className={cn(toggle, "text-secondary-foreground hover:bg-muted")} />
            </div>
          </div>
          {/* BUG-022: at season end (and under the month podium) nobody is red: the whole economy can drift down */}
          <Leaderboard rows={players} limit={players.length} anonymous={anonymous} big neutral={finished || !!podium} />
        </Panel>
      </div>

      {podium && <RoundPodium rows={podium.rows} month={podium.month} anonymous={anonymous} onClose={closePodium} />}
    </div>
  );
}

function RoundControls({ worldId, round, last, playing, onChange, onClosed }: { worldId: string; round: number; last: boolean; playing: number; onChange: () => void; onClosed: (s: ProfStateResponse) => void }) {
  const [minutes, setMinutes] = useState<number | undefined>(undefined); // "Ručno": a running deadline locks unanswered situations at 1/5
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<ProfStateResponse>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      onClosed(await action());
      onChange();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Closing a month is final and gives the students still playing the lowest grade on what they left open, so ask first
  // (#266, 13), like "Završi sezonu" does.
  const advance = () => {
    if (confirm(closeMonthConfirm(ROUND_LABELS[round - 1].toLowerCase(), ROUND_LABELS[round].toLowerCase(), playing, MISSED_QUALITY)))
      run(() => api.openRound(worldId, { fromRound: round, ...(minutes ? { deadlineMinutes: minutes } : {}) }));
  };
  const finish = () => {
    if (confirm("Završiti sezonu? Zatvara se mjesec svima i ljestvica postaje konačna.")) run(() => api.finish(worldId));
  };
  const button =
    "flex min-h-14 items-center gap-2 rounded-[var(--radius)] px-6 text-lg font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50";

  return (
    <div className="space-y-3">
      <div className="surface flex flex-wrap items-center gap-4 rounded-[var(--radius)] p-4">
        {!last && (
          <>
            <fieldset className="flex flex-wrap items-center gap-2" disabled={busy}>
              <legend className="sr-only">Rok za sljedeći mjesec</legend>
              <span className="text-sm font-semibold text-muted-foreground">Rok za {ROUND_LABELS[round].toLowerCase()}:</span>
              {DEADLINES.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  aria-pressed={minutes === d.minutes}
                  onClick={() => setMinutes(d.minutes)}
                  className={cn(
                    "min-h-11 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                    minutes === d.minutes ? "bg-secondary text-secondary-foreground ring-2 ring-primary" : "bg-muted hover:bg-secondary",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </fieldset>
            <button
              type="button"
              disabled={busy}
              onClick={advance}
              className={cn(button, "bg-primary text-primary-foreground hover:bg-[#1f5fe0]")}
            >
              <SkipForward className="size-5" aria-hidden />
              {busy ? <><Dots /> Zatvaram mjesec</> : `Zatvori ${ROUND_LABELS[round - 1].toLowerCase()} i otvori ${ROUND_LABELS[round].toLowerCase()}`}
            </button>
          </>
        )}
        {/* Professor's own situations (S8, Simon's page). */}
        <Link
          href={`/profesor/${worldId}/situacije`}
          className={cn(button, "ml-auto bg-muted text-foreground hover:bg-secondary")}
        >
          <MessageSquarePlus className="size-5" aria-hidden /> Situacije
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={finish}
          className={cn(button, last ? "bg-primary text-primary-foreground hover:bg-[#1f5fe0]" : "bg-muted text-foreground hover:bg-secondary")}
        >
          <Flag className="size-5" aria-hidden /> {busy && last ? <><Dots /> Završavam</> : "Završi sezonu"}
        </button>
      </div>
      {error && <FormError key={error}>{error}</FormError>}
    </div>
  );
}
