"use client";

import { Wallet } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { eur, num } from "@/lib/format";
import { ROUND_LABELS } from "@/lib/rules";
import type { RoundFinance } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { cn } from "@/lib/utils";

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("font-bold tabular-nums", className)}>{value}</dd>
    </div>
  );
}

function MonthCard({ f }: { f: RoundFinance }) {
  return (
    <Panel title={ROUND_LABELS[f.round - 1] ?? `Krug ${f.round}`}>
      <dl className="divide-y">
        <Row label="Prihod" value={eur(f.revenue)} />
        <Row label="Troškovi" value={eur(f.costs)} />
        <Row label="Dobit" value={eur(f.profit)} className={f.profit < 0 ? "text-down" : "text-up"} />
        <Row label="Noćenja" value={`${num(f.nights + f.contractNights)} noćenja`} />
        <Row label="Popunjenost" value={`${f.occupancyPct} %`} />
        <Row label="Udio tržišta" value={`${f.marketSharePct} % turista grada`} />
        <Row label="Stanje nakon mjeseca" value={eur(f.cashAfter)} />
      </dl>
    </Panel>
  );
}

export default function FinancePage() {
  const { data, error } = usePoll(api.me);
  if (error) return <p role="alert" className="rounded-xl bg-down-soft px-4 py-3 text-down">{error.message}</p>;
  if (!data) return <div className="h-80 animate-pulse rounded-[var(--radius)] bg-muted" aria-busy="true" aria-label="Učitavam" />;

  const { cash, startCash } = data.company;
  const diff = cash - startCash;
  return (
    <div className="space-y-5 pt-4 md:pt-0">
      <PageHeader title="Financije" subtitle="Novac hotela i obračun po mjesecima." />
      <StatCard
        icon={Wallet}
        label="Stanje računa"
        value={num(cash)}
        unit="€"
        tone="accent"
        note={`${diff >= 0 ? "+" : "−"}${eur(Math.abs(diff))} u odnosu na početnih ${eur(startCash)}`}
      />
      {data.finances.length === 0 ? (
        <Panel tone="sand">
          <p className="text-sm">Prvi obračun stiže kad profesor zatvori mjesec.</p>
        </Panel>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {[...data.finances].reverse().map((f) => (
            <MonthCard key={f.round} f={f} />
          ))}
        </div>
      )}
    </div>
  );
}
