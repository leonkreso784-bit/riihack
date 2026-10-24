"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { USE_MOCK } from "@/lib/client";
import { Field, FormError, SubmitButton } from "@/components/form";

// L16: prijava profesorskim računom → Moje igre. Prijava kodom ostaje na /profesor.
export default function ProfSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || !password) return setError("Upiši e-mail i lozinku");
    setBusy(true);
    setError(null);
    if (USE_MOCK) return router.push("/profesor/igre"); // mock: bez backenda, ravno na popis
    const { error: err } = await authClient.signIn.email({ email: email.trim(), password });
    if (err) {
      setError(authErrorMessage(err, "Prijava nije uspjela"));
      setBusy(false);
      return;
    }
    router.push("/profesor/igre");
  }

  return (
    <div className="mx-auto max-w-md pt-4 md:pt-12">
      <h1 className="text-4xl font-extrabold tracking-tight">Prijava</h1>
      <p className="mt-2 text-muted-foreground">Prijavi se profesorskim računom i vidi sve svoje igre.</p>

      <form onSubmit={signIn} className="surface mt-8 space-y-5 rounded-[var(--radius)] p-5 md:p-6">
        <Field id="login-email" label="E-mail" type="email" autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@skola.hr" />
        <Field id="login-password" label="Lozinka" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <FormError key={error}>{error}</FormError>}
        <SubmitButton busy={busy} busyText="Prijavljujem…">
          Prijavi se
        </SubmitButton>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Nemaš račun?{" "}
          <Link href="/profesor/registracija" className="font-semibold text-secondary-foreground hover:underline">
            Registriraj se
          </Link>
        </p>
      </div>
    </div>
  );
}
