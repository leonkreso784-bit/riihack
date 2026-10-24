"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { MAX_ROUNDS, ROUND_LABELS } from "@/lib/rules";
import type { DispatchRequest, LeaderboardRow, SituationSummary, WorldView } from "@/lib/types";
import { Field, FormError, SubmitButton } from "@/components/form";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CHOICE = "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 text-base has-checked:border-primary has-checked:bg-secondary";

// S8: "Pošalji" for one situation: to whom (everyone or picked students), when (now or round k), optional room.
export function DispatchDialog({
  worldId,
  situation,
  world,
  players,
  onClose,
  onSent,
}: {
  worldId: string;
  situation: SituationSummary | null;
  world: WorldView;
  players: LeaderboardRow[];
  onClose: () => void;
  onSent: () => void;
}) {
  return (
    <Dialog open={situation !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] gap-5 overflow-y-auto p-5 sm:max-w-lg">
        {situation && <DispatchBody key={situation.id} {...{ worldId, situation, world, players, onClose, onSent }} />}
      </DialogContent>
    </Dialog>
  );
}

function DispatchBody({ worldId, situation, world, players, onClose, onSent }: {
  worldId: string;
  situation: SituationSummary;
  world: WorldView;
  players: LeaderboardRow[];
  onClose: () => void;
  onSent: () => void;
}) {
  const uid = useId();
  const canSendNow = world.status === "running";
  const firstRound = Math.max(world.round + 1, 1);
  const laterRounds = Array.from({ length: Math.max(0, MAX_ROUNDS - firstRound + 1) }, (_, i) => firstRound + i);
  const [when, setWhen] = useState<string>(canSendNow ? "now" : String(laterRounds[0] ?? ""));
  const [everyone, setEveryone] = useState(true);
  const [picked, setPicked] = useState<string[]>([]);
  const [room, setRoom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!everyone && picked.length === 0) return setError("Odaberi barem jednog studenta ili pošalji svima.");
    if (when === "") return setError("Nema kruga u koji se može poslati.");
    const req: DispatchRequest = { templateId: situation.id };
    if (!everyone) req.companyIds = picked;
    if (when !== "now") req.round = Number(when);
    if (room.trim()) req.roomNumber = room.trim();
    setBusy(true);
    try {
      await api.dispatch(worldId, req);
      const to = everyone ? "svim studentima" : `${picked.length} ${picked.length === 1 ? "studentu" : "studenata"}`;
      toast.success(when === "now" ? `Poslano ${to}: ${situation.title}` : `Zakazano, mjesec ${ROUND_LABELS[Number(when) - 1]} (${to}): ${situation.title}`);
      onSent();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className="space-y-5">
      <DialogHeader>
        <DialogTitle className="text-lg font-extrabold tracking-tight">Pošalji situaciju</DialogTitle>
        <DialogDescription className="text-base text-foreground">{situation.title}</DialogDescription>
      </DialogHeader>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">Kome</legend>
        <label className={CHOICE}>
          <input type="radio" name={`${uid}-who`} className="size-5 accent-primary" checked={everyone} onChange={() => setEveryone(true)} />
          Svim studentima
        </label>
        <label className={CHOICE}>
          <input type="radio" name={`${uid}-who`} className="size-5 accent-primary" checked={!everyone} onChange={() => setEveryone(false)} />
          Odabranim studentima
        </label>
        {!everyone && (
          <ul className="max-h-48 space-y-2 overflow-y-auto pl-2">
            {players.length === 0 && <li className="text-sm text-muted-foreground">Još nema studenata u igri.</li>}
            {players.map((p) => (
              <li key={p.companyId}>
                <label className={CHOICE}>
                  <input
                    type="checkbox"
                    className="size-5 accent-primary"
                    checked={picked.includes(p.companyId)}
                    onChange={(e) => setPicked(e.target.checked ? [...picked, p.companyId] : picked.filter((x) => x !== p.companyId))}
                  />
                  <span className="min-w-0 truncate">
                    {p.playerName} <span className="text-muted-foreground">· {p.hotelName}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-when`} className="text-sm font-semibold">
          Kada
        </Label>
        <select
          id={`${uid}-when`}
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {canSendNow && <option value="now">Odmah (u tekući mjesec)</option>}
          {laterRounds.map((k) => (
            <option key={k} value={k}>
              {ROUND_LABELS[k - 1]} (krug {k})
            </option>
          ))}
        </select>
        {!canSendNow && <p className="text-sm text-muted-foreground">Odmah se može slati tek kad igra krene.</p>}
      </div>

      <Field id={`${uid}-room`} label="Soba (neobavezno, npr. 204)" value={room} onChange={(e) => setRoom(e.target.value)} />

      {error && <FormError>{error}</FormError>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 rounded-xl border bg-card px-6 text-base font-bold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Odustani
        </button>
        <div className="sm:w-44">
          <SubmitButton busy={busy} busyText="Šaljem…">
            Pošalji
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
