"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { JOIN_CODE_LENGTH } from "@/lib/rules";
import { CodeInput } from "@/components/code-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const between = (s: string) => s.trim().length >= 2 && s.trim().length <= 40;

// R1: Kahoot-style entry. Step 1 the game code from the projector, step 2 your name and your hotel's name.
export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!code || busy) return;
    if (!between(name)) return setError("Ime mora imati od 2 do 40 znakova");
    if (!between(hotelName)) return setError("Ime hotela mora imati od 2 do 40 znakova");
    setBusy(true);
    setError(null);
    try {
      await api.join({ joinCode: code, name: name.trim(), hotelName: hotelName.trim() });
      router.push("/cekaonica");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md pt-4 md:pt-12">
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Uđi u igru</h1>
      <p className="mt-2 text-muted-foreground">
        {code ? "Još samo tko si i kako se zove tvoj hotel." : "Upiši kod koji profesor pokazuje na ekranu."}
      </p>

      <form onSubmit={join} className="surface mt-8 space-y-5 rounded-[var(--radius)] p-5 md:p-6">
        {code ? (
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
            <span className="font-mono text-2xl font-bold tracking-[0.3em]">{code}</span>
            <button
              type="button"
              onClick={() => {
                setCode(null);
                setError(null);
              }}
              className="min-h-11 rounded-lg px-2 text-sm font-semibold text-secondary-foreground hover:underline"
            >
              Promijeni kod
            </button>
          </div>
        ) : (
          <CodeInput length={JOIN_CODE_LENGTH} onComplete={setCode} />
        )}

        {code && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">Tvoje ime</Label>
              <Input
                id="name"
                autoFocus
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="npr. Ana Kovač"
                className="h-12 rounded-xl bg-card px-4 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hotel" className="text-sm font-semibold">Ime hotela koji vodiš</Label>
              <Input
                id="hotel"
                autoComplete="off"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="npr. Vila Ana"
                className="h-12 rounded-xl bg-card px-4 text-base"
              />
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-down-soft px-4 py-3 text-sm font-medium text-down">
            {error}
          </p>
        )}

        {code && (
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground transition-colors hover:bg-[#1f5fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            {busy ? "Ulazim…" : "Uđi u igru"}
          </button>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Vodiš kolegij?{" "}
        <Link href="/profesor" className="font-semibold text-secondary-foreground hover:underline">
          Ja sam profesor
        </Link>
      </p>
    </div>
  );
}
