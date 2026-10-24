"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { eur, plural } from "@/lib/format";
import { ROUND_LABELS } from "@/lib/rules";
import type { AnswerView, Quality, SituationView } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/panel";
import { Pill, type Tone } from "@/components/pill";
import { FormError } from "@/components/form";
import { Delta } from "@/components/metric-bar";

const QUALITIES: Quality[] = [1, 2, 3, 4, 5];
function how(a: AnswerView | undefined, state: SituationView["state"]): { label: string; tone: Tone } {
  if (!a) return state === "open" ? { label: "još otvorena", tone: "accent" } : { label: "bez odgovora", tone: "down" };
  if (a.copied) return { label: "prepisano", tone: "warn" };
  if (a.mode === "none") return { label: "bez odgovora", tone: "down" }; // BUG-015: closed without answering
  return a.mode === "own" ? { label: "vlastite riječi", tone: "up" } : { label: "klik", tone: "neutral" };
}

// R8: one student's thinking for the professor: per month every situation (how they answered, the text, the talk
// with the character, the judge's verdict) with "Promijeni ocjenu", then the mentor's question, reflection, debrief.
export default function StudentPage() {
  const { worldId, id } = useParams<{ worldId: string; id: string }>();
  const { data, error, refresh } = usePoll(() => api.companyDetail(worldId, id), 10_000);
  const back = (
    <Link href={`/profesor/${worldId}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-secondary-foreground hover:underline">
      <ArrowLeft className="size-4" aria-hidden /> Ploča igre
    </Link>
  );
  if (error && !data)
    return (
      <div className="space-y-4">
        {back}
        <FormError>{error.message}</FormError>
      </div>
    );
  if (!data) return <p className="pt-6 text-muted-foreground">Učitavam…</p>;

  const { company, situations, reports } = data;
  const rounds = [...new Set([...situations.map((s) => s.round), ...reports.map((r) => r.round)])].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {back}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{company.hotelName}</h1>
          <p className="text-muted-foreground">
            {company.playerName} · {company.place} · {"★".repeat(company.stars)} · {company.roomsCount} soba · {eur(company.cash)}
          </p>
        </div>
        <p className="text-right">
          <span className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">Napredak</span>
          <Delta value={company.progress} className="text-2xl" />
        </p>
      </header>

      {rounds.length === 0 && <p className="surface rounded-[var(--radius)] p-6 text-muted-foreground">Student još nije dobio nijednu situaciju.</p>}

      {rounds.map((round) => {
        const report = reports.find((r) => r.round === round);
        return (
          <section key={round} className="space-y-4" aria-labelledby={`round-${round}`}>
            <h2 id={`round-${round}`} className="text-xl font-extrabold tracking-tight">
              {ROUND_LABELS[round - 1] ?? `Krug ${round}`}
            </h2>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
              {situations.filter((s) => s.round === round).map((s) => (
                <Situation key={s.id} s={s} worldId={worldId} onChange={refresh} />
              ))}
            </div>
            {report?.mentorQuestion && (
              <Panel tone="mint" title="Mentor">
                <dl className="space-y-3">
                  <div>
                    <dt className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><GraduationCap className="size-4" aria-hidden /> Pitanje mentora</dt>
                    <dd>{report.mentorQuestion}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground">Odgovor studenta</dt>
                    <dd className={cn(!report.reflection && "text-muted-foreground")}>{report.reflection ?? "Još nije odgovorio."}</dd>
                  </div>
                  {report.mentorText && (
                    <div>
                      <dt className="text-xs font-bold text-muted-foreground">Osvrt mentora</dt>
                      <dd>{report.mentorText}</dd>
                    </div>
                  )}
                </dl>
              </Panel>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Situation({ s, worldId, onChange }: { s: SituationView; worldId: string; onChange: () => void }) {
  const a = s.answer;
  const { label, tone } = how(a, s.state);
  const option = s.options.find((o) => o.id === a?.optionId);
  return (
    <Panel>
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.character.name} · {s.character.role}</p>
          </div>
          <span className="flex flex-wrap gap-1.5">
            <Pill tone={tone}>{label}</Pill>
            {a && <Pill tone={a.quality >= 4 ? "up" : a.quality === 3 ? "warn" : "down"}>{a.quality} / 5{a.overridden && " · profesor"}</Pill>}
          </span>
        </div>

        {(a?.text ?? option?.text) && <blockquote className="rounded-xl bg-muted px-4 py-3 whitespace-pre-line">{a?.text ?? option?.text}</blockquote>}
        {a?.verdict && (
          <p className="text-sm">
            <strong>Presuda:</strong> ispunjeno kriterija {a.verdict.criteriaMet.length}. <span className="text-muted-foreground">{a.verdict.reasoning}</span>
          </p>
        )}
        {s.transcript.length > 0 && (
          <details className="rounded-xl border px-4 py-2">
            <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold">Razgovor s likom ({s.transcript.length} {plural(s.transcript.length, "poruka", "poruke", "poruka")})</summary>
            <ol className="space-y-2 pb-2">
              {s.transcript.map((t, i) => (
                <li key={i} className={cn("text-sm", t.role === "student" && "text-right")}>
                  <span className={cn("inline-block max-w-[90%] rounded-xl px-3 py-2 text-left", t.role === "student" ? "bg-primary text-primary-foreground" : "bg-muted")}>{t.text}</span>
                </li>
              ))}
            </ol>
          </details>
        )}
        {a && <ChangeGrade worldId={worldId} situationId={s.id} current={a.quality} onChange={onChange} />}
      </div>
    </Panel>
  );
}

// "Promijeni ocjenu": the professor overrides the engine's 1–5 after reading the answer.
function ChangeGrade({ worldId, situationId, current, onChange }: { worldId: string; situationId: string; current: Quality; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function set(q: Quality) {
    if (busy || q === current) return;
    setBusy(true);
    setError(null);
    try {
      await api.overrideQuality(worldId, situationId, q);
      onChange();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <fieldset className="flex flex-wrap items-center gap-2" disabled={busy}>
        <legend className="sr-only">Promijeni ocjenu</legend>
        <span className="text-sm font-semibold text-muted-foreground">Promijeni ocjenu:</span>
        {QUALITIES.map((q) => (
          <button
            key={q}
            type="button"
            aria-pressed={q === current}
            onClick={() => set(q)}
            className={cn(
              "size-11 rounded-xl font-bold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60",
              q === current ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary",
            )}
          >
            {q}
          </button>
        ))}
      </fieldset>
      {error && <FormError key={error}>{error}</FormError>}
    </div>
  );
}
