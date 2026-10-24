"use client";

import { useState } from "react";
import { Megaphone, Tag } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { eur } from "@/lib/format";
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
