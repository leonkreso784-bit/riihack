"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Eye } from "lucide-react";
import { api } from "@/lib/client";
import type { CreateWorldResponse } from "@/lib/types";
import { Field, FormError, SubmitButton } from "@/components/form";

// R2: new game → the professor code is shown once, hidden until "Prikaži" (the laptop may already be on the projector).
export default function NewGame() {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState("24");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<CreateWorldResponse | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const maxPlayers = Number(players);
    if (name.trim().length < 2 || name.trim().length > 60) return setError("Naziv igre mora imati od 2 do 60 znakova");
    if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 60) return setError("Broj studenata mora biti od 1 do 60");
    setBusy(true);
    setError(null);
    try {
      setCreated(await api.createWorld({ name: name.trim(), maxPlayers }));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md pt-4 md:pt-12">
      {created ? (
        <Created res={created} />
      ) : (
        <>
          <h1 className="text-4xl font-extrabold tracking-tight">Nova igra</h1>
          <p className="mt-2 text-muted-foreground">Svaki student dobije svoj hotel u istom gradu.</p>
          <form onSubmit={create} className="surface mt-8 space-y-5 rounded-[var(--radius)] p-5 md:p-6">
            <Field id="world-name" label="Naziv igre" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="npr. Hotelijerstvo 2A, ljeto" />
            <Field id="players" label="Koliko studenata igra" type="number" inputMode="numeric" min={1} max={60} value={players} onChange={(e) => setPlayers(e.target.value)} />
            {error && <FormError key={error}>{error}</FormError>}
            <SubmitButton busy={busy} busyText="Stvaram igru…">
              Napravi igru
            </SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}

function Created({ res }: { res: CreateWorldResponse }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <>
      <h1 className="text-4xl font-extrabold tracking-tight">Igra je spremna</h1>
      <p className="mt-2 text-muted-foreground">Studenti ulaze kodom igre. Tvoj profesorski kod je samo za tebe.</p>

      <div className="surface mt-8 space-y-4 rounded-[var(--radius)] p-5 md:p-6">
        <p className="text-sm font-semibold">Profesorski kod</p>
        {shown ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
            <span className="font-mono text-xl font-bold tracking-widest">{res.profCode}</span>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(res.profCode);
                setCopied(true);
              }}
              className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-secondary-foreground hover:underline"
            >
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "Kopirano" : "Kopiraj"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShown(true)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed font-semibold text-muted-foreground hover:border-primary hover:text-foreground"
          >
            <Eye className="size-4" aria-hidden /> Prikaži (pazi da nije na projektoru)
          </button>
        )}
        <p className="rounded-xl bg-sand px-4 py-3 text-sm">Spremi ovaj kod, njime se vraćaš u igru s drugog računala.</p>
      </div>

      <Link
        href={`/profesor/${res.worldId}`}
        className="mt-6 flex min-h-14 items-center justify-center rounded-[var(--radius)] bg-primary px-4 text-lg font-bold text-primary-foreground transition-colors hover:bg-[#1f5fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Otvori igru i pokaži kod razredu
      </Link>
    </>
  );
}
