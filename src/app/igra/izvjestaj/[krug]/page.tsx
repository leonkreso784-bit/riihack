"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { METRIC_LABELS, ROUND_LABELS } from "@/lib/rules";
import type { MetricKey, RoundReportView } from "@/lib/types";
import { Panel } from "@/components/panel";
import { FormError } from "@/components/form";
import { Delta, METRIC_ICONS } from "@/components/metric-bar";
import { MentorDialog } from "@/components/mentor-dialog";

const back = (
  <Link href="/igra" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-secondary-foreground hover:underline">
    <ArrowLeft className="size-4" aria-hidden /> Moja tvrtka
  </Link>
);

// R7: report of a closed month: how each metric moved, then the mentor's question and the student's reflection.
// The question is generated on the first read (AI, a few seconds) and saved, so this loads once, not every 3 s.
export default function ReportPage() {
  const round = Number(useParams<{ krug: string }>().krug);
  const { data, error } = usePoll(() => api.report(round), 10 * 60_000);
  const [answered, setAnswered] = useState<RoundReportView>();
  const month = ROUND_LABELS[round - 1] ?? `Krug ${round}`;

  if (error && !data)
    return (
      <div className="space-y-4 pt-4 md:pt-0">
        {back}
        <FormError>{error.message}</FormError>
      </div>
    );
  const report = answered ?? data;

  return (
    <div className="space-y-5 pt-4 md:pt-0">
      {back}
      <header>
        <p className="text-sm font-semibold text-muted-foreground">Izvještaj mjeseca</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{month}</h1>
        <Link href={`/igra/izvjestaj/${round}/tok`} className="inline-flex min-h-11 items-center font-semibold text-secondary-foreground hover:underline">
          Kako je izračunat mjesec →
        </Link>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
        <Panel title="Što se promijenilo">
          {report ? (
            <ul className="divide-y">
              {(Object.keys(METRIC_LABELS) as MetricKey[]).map((k) => {
                const Icon = METRIC_ICONS[k];
                const before = report.metricsBefore[k];
                const after = report.metricsAfter[k];
                return (
                  <li key={k} className="flex items-center gap-3 py-3">
                    <Icon className="size-5 shrink-0 text-secondary-foreground" aria-hidden />
                    <span className="flex-1 font-semibold">{METRIC_LABELS[k]}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {before} → <strong className="text-foreground">{after}</strong>
                    </span>
                    <Delta value={after - before} className="w-14 text-right text-sm" />
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="h-56 animate-pulse rounded-xl bg-muted" aria-busy="true" aria-label="Učitavam" />
          )}
        </Panel>

        <Panel title="Razgovor s mentorom" tone="mint">
          {report ? <MentorDialog report={report} onAnswered={setAnswered} /> : <p className="text-muted-foreground">Mentor razmišlja…</p>}
        </Panel>
      </div>
    </div>
  );
}
