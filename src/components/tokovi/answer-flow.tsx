"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Calculator, Gavel, Gauge, MessageSquareText, Sparkles, Building2, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/panel";
import { AI_NOTE, buildAnswerFlow, type AnswerFlowInput, type AnswerStep, type AnswerStepId } from "@/lib/tokovi/answer-flow";

const ICONS: Record<AnswerStepId, LucideIcon> = {
  odgovor: MessageSquareText,
  sudac: Gavel,
  kvaliteta: Gauge,
  ucinak: Calculator,
  odjeli: Building2,
};

const TONES = { plain: "surface", dark: "gloss-night", up: "border border-mint bg-mint", down: "border border-sand bg-sand" } as const;

function StepCard({ step, selected, onSelect, controls, className }: { step: AnswerStep; selected: boolean; onSelect: () => void; controls?: string; className?: string }) {
  const Icon = ICONS[step.id];
  const dark = step.tone === "dark";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-controls={controls}
      className={cn(
        "rounded-[var(--radius)] p-4 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-shadow",
        TONES[step.tone ?? "plain"],
        selected && "outline-2 outline-primary",
        className,
      )}
    >
      <span className="mb-2 flex items-center gap-2">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", dark ? "bg-white/15" : "bg-secondary text-secondary-foreground")}>
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="text-base leading-tight font-bold">{step.title}</span>
      </span>
      {step.big && <span className="block text-2xl leading-tight font-extrabold tracking-tight whitespace-nowrap tabular-nums">{step.big}</span>}
      <span className={cn("mt-1 block text-sm leading-snug font-medium", dark ? "text-white/75" : "text-muted-foreground")}>{step.small}</span>
    </button>
  );
}

const H4 = "mb-1.5 text-[0.8125rem] font-bold tracking-wide text-muted-foreground uppercase";

function Detail({ step, wide }: { step: AnswerStep; wide?: boolean }) {
  return (
    <div className={cn(wide ? "grid grid-cols-3 gap-5" : "space-y-4")}>
      <h3 className={cn("text-xl font-extrabold tracking-tight", wide && "col-span-3")}>{step.title}</h3>
      <section aria-label="Ulaz">
        <h4 className={H4}>Ulaz</h4>
        <dl className="rounded-2xl bg-muted px-3.5 py-1.5 text-sm">
          {step.inputs.map((r) => (
            <div key={r.label} className="flex justify-between gap-3 border-b border-border py-2 last:border-0">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="text-right font-bold">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-label="Pravilo">
        <h4 className={H4}>Pravilo</h4>
        <div className="gloss-night rounded-2xl px-4 py-3.5 text-sm leading-relaxed">
          {step.rule.map((l) => (
            <p key={l} className="mb-1.5 last:mb-0">{l}</p>
          ))}
          {step.calc && <p className="mt-2 border-t border-white/15 pt-2 font-semibold tabular-nums">{step.calc}</p>}
        </div>
      </section>
      <section aria-label="Izlaz">
        <h4 className={H4}>Izlaz</h4>
        <dl className="rounded-2xl bg-secondary px-4 py-2">
          {step.outputs.map((r) => (
            <div key={r.label} className={cn("py-1.5", r.value.length > 36 ? "space-y-0.5" : "flex items-baseline justify-between gap-3")}>
              <dt className="text-sm font-semibold text-muted-foreground">{r.label}</dt>
              <dd className={cn("tabular-nums", r.value.length <= 36 && "text-right", r.strong ? "text-xl font-extrabold whitespace-nowrap text-secondary-foreground" : "text-sm font-bold")}>{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {step.note && <p className={cn(wide && "col-span-3", "rounded-2xl border border-sand bg-sand px-4 py-3 text-sm leading-relaxed font-medium")}>{step.note}</p>}
    </div>
  );
}

export function AnswerFlow({ input }: { input: AnswerFlowInput }) {
  const uid = useId();
  const steps = buildAnswerFlow(input);
  const [selected, setSelected] = useState<AnswerStepId>();
  const detail = useRef<HTMLElement>(null);
  const shown = steps.find((s) => s.id === selected);

  useEffect(() => {
    if (!selected) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    detail.current?.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(undefined);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const toggle = (id: AnswerStepId) => setSelected(selected === id ? undefined : id);

  return (
    <div className="space-y-5">
      <p className="flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-base font-semibold text-secondary-foreground">
        <Sparkles className="mt-0.5 size-5 shrink-0" aria-hidden /> {AI_NOTE}
      </p>
      <p className="text-sm text-muted-foreground">Klikni korak da vidiš što je ušlo, koje je pravilo primijenjeno i što je izašlo.</p>

      {/* Desktop: steps in a row joined by arrows; the open step shows Ulaz, Pravilo, Izlaz right under the row. */}
      <div className="hidden space-y-5 md:block">
        <ol className="flex items-stretch">
          {steps.map((s, i) => (
            <li key={s.id} className="flex min-w-0 flex-1 items-stretch">
              {i > 0 && (
                <span aria-hidden className="flex w-7 shrink-0 items-center justify-center text-muted-foreground">
                  <ArrowRight className={cn("size-5", selected && (selected === s.id || selected === steps[i - 1].id) && "text-primary")} />
                </span>
              )}
              <StepCard step={s} selected={selected === s.id} onSelect={() => toggle(s.id)} className="min-w-0 flex-1" />
            </li>
          ))}
        </ol>
        {shown && (
          <aside aria-label="Kako je izračunat korak" ref={detail} className="surface relative scroll-mt-4 rounded-[var(--radius)] p-6">
            <button type="button" onClick={() => setSelected(undefined)} aria-label="Zatvori" className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary">
              <X className="size-5" aria-hidden />
            </button>
            <div className="pr-10">
              <Detail step={shown} wide />
            </div>
          </aside>
        )}
      </div>

      {/* Mobile: vertical list, the open step shows its panel right under it. */}
      <ol className="md:hidden">
        {steps.map((s, i) => (
          <li key={s.id}>
            {i > 0 && (
              <div aria-hidden className="mx-auto flex h-7 w-6 justify-center">
                <span className="h-full w-0.5 rounded-full bg-[#c3d0e6]" />
              </div>
            )}
            <StepCard step={s} selected={selected === s.id} onSelect={() => toggle(s.id)} controls={selected === s.id ? `${uid}-${s.id}` : undefined} className="w-full" />
            {selected === s.id && (
              <div id={`${uid}-${s.id}`} className="mt-2 rounded-[var(--radius)] border bg-card p-4">
                <Detail step={s} />
              </div>
            )}
          </li>
        ))}
      </ol>

      {!input.rubric?.length && (
        <Panel tone="sand" pad="sm">
          <p className="text-sm">Za ovu situaciju za sada vidiš samo koliko je kriterija ispunjeno, bez njihovih tekstova.</p>
        </Panel>
      )}
    </div>
  );
}
