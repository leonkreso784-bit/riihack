"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BookmarkPlus, Download, Library, Plus, Send, Upload } from "lucide-react";
import { api, isUnauthorized, usePoll } from "@/lib/client";
import { ROUND_LABELS } from "@/lib/rules";
import type { DispatchView, Playbook, ProfStateResponse, SituationSource, SituationSummary } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Pill, type Tone } from "@/components/pill";
import { FormError } from "@/components/form";
import { SituationForm } from "@/components/prof/situation-form";
import { DispatchDialog } from "@/components/prof/dispatch-dialog";
import { LIBRARY_HINT, LibraryDialog } from "@/components/prof/library-dialog";
import { BackLink } from "@/components/back-link";
import { Loading } from "@/components/loading";

const SOURCE: Record<SituationSource, { label: string; tone: Tone }> = {
  bank: { label: "Banka", tone: "neutral" },
  custom: { label: "Profesor", tone: "accent" },
  ai: { label: "AI", tone: "warn" },
};

const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";

// S8: the professor's situations: bank list, write a new one, send to students, random draw switch, scheduled sends.
export default function ProfSituations() {
  const { worldId } = useParams<{ worldId: string }>();
  const { data, error, refresh } = usePoll(() => api.profState(worldId));
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<SituationSummary | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [playbookError, setPlaybookError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [libraryHint, setLibraryHint] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (error && !data) return <FormError>{error.message}</FormError>;
  if (!data) return <Loading />;

  const state: ProfStateResponse = data;
  const bank = state.bank ?? [];
  const dispatches = state.dispatches ?? [];
  const autoDraw = state.autoDraw ?? true;

  async function toggleAutoDraw() {
    setSwitching(true);
    setSwitchError(null);
    try {
      await api.worldSettings(worldId, { autoDraw: !autoDraw });
      refresh();
    } catch (err) {
      setSwitchError((err as Error).message);
    }
    setSwitching(false);
  }

  async function saveToLibrary(s: SituationSummary) {
    setLibraryHint(null);
    setSavingId(s.id);
    try {
      await api.librarySave(worldId, s.id);
      setSavedIds((ids) => [...ids, s.id]);
      toast.success(`Spremljeno u knjižnicu: ${s.title}`);
    } catch (err) {
      setLibraryHint(isUnauthorized(err) ? LIBRARY_HINT : (err as Error).message);
    }
    setSavingId(null);
  }

  async function exportPlaybook() {
    setPlaybookError(null);
    try {
      const playbook = await api.exportPlaybook(worldId);
      const blob = new Blob([JSON.stringify(playbook, null, 2)], { type: "application/json" });
      const slug = (playbook.name || state.world.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `playbook-${slug || new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setPlaybookError((err as Error).message);
    }
  }

  async function importPlaybook(file: File) {
    setPlaybookError(null);
    setImporting(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        throw new Error("Datoteka nije ispravan JSON.");
      }
      const pb = parsed as Partial<Playbook> | null;
      if (!pb || pb.version !== 1 || !Array.isArray(pb.situations)) throw new Error("Ovo nije playbook (očekujem version 1 i popis situacija).");
      await api.importPlaybook(worldId, pb as Playbook);
      toast.success(`Uvezeno ${pb.situations.length} situacija`);
      refresh();
    } catch (err) {
      setPlaybookError((err as Error).message);
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <BackLink href={`/profesor/${worldId}`} label="Natrag na ploču" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Situacije" subtitle="Napiši svoju situaciju ili odaberi iz banke i pošalji je studentima." />
        {!creating && (
          <button type="button" onClick={() => setCreating(true)} className={`${BUTTON} min-h-12 bg-primary px-6 text-base text-primary-foreground hover:bg-[#1f5fe0]`}>
            <Plus className="size-5" aria-hidden /> Nova situacija
          </button>
        )}
      </div>

      {creating && (
        <SituationForm
          worldId={worldId}
          players={state.players}
          onCancel={() => setCreating(false)}
          onCreated={(s) => {
            setCreating(false);
            refresh();
            toast.success(`Spremljeno: ${s.title}`);
          }}
        />
      )}

      <Panel title="Playbook">
        <p className="mb-4 text-sm text-muted-foreground">Spremi svoje situacije i postavke i učitaj ih u drugu igru.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={exportPlaybook} className={`${BUTTON} bg-secondary text-secondary-foreground hover:bg-[#dbe7ff]`}>
            <Download className="size-4" aria-hidden /> Izvezi playbook
          </button>
          <button type="button" disabled={importing} onClick={() => fileRef.current?.click()} className={`${BUTTON} bg-secondary text-secondary-foreground hover:bg-[#dbe7ff]`}>
            <Upload className="size-4" aria-hidden /> {importing ? "Uvozim…" : "Uvezi playbook"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            tabIndex={-1}
            aria-label="Datoteka playbooka"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importPlaybook(file);
            }}
          />
        </div>
        {playbookError && <div className="mt-3"><FormError>{playbookError}</FormError></div>}
      </Panel>

      <Panel tone="accent">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p id="auto-draw-label" className="text-base font-bold">
              Slučajno izvlačenje
            </p>
            <p id="auto-draw-hint" className="text-sm text-muted-foreground">
              {autoDraw ? "Svaki mjesec igra sama izvuče situacije iz banke. Tvoja slanja se dodaju." : "Igra ne izvlači situacije. Studenti dobivaju samo ono što ti pošalješ."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoDraw}
            aria-labelledby="auto-draw-label"
            aria-describedby="auto-draw-hint"
            disabled={switching}
            onClick={toggleAutoDraw}
            className={`relative h-11 w-[4.5rem] shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 ${autoDraw ? "bg-primary" : "bg-[#9aa3b5]"}`}
          >
            <span className={`absolute top-1 left-1 size-9 rounded-full bg-white shadow transition-transform ${autoDraw ? "translate-x-[1.75rem]" : ""}`} />
            <span className="sr-only">{autoDraw ? "Uključeno" : "Isključeno"}</span>
          </button>
        </div>
        {switchError && <div className="mt-3"><FormError>{switchError}</FormError></div>}
      </Panel>

      <Panel title="Popis situacija" action={
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setLibraryOpen(true)} className={`${BUTTON} bg-secondary text-secondary-foreground hover:bg-[#dbe7ff]`}>
            <Library className="size-4" aria-hidden /> Dodaj iz knjižnice
          </button>
          <span className="text-sm text-muted-foreground">{bank.length} ukupno</span>
        </div>
      } pad="list">
        {libraryHint && <p role="status" className="mt-3 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">{libraryHint}</p>}
        {bank.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Još nema situacija. Napiši prvu gumbom „Nova situacija“.</p>
        ) : (
          <ul className="divide-y">
            {bank.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1 basis-60">
                  <p className="text-base font-bold">{s.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Pill tone={SOURCE[s.source].tone}>{SOURCE[s.source].label}</Pill>
                    {s.area} · težina {s.difficulty} od 5
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.source !== "bank" && (
                    <button
                      type="button"
                      disabled={savingId !== null || savedIds.includes(s.id)}
                      onClick={() => saveToLibrary(s)}
                      className={`${BUTTON} border bg-card hover:bg-muted`}
                    >
                      <BookmarkPlus className="size-4" aria-hidden /> {savedIds.includes(s.id) ? "Spremljeno" : savingId === s.id ? "Spremam…" : "Spremi u knjižnicu"}
                    </button>
                  )}
                  <button type="button" onClick={() => setSending(s)} className={`${BUTTON} bg-secondary text-secondary-foreground hover:bg-[#dbe7ff]`}>
                    <Send className="size-4" aria-hidden /> Pošalji
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Zakazana slanja" action={<span className="text-sm text-muted-foreground">{dispatches.length} ukupno</span>} pad="list">
        {dispatches.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">Nema zakazanih slanja.</p>
        ) : (
          <ul className="divide-y">
            {dispatches.map((d) => (
              <DispatchRow key={d.id} d={d} />
            ))}
          </ul>
        )}
      </Panel>

      <LibraryDialog worldId={worldId} open={libraryOpen} onClose={() => setLibraryOpen(false)} onAdded={refresh} />
      <DispatchDialog worldId={worldId} situation={sending} world={state.world} players={state.players} onClose={() => setSending(null)} onSent={refresh} />
    </div>
  );
}

function DispatchRow({ d }: { d: DispatchView }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="min-w-0 flex-1 basis-60">
        <p className="text-base font-bold">{d.title}</p>
        <p className="text-sm text-muted-foreground">
          {ROUND_LABELS[d.round - 1] ?? `Krug ${d.round}`} (krug {d.round}) · {d.companyIds === null ? "svi studenti" : `${d.companyIds.length} ${d.companyIds.length === 1 ? "student" : "studenata"}`}
        </p>
      </div>
      <Pill tone={d.status === "sent" ? "up" : "warn"}>{d.status === "sent" ? "Poslano" : "Zakazano"}</Pill>
    </li>
  );
}
