"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const BUTTON =
  "flex min-h-14 items-center justify-center rounded-[var(--radius)] px-4 text-lg font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// R2: the professor works from their account (L16): new games and existing ones live in "Moje igre".
// ponytail: code login (/api/prof/login) is no longer linked; the code from /profesor/novi still works through the API.
// No flash: nothing until the session check ends; a signed-in professor goes straight to "Moje igre".
export default function ProfEntry() {
  const router = useRouter();
  const session = authClient.useSession();
  const signedIn = Boolean(session.data);
  useEffect(() => {
    if (signedIn) router.replace("/profesor/igre");
  }, [signedIn, router]);

  return (
    <div className="mx-auto max-w-md pt-4 md:pt-12">
      <h1 className="text-4xl font-extrabold tracking-tight">Profesor</h1>
      <p className="mt-2 text-muted-foreground">Prijavi se i vodi svoje igre: nove igre i one koje već traju su na tvom računu.</p>

      <div className="mt-8 min-h-[7.75rem] space-y-3">
        {session.isPending || signedIn ? (
          <p className="text-center text-muted-foreground">Učitavam…</p>
        ) : (
          <>
            <Link href="/profesor/prijava" className={`${BUTTON} bg-primary text-primary-foreground hover:bg-[#1f5fe0]`}>
              Prijavi se
            </Link>
            <Link href="/profesor/registracija" className={`${BUTTON} surface hover:bg-muted`}>
              Napravi račun
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
