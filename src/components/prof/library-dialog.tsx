"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, isUnauthorized } from "@/lib/client";
import type { LibraryItem } from "@/lib/types";
import { FormError } from "@/components/form";
import { Pill } from "@/components/pill";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const LIBRARY_HINT = "Knjižnica radi s profesorskim računom. Prijavite se da spremate situacije za iduće razrede.";

const SOURCE_LABEL = { bank: "Banka", custom: "Profesor", ai: "AI" } as const;

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("hr-HR", { day: "numeric", month: "numeric", year: "numeric" });

// S12: "Dodaj iz knjižnice": the professor's saved situations; each one can be copied into this game.
export function LibraryDialog({ worldId, open, onClose, onAdded }: { worldId: string; open: boolean; onClose: () => void; onAdded: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] gap-5 overflow-y-auto p-5 sm:max-w-lg">
        {open && <LibraryBody worldId={worldId} onClose={onClose} onAdded={onAdded} />}
      </DialogContent>
    </Dialog>
  );
}

function LibraryBody({ worldId, onClose, onAdded }: { worldId: string; onClose: () => void; onAdded: () => void }) {
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [hint, setHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    api
      .libraryList()
      .then((list) => alive && setItems(list))
      .catch((err) => {
        if (!alive) return;
        if (isUnauthorized(err)) setHint(true);
        else setError((err as Error).message);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function add(item: LibraryItem) {
    setError(null);
    setAdding(item.id);
    try {
      await api.libraryCopy(item.id, worldId);
      setAdded((a) => [...a, item.id]);
      toast.success(`Dodano u igru: ${item.title}`);
      onAdded();
    } catch (err) {
      if (isUnauthorized(err)) setHint(true);
      else setError((err as Error).message);
    }
    setAdding(null);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-extrabold tracking-tight">Dodaj iz knjižnice</DialogTitle>
        <DialogDescription className="text-base text-foreground">Tvoje spremljene situacije. Kopija ide u ovu igru, original ostaje u knjižnici.</DialogDescription>
      </DialogHeader>

      {hint && <p role="status" className="rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">{LIBRARY_HINT}</p>}
      {error && <FormError>{error}</FormError>}
      {!hint && !error && items === null && <p className="py-4 text-center text-muted-foreground">Učitavam…</p>}
      {items && items.length === 0 && <p className="py-4 text-center text-muted-foreground">Knjižnica je prazna. Spremi situaciju gumbom „Spremi u knjižnicu“.</p>}
      {items && items.length > 0 && (
        <ul className="divide-y">
          {items.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1 basis-48">
                <p className="text-base font-bold">{s.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Pill tone={s.source === "ai" ? "warn" : "accent"}>{SOURCE_LABEL[s.source]}</Pill>
                  {s.area} · težina {s.difficulty} od 5 · {fmtDate(s.createdAt)}
                </p>
              </div>
              <button
                type="button"
                disabled={adding !== null || added.includes(s.id)}
                onClick={() => add(s)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-secondary px-4 text-sm font-bold text-secondary-foreground transition-colors hover:bg-[#dbe7ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
              >
                {added.includes(s.id) ? "Dodano" : adding === s.id ? "Dodajem…" : "Dodaj u ovu igru"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 rounded-xl border bg-card px-6 text-base font-bold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Zatvori
        </button>
      </div>
    </>
  );
}
