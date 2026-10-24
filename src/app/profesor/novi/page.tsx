"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Field, FormError, SubmitButton } from "@/components/form";

// R2: new game → straight to the board (waiting room with the QR). The game lives on the professor's account.
export default function NewGame() {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState("24");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const maxPlayers = Number(players);
    if (name.trim().length < 2 || name.trim().length > 60) return setError("Naziv igre mora imati od 2 do 60 znakova");
    if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 60) return setError("Broj studenata mora biti od 1 do 60");
    setBusy(true);
    setError(null);
    try {
      const { worldId } = await api.createWorld({ name: name.trim(), maxPlayers });
      router.push(`/profesor/${worldId}`); // the game is on the professor's account (Moje igre), no code to keep
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md pt-4 md:pt-12">
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
    </div>
  );
}
