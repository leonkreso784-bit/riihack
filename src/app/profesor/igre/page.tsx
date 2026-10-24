"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Plus, Users } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { api, USE_MOCK } from "@/lib/client";
import type { ProfGameSummary } from "@/lib/types";
import { Panel } from "@/components/panel";
import { Pill, type Tone } from "@/components/pill";
import { FormError } from "@/components/form";

const PRIMARY_LINK =
  "flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground transition-colors hover:bg-[#1f5fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function statusPill(g: ProfGameSummary): { tone: Tone; label: string } {
  if (g.status === "lobby") return { tone: "warn", label: "Čekaonica" };
  if (g.status === "finished") return { tone: "up", label: "Gotova" };
  return { tone: "accent", label: `Krug ${g.round} od ${g.maxRounds}` };
}

const dateFmt = new Intl.DateTimeFormat("hr-HR", { day: "numeric", month: "numeric", year: "numeric" });

// L16: Moje igre — sve igre prijavljenog profesora; bez sesije natrag na prijavu.
export default function MyGames() {
  const router = useRouter();
  const session = authClient.useSession();
  const user = USE_MOCK ? { name: "Ana Horvat" } : session.data?.user; // mock: demo profesor bez backenda
  const pending = !USE_MOCK && session.isPending;
  const signedIn = Boolean(user);
  const [games, setGames] = useState<ProfGameSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false); // odjava sama vodi na /profesor, bez preusmjeravanja na prijavu

  const refetch = useEffectEvent(() => session.refetch());
  useEffect(() => {
    if (pending || leavingRef.current) return;
    let alive = true;
    (async () => {
      // Nakon odjave pa prijave u istoj kartici useSession zna još držati staru (praznu) sesiju: provjeri na serveru.
      if (!signedIn) {
        const { data } = await authClient.getSession().catch(() => ({ data: null }));
        if (!alive || leavingRef.current) return;
        if (!data) return router.replace("/profesor/prijava");
        refetch();
      }
      try {
        const g = await api.profGames();
        if (alive) setGames(g);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pending, signedIn, router]);

  async function logout() {
    leavingRef.current = true;
    setLeaving(true);
    if (!USE_MOCK) await authClient.signOut().catch(() => {});
    await api.logout().catch(() => {}); // briše i sp_prof na ovom uređaju
    router.replace("/profesor");
  }

  if (pending || !user) return <p className="pt-12 text-center text-muted-foreground">Učitavam…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-4 md:pt-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight">Moje igre</h1>
          <p className="text-muted-foreground">{user.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/profesor/novi" className={`${PRIMARY_LINK} flex-1 sm:flex-none`}>
            <Plus className="size-5" aria-hidden /> Nova igra
          </Link>
          <button
            type="button"
            onClick={logout}
            disabled={leaving}
            className="flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            <LogOut className="size-5" aria-hidden /> Odjava
          </button>
        </div>
      </header>

      {error && <FormError key={error}>{error}</FormError>}

      {!games && !error && <p className="text-muted-foreground">Učitavam igre…</p>}

      {games?.length === 0 && (
        <Panel tone="accent" className="space-y-4 text-center">
          <p className="text-lg font-bold">Još nemaš nijednu igru</p>
          <p className="text-muted-foreground">Napravi prvu igru, studenti ulaze kodom igre i svatko dobije svoj hotel.</p>
          <Link href="/profesor/novi" className={`${PRIMARY_LINK} mx-auto w-full sm:w-auto`}>
            <Plus className="size-5" aria-hidden /> Napravi prvu igru
          </Link>
        </Panel>
      )}

      {games && games.length > 0 && (
        <Panel pad="none">
          <ul className="divide-y">
            {games.map((g) => {
              const s = statusPill(g);
              return (
                <li key={g.worldId}>
                  <Link
                    href={`/profesor/${g.worldId}`}
                    className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary md:px-6"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-bold">{g.name}</span>
                        <Pill tone={s.tone}>{s.label}</Pill>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          Kod <span className="font-mono font-semibold tracking-widest text-foreground">{g.joinCode}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-4" aria-hidden /> {g.players} {g.players === 1 ? "student" : "studenata"}
                        </span>
                        <span>{dateFmt.format(new Date(g.createdAt))}</span>
                      </div>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
