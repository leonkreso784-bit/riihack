"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Megaphone, Tag } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { eur, num } from "@/lib/format";
import { activeIn, breakdown, staffCostOf } from "@/lib/finance-view";
import { FIXED_COST_PER_ROOM, MARKETING_MAX, PRICE_MAX, PRICE_MIN, ROUND_LABELS } from "@/lib/rules";
import type { MeResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
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

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:items-start">
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

          <Cost data={data} price={plan.price} marketing={plan.marketing} />

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

const Row = ({ label, value, className }: { label: string; value: string; className?: string }) => (
  <div className="flex items-baseline justify-between gap-3 py-1.5">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className={cn("font-bold tabular-nums", className)}>{value}</dd>
  </div>
);

// What this month's plan costs and how many nights it takes to break even, from the same items the engine settles
// (finance-view.ts). Updates live while the sliders move; last month's numbers next to it for comparison.
function Cost({ data, price, marketing }: { data: MeResponse; price: number; marketing: number }) {
  const { company, contracts, world, plan } = data;
  const active = activeIn(contracts, world.round);
  const staff = staffCostOf(company);
  const rooms = company.roomsCount * FIXED_COST_PER_ROOM;
  const contractCosts = active.reduce((s, c) => s + c.monthlyCost, 0);
  const contractRevenue = active.reduce((s, c) => s + c.nights * c.pricePerNight, 0);
  const investments = Object.values(plan.investments ?? {}).reduce((s, v) => s + (v ?? 0), 0);
  const total = staff + rooms + marketing + contractCosts + investments;
  const last = data.finances.at(-1);
  const capacity = last?.capacityNights ?? company.roomsCount * 30; // ponytail: 30 nights per room until the first settlement
  const breakEven = Math.max(0, Math.ceil((total - contractRevenue) / price));
  const lastItems = last && breakdown(last, company, contracts);

  return (
    <Panel title="Što ova odluka košta">
      <dl className="divide-y">
        <Row label="Osoblje" value={eur(staff)} />
        <Row label="Održavanje soba" value={eur(rooms)} />
        <Row label="Marketing" value={eur(marketing)} />
        {contractCosts > 0 && <Row label="Ugovori s tvrtkama" value={eur(contractCosts)} />}
        <Row label="Ulaganja u odjele" value={eur(investments)} />
        <Row label="Rashodi ovog mjeseca" value={eur(total)} className="text-lg" />
      </dl>
      <p className={cn("mt-3 rounded-xl px-4 py-3 text-sm", breakEven > capacity ? "bg-down-soft text-down" : "bg-muted")}>
        {contractRevenue > 0 && <>Ugovori donose {eur(contractRevenue)}. </>}
        Da pokriješ rashode po cijeni od {eur(price)} trebaš <strong>{num(breakEven)} noćenja</strong> (
        {Math.round((breakEven / capacity) * 100)} % popunjenosti od {num(capacity)} mogućih).
        {breakEven > capacity && " To je više nego što hotel može primiti: ovaj mjesec ide u gubitak."}
      </p>
      {last && lastItems && (
        <div className="mt-4">
          <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{ROUND_LABELS[last.round - 1] ?? "Prošli mjesec"} za usporedbu</p>
          <dl className="divide-y">
            <Row label="Popunjenost" value={`${last.occupancyPct} %`} />
            <Row label="Rashodi" value={eur(last.costs)} />
            <Row label="Marketing" value={eur(lastItems.costs.marketing)} />
            <Row label="Dobit" value={eur(last.profit)} className={last.profit < 0 ? "text-down" : "text-up"} />
          </dl>
        </div>
      )}
      <Link href="/igra/osoblje" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-secondary-foreground hover:underline">
        Ulaganja po odjelima: {eur(investments)} <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Panel>
  );
}
