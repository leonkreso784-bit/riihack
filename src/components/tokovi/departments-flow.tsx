"use client";

// Tokovi, skica 3 (v2): odjeli kao staze. Svaka staza je jedan odjel: ljudi, što ih muči, ulaganje i situacije ovog
// mjeseca, a krivulja vodi u pokazatelj koji odjel hrani. Brojke računa lib/tokovi/departments-flow.ts pravilima motora.
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDown, CheckCircle2, CircleSlash, Gauge, HandCoins, MessagesSquare, Sparkles, X } from "lucide-react";
import { INVEST_EFFECT_CAP, INVEST_EFFECT_DIVISOR, INVEST_MAX } from "@/lib/rules";
import type { StaffDepartment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { plural } from "@/lib/format";
import { Panel } from "@/components/panel";
import { Slider, StepDetail, type FlowStepData } from "@/components/tokovi/flow-ui";
import {
  AI_NOTE,
  buildDepartmentsBoard,
  METRIC_ACCUSATIVE,
  WHATIF_LABEL,
  whatIfDepartment,
  type DepartmentLane,
  type DepartmentsFlowInput,
  type LaneSituation,
  type MetricResult,
} from "@/lib/tokovi/departments-flow";
import { eur } from "@/lib/tokovi/month-flow";
import { signed } from "@/lib/tokovi/answer-flow";

const STEP = 100;

// Staze u bojama skice 2: topla, svježa, plava, pa opet, da se odjeli razlikuju na prvi pogled.
const LANE_BG: Record<StaffDepartment, string> = {
  reception: "bg-[#f8f1e7]",
  kitchen: "bg-[#eaf6f3]",
  housekeeping: "bg-[#edf2fd]",
  maintenance: "bg-[#f6f2ea]",
  management: "bg-[#eef1f7]",
};

const toneText = (n: number) => (n > 0 ? "text-up" : n < 0 ? "text-down" : "text-muted-foreground");
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

type Open = { key: string; step: FlowStepData; eyebrow: string };

/** Ploča detalja: s desne strane na desktopu, odozdo na mobitelu. Esc i klik izvan zatvaraju, fokus se vraća. */
function DetailDrawer({ open, onClose }: { open: Open | undefined; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      back?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Zatvori detalje" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[#10172c]/25 motion-safe:animate-in motion-safe:fade-in" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[var(--radius)] bg-background p-5 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-8 lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-[var(--radius)] lg:p-7 lg:motion-safe:slide-in-from-right-8"
      >
        <button
          ref={close}
          type="button"
          onClick={onClose}
          aria-label="Zatvori"
          className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X className="size-5" aria-hidden />
        </button>
        <p id={titleId} className="mb-1 pr-12 text-xs font-bold tracking-widest text-secondary-foreground uppercase">
          {open.eyebrow}
        </p>
        <div className="pr-1">
          <StepDetail step={open.step} />
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-up" aria-hidden /> Izračunato pravilima igre, bez AI-ja.
        </p>
      </aside>
    </div>
  );
}

function SituationCard({ s, onOpen, selected }: { s: LaneSituation; onOpen: () => void; selected: boolean }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      className={cn(
        "flex min-h-11 w-full flex-col rounded-2xl border-2 bg-card p-3 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-shadow hover:shadow-md",
        s.tone === "good" && "border-up/45 bg-[#f1faf4]",
        s.tone === "bad" && "border-down/45 bg-[#fff5f5]",
        s.tone === "neutral" && "border-border",
        selected && "outline-2 outline-primary",
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="line-clamp-3 text-sm leading-snug font-bold">{s.title}</span>
        {s.tone === "good" ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-up" aria-label="dobro riješeno" />
        ) : s.tone === "bad" ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-down" aria-label="loše riješeno" />
        ) : (
          <CircleSlash className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="bez pomaka" />
        )}
      </span>
      <span className="mt-1 text-xs text-muted-foreground">
        {s.who} · kvaliteta {s.quality}/5
      </span>
      <span className={cn("mt-auto pt-1.5 text-lg leading-none font-extrabold tabular-nums", toneText(s.delta))}>{signed(s.delta)}</span>
    </button>
  );
}

function InvestCard({ lane, onOpen, selected }: { lane: DepartmentLane; onOpen: () => void; selected: boolean }) {
  const on = lane.investment > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      className={cn(
        "flex min-h-11 w-full flex-col rounded-2xl p-3 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-shadow hover:shadow-md",
        on ? "gloss-night" : "border-2 border-dashed border-[#c3d0e6] bg-card/70",
        selected && "outline-2 outline-primary",
      )}
    >
      <span className={cn("flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase", on ? "text-white/75" : "text-muted-foreground")}>
        <HandCoins className="size-3.5" aria-hidden /> Ulaganje
      </span>
      <span className="mt-1 text-lg leading-tight font-extrabold whitespace-nowrap tabular-nums">{eur(lane.investment)}</span>
      <span className={cn("mt-0.5 text-xs leading-snug font-medium", on ? "text-white/80" : "text-muted-foreground")}>
        {lane.ownEffect > 0
          ? `${signed(lane.ownEffect)} ${lane.metricLabel}${lane.ownEffect >= INVEST_EFFECT_CAP ? " (strop)" : ""}`
          : on
            ? `Još bez boda, prvi od ${eur(INVEST_EFFECT_DIVISOR)}`
            : `Nije planirano. ${eur(INVEST_EFFECT_DIVISOR)} donosi +1`}
      </span>
    </button>
  );
}

function ResultCard({ r, onOpen, selected, compact }: { r: MetricResult; onOpen: () => void; selected: boolean; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      className={cn(
        "surface w-full rounded-2xl text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-shadow hover:shadow-lg",
        compact ? "flex min-h-11 items-center justify-between gap-3 px-3.5 py-2.5" : "p-4",
        r.change > 0 && "ring-2 ring-up/30",
        r.change < 0 && "ring-2 ring-down/30",
        selected && "outline-2 outline-primary",
      )}
    >
      {compact ? (
        <>
          <span className="flex items-center gap-2 text-sm font-bold">
            <Gauge className="size-4 text-secondary-foreground" aria-hidden /> {r.label}
          </span>
          <span className="text-base font-extrabold whitespace-nowrap tabular-nums">
            {r.before} → <span className={toneText(r.change)}>{r.expected}</span>
          </span>
        </>
      ) : (
        <>
          <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            <Gauge className="size-3.5" aria-hidden /> Pokazatelj
          </span>
          <span className="mt-1 block text-base leading-tight font-bold">{r.label}</span>
          <span className="mt-2 flex items-baseline gap-2 text-2xl font-extrabold tracking-tight tabular-nums">
            {r.before} <span className="text-base text-muted-foreground">→</span> <span className={toneText(r.change)}>{r.expected}</span>
          </span>
          <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold", r.change > 0 ? "bg-mint text-up" : r.change < 0 ? "bg-down-soft text-down" : "bg-muted text-muted-foreground")}>
            {r.change === 0 ? "bez promjene" : `${signed(r.change)} po zatvaranju`}
          </span>
          <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
            ulaganja {signed(r.invest)} · situacije {signed(r.situations)}
          </span>
        </>
      )}
    </button>
  );
}

function Lane({ lane, result, openKey, onOpen, highlight, laneRef }: { lane: DepartmentLane; result: MetricResult; openKey?: string; onOpen: (o: Open) => void; highlight: boolean; laneRef: (el: HTMLDivElement | null) => void }) {
  const people = lane.people;
  const shown = people?.slice(0, 3) ?? [];
  const more = (people?.length ?? 0) - shown.length;
  const k = (s: string) => `${lane.department}:${s}`;
  const open = (key: string, step: FlowStepData, eyebrow: string) => onOpen({ key: k(key), step, eyebrow });
  return (
    <div ref={laneRef} className={cn("rounded-[var(--radius)] p-3.5 lg:p-4", LANE_BG[lane.department], highlight && "ring-2 ring-primary")}>
      <div className="grid gap-3 lg:grid-cols-[158px_minmax(0,1fr)] lg:gap-4">
        {/* Ljudi */}
        <button
          type="button"
          onClick={() => open("ljudi", lane.details.ljudi, lane.label)}
          aria-pressed={openKey === k("ljudi")}
          className={cn("min-h-11 rounded-2xl p-1 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary", openKey === k("ljudi") && "outline-2 outline-primary")}
        >
          <span className="flex items-baseline justify-between gap-2 lg:block">
            <span className="block text-lg leading-tight font-extrabold tracking-tight">{lane.label}</span>
            <span className="block text-xs font-semibold text-muted-foreground lg:mt-0.5">hrani: {lane.metricLabel}</span>
          </span>
          {people === null ? (
            <span className="mt-2 block text-sm text-muted-foreground">Popis osoblja se učitava</span>
          ) : people.length === 0 ? (
            <span className="mt-2 block text-sm text-muted-foreground">Nema nikoga u odjelu</span>
          ) : (
            <span className="mt-2 block">
              <span className="flex items-center">
                {shown.map((p, i) => (
                  <span key={p.name} className={cn("grid size-8 place-items-center rounded-full border-2 border-white bg-night text-[0.7rem] font-bold text-white", i > 0 && "-ml-2")} aria-hidden>
                    {initials(p.name)}
                  </span>
                ))}
                <span className="ml-2 text-sm font-bold whitespace-nowrap">{people.length === 1 ? "1 osoba" : `${people.length} ${people.length % 10 >= 2 && people.length % 10 <= 4 && (people.length < 12 || people.length > 14) ? "osobe" : "osoba"}`}</span>
              </span>
              <span className="mt-1.5 block space-y-0.5">
                {shown.map((p) => (
                  <span key={p.name} className="block truncate text-xs leading-snug">
                    <span className="font-semibold">{p.name}</span> <span className="text-muted-foreground">· {p.role}</span>
                  </span>
                ))}
                {more > 0 && <span className="block text-xs text-muted-foreground">i još {more}</span>}
              </span>
            </span>
          )}
        </button>

        <div className="min-w-0 space-y-2.5">
          {/* Što ih muči */}
          <div className="flex flex-wrap gap-1.5">
            {lane.alerts.length === 0 ? (
              <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white/70 px-3 text-xs font-semibold text-up">
                <CheckCircle2 className="size-3.5" aria-hidden /> Ništa ih ne muči
              </span>
            ) : (
              <>
                {lane.alerts.slice(0, 3).map((a) => (
                  <button
                    key={a.text}
                    type="button"
                    onClick={() => open("upozorenja", lane.details.upozorenja, lane.label)}
                    className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border border-[#e6c98f] bg-[#fdf1d8] px-3 text-left text-xs font-semibold text-[#7a4a05] outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary lg:min-h-8"
                  >
                    <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{a.text}</span>
                  </button>
                ))}
                {lane.alerts.length > 3 && (
                  <button
                    type="button"
                    onClick={() => open("upozorenja", lane.details.upozorenja, lane.label)}
                    className="inline-flex min-h-11 items-center rounded-full border border-[#e6c98f] bg-white/70 px-3 text-xs font-bold text-[#7a4a05] lg:min-h-8"
                  >
                    i još {lane.alerts.length - 3}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Ulaganje i situacije */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <InvestCard lane={lane} onOpen={() => open("ulaganje", lane.details.ulaganje, lane.label)} selected={openKey === k("ulaganje")} />
            {lane.situations.map((s) => (
              <SituationCard key={s.id} s={s} selected={openKey === k(s.id)} onOpen={() => open(s.id, s.detail, `Situacija · ${lane.label}`)} />
            ))}
            {lane.situations.length === 0 && (
              <div className="col-span-1 flex flex-col rounded-2xl border-2 border-dashed border-[#c3d0e6] p-3 text-xs leading-snug text-muted-foreground sm:col-span-2">
                <span className="mb-1 flex items-center gap-1.5 font-bold tracking-wide uppercase">
                  <MessagesSquare className="size-3.5" aria-hidden /> Situacije
                </span>
                Kad odgovoriš na situaciju koja dira {METRIC_ACCUSATIVE[lane.metric]}, ovdje stiže kartica: zelena za dobar odgovor, crvena za loš.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobitel: strelica dolje u pokazatelj koji odjel hrani. */}
      <div className="mt-2 lg:hidden">
        <div aria-hidden className="flex justify-center py-1 text-muted-foreground">
          <ArrowDown className={cn("size-5", toneText(lane.contribution))} />
        </div>
        <ResultCard r={result} compact selected={openKey === `rez:${result.metric}`} onOpen={() => onOpen({ key: `rez:${result.metric}`, step: result.detail, eyebrow: "Pokazatelj" })} />
      </div>
    </div>
  );
}

type Wire = { d: string; tone: number; label?: string; lx: number; ly: number; key: string };

export function DepartmentsFlow({ input }: { input: DepartmentsFlowInput }) {
  const uid = useId();
  const [scenario, setScenario] = useState<Partial<Record<StaffDepartment, number>>>({});
  const [whatDept, setWhatDept] = useState<StaffDepartment>("reception");
  const [open, setOpen] = useState<Open>();
  const changed = (Object.keys(scenario) as StaffDepartment[]).filter((d) => scenario[d] !== undefined && scenario[d] !== (input.plan[d] ?? 0));
  const plan = useMemo(() => {
    const p = { ...input.plan };
    for (const [d, v] of Object.entries(scenario) as [StaffDepartment, number | undefined][]) if (v !== undefined) p[d] = v;
    return p;
  }, [input.plan, scenario]);
  const board = useMemo(() => buildDepartmentsBoard({ ...input, plan }), [input, plan]);
  const { lanes, results, summary } = board;
  const resultOf = (m: string) => results.find((r) => r.metric === m)!;

  // Krivulje od staze do pokazatelja: mjere se iz stvarnog rasporeda (desktop), na mobitelu se ne crtaju.
  const grid = useRef<HTMLDivElement>(null);
  const laneEls = useRef<Record<string, HTMLDivElement | null>>({});
  const resEls = useRef<Record<string, HTMLDivElement | null>>({});
  const [wires, setWires] = useState<Wire[]>([]);
  const [drawn, setDrawn] = useState(false);
  const measure = useCallback(() => {
    const g = grid.current;
    if (!g || g.offsetWidth === 0) return;
    const box = g.getBoundingClientRect();
    const out: Wire[] = [];
    for (const lane of lanes) {
      const a = laneEls.current[lane.department];
      const b = resEls.current[lane.metric];
      if (!a || !b || b.offsetParent === null) continue;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const x1 = ra.right - box.left;
      const y1 = ra.top + ra.height / 2 - box.top;
      const x2 = rb.left - box.left;
      const y2 = rb.top + rb.height / 2 - box.top;
      const mx = (x1 + x2) / 2;
      out.push({ key: lane.department, d: `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`, tone: lane.contribution, label: lane.contribution !== 0 ? signed(lane.contribution) : undefined, lx: mx, ly: (y1 + y2) / 2 });
    }
    setWires(out);
  }, [lanes]);
  useLayoutEffect(() => {
    measure();
    const g = grid.current;
    if (!g) return;
    const ro = new ResizeObserver(measure);
    ro.observe(g);
    return () => ro.disconnect();
  }, [measure]);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const onClose = useCallback(() => setOpen(undefined), []);
  const planned = input.plan[whatDept] ?? 0;
  const amount = scenario[whatDept] ?? planned;
  const w = whatIfDepartment({ ...input, plan: { ...plan, [whatDept]: planned } }, whatDept, amount);
  const max = Math.max(INVEST_MAX, planned);
  const whatLane = lanes.find((l) => l.department === whatDept)!;

  // Redovi u mreži: odjeli na istom pokazatelju dijele jednu karticu rezultata.
  const rowsOf = (metric: string) => lanes.map((l, i) => (l.metric === metric ? i + 1 : 0)).filter(Boolean);

  return (
    <div className="space-y-5">
      {/* Uvod: mjesec, brojke i napomena o AI-ju u jednom redu. */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="surface rounded-full px-3.5 py-1.5 font-bold">{summary.month}</span>
        <span className="rounded-full bg-sand px-3.5 py-1.5 font-semibold">Ulaganja {eur(summary.totalCost)}</span>
        <span className="rounded-full bg-mint px-3.5 py-1.5 font-semibold">Odgovorene situacije: {summary.answered}</span>
        <span className="gloss-night inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold">
          <Sparkles className="size-4" aria-hidden /> {AI_NOTE}
        </span>
        {changed.length > 0 && <span className="rounded-full bg-secondary px-3.5 py-1.5 font-bold text-secondary-foreground">Prikazuješ procjenu iz „Što ako?“</span>}
      </div>

      {summary.empty && (
        <Panel tone="sand" pad="sm">
          <p className="text-sm leading-relaxed">
            <span className="font-bold">{summary.month} tek počinje.</span> Još nema ulaganja ni odgovorenih situacija, pa se pokazatelji za sada ne miču. Staze ispod pokazuju tko radi u kojem odjelu i kamo će teći tvoje odluke: ulaganje iz{" "}
            <Link href="/igra/plan" className="font-bold text-secondary-foreground underline underline-offset-2">
              plana
            </Link>{" "}
            i svaki odgovor na situaciju.
          </p>
        </Panel>
      )}

      <section aria-label="Odjeli kao staze" className="surface rounded-[var(--radius)] p-3 md:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-sm font-semibold">
            Kako čitati: slijeva nadesno, od odjela do pokazatelja (na mobitelu odozgo prema dolje). Broj na liniji je koliko bodova odjel šalje pokazatelju. Klikni karticu za detalje.
          </p>
          <ul className="flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground" aria-label="Legenda">
            <li className="flex items-center gap-1.5"><span className="size-3 rounded-full border border-[#e6c98f] bg-[#fdf1d8]" aria-hidden /> Što muči odjel</li>
            <li className="flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-up/45 bg-[#f1faf4]" aria-hidden /> Dobar odgovor</li>
            <li className="flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-down/45 bg-[#fff5f5]" aria-hidden /> Loš odgovor</li>
          </ul>
        </div>

        <div ref={grid} className="relative grid gap-3 lg:grid-cols-[minmax(0,1fr)_52px_184px] lg:gap-x-0">
          {lanes.map((lane, i) => (
            <div key={lane.department} style={{ gridRow: i + 1 }} className="lg:col-start-1">
              <Lane
                lane={lane}
                result={resultOf(lane.metric)}
                openKey={open?.key}
                onOpen={setOpen}
                highlight={changed.includes(lane.department)}
                laneRef={(el) => {
                  laneEls.current[lane.department] = el;
                }}
              />
            </div>
          ))}
          {results.map((r) => {
            const rows = rowsOf(r.metric);
            return (
              <div key={r.metric} style={{ gridRow: `${rows[0]} / span ${rows.length}` }} className="hidden self-center lg:col-start-3 lg:block">
                <div
                  ref={(el) => {
                    resEls.current[r.metric] = el;
                  }}
                >
                  <ResultCard r={r} selected={open?.key === `rez:${r.metric}`} onOpen={() => setOpen({ key: `rez:${r.metric}`, step: r.detail, eyebrow: "Pokazatelj" })} />
                </div>
                <p className="mt-1.5 px-1 text-xs text-muted-foreground">{r.departments.length > 1 ? "Hrane ga dva odjela, učinci se zbrajaju." : " "}</p>
              </div>
            );
          })}
          <svg className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible lg:block" aria-hidden>
            {wires.map((wi) => (
              <path
                key={wi.key}
                d={wi.d}
                fill="none"
                strokeWidth={2.5}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={drawn ? 0 : 1}
                className={cn("motion-safe:transition-[stroke-dashoffset] motion-safe:duration-1000 motion-safe:ease-out motion-reduce:[stroke-dashoffset:0]", wi.tone > 0 ? "stroke-up" : wi.tone < 0 ? "stroke-down" : "stroke-[#c3d0e6]")}
              />
            ))}
          </svg>
          {wires
            .filter((wi) => wi.label)
            .map((wi) => (
              <span
                key={`l-${wi.key}`}
                aria-hidden
                style={{ left: wi.lx, top: wi.ly }}
                className={cn("pointer-events-none absolute hidden -translate-x-1/2 -translate-y-1/2 rounded-full border bg-white px-2 py-0.5 text-xs font-extrabold tabular-nums shadow-sm lg:block", toneText(wi.tone))}
              >
                {wi.label}
              </span>
            ))}
        </div>
      </section>

      {/* Sažetak: što odjeli ovaj mjesec rade hotelu. */}
      <section aria-label="Što odjeli ovaj mjesec rade hotelu" className="gloss-night rounded-[var(--radius)] p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-[1.3fr_1fr_1.2fr]">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Što odjeli ovaj mjesec rade hotelu</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              {summary.empty
                ? `Za ${summary.month.toLowerCase()} još ništa: nema ulaganja ni odgovora s učinkom. Prvi bod na pokazatelju odjela daje ulaganje od ${eur(INVEST_EFFECT_DIVISOR)}.`
                : `Ulaganja i odgovori iz staza zbrajaju se po pokazateljima. Sve se upisuje kad se ${summary.month.toLowerCase()} zatvori.`}
              {summary.waiting > 0 && ` Još ${summary.waiting} ${plural(summary.waiting, "situacija čeka", "situacije čekaju", "situacija čeka")} tvoj odgovor.`}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-white/65 uppercase">Trošak ulaganja</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight whitespace-nowrap tabular-nums">{eur(summary.totalCost)}</p>
            <p className="mt-1 text-sm text-white/75">ulazi u troškove mjeseca i snižava dobit, a dobit pomiče Financije</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-white/65 uppercase">Pokazatelji po zatvaranju</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {results.map((r) => (
                <li key={r.metric} className={cn("rounded-full px-2.5 py-1 text-xs font-bold tabular-nums", r.change > 0 ? "bg-[#d9f3e3] text-up" : r.change < 0 ? "bg-down-soft text-down" : "bg-white/12 text-white/80")}>
                  {r.label} {r.change === 0 ? "±0" : signed(r.change)}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setOpen({ key: "sazetak", step: summary.detail, eyebrow: "Sažetak mjeseca" })}
              className="mt-3 min-h-11 rounded-full bg-white px-5 text-sm font-bold text-night outline-offset-2 focus-visible:outline-2 focus-visible:outline-white"
            >
              Kako je izračunato
            </button>
          </div>
        </div>
        <p className="mt-5 border-t border-white/15 pt-4 text-sm text-white/80">
          Pravilo: ulaganje daje bodove tek od {eur(INVEST_EFFECT_DIVISOR)}. Svakih {eur(INVEST_EFFECT_DIVISOR)} je +1 na pokazatelj odjela, najviše {signed(INVEST_EFFECT_CAP)} po odjelu, do {eur(INVEST_MAX)} mjesečno.
        </p>
      </section>

      {/* Što ako: sporedno, jedan odjel i jedan klizač. */}
      <Panel title="Što ako?" tone="accent">
        <p className="mb-3 text-sm text-muted-foreground">{WHATIF_LABEL} Staze iznad odmah pokazuju procjenu.</p>
        <div role="group" aria-label="Odjel za procjenu" className="mb-4 flex flex-wrap gap-2">
          {lanes.map((l) => (
            <button
              key={l.department}
              type="button"
              aria-pressed={l.department === whatDept}
              onClick={() => setWhatDept(l.department)}
              className={cn(
                "min-h-11 rounded-full px-4 text-sm font-bold outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary",
                l.department === whatDept ? "gloss text-white" : "border bg-card text-foreground",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
        <Slider id={`${uid}-ulaganje`} label={`Ulaganje: ${whatLane.label}`} value={amount} min={0} max={max} step={STEP} disabled={false} format={eur} onChange={(n) => setScenario({ ...scenario, [whatDept]: n })} />
        <p className="mt-3 text-sm leading-relaxed" aria-live="polite">
          <span className="font-bold">{whatLane.label}</span> daje <span className={cn("font-extrabold", toneText(w.ownEffect))}>{signed(w.ownEffect)}</span> na {whatLane.metricLabel.toLowerCase()}, pokazatelj po zatvaranju{" "}
          <span className="font-extrabold tabular-nums">{w.expected}/100</span>
          {w.expected !== w.expectedPlan && <span className={cn("font-bold", toneText(w.expected - w.expectedPlan))}> ({signed(w.expected - w.expectedPlan)} prema planu)</span>}. Trošak odjela{" "}
          <span className="font-extrabold whitespace-nowrap tabular-nums">{eur(w.cost)}</span>
          {w.costDelta !== 0 && <span className={cn("font-bold whitespace-nowrap", w.costDelta > 0 ? "text-down" : "text-up")}> ({w.costDelta > 0 ? "+" : "−"}{eur(Math.abs(w.costDelta))})</span>}, svi odjeli {eur(w.totalCost)}.{" "}
          <span className="text-muted-foreground">
            {w.atCap ? "Strop je dosegnut, više novca ne donosi više bodova." : w.nextAt !== null && w.nextAt <= max ? `Sljedeći bod kreće od ${eur(w.nextAt)}.` : ""}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setScenario({})}
            disabled={changed.length === 0}
            className="min-h-11 rounded-full border bg-card px-5 text-sm font-bold text-secondary-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
          >
            Vrati plan
          </button>
          {changed.length > 0 && <span className="text-sm font-semibold text-muted-foreground">Procjena, ništa se ne sprema. Ulaganje stvarno mijenjaš u planu mjeseca.</span>}
        </div>
      </Panel>

      <DetailDrawer open={open} onClose={onClose} />
    </div>
  );
}
