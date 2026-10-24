"use client";

import { useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { api, isUnauthorized, USE_MOCK } from "@/lib/client";
import type { LibraryItem, ProfGameSummary } from "@/lib/types";
import { Panel } from "@/components/panel";
import { Pill } from "@/components/pill";
import { FormError } from "@/components/form";

const SOURCE_LABEL = { bank: "Banka", custom: "Profesor", ai: "AI" } as const;

const dateFmt = new Intl.DateTimeFormat("hr-HR", { day: "numeric", month: "numeric", year: "numeric" });

// L17: Knjižnica situacija — sve situacije na profesorovom računu; svaka se može kopirati u jednu od njegovih igara.
export default function Library() {
  const router = useRouter();
  const session = authClient.useSession();
  const signedIn = USE_MOCK || Boolean(session.data?.user);
  const pending = !USE_MOCK && session.isPending;
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [games, setGames] = useState<ProfGameSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<Record<string, string>>({}); // itemId → worldId
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({}); // itemId → poruka uspjeha

  const refetch = useEffectEvent(() => session.refetch());
  useEffect(() => {
    if (pending) return;
    let alive = true;
    (async () => {
      // Kao /profesor/igre: useSession zna držati staru praznu sesiju, pa provjeri na serveru prije preusmjeravanja.
      if (!signedIn) {
        const { data } = await authClient.getSession().catch(() => ({ data: null }));
        if (!alive) return;
        if (!data) return router.replace("/profesor/prijava");
        refetch();
      }
      try {
        const [list, g] = await Promise.all([api.libraryList(), api.profGames()]);
        if (!alive) return;
        setItems(list);
        setGames(g);
      } catch (e) {
        if (!alive) return;
        if (isUnauthorized(e)) router.replace("/profesor/prijava");
        else setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pending, signedIn, router]);

  async function copy(item: LibraryItem) {
    const worldId = target[item.id] ?? games[0]?.worldId;
    if (!worldId) return;
    setError(null);
    setBusy(item.id);
    try {
      await api.libraryCopy(item.id, worldId);
      const name = games.find((g) => g.worldId === worldId)?.name ?? "igru";
      setDone((d) => ({ ...d, [item.id]: `Kopirano u igru: ${name}` }));
    } catch (e) {
      if (isUnauthorized(e)) router.replace("/profesor/prijava");
      else setError((e as Error).message);
    }
    setBusy(null);
  }

  if (pending || (!signedIn && items === null && !error)) return <p className="pt-12 text-center text-muted-foreground">Učitavam…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-4 md:pt-12">
      <header className="space-y-2">
        <Link
          href="/profesor/igre"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ArrowLeft className="size-4" aria-hidden /> Moje igre
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tight">Knjižnica situacija</h1>
        <p className="text-muted-foreground">Tvoje spremljene situacije. Kopija ide u odabranu igru, original ostaje u knjižnici.</p>
      </header>

      {error && <FormError key={error}>{error}</FormError>}

      {!items && !error && <p className="text-muted-foreground">Učitavam knjižnicu…</p>}

      {items?.length === 0 && (
        <Panel tone="accent" className="space-y-2 text-center">
          <p className="text-lg font-bold">Knjižnica je prazna</p>
          <p className="text-muted-foreground">Otvori situaciju u svojoj igri i spremi je gumbom „Spremi u knjižnicu“.</p>
        </Panel>
      )}

      {items && items.length > 0 && games.length === 0 && (
        <p role="status" className="rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
          Nemaš nijednu igru u koju bi kopirao.{" "}
          <Link href="/profesor/novi" className="font-bold underline">
            Napravi igru
          </Link>
          .
        </p>
      )}

      {items && items.length > 0 && (
        <Panel pad="none">
          <ul className="divide-y">
            {items.map((s) => (
              <li key={s.id} className="space-y-3 px-4 py-4 md:px-6">
                <div className="space-y-1">
                  <p className="font-bold">{s.title}</p>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Pill tone={s.source === "ai" ? "warn" : "accent"}>{SOURCE_LABEL[s.source]}</Pill>
                    {s.area} · težina {s.difficulty} od 5 · {dateFmt.format(new Date(s.createdAt))}
                  </p>
                </div>
                {games.length > 0 && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      aria-label={`Igra za kopiranje: ${s.title}`}
                      value={target[s.id] ?? games[0].worldId}
                      onChange={(e) => setTarget((t) => ({ ...t, [s.id]: e.target.value }))}
                      className="min-h-11 flex-1 rounded-xl border bg-card px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {games.map((g) => (
                        <option key={g.worldId} value={g.worldId}>
                          {g.name} ({g.joinCode})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => copy(s)}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-secondary px-4 text-sm font-bold text-secondary-foreground transition-colors hover:bg-[#dbe7ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
                    >
                      {busy === s.id ? "Kopiram…" : "Kopiraj u igru"}
                    </button>
                  </div>
                )}
                {done[s.id] && (
                  <p role="status" className="text-sm font-semibold text-up">
                    {done[s.id]}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
