"use client";

import { useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { Bot, Play, Users, X } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import type { BotsRequest, LeaderboardRow, ProfStateResponse } from "@/lib/types";
import { ProfBoard } from "@/components/prof-board";
import { QrCode } from "@/components/qr-code";
import { FormError } from "@/components/form";

const noop = () => () => {};
const useHost = () => useSyncExternalStore(noop, () => location.host, () => "");

// R2 lobby for the projector (huge join code, students appear live); while the game runs (and after it ends) the live board (R6).
export default function ProfWorld() {
  const { worldId } = useParams<{ worldId: string }>();
  const { data, error, syncedAt, refresh } = usePoll(() => api.profState(worldId));
  if (error && !data) return <FormError>{error.message}</FormError>;
  if (!data) return <p className="pt-12 text-center text-muted-foreground">Učitavam…</p>;
  return data.world.status === "lobby" ? (
    <Lobby state={data} onStarted={refresh} />
  ) : (
    <ProfBoard state={data} syncedAt={syncedAt} onChange={refresh} />
  );
}

function Lobby({ state, onStarted }: { state: ProfStateResponse; onStarted: () => void }) {
  const host = useHost();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { world, players } = state;
  const students = players.filter((p) => !p.isBot).length;
  const botCount = players.length - students;
  const full = players.length >= world.maxPlayers;
  const [level, setLevel] = useState<NonNullable<BotsRequest["difficulty"]>>("srednje");

  // ADR-044: botovi (računalni hoteli) u čekaonici
  async function bots(req: BotsRequest) {
    setBusy(true);
    setError(null);
    try {
      await api.bots(world.id, req);
      onStarted();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

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
      <section className="gloss anim-shine relative flex flex-col items-center gap-6 overflow-hidden rounded-[var(--radius)] px-6 py-8 md:flex-row md:justify-center md:gap-12 md:py-12">
        {host && (
          <QrCode
            text={`${location.protocol}//${host}/ulaz?kod=${world.joinCode}`}
            label={`QR kod za ulaz u igru ${world.joinCode}`}
            className="anim-pop size-44 shrink-0 rounded-2xl p-2 shadow-lg md:size-64"
          />
        )}
        <div className="text-center">
          <p className="text-lg font-semibold opacity-90 md:text-2xl">
            Skeniraj QR ili uđi na <strong className="font-extrabold">{host || "riihack.vercel.app"}/ulaz</strong> i upiši kod
          </p>
          <p
            aria-label={`Kod igre ${world.joinCode.split("").join(" ")}`}
            className="anim-pop mt-3 font-mono text-[clamp(3.5rem,11vw,9rem)] leading-none font-extrabold tracking-[0.12em]"
          >
            {world.joinCode}
          </p>
          <p className="mt-4 text-base opacity-90 md:text-xl">{world.name}</p>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-3 text-2xl font-extrabold tabular-nums md:text-4xl" aria-live="polite">
          <Users className="size-7 text-secondary-foreground md:size-9" aria-hidden />
          <span key={players.length} className="anim-pop inline-block">{players.length}</span> / {world.maxPlayers}
          <span className="text-base font-semibold text-muted-foreground md:text-xl">
            {students} {students === 1 ? "student" : "studenata"}, {botCount} {botCount === 1 ? "bot" : "botova"}
          </span>
        </p>
        <button
          type="button"
          onClick={start}
          disabled={busy || students === 0}
          className="flex min-h-14 items-center gap-2 rounded-[var(--radius)] bg-primary px-7 text-lg font-bold text-primary-foreground transition-colors hover:bg-[#1f5fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          <Play className="size-5" aria-hidden /> {busy ? "Pokrećem…" : "Pokreni igru"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Težina botova" className="flex items-center gap-1 rounded-[var(--radius)] bg-muted p-1">
          {(["lako", "srednje", "tesko"] as const).map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={level === l}
              onClick={() => setLevel(l)}
              className={`min-h-11 rounded-xl px-4 text-sm font-bold transition-colors ${level === l ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {l === "tesko" ? "Teško" : l === "lako" ? "Lako" : "Srednje"}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => bots({ action: "add", difficulty: level })} disabled={busy || full} className={botButton}>
          <Bot className="size-5" aria-hidden /> Dodaj bota
        </button>
        <button type="button" onClick={() => bots({ action: "fill", difficulty: level })} disabled={busy || players.length >= Math.min(5, world.maxPlayers)} className={botButton}>
          <Bot className="size-5" aria-hidden /> Popuni do 5 hotela
        </button>
        <span className="text-sm text-muted-foreground">Botovi su hoteli koje vodi računalo. Lako: slabi odgovori i preskupo; teško: najbolji odgovori i dobra cijena.</span>
      </div>
      {error && <FormError>{error}</FormError>}

      {players.length === 0 ? (
        <p className="rounded-[var(--radius)] border-2 border-dashed py-12 text-center text-lg text-muted-foreground">
          Čekamo prve studente…
        </p>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <PlayerCard key={p.companyId} p={p} busy={busy} onRemove={() => bots({ action: "remove", companyId: p.companyId })} />
          ))}
        </ul>
      )}
    </div>
  );
}

const botButton =
  "flex min-h-11 items-center gap-2 rounded-xl bg-muted px-4 text-sm font-bold transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50";

function PlayerCard({ p, busy, onRemove }: { p: LeaderboardRow; busy: boolean; onRemove: () => void }) {
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
      {p.isBot && (
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          aria-label={`Ukloni bota ${p.hotelName}`}
          className="ml-auto flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
        >
          <X className="size-4" aria-hidden /> Ukloni
        </button>
      )}
    </li>
  );
}
