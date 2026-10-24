"use client";

import { ChartColumn, Percent, Trophy, Wallet } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { eur, num } from "@/lib/format";
import { breakdown, growthPct, type Breakdown } from "@/lib/finance-view";
import { ROUND_LABELS } from "@/lib/rules";
import type { RoundFinance } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { cn } from "@/lib/utils";
import { FlowLink } from "@/components/flow-link";

type Month = { f: RoundFinance; b: Breakdown; growth: number | null };

// One row of the summary table: a label and one cell per closed month.
type Line = { label: string; value: (m: Month) => string; strong?: boolean; tone?: (m: Month) => string | undefined; indent?: boolean };
const signed = (n: number) => `${n < 0 ? "−" : ""}${eur(Math.abs(n))}`;
const LINES: (Line | string)[] = [
  "Prihodi",
  { label: "Gosti u sobama", value: (m) => eur(m.b.revenue.rooms), indent: true },
  { label: "Ugovori s agencijama", value: (m) => eur(m.b.revenue.contracts), indent: true },
  { label: "Ukupni prihodi", value: (m) => eur(m.f.revenue), strong: true },
  "Rashodi",
  { label: "Osoblje", value: (m) => eur(m.b.costs.staff), indent: true },
  { label: "Održavanje soba", value: (m) => eur(m.b.costs.rooms), indent: true },
  { label: "Marketing", value: (m) => eur(m.b.costs.marketing), indent: true },
  { label: "Ugovori s tvrtkama", value: (m) => eur(m.b.costs.contracts), indent: true },
  { label: "Ulaganja u odjele", value: (m) => eur(m.b.costs.investments), indent: true },
  { label: "Ukupni rashodi", value: (m) => eur(m.f.costs), strong: true },
  "Rezultat",
  { label: "Dobit / gubitak", value: (m) => signed(m.f.profit), strong: true, tone: (m) => (m.f.profit < 0 ? "text-down" : "text-up") },
  { label: "Rast prihoda", value: (m) => (m.growth === null ? "·" : `${m.growth > 0 ? "▲ +" : m.growth < 0 ? "▼ " : ""}${m.growth} %`), tone: (m) => (m.growth === null ? undefined : m.growth < 0 ? "text-down" : "text-up") },
  { label: "Stanje nakon mjeseca", value: (m) => eur(m.f.cashAfter) },
  "Poslovanje",
  { label: "Noćenja (gosti + ugovori)", value: (m) => `${num(m.f.nights)} + ${num(m.f.contractNights)}` },
  { label: "Popunjenost", value: (m) => `${m.f.occupancyPct} %` },
  { label: "Udio turista grada", value: (m) => `${m.f.marketSharePct} %` },
  { label: "Prihod po noćenju", value: (m) => { const n = m.f.nights + m.f.contractNights; return n ? eur(Math.round(m.f.revenue / n)) : "·"; } },
];

// Hotel money: where it stands, rank in class, and a month-by-month statement (revenue and cost items, result,
// operations). Items come from finance-view.ts, which rebuilds the engine's sums.
export default function FinancePage() {
  const { data, error } = usePoll(api.me);
  if (error) return <p role="alert" className="rounded-xl bg-down-soft px-4 py-3 text-down">{error.message}</p>;
  if (!data) return <div className="h-80 animate-pulse rounded-[var(--radius)] bg-muted" aria-busy="true" aria-label="Učitavam" />;

  const { company, finances, leaderboard, contracts } = data;
  const diff = company.cash - company.startCash;
  const months: Month[] = finances.map((f, i) => ({ f, b: breakdown(f, company, contracts), growth: growthPct(finances[i - 1]?.revenue, f.revenue) }));
  const totalProfit = finances.reduce((s, f) => s + f.profit, 0);
  const avgOccupancy = finances.length ? Math.round(finances.reduce((s, f) => s + f.occupancyPct, 0) / finances.length) : null;
  const rank = [...leaderboard].sort((a, b) => b.cash - a.cash).findIndex((r) => r.companyId === company.id) + 1;
  const maxCash = Math.max(company.startCash, ...finances.map((f) => f.cashAfter));

  return (
    <div className="space-y-5 pt-4 md:pt-0">
      <PageHeader title="Financije" subtitle="Novac hotela i obračun po mjesecima." />
      {finances.length > 0 && (
        <FlowLink href={`/igra/izvjestaj/${finances[finances.length - 1].round}/tok`} title="Kako je izračunat mjesec" hint="Obračun korak po korak i „Što ako?“" />
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Stanje računa" value={num(company.cash)} unit="€" tone="accent" note={`${diff >= 0 ? "+" : "−"}${eur(Math.abs(diff))} od početnih ${eur(company.startCash)}`} />
        <StatCard icon={ChartColumn} label="Dobit sezone" value={num(totalProfit)} unit="€" tone={totalProfit < 0 ? "down" : "up"} note={`${finances.length} obračunat${finances.length === 1 ? "" : "a"} mjesec${finances.length === 1 ? "" : "a"}`} />
        <StatCard icon={Percent} label="Prosječna popunjenost" value={avgOccupancy ?? "—"} unit={avgOccupancy === null ? "" : "%"} />
        <StatCard icon={Trophy} label="Rang po novcu" value={rank ? `${rank}.` : "—"} unit="" note={`od ${leaderboard.length} hotela`} />
      </div>

      {months.length === 0 ? (
        <Panel tone="sand">
          <p className="text-sm">Prvi obračun stiže kad profesor zatvori mjesec.</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-start">
          <Panel title="Financijski sažetak">
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full min-w-[22rem] text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th scope="col" className="py-2 text-left font-semibold"><span className="sr-only">Stavka</span></th>
                    {months.map((m) => (
                      <th key={m.f.round} scope="col" className="px-1 py-2 text-right font-semibold">{ROUND_LABELS[m.f.round - 1] ?? `Krug ${m.f.round}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LINES.map((l) =>
                    typeof l === "string" ? (
                      <tr key={l}>
                        <th colSpan={months.length + 1} scope="colgroup" className="pt-4 pb-1 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">{l}</th>
                      </tr>
                    ) : (
                      <tr key={l.label} className={cn("border-t", l.strong && "font-bold")}>
                        <th scope="row" className={cn("py-2 text-left", l.strong ? "font-bold" : "font-normal", l.indent && "pl-3 text-muted-foreground")}>{l.label}</th>
                        {months.map((m) => (
                          <td key={m.f.round} className={cn("px-1 py-2 text-right tabular-nums", l.tone?.(m))}>{l.value(m)}</td>
                        ))}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Obračun se objavljuje kad profesor zatvori mjesec.</p>
          </Panel>

          <Panel title="Stanje računa kroz sezonu">
            <ol className="space-y-3">
              {[{ label: "Početak", cash: company.startCash }, ...finances.map((f) => ({ label: ROUND_LABELS[f.round - 1] ?? `Krug ${f.round}`, cash: f.cashAfter }))].map((p) => (
                <li key={p.label}>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{p.label}</span>
                    <span className="font-bold tabular-nums">{eur(p.cash)}</span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-muted">
                    <div className={cn("anim-grow h-full rounded-full", p.cash < 0 ? "bg-down" : "bg-primary")} style={{ width: `${Math.max(2, (Math.max(0, p.cash) / maxCash) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      )}
    </div>
  );
}
