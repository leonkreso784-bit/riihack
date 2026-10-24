"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { api } from "@/lib/client";
import { PROF_CODE_LENGTH } from "@/lib/rules";
import { Field, FormError, SubmitButton } from "@/components/form";

// R2: the professor comes back with their 12-character code, or starts a new game.
export default function ProfLogin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const profCode = code.replace(/[\s-]/g, "").toUpperCase();
    if (profCode.length !== PROF_CODE_LENGTH) return setError(`Profesorski kod ima ${PROF_CODE_LENGTH} znakova`);
    setBusy(true);
    setError(null);
    try {
      const { worldId } = await api.profLogin({ profCode });
      router.push(`/profesor/${worldId}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md pt-4 md:pt-12">
      <h1 className="text-4xl font-extrabold tracking-tight">Profesor</h1>
      <p className="mt-2 text-muted-foreground">Napravi novu igru za razred ili se vrati u postojeću.</p>

      <Link
        href="/profesor/novi"
        className="mt-8 flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-4 text-lg font-bold text-primary-foreground transition-colors hover:bg-[#1f5fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Plus className="size-5" aria-hidden /> Nova igra
      </Link>

      <form onSubmit={login} className="surface mt-6 space-y-5 rounded-[var(--radius)] p-5 md:p-6">
        <Field
          id="prof-code"
          label="Već imaš igru? Upiši profesorski kod"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="12 znakova"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="font-mono tracking-widest uppercase"
        />
        {error && <FormError key={error}>{error}</FormError>}
        <SubmitButton busy={busy} busyText="Provjeravam…">
          Otvori igru
        </SubmitButton>
      </form>
    </div>
  );
}
