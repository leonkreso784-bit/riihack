"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { USE_MOCK } from "@/lib/client";
import { Field, FormError, SubmitButton } from "@/components/form";

const MIN_PASSWORD = 8; // Better Auth zadano

// L16: profesorski račun (ime, e-mail, lozinka); sve igre ostaju na računu, bez pamćenja kodova.
export default function ProfRegister() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Upiši svoje ime");
    if (!email.includes("@")) return setError("Upiši ispravan e-mail");
    if (password.length < MIN_PASSWORD) return setError(`Lozinka mora imati barem ${MIN_PASSWORD} znakova`);
    setBusy(true);
    setError(null);
    if (USE_MOCK) return router.push("/profesor/igre"); // mock: bez backenda, ravno na popis
    const { error: err } = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password });
    if (err) {
      setError(authErrorMessage(err, "Registracija nije uspjela"));
      setBusy(false);
      return;
    }
    router.push("/profesor/igre");
  }

  return (
    <div className="mx-auto max-w-md pt-4 md:pt-12">
      <h1 className="text-4xl font-extrabold tracking-tight">Profesorski račun</h1>
      <p className="mt-2 text-muted-foreground">Sve tvoje igre na jednom mjestu, bez pamćenja kodova.</p>

      <form onSubmit={register} className="surface mt-8 space-y-5 rounded-[var(--radius)] p-5 md:p-6">
        <Field id="reg-name" label="Ime i prezime" autoFocus autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="npr. Ana Horvat" />
        <Field id="reg-email" label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@skola.hr" />
        <div className="space-y-2">
          <Field
            id="reg-password"
            label="Lozinka"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="reg-password-hint"
          />
          <p id="reg-password-hint" className="text-sm text-muted-foreground">
            Barem {MIN_PASSWORD} znakova.
          </p>
        </div>
        {error && <FormError key={error}>{error}</FormError>}
        <SubmitButton busy={busy} busyText="Stvaram račun…">
          Napravi račun
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Već imaš račun?{" "}
        <Link href="/profesor/prijava" className="font-semibold text-secondary-foreground hover:underline">
          Prijavi se
        </Link>
      </p>
    </div>
  );
}
