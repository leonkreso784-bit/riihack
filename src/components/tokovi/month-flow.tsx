"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BedDouble, Building2, Euro, FileText, Gauge, Magnet, Play, Receipt, Star, Tag, TrendingUp, Wallet, X, type LucideIcon } from "lucide-react";
import { num } from "@/lib/format";
import { MARKETING_MAX, PRICE_MAX, PRICE_MIN } from "@/lib/rules";
import type { RoundFinance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/panel";
import { Delta } from "@/components/metric-bar";
import { buildMonthFlow, ESTIMATE_LABEL, eur, estimateWhatIf, type FlowStep, type StepId } from "@/lib/tokovi/month-flow";

const ICONS: Record<StepId, LucideIcon> = {
  start: Play,
  ugled: Star,
  plan: Tag,
  ugovori: FileText,
  privlacnost: Magnet,
  trziste: Building2,
  nocenja: BedDouble,
  prihod: TrendingUp,
  troskovi: Receipt,
  dobit: Euro,
  financije: Gauge,
  novac: Wallet,
};

// Desktop layout: left edge x and centre y of every card on a 1560 wide canvas (columns left to right).
const CANVAS = { w: 1560, h: 800 };
const POS: Record<StepId, { x: number; y: number; w?: number }> = {
  start: { x: 0, y: 260, w: 150 },
  ugled: { x: 190, y: 90 },
  plan: { x: 190, y: 260, w: 208 },
  privlacnost: { x: 458, y: 170 },
  ugovori: { x: 458, y: 470 },
  troskovi: { x: 458, y: 680 },
  trziste: { x: 690, y: 170 },
  nocenja: { x: 922, y: 170 },
  prihod: { x: 1154, y: 170 },
  dobit: { x: 1154, y: 450 },
  financije: { x: 1384, y: 340 },
  novac: { x: 1384, y: 600 },
};
const EDGES: [StepId, StepId][] = [
  ["start", "ugled"], ["start", "plan"],
  ["ugled", "privlacnost"], ["plan", "privlacnost"], ["privlacnost", "trziste"], ["ugovori", "trziste"], ["trziste", "nocenja"], ["nocenja", "prihod"],
  ["plan", "troskovi"], ["ugovori", "troskovi"],
  ["prihod", "dobit"], ["troskovi", "dobit"], ["dobit", "financije"], ["dobit", "novac"],
];
const CARD_W = 176;
const HALF_H = 70; // rough half height of a card, only used for the vertical connector

const TONES: Record<NonNullable<FlowStep["tone"]> | "plain", string> = {
  plain: "surface",
  dark: "gloss-night",
  money: "border border-mint bg-mint",
  up: "surface",
  down: "surface",
};

const signedEur = (n: number) => `${n < 0 ? "−" : n > 0 ? "+" : ""}${eur(Math.abs(n))}`;

function MoneyDelta({ value }: { value: number }) {
  const tone = value > 0 ? "text-up" : value < 0 ? "text-down" : "text-muted-foreground";
  const text = value > 0 ? `▲ +${eur(value)}` : value < 0 ? `▼ −${eur(-value)}` : "±0 €";
  return <span className={cn("font-bold whitespace-nowrap tabular-nums", tone)}>{text}</span>;
}

function StepCard({ step, selected, onSelect, className, style, controls }: { step: FlowStep; selected: boolean; onSelect: () => void; className?: string; style?: React.CSSProperties; controls?: string }) {
  const Icon = ICONS[step.id];
  const dark = step.tone === "dark";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-controls={controls}
      style={style}
      className={cn(
        "rounded-[var(--radius)] p-3.5 text-left outline-offset-2 motion-safe:transition-shadow focus-visible:outline-2 focus-visible:outline-primary",
        TONES[step.tone ?? "plain"],
        selected && "outline-2 outline-primary hover:shadow-lg",
        className,
      )}
    >
      <span className="mb-2 flex items-center gap-2">
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", dark ? "bg-white/15" : "bg-secondary text-secondary-foreground")}>
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="text-base leading-tight font-bold">{step.title}</span>
      </span>
      {step.big && <span className={cn("block text-2xl leading-tight font-extrabold tracking-tight whitespace-nowrap tabular-nums", step.tone === "up" && "text-up", step.tone === "down" && "text-down")}>{step.big}</span>}
      <span className={cn("mt-1 block text-[0.85rem] leading-snug font-medium", dark ? "text-white/70" : "text-muted-foreground")}>{step.small}</span>
    </button>
  );
}

function StepDetail({ step, wide }: { step: FlowStep; wide?: boolean }) {
  return (
    <div className={cn(wide ? "grid grid-cols-3 gap-5" : "space-y-4")}>
      <h3 className={cn("text-xl font-extrabold tracking-tight", wide && "col-span-3")}>{step.title}</h3>
      <section aria-label="Ulaz">
        <h4 className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">Ulaz</h4>
        <dl className="rounded-2xl bg-muted px-3.5 py-1.5 text-sm">
          {step.inputs.map((r) => (
            <div key={r.label} className="flex justify-between gap-3 border-b border-border py-2 last:border-0">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="text-right font-bold whitespace-nowrap tabular-nums">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-label="Pravilo">
        <h4 className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">Pravilo</h4>
        <div className="gloss-night rounded-2xl px-4 py-3.5 text-sm leading-relaxed">
          {step.rule.map((l) => (
            <p key={l} className="mb-1.5 last:mb-0">{l}</p>
          ))}
          {step.calc && <p className="mt-2 border-t border-white/15 pt-2 font-semibold tabular-nums">{step.calc}</p>}
        </div>
      </section>
      <section aria-label="Izlaz">
        <h4 className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">Izlaz</h4>
        <dl className="rounded-2xl bg-secondary px-4 py-2">
          {step.outputs.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-3 py-1.5">
              <dt className="text-sm font-semibold text-muted-foreground">{r.label}</dt>
              <dd className={cn("text-right whitespace-nowrap tabular-nums", r.strong ? "text-xl font-extrabold text-secondary-foreground" : "font-bold")}>{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {step.note && <p className={cn(wide && "col-span-3", "rounded-2xl border border-sand bg-sand px-4 py-3 text-sm leading-relaxed font-medium")}>{step.note}</p>}
    </div>
  );
}

function Slider({ id, label, value, min, max, step, onChange, disabled, format }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; disabled: boolean; format: (n: number) => string }) {
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

export function MonthFlow({ finance, rooms, hotelsInCity, round }: { finance: RoundFinance; rooms: { basePrice: number }[]; hotelsInCity: number; round: number }) {
  const uid = useId();
  const real = useMemo(() => buildMonthFlow(finance, rooms, hotelsInCity, round), [finance, rooms, hotelsInCity, round]);
  const [scenario, setScenario] = useState<{ price: number; marketing: number }>();
  const [selected, setSelected] = useState<StepId>();

  const wrap = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  const detail = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => setScrolls(el.scrollWidth > el.clientWidth + 1);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [real]);

  useEffect(() => {
    if (!selected) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    detail.current?.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(undefined);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  if (!real) {
    return (
      <Panel tone="sand">
        <p className="text-sm">Ovaj mjesec je obračunat prije nego što smo spremali raspodjelu prihoda i troškova, pa ga ne možemo prikazati korak po korak.</p>
      </Panel>
    );
  }

  const base = real.base;
  const current = scenario ?? { price: base.price, marketing: base.marketing };
  const est = estimateWhatIf(finance, rooms, current);
  const flow = scenario ? (buildMonthFlow(finance, rooms, hotelsInCity, round, scenario) ?? real) : real;
  const steps = flow.steps;
  const byId = Object.fromEntries(steps.map((s) => [s.id, s])) as Record<StepId, FlowStep>;
  const shown = selected ? byId[selected] : undefined;
  const f = est.ok ? est.finance : finance;
  const changed = est.ok && est.changed;

  const priceMin = Math.max(PRICE_MIN, Math.min(base.price, Math.floor(base.price * 0.5)));
  const priceMax = Math.min(PRICE_MAX, Math.max(base.price, Math.ceil(base.price * 1.6)));
  const set = (patch: Partial<typeof current>) => setScenario({ ...current, ...patch });
  const effect = (p: number) => Math.max(-5, Math.min(5, Math.trunc(p / 2000))) + 0;

  const lit = (a: StepId, b: StepId) => selected === a || selected === b;

  return (
    <div className="space-y-5">
      <Panel title="Što ako?" tone="accent">
        <p className="mb-4 text-sm text-muted-foreground">{est.ok ? ESTIMATE_LABEL : est.reason}</p>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-5 md:grid-cols-2">
          <Slider id={`${uid}-cijena`} label="Cijena po noći" value={current.price} min={priceMin} max={priceMax} step={1} disabled={!est.ok} format={eur} onChange={(n) => set({ price: n })} />
          <Slider id={`${uid}-marketing`} label="Marketing" value={current.marketing} min={0} max={MARKETING_MAX} step={current.marketing % 50 === 0 ? 50 : 1} disabled={!est.ok} format={eur} onChange={(n) => set({ marketing: n })} />
        </div>
        {est.ok && (
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-live="polite">
            <div className="rounded-2xl bg-card px-3.5 py-3">
              <div className="text-xs font-semibold text-muted-foreground">Noćenja</div>
              <div className="text-lg font-extrabold tabular-nums">{num(f.nights)}</div>
              <Delta value={f.nights - finance.nights} className="text-sm" />
            </div>
            <div className="rounded-2xl bg-card px-3.5 py-3">
              <div className="text-xs font-semibold text-muted-foreground">Prihod</div>
              <div className="text-lg font-extrabold tabular-nums">{eur(f.revenue)}</div>
              <MoneyDelta value={f.revenue - finance.revenue} />
            </div>
            <div className="rounded-2xl bg-card px-3.5 py-3">
              <div className="text-xs font-semibold text-muted-foreground">Dobit</div>
              <div className={cn("text-lg font-extrabold tabular-nums", f.profit < 0 && "text-down")}>{signedEur(f.profit)}</div>
              <MoneyDelta value={f.profit - finance.profit} />
            </div>
            <div className="rounded-2xl bg-card px-3.5 py-3">
              <div className="text-xs font-semibold text-muted-foreground">Pokazatelj Financije</div>
              <div className="text-lg font-extrabold tabular-nums">{effect(f.profit) > 0 ? `+${effect(f.profit)}` : effect(f.profit) < 0 ? `−${-effect(f.profit)}` : "0"}</div>
              <Delta value={effect(f.profit) - effect(finance.profit)} className="text-sm" />
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setScenario(undefined)}
            disabled={!scenario}
            className="min-h-11 rounded-full border bg-card px-5 text-sm font-bold text-secondary-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
          >
            Vrati stvarni mjesec
          </button>
          {changed && <span className="text-sm font-semibold text-muted-foreground">Ovo je procjena, ne stvarni obračun. Pomaci su u odnosu na stvarni mjesec.</span>}
        </div>
      </Panel>

      <p className="text-sm text-muted-foreground">Klikni korak da vidiš što je ušlo, koje je pravilo primijenjeno i što je izašlo.</p>

      {/* Desktop: cards in columns joined by lines; the open step opens its panel (Ulaz, Pravilo, Izlaz) right under the flow. */}
      <div className="hidden space-y-5 md:block">
          {scrolls && <p className="text-sm font-semibold text-muted-foreground">Povuci vodoravno za cijeli tok →</p>}
          <div className="relative min-w-0">
          <div ref={wrap} className="min-w-0 overflow-x-auto pb-2">
          <div style={{ width: CANVAS.w, height: CANVAS.h }} className="relative">
            <div style={{ width: CANVAS.w, height: CANVAS.h }} className="absolute top-0 left-0">
              <svg width={CANVAS.w} height={CANVAS.h} className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
                {EDGES.map(([a, b]) => {
                  const A = POS[a];
                  const B = POS[b];
                  const vertical = A.x === B.x;
                  const x1 = vertical ? A.x + CARD_W / 2 : A.x + (A.w ?? CARD_W);
                  const y1 = vertical ? A.y + HALF_H : A.y;
                  const x2 = vertical ? B.x + CARD_W / 2 : B.x;
                  const y2 = vertical ? B.y - HALF_H : B.y;
                  const mx = (x1 + x2) / 2;
                  const d = vertical ? `M${x1} ${y1} L${x2} ${y2}` : `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
                  return <path key={`${a}-${b}`} d={d} fill="none" strokeWidth={2.5} strokeLinecap="round" className={cn("motion-safe:transition-[stroke]", lit(a, b) ? "stroke-primary" : "stroke-[#c3d0e6]")} />;
                })}
              </svg>
              {steps.map((s) => {
                const p = POS[s.id];
                return (
                  <StepCard
                    key={s.id}
                    step={s}
                    selected={selected === s.id}
                    onSelect={() => setSelected(selected === s.id ? undefined : s.id)}
                    className="absolute -translate-y-1/2"
                    style={{ left: p.x, top: p.y, width: p.w ?? CARD_W }}
                  />
                );
              })}
            </div>
          </div>
        </div>
          {scrolls && (
            <>
              <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
              <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
            </>
          )}
          </div>

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
            <StepCard step={s} selected={selected === s.id} onSelect={() => setSelected(selected === s.id ? undefined : s.id)} controls={selected === s.id ? `${uid}-${s.id}` : undefined} className="w-full" />
            {selected === s.id && (
              <div id={`${uid}-${s.id}`} className="mt-2 rounded-[var(--radius)] border bg-card p-4">
                <StepDetail step={s} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
