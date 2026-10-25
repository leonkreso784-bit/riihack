"use client";

// Zajednički dijelovi Tokova: kartica koraka, detalj (Ulaz, Pravilo, Izlaz), klizač i raspored koraka
// (desktop red sa strelicama, mobilni okomiti popis). Koristi ih skica 2 (odgovor) i skica 3 (odjeli).
import { useEffect, useId, useRef, useState } from "react";
import { ArrowDown, ArrowRight, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type FlowRowData = { label: string; value: string; strong?: boolean };
export type FlowStepData = {
  id: string;
  title: string;
  small: string;
  big?: string;
  tone?: "dark" | "up" | "down";
  inputs: FlowRowData[];
  rule: string[];
  calc?: string;
  outputs: FlowRowData[];
  note?: string;
};

const TONES = { plain: "surface", dark: "gloss-night", up: "border border-mint bg-mint", down: "border border-sand bg-sand" } as const;

export function StepCard({ step, icon: Icon, selected, onSelect, controls, className }: { step: FlowStepData; icon: LucideIcon; selected: boolean; onSelect: () => void; controls?: string; className?: string }) {
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

export function StepDetail({ step, wide }: { step: FlowStepData; wide?: boolean }) {
  return (
    <div className={cn(wide ? "grid grid-cols-3 gap-5" : "space-y-4")}>
      <h3 className={cn("text-xl font-extrabold tracking-tight", wide && "col-span-3")}>{step.title}</h3>
      <section aria-label="Ulaz">
        <h4 className={H4}>Ulaz</h4>
        <dl className="rounded-2xl bg-muted px-3.5 py-1.5 text-sm">
          {step.inputs.map((r, i) => (
            <div key={`${r.label}:${i}`} className="flex justify-between gap-3 border-b border-border py-2 last:border-0">
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
          {step.outputs.map((r, i) => (
            <div key={`${r.label}:${i}`} className={cn("py-1.5", r.value.length > 36 ? "space-y-0.5" : "flex items-baseline justify-between gap-3")}>
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

export function Slider({ id, label, value, min, max, step, onChange, disabled, format }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; disabled: boolean; format: (n: number) => string }) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm font-bold">
        {label}
        <span className="text-lg font-extrabold text-secondary-foreground tabular-nums">{format(value)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="my-2 h-2.5 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

/** Koraci u nizu: desktop red sa strelicama i detalj ispod reda, mobilno okomiti popis s detaljem ispod otvorenog koraka. */
export function StepFlow({ steps, icons, perRow = steps.length }: { steps: FlowStepData[]; icons: Record<string, LucideIcon>; perRow?: number }) {
  const rows = Array.from({ length: Math.ceil(steps.length / perRow) }, (_, r) => steps.slice(r * perRow, (r + 1) * perRow));
  const uid = useId();
  const [selected, setSelected] = useState<string>();
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

  const toggle = (id: string) => setSelected(selected === id ? undefined : id);

  return (
    <>
      <p className="text-sm text-muted-foreground">Klikni korak da vidiš što je ušlo, koje je pravilo primijenjeno i što je izašlo.</p>

      {/* Desktop: steps in a row joined by arrows; the open step shows Ulaz, Pravilo, Izlaz right under the row. */}
      <div className="hidden space-y-5 md:block">
        {rows.map((row, r) => (
          <div key={r} className="space-y-2">
            {r > 0 && (
              <div aria-hidden className="flex justify-center text-muted-foreground">
                <ArrowDown className="size-5" />
              </div>
            )}
            <ol className="flex items-stretch">
              {row.map((s, i) => {
                const prev = i > 0 ? row[i - 1] : undefined;
                return (
                  <li key={s.id} className="flex min-w-0 flex-1 items-stretch">
                    {prev && (
                      <span aria-hidden className="flex w-7 shrink-0 items-center justify-center text-muted-foreground">
                        <ArrowRight className={cn("size-5", selected && (selected === s.id || selected === prev.id) && "text-primary")} />
                      </span>
                    )}
                    <StepCard step={s} icon={icons[s.id]} selected={selected === s.id} onSelect={() => toggle(s.id)} className="min-w-0 flex-1" />
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
        {shown && (
          <aside aria-label="Kako je izračunat korak" ref={detail} className="surface relative scroll-mt-4 rounded-[var(--radius)] p-6">
            <button type="button" onClick={() => setSelected(undefined)} aria-label="Zatvori" className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary">
              <X className="size-5" aria-hidden />
            </button>
            <div className="pr-10">
              <StepDetail step={shown} wide />
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
            <StepCard step={s} icon={icons[s.id]} selected={selected === s.id} onSelect={() => toggle(s.id)} controls={selected === s.id ? `${uid}-${s.id}` : undefined} className="w-full" />
            {selected === s.id && (
              <div id={`${uid}-${s.id}`} className="mt-2 rounded-[var(--radius)] border bg-card p-4">
                <StepDetail step={s} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
