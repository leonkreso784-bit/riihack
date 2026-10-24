"use client";

import { useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { Play, Users } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import type { LeaderboardRow, ProfStateResponse } from "@/lib/types";
import { Panel } from "@/components/panel";
import { RoundBanner } from "@/components/round-banner";
import { Leaderboard } from "@/components/leaderboard";
import { FormError } from "@/components/form";

const noop = () => () => {};
const useHost = () => useSyncExternalStore(noop, () => location.host, () => "");

// R2 lobby for the projector (huge join code, students appear live); while the game runs R6 takes over this page.
export default function ProfWorld() {
  const { worldId } = useParams<{ worldId: string }>();
  const { data, error, syncedAt, refresh } = usePoll(() => api.profState(worldId));
  if (error && !data) return <FormError>{error.message}</FormError>;
  if (!data) return <p className="pt-12 text-center text-muted-foreground">Učitavam…</p>;
  return data.world.status === "lobby" ? (
    <Lobby state={data} onStarted={refresh} />
  ) : (
    <Running state={data} syncedAt={syncedAt} />
  );
}

function Lobby({ state, onStarted }: { state: ProfStateResponse; onStarted: () => void }) {
  const host = useHost();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { world, players } = state;

  async function start() {
    setBusy(true);
    setError(null);
    try {
      await api.start(world.id);
      onStarted();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="gloss anim-shine relative overflow-hidden rounded-[var(--radius)] px-6 py-8 text-center md:py-12">
        <p className="text-lg font-semibold opacity-90 md:text-2xl">
          Uđi na <strong className="font-extrabold">{host || "riihack.vercel.app"}/ulaz</strong> i upiši kod
        </p>
        <p
          aria-label={`Kod igre ${world.joinCode.split("").join(" ")}`}
          className="anim-pop mt-3 font-mono text-[clamp(3.5rem,13vw,10rem)] leading-none font-extrabold tracking-[0.12em]"
        >
          {world.joinCode}
        </p>
        <p className="mt-4 text-base opacity-90 md:text-xl">{world.name}</p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-3 text-2xl font-extrabold tabular-nums md:text-4xl" aria-live="polite">
          <Users className="size-7 text-secondary-foreground md:size-9" aria-hidden />
          <span key={players.length} className="anim-pop inline-block">{players.length}</span> / {world.maxPlayers}
          <span className="text-base font-semibold text-muted-foreground md:text-xl">studenata unutra</span>
        </p>
        <button
          type="button"
          onClick={start}
          disabled={busy || players.length === 0}
          className="flex min-h-14 items-center gap-2 rounded-[var(--radius)] bg-primary px-7 text-lg font-bold text-primary-foreground transition-colors hover:bg-[#1f5fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          <Play className="size-5" aria-hidden /> {busy ? "Pokrećem…" : "Pokreni igru"}
        </button>
      </div>
      {error && <FormError>{error}</FormError>}

      {players.length === 0 ? (
        <p className="rounded-[var(--radius)] border-2 border-dashed py-12 text-center text-lg text-muted-foreground">
          Čekamo prve studente…
        </p>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <PlayerCard key={p.companyId} p={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PlayerCard({ p }: { p: LeaderboardRow }) {
  return (
    <li className="surface flex items-center gap-3 rounded-[var(--radius)] p-4 duration-500 animate-in fade-in zoom-in-95 motion-reduce:animate-none">
      <span aria-hidden className="gloss-night grid size-11 shrink-0 place-items-center rounded-xl text-sm font-extrabold">
        {p.hotelName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-lg font-bold">{p.hotelName}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {p.playerName} · {p.place}
        </span>
      </span>
    </li>
  );
}

// ponytail: minimal running view (round + class ranking) until R6 builds the full live board.
function Running({ state, syncedAt }: { state: ProfStateResponse; syncedAt: number }) {
  return (
    <div className="space-y-6">
      <RoundBanner world={state.world} syncedAt={syncedAt} size="xl" />
      <Panel title="Razred" action={<span className="text-sm text-muted-foreground">po napretku</span>}>
        <Leaderboard rows={state.players} limit={state.players.length} />
      </Panel>
    </div>
  );
}
