"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus, Send } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { ROUND_LABELS } from "@/lib/rules";
import type { DispatchView, ProfStateResponse, SituationSource, SituationSummary } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Pill, type Tone } from "@/components/pill";
import { FormError } from "@/components/form";
import { SituationForm } from "@/components/prof/situation-form";
import { DispatchDialog } from "@/components/prof/dispatch-dialog";

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

  if (error && !data) return <FormError>{error.message}</FormError>;
  if (!data) return <p className="pt-12 text-center text-muted-foreground">Učitavam…</p>;

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

  return (
    <div className="space-y-6">
      <Link
        href={`/profesor/${worldId}`}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-secondary-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft className="size-4" aria-hidden /> Natrag na ploču
      </Link>

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
          onCancel={() => setCreating(false)}
          onCreated={(s) => {
            setCreating(false);
            refresh();
            toast.success(`Spremljeno: ${s.title}`);
          }}
        />
      )}

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

      <Panel title="Popis situacija" action={<span className="text-sm text-muted-foreground">{bank.length} ukupno</span>} pad="list">
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
                <button type="button" onClick={() => setSending(s)} className={`${BUTTON} bg-secondary text-secondary-foreground hover:bg-[#dbe7ff]`}>
                  <Send className="size-4" aria-hidden /> Pošalji
                </button>
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
