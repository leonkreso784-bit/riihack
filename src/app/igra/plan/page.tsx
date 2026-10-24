"use client";

import { useState } from "react";
import { Megaphone, Tag } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { eur } from "@/lib/format";
import { COST_LABELS, staffCostFor, activeContracts, delta, estimateCostParts, monthlyCosts, planInvestments } from "@/lib/finance-view";
import { MARKETING_MAX, PRICE_MAX, PRICE_MIN, ROUND_LABELS } from "@/lib/rules";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { ContractOffers } from "@/components/city/contract-offers";

const SLIDER = "h-11 w-full cursor-pointer accent-primary";

function Slider({ id, label, icon: Icon, value, min, max, step, onChange }: {
  id: string; label: string; icon: typeof Tag; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="size-4 text-secondary-foreground" aria-hidden />
          {label}
        </label>
        <output htmlFor={id} className="text-2xl font-extrabold tabular-nums">{eur(value)}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={SLIDER} />
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{eur(min)}</span>
        <span>{eur(max)}</span>
      </div>
    </div>
  );
}

function Delta({ cur, prev }: { cur: number; prev: number | undefined }) {
  const d = delta(cur, prev);
  if (!d) return <span className="text-muted-foreground">–</span>;
  if (!d.arrow) return <span className="text-muted-foreground">bez promjene</span>;
  // za cijenu je rast dobra, za troškove loša: boju ne tumačimo, samo smjer
  return (
    <span className="font-bold">
      {d.arrow} {d.diff > 0 ? "+" : "−"}{eur(Math.abs(d.diff))}
    </span>
  );
}

function CompareRow({ name, now, before, d }: { name: string; now: string; before: string; d: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-0.5 py-2">
      <dt className="font-semibold">{name}</dt>
      <dd className="text-right tabular-nums">{d}</dd>
      <dd className="text-xs text-muted-foreground tabular-nums">Sada {now}</dd>
      <dd className="text-right text-xs text-muted-foreground tabular-nums">Prošlo {before}</dd>
    </div>
  );
}

export default function PlanPage() {
  const { data, error } = usePoll(api.me);
  const [draft, setDraft] = useState<{ price: number; marketing: number }>();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();

  if (error) return <p role="alert" className="rounded-xl bg-down-soft px-4 py-3 text-down">{error.message}</p>;
  if (!data) return <div className="h-80 animate-pulse rounded-[var(--radius)] bg-muted" aria-busy="true" aria-label="Učitavam" />;

  const plan = draft ?? data.plan;
  const last = data.finances.at(-1);
  const month = ROUND_LABELS[data.world.round - 1] ?? `krug ${data.world.round}`;

  // Troškovi iz TRENUTNIH vrijednosti klizača (ista formula kao motor, lib/finance-view.ts).
  const staffCost = staffCostFor(data.company.templateId, data.company.roomsCount);
  const roomsCount = data.company.roomsCount;
  const contractsNow = activeContracts(data.contracts, data.world.round);
  const investments = planInvestments(data.plan, data.departments);
  const costs = monthlyCosts({ staffCost, roomsCount, marketing: plan.marketing, contractsCost: contractsNow.reduce((s, c) => s + c.monthlyCost, 0), investments });
  const rows = (Object.keys(COST_LABELS) as (keyof typeof COST_LABELS)[]).map((k) => ({ key: k, label: COST_LABELS[k], amount: costs[k] }));

  // Prošli mjesec: troškovi i ulaganja su stvarni, marketing je procjena (ostatak troškova), cijena je prosjek prihoda po noćenju.
  const prevContracts = last ? activeContracts(data.contracts, last.round) : [];
  const prevMarketing = last
    ? (estimateCostParts(last, { staffCost, roomsCount, contractsCost: prevContracts.reduce((s, c) => s + c.monthlyCost, 0) }).find((p) => p.key === "marketing")?.amount ?? 0)
    : undefined;
  const prevNights = last ? last.nights + last.contractNights : 0;
  const prevPrice = last && prevNights > 0 ? Math.round(last.revenue / prevNights) : undefined;

  async function save() {
    setSaving(true);
    setMsg(undefined);
    try {
      await api.plan({ price: plan.price, marketing: plan.marketing });
      setMsg({ ok: true, text: "Plan je spremljen." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message || "Plan nije spremljen. Pokušaj ponovno." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pt-4 md:pt-0">
      <PageHeader title={`Plan za ${month.toLowerCase()}`} subtitle="Odredi cijenu noćenja i marketing prije nego profesor zatvori mjesec." />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <div className="space-y-5">
          <Panel title="Tvoj plan">
            <div className="space-y-6">
              <Slider id="price" label="Cijena noćenja" icon={Tag} value={plan.price} min={PRICE_MIN} max={PRICE_MAX} step={1} onChange={(price) => setDraft({ ...plan, price })} />
              <Slider id="marketing" label="Marketing ovog mjeseca" icon={Megaphone} value={plan.marketing} min={0} max={MARKETING_MAX} step={50} onChange={(marketing) => setDraft({ ...plan, marketing })} />
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="gloss inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Spremam…" : "Spremi plan"}
              </button>
              {msg && (
                <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-up" : "rounded-xl bg-down-soft px-4 py-3 text-sm text-down"}>
                  {msg.text}
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Što ova odluka košta">
            <dl className="divide-y">
              {rows.map((r) => (
                <div key={r.key} className="flex items-baseline justify-between gap-3 py-1.5">
                  <dt className="text-sm text-muted-foreground">{r.label}</dt>
                  <dd className="font-bold tabular-nums">{eur(r.amount)}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 pt-2.5">
                <dt className="text-sm font-bold">Troškovi mjeseca ukupno</dt>
                <dd className="text-xl font-extrabold tabular-nums" aria-live="polite">{eur(costs.total)}</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-xl bg-sand px-3 py-2 text-xs">Prihod ovisi o tržištu i ostalim hotelima; zna se nakon obračuna.</p>
          </Panel>

          {last && (
            <Panel title="Usporedba s prošlim mjesecom">
              <dl className="divide-y text-sm">
                <CompareRow name="Cijena noćenja" now={eur(plan.price)} before={prevPrice !== undefined ? `${eur(prevPrice)} (prosjek)` : "–"} d={<Delta cur={plan.price} prev={prevPrice} />} />
                <CompareRow name="Marketing" now={eur(plan.marketing)} before={prevMarketing !== undefined ? `${eur(prevMarketing)} (procjena)` : "–"} d={<Delta cur={plan.marketing} prev={prevMarketing} />} />
                <CompareRow name="Ulaganja u odjele" now={eur(investments)} before={eur(last.investments ?? 0)} d={<Delta cur={investments} prev={last.investments ?? 0} />} />
                <CompareRow name="Troškovi" now={eur(costs.total)} before={eur(last.costs)} d={<Delta cur={costs.total} prev={last.costs} />} />
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">Cijena i marketing prošlog mjeseca izračunati su iz obračuna, ne spremljeni plan.</p>
            </Panel>
          )}

          <Panel title="Što znati prije odluke" tone="mint">
            <p className="text-sm">
              {last && (
                <>
                  <strong>Prošli mjesec:</strong> {last.occupancyPct} % popunjenosti, {last.marketSharePct} % turista grada.{" "}
                </>
              )}
              Turisti biraju između svih hotela u gradu: niža cijena i bolji glas privlače goste, ali i drugi hoteli odlučuju isto.
            </p>
          </Panel>
        </div>

        <ContractOffers contracts={data.contracts} />
      </div>
    </div>
  );
}
