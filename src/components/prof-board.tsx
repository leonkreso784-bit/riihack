"use client";

import { useState } from "react";
import { CheckCircle2, Flag, Hourglass, SkipForward } from "lucide-react";
import { api } from "@/lib/client";
import { ROUND_LABELS } from "@/lib/rules";
import type { ProfStateResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Panel } from "./panel";
import { Pill } from "./pill";
import { FormError } from "./form";
import { RoundBanner } from "./round-banner";
import { Leaderboard } from "./leaderboard";
import { CityMap } from "./city/city-map";
import { NewsFeed } from "./city/news-feed";

const DEADLINES = [
  { label: "Ručno", minutes: undefined },
  { label: "5 min", minutes: 5 },
  { label: "10 min", minutes: 10 },
  { label: "15 min", minutes: 15 },
];

// R6: the professor's live board for the projector. City map is the main part; next to it who still plays this
// month, the class ranking and the city news. Students see a new month on their next poll (≤ POLL_MS).
export function ProfBoard({ state, syncedAt, onChange }: { state: ProfStateResponse; syncedAt: number; onChange: () => void }) {
  const { world, players } = state;
  const finished = world.status === "finished";
  const last = world.round >= world.maxRounds;
  const done = players.filter((p) => p.closedRound >= world.round);
  const playing = players.filter((p) => p.closedRound < world.round);

  return (
    <div className="space-y-6">
      {finished ? (
        <section className="gloss anim-shine rounded-[var(--radius)] px-8 py-6">
          <p className="flex items-center gap-3 text-4xl font-extrabold tracking-tight">
            <Flag className="size-8" aria-hidden /> Sezona je gotova
          </p>
          <p className="mt-1 text-lg opacity-90">{world.name} · ljestvica ispod je konačna</p>
        </section>
      ) : (
        <>
          <RoundBanner world={world} syncedAt={syncedAt} size="xl" />
          <RoundControls worldId={world.id} round={world.round} last={last} onChange={onChange} />
        </>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-3">
        <Panel title="Karta grada" className="min-w-0 xl:col-span-2">
          <CityMap city={state.city} round={world.round} />
        </Panel>

        <div className="space-y-6">
          {!finished && (
            <Panel
              title={`${ROUND_LABELS[world.round - 1]}: zatvorilo ${done.length} od ${players.length}`}
              action={<Pill tone={playing.length ? "accent" : "up"}>{playing.length ? `${playing.length} još igra` : "svi gotovi"}</Pill>}
            >
              <ul className="flex flex-wrap gap-2">
                {[...playing, ...done].map((p) => {
                  const closed = p.closedRound >= world.round;
                  return (
                    <li
                      key={p.companyId}
                      className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", closed ? "bg-mint text-up" : "bg-muted")}
                    >
                      {closed ? <CheckCircle2 className="size-4" aria-hidden /> : <Hourglass className="size-4 text-muted-foreground" aria-hidden />}
                      {p.hotelName}
                      <span className="sr-only">{closed ? "zatvorio mjesec" : "još igra"}</span>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
          <Panel title="Ljestvica" action={<span className="text-sm text-muted-foreground">po napretku</span>}>
            <Leaderboard rows={players} limit={players.length} />
          </Panel>
        </div>
      </div>

      <Panel title="Vijesti iz grada">
        <NewsFeed items={state.news} />
      </Panel>
    </div>
  );
}

function RoundControls({ worldId, round, last, onChange }: { worldId: string; round: number; last: boolean; onChange: () => void }) {
  const [minutes, setMinutes] = useState<number | undefined>(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      onChange();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

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
              onClick={() => run(() => api.openRound(worldId, minutes ? { deadlineMinutes: minutes } : {}))}
              className={cn(button, "bg-primary text-primary-foreground hover:bg-[#1f5fe0]")}
            >
              <SkipForward className="size-5" aria-hidden />
              {busy ? "Zatvaram…" : `Zatvori ${ROUND_LABELS[round - 1].toLowerCase()} i otvori ${ROUND_LABELS[round].toLowerCase()}`}
            </button>
          </>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={finish}
          className={cn(button, last ? "bg-primary text-primary-foreground hover:bg-[#1f5fe0]" : "ml-auto bg-muted text-foreground hover:bg-secondary")}
        >
          <Flag className="size-5" aria-hidden /> {busy && last ? "Završavam…" : "Završi sezonu"}
        </button>
      </div>
      {error && <FormError key={error}>{error}</FormError>}
    </div>
  );
}
