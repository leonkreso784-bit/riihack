"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const BUTTON =
  "flex min-h-14 items-center justify-center rounded-[var(--radius)] px-4 text-lg font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// R2: the professor works from their account (L16): new games and existing ones live in "Moje igre".
// ponytail: code login (/api/prof/login) is no longer linked; the code from /profesor/novi still works through the API.
export default function ProfEntry() {
  const session = authClient.useSession();

  return (
    <div className="mx-auto max-w-md pt-4 md:pt-12">
      <h1 className="text-4xl font-extrabold tracking-tight">Profesor</h1>
      <p className="mt-2 text-muted-foreground">Prijavi se i vodi svoje igre: nove igre i one koje već traju su na tvom računu.</p>

      <div className="mt-8 space-y-3">
        {session.data ? (
          <Link href="/profesor/igre" className={`${BUTTON} bg-primary text-primary-foreground hover:bg-[#1f5fe0]`}>
            Moje igre
          </Link>
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
