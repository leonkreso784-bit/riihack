"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api, usePoll } from "@/lib/client";
import { METRIC_LABELS, ROUND_LABELS } from "@/lib/rules";
import type { MetricKey } from "@/lib/types";
import { Panel } from "@/components/panel";
import { FormError } from "@/components/form";
import { Delta, METRIC_ICONS } from "@/components/metric-bar";
import { Hint } from "@/components/hint";
import { METRIC_HINTS } from "@/lib/hints";
import { GraduationCap } from "lucide-react";
import { FlowLink } from "@/components/flow-link";
import { BackLink } from "@/components/back-link";

const back = (
  <BackLink href="/igra" label="Moja tvrtka" />
);

// R7: report of a closed month: how each metric moved, and the way to the mentor's conversation about it.
// Reading the report also generates the mentor's question (AI, a few seconds) and saves it, so this loads once, not every 3 s.
export default function ReportPage() {
  const round = Number(useParams<{ krug: string }>().krug);
  // Dok mjesec traje brojke su privremene pa se osvježavaju češće (profesor može zatvoriti mjesec dok je stranica otvorena).
  const [provisional, setProvisional] = useState(true);
  const pollMs = provisional ? 15_000 : 10 * 60_000;
  const { data, error } = usePoll(() => api.report(round), pollMs);
  const world = usePoll(api.me, pollMs).data?.world;
  const isProvisional = world?.round === round && world.status !== "finished";
  if (world && provisional !== isProvisional) setProvisional(isProvisional);
  const month = ROUND_LABELS[round - 1] ?? `Krug ${round}`;

  if (error && !data)
    return (
      <div className="space-y-4 pt-4 md:pt-0">
        {back}
        <FormError>{error.message}</FormError>
      </div>
    );

  return (
    <div className="space-y-5 pt-4 md:pt-0">
      {back}
      <header>
        <p className="text-sm font-semibold text-muted-foreground">Izvještaj mjeseca</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{month}</h1>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {/* BUG-070: the conversation itself lives on /igra/mentor with every other month. */}
        <FlowLink
          href={`/igra/mentor#mjesec-${round}`}
          icon={GraduationCap}
          title="Razgovor s mentorom"
          hint={data?.mentorQuestion && !data.reflection ? "Mentor te nešto pita, odgovori mu" : `Mentorov osvrt na ${month.toLowerCase()}`}
        />
        <FlowLink href={`/igra/izvjestaj/${round}/tok`} title="Kako je izračunat mjesec" hint="Obračun korak po korak i „Što ako?“" />
      </div>

      <div className="max-w-2xl">
        <Panel title="Što se promijenilo">
          {data && isProvisional && (
            <p className="mb-2 text-sm text-muted-foreground">Brojke su privremene; konačne su nakon što profesor zatvori mjesec.</p>
          )}
          {data ? (
            <ul className="divide-y">
              {(Object.keys(METRIC_LABELS) as MetricKey[]).map((k) => {
                const Icon = METRIC_ICONS[k];
                const before = data.metricsBefore[k];
                const after = data.metricsAfter[k];
                return (
                  <li key={k} className="flex items-center gap-3 py-3">
                    <Icon className="size-5 shrink-0 text-secondary-foreground" aria-hidden />
                    <span className="flex flex-1 items-center gap-2 font-semibold">
                      {METRIC_LABELS[k]} <Hint label={METRIC_LABELS[k]} text={METRIC_HINTS[k]} />
                    </span>
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
      </div>
    </div>
  );
}
