"use client";

import { useState } from "react";
import { AlertTriangle, Moon, Sun, Sunset, Users } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { eur } from "@/lib/format";
import { DEPARTMENT_METRIC, INVEST_EFFECT_CAP, INVEST_EFFECT_DIVISOR, INVEST_MAX, METRIC_LABELS, ROUND_LABELS, STAFF_DEPARTMENT_LABELS, STAFF_SHIFT_LABELS } from "@/lib/rules";
import type { DepartmentInvestments, DepartmentView, StaffDepartment, StaffMember, StaffShift } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Pill, type Tone } from "@/components/pill";
import { FormError, SubmitButton } from "@/components/form";

const DEPARTMENTS = Object.keys(STAFF_DEPARTMENT_LABELS) as StaffDepartment[];
const SHIFT: Record<StaffShift, { icon: typeof Sun; tone: Tone }> = {
  morning: { icon: Sun, tone: "warn" },
  afternoon: { icon: Sunset, tone: "accent" },
  night: { icon: Moon, tone: "neutral" },
};
// Same formula as the engine (rules.ts): the metric moves by at most INVEST_EFFECT_CAP per month.
const effect = (eurPerMonth: number) => Math.min(INVEST_EFFECT_CAP, Math.floor(eurPerMonth / INVEST_EFFECT_DIVISOR));

// Departments of the hotel: each one's metric, people, warnings and this month's investment. Investments are saved with
// the month's plan (price and marketing stay as they are). Staff never changes during a game, so it polls slowly.
export default function DepartmentsPage() {
  const { data, error } = usePoll(api.me);
  const { data: staff } = usePoll(api.staff, 60_000);
  const [draft, setDraft] = useState<DepartmentInvestments>();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();

  if (error && !data) return <FormError>{error.message}</FormError>;
  if (!data || !staff) return <p className="pt-6 text-muted-foreground">Učitavam…</p>;

  const { world, company, plan } = data;
  const invest = draft ?? plan.investments ?? {};
  const total = DEPARTMENTS.reduce((sum, d) => sum + (invest[d] ?? 0), 0);
  const open = world.status === "running" && company.closedRound < world.round;
  const month = (ROUND_LABELS[world.round - 1] ?? `krug ${world.round}`).toLowerCase();
  const views = new Map((data.departments ?? []).map((v) => [v.department, v]));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMsg(undefined);
    try {
      await api.plan({ price: plan.price, marketing: plan.marketing, investments: invest });
      setMsg({ ok: true, text: `Ulaganja za ${month} su spremljena.` });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6 pt-4 md:pt-0">
      <PageHeader title="Odjeli" subtitle={`${staff.length} ljudi u ${DEPARTMENTS.length} odjela · ulaganja za ${month}`} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2">
        {DEPARTMENTS.map((d) => (
          <Department
            key={d}
            department={d}
            view={views.get(d)}
            people={staff.filter((s) => s.department === d)}
            value={invest[d] ?? 0}
            disabled={!open || saving}
            onChange={(v) => setDraft({ ...invest, [d]: v })}
          />
        ))}
      </div>

      <div className="surface sticky bottom-20 z-10 space-y-2 rounded-[var(--radius)] p-3 md:bottom-4 md:p-4">
        {msg && (msg.ok ? <p role="status" className="rounded-xl bg-mint px-3 py-2 text-sm font-medium text-up">{msg.text}</p> : <FormError key={msg.text}>{msg.text}</FormError>)}
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0">
            <span className="block text-xs font-semibold text-muted-foreground">Ukupno ovaj mjesec</span>
            <span className="text-xl font-extrabold tabular-nums">{eur(total)}</span>
          </p>
          {open ? (
            <div className="w-44 shrink-0">
              <SubmitButton busy={saving} busyText="Spremam…">Spremi ulaganja</SubmitButton>
            </div>
          ) : (
            <p className="max-w-[60%] text-right text-sm text-muted-foreground">Mjesec je zatvoren. Ulagati možeš kad profesor otvori sljedeći.</p>
          )}
        </div>
      </div>
    </form>
  );
}

function Department({
  department,
  view,
  people,
  value,
  disabled,
  onChange,
}: {
  department: StaffDepartment;
  view?: DepartmentView;
  people: StaffMember[];
  value: number;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  const metric = view?.metric ?? DEPARTMENT_METRIC[department];
  const id = `invest-${department}`;
  const plus = effect(value);
  return (
    <Panel
      title={view?.label ?? STAFF_DEPARTMENT_LABELS[department]}
      action={
        <Pill>
          <Users className="size-3.5" aria-hidden /> {view?.staffCount ?? people.length}
        </Pill>
      }
    >
      <div className="space-y-4">
        <p className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{METRIC_LABELS[metric]}</span>
          {view && <span className="font-bold tabular-nums">{view.metricValue}/100</span>}
        </p>

        {view?.alerts.map((a) => (
          <p key={a} className="flex items-start gap-2 rounded-xl bg-sand px-3 py-2 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden /> {a}
          </p>
        ))}

        <div className="space-y-1.5">
          <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm font-semibold">
            Ulaganje ovog mjeseca
            <span className="tabular-nums">{eur(value)}</span>
          </label>
          <input
            id={id}
            type="range"
            min={0}
            max={INVEST_MAX}
            step={250}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-primary disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            {plus > 0 ? `+${plus} ${METRIC_LABELS[metric].toLowerCase()} na kraju mjeseca` : `Svakih ${eur(INVEST_EFFECT_DIVISOR)} donosi +1, najviše +${INVEST_EFFECT_CAP}`}
          </p>
        </div>

        <ul className="divide-y border-t">
          {people.map((p) => {
            const { icon: Icon, tone } = SHIFT[p.shift];
            return (
              <li key={p.name} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-bold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.role}</p>
                  {p.note && <p className="mt-1 text-sm">{p.note}</p>}
                </div>
                <Pill tone={tone} className="shrink-0">
                  <Icon className="size-3.5" aria-hidden /> {STAFF_SHIFT_LABELS[p.shift]}
                </Pill>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}
