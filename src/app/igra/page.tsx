"use client";

import { api, usePoll } from "@/lib/client";
import { METRIC_LABELS, ROUND_LABELS } from "@/lib/rules";
import { num } from "@/lib/format";
import type { MetricKey } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { MetricBar } from "@/components/metric-bar";
import { Pill } from "@/components/pill";

// ponytail: temporary R0 check that the shell and components work on mock data; R4 replaces this page.
export default function GamePage() {
  const { data, error } = usePoll(api.me);
  if (error) return <p className="text-down">{error.message}</p>;
  if (!data) return <p className="text-muted-foreground">Učitavam…</p>;

  const { company, world } = data;
  const last = data.finances.at(-1);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title={company.hotelName} subtitle={`${company.place} · ${"★".repeat(company.stars)}`} />
        <Pill tone="accent">
          Krug {world.round} od {world.maxRounds} · {ROUND_LABELS[world.round - 1]}
        </Pill>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Stanje računa" value={num(company.cash)} unit="€" tone="accent" />
        <StatCard label="Napredak" value={company.progress > 0 ? `+${company.progress}` : company.progress} unit="bodova" tone={company.progress >= 0 ? "up" : "down"} />
        <StatCard label="Popunjenost" value={last?.occupancyPct ?? 0} unit="%" />
      </div>

      <section className="space-y-4 rounded-[var(--radius)] border bg-card p-5">
        <h2 className="font-bold">Pokazatelji (početak prema sada)</h2>
        {(Object.keys(METRIC_LABELS) as MetricKey[]).map((k) => (
          <MetricBar key={k} label={METRIC_LABELS[k]} start={company.startMetrics[k]} now={company.metrics[k]} />
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        <Pill>neutralno</Pill>
        <Pill tone="accent">krug otvoren</Pill>
        <Pill tone="up">zatvorio krug</Pill>
        <Pill tone="warn">još igra</Pill>
        <Pill tone="down">u kvaru</Pill>
      </div>
    </div>
  );
}
