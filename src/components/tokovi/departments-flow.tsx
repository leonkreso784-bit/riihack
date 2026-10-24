"use client";

import { useId, useMemo, useState } from "react";
import { AlertTriangle, Banknote, Calculator, Gauge, HandCoins, MessagesSquare, Sparkles, Users, type LucideIcon } from "lucide-react";
import { INVEST_MAX } from "@/lib/rules";
import type { StaffDepartment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Delta } from "@/components/metric-bar";
import { Panel } from "@/components/panel";
import { Slider, StepFlow } from "@/components/tokovi/flow-ui";
import { AI_NOTE, buildDepartmentFlows, WHATIF_LABEL, whatIfDepartment, type DepartmentsFlowInput, type DeptStepId } from "@/lib/tokovi/departments-flow";
import { eur } from "@/lib/tokovi/month-flow";
import { signed } from "@/lib/tokovi/answer-flow";

const ICONS: Record<DeptStepId, LucideIcon> = {
  ljudi: Users,
  upozorenja: AlertTriangle,
  ulaganje: HandCoins,
  pravilo: Calculator,
  situacije: MessagesSquare,
  pokazatelj: Gauge,
  trosak: Banknote,
};

const STEP = 100;

export function DepartmentsFlow({ input }: { input: DepartmentsFlowInput }) {
  const uid = useId();
  const flows = useMemo(() => buildDepartmentFlows(input), [input]);
  const [dept, setDept] = useState<StaffDepartment>(flows[0].department);
  const [scenario, setScenario] = useState<Partial<Record<StaffDepartment, number>>>({});
  const flow = flows.find((f) => f.department === dept) ?? flows[0];
  const planned = input.plan[flow.department] ?? 0;
  const amount = scenario[flow.department] ?? planned;
  const w = whatIfDepartment(input, flow.department, amount);
  const changed = amount !== planned;
  // Slider steps of STEP; a plan saved with another step is still reachable through the max.
  const max = Math.max(INVEST_MAX, planned);

  return (
    <div className="space-y-5">
      <p className="flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-base font-semibold text-secondary-foreground">
        <Sparkles className="mt-0.5 size-5 shrink-0" aria-hidden /> {AI_NOTE}
      </p>

      <div role="group" aria-label="Odjel" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {flows.map((f) => (
          <button
            key={f.department}
            type="button"
            aria-pressed={f.department === flow.department}
            onClick={() => setDept(f.department)}
            className={cn(
              "min-h-14 rounded-[var(--radius)] px-3.5 py-2.5 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-shadow",
              f.department === flow.department ? "gloss-night" : "surface",
            )}
          >
            <span className="block text-base leading-tight font-bold">{f.label}</span>
            <span className={cn("block text-sm leading-snug font-medium", f.department === flow.department ? "text-white/75" : "text-muted-foreground")}>{f.metricLabel}</span>
          </button>
        ))}
      </div>

      <Panel title="Što ako?" tone="accent">
        <p className="mb-4 text-sm text-muted-foreground">{WHATIF_LABEL}</p>
        <Slider
          id={`${uid}-ulaganje`}
          label={`Ulaganje: ${flow.label}`}
          value={amount}
          min={0}
          max={max}
          step={STEP}
          disabled={false}
          format={eur}
          onChange={(n) => setScenario({ ...scenario, [flow.department]: n })}
        />
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-live="polite">
          <div className="rounded-2xl bg-card px-3.5 py-3">
            <div className="text-xs font-semibold text-muted-foreground">Učinak odjela</div>
            <div className="text-lg font-extrabold tabular-nums">{signed(w.ownEffect)}</div>
            <Delta value={w.ownEffect - flow.ownEffect} className="text-sm" />
          </div>
          <div className="rounded-2xl bg-card px-3.5 py-3">
            <div className="text-xs font-semibold text-muted-foreground">{flow.metricLabel} po zatvaranju</div>
            <div className="text-lg font-extrabold tabular-nums">{w.expected}/100</div>
            <Delta value={w.expected - w.expectedPlan} className="text-sm" />
          </div>
          <div className="rounded-2xl bg-card px-3.5 py-3">
            <div className="text-xs font-semibold text-muted-foreground">Trošak odjela</div>
            <div className="text-lg font-extrabold whitespace-nowrap tabular-nums">{eur(w.cost)}</div>
            <span className={cn("text-sm font-bold whitespace-nowrap tabular-nums", w.costDelta > 0 ? "text-down" : w.costDelta < 0 ? "text-up" : "text-muted-foreground")}>
              {w.costDelta === 0 ? "±0 €" : `${w.costDelta > 0 ? "+" : "−"}${eur(Math.abs(w.costDelta))}`}
            </span>
          </div>
          <div className="rounded-2xl bg-card px-3.5 py-3">
            <div className="text-xs font-semibold text-muted-foreground">Troškovi svih odjela</div>
            <div className="text-lg font-extrabold whitespace-nowrap tabular-nums">{eur(w.totalCost)}</div>
            <span className="text-sm text-muted-foreground">u troškovima mjeseca</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {w.atCap ? "Strop učinka je dosegnut, dodatno ulaganje ne donosi više." : w.nextAt !== null && w.nextAt <= max ? `Sljedeći bod učinka kreće od ${eur(w.nextAt)}.` : "Do kraja klizača nema sljedećeg boda učinka."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setScenario({ ...scenario, [flow.department]: undefined })}
            disabled={!changed}
            className="min-h-11 rounded-full border bg-card px-5 text-sm font-bold text-secondary-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
          >
            Vrati plan
          </button>
          {changed && <span className="text-sm font-semibold text-muted-foreground">Ovo je procjena, ništa se ne sprema. Ulaganje stvarno mijenjaš na stranici Odjeli.</span>}
        </div>
      </Panel>

      <StepFlow key={flow.department} steps={flow.steps} icons={ICONS} perRow={4} />
    </div>
  );
}
