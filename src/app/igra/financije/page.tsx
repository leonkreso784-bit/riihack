"use client";

import { Landmark, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { eur, num } from "@/lib/format";
import { ROUND_LABELS } from "@/lib/rules";
import {
  activeContracts,
  bonitet,
  contractRevenue,
  estimateCostParts,
  estimateRevenueParts,
  growthPct,
  inBlockade,
  readParts,
  staffCostFor,
  type FinanceExt,
} from "@/lib/finance-view";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { StackedBar } from "@/components/finance/stacked-bar";
import { cn } from "@/lib/utils";

const label = (round: number) => ROUND_LABELS[round - 1] ?? `Krug ${round}`;
const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "");
const TH = "px-3 py-2.5 text-right text-xs font-bold whitespace-nowrap";
const TD = "px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap";

function Row({ name, cells, bold }: { name: string; cells: React.ReactNode[]; bold?: boolean }) {
  return (
    <tr>
      <th scope="row" className={cn("sticky left-0 z-10 bg-card px-3 py-2.5 text-left text-sm whitespace-nowrap", bold ? "font-bold" : "font-semibold text-muted-foreground")}>{name}</th>
      {cells.map((c, i) => (
        <td key={i} className={TD}>{c}</td>
      ))}
    </tr>
  );
}

export default function FinancePage() {
  const { data, error } = usePoll(api.me);
  if (error) return <p role="alert" className="rounded-xl bg-down-soft px-4 py-3 text-down">{error.message}</p>;
  if (!data) return <div className="h-80 animate-pulse rounded-[var(--radius)] bg-muted" aria-busy="true" aria-label="Učitavam" />;

  const { cash, startCash, roomsCount, templateId } = data.company;
  const months = data.finances as FinanceExt[];
  const last = months.at(-1);
  const grade = bonitet(cash, startCash, last?.profit ?? null);
  const blocked = inBlockade(cash);
  const diff = cash - startCash;

  return (
    <div className="space-y-5 pt-4 md:pt-0">
      <PageHeader title="Financije" subtitle="Novac hotela i obračun po mjesecima." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ShieldCheck} label="Bonitetna ocjena" value={grade.grade} unit="" tone={grade.tone === "neutral" ? "neutral" : grade.tone} note={grade.text} />
        <StatCard
          icon={Landmark}
          label="Račun"
          value={blocked ? "U blokadi" : "Nije u blokadi"}
          unit=""
          tone={blocked ? "down" : "up"}
          note={blocked ? "Novac je ispod nule: poslovanje je ograničeno." : "Novac na računu nije ispod nule."}
        />
        <StatCard
          icon={Wallet}
          label="Novac na računu"
          value={num(cash)}
          unit="€"
          tone="accent"
          note={`${diff >= 0 ? "+" : "−"}${eur(Math.abs(diff))} u odnosu na početnih ${eur(startCash)}`}
        />
        <StatCard
          icon={TrendingUp}
          label="Dobit zadnjeg mjeseca"
          value={last ? `${sign(last.profit)}${num(Math.abs(last.profit))}` : "–"}
          unit={last ? "€" : ""}
          tone={last ? (last.profit < 0 ? "down" : "up") : "neutral"}
          note={last ? label(last.round) : "Još nema obračuna"}
        />
      </div>

      {!last ? (
        <Panel tone="sand">
          <p className="text-sm">Prvi obračun stiže kad profesor zatvori mjesec. Tada ovdje vidiš prihode, rashode, dobit i raspodjelu troškova.</p>
        </Panel>
      ) : (
        <>
          <Panel title="Obračun po mjesecima" pad="list" className="pb-0 overflow-hidden">
            <div className="-mx-5 overflow-x-auto md:-mx-6" tabIndex={0} aria-label="Tablica obračuna po mjesecima">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr className="border-y bg-muted/60">
                    <th scope="col" className="sticky left-0 z-10 bg-muted px-3 py-2.5 text-left text-xs font-bold whitespace-nowrap">Pokazatelj</th>
                    {months.map((f) => (
                      <th key={f.round} scope="col" className={TH}>{label(f.round)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <Row name="Ukupni prihodi" cells={months.map((f) => <span key={f.round}>{eur(f.revenue)}</span>)} />
                  <Row name="Ukupni rashodi" cells={months.map((f) => <span key={f.round}>{eur(f.costs)}</span>)} />
                  <Row
                    name="Dobit / gubitak"
                    bold
                    cells={months.map((f) => (
                      <span key={f.round} className={cn("font-bold", f.profit < 0 ? "text-down" : "text-up")}>
                        {sign(f.profit)}{eur(Math.abs(f.profit))}
                      </span>
                    ))}
                  />
                  <Row
                    name="Rast / pad prihoda"
                    cells={months.map((f, i) => {
                      const g = growthPct(months[i - 1]?.revenue, f.revenue);
                      if (g === null) return <span key={f.round} className="text-muted-foreground">–</span>;
                      return (
                        <span key={f.round} className={g < 0 ? "text-down" : g > 0 ? "text-up" : ""}>
                          {g > 0 ? "▲" : g < 0 ? "▼" : ""} {Math.abs(g)} %
                        </span>
                      );
                    })}
                  />
                  <Row name="Novac nakon mjeseca" cells={months.map((f) => <span key={f.round}>{eur(f.cashAfter)}</span>)} />
                  <Row name="Popunjenost" cells={months.map((f) => <span key={f.round}>{f.occupancyPct} %</span>)} />
                  <Row name="Tržišni udio" cells={months.map((f) => <span key={f.round}>{f.marketSharePct} %</span>)} />
                </tbody>
              </table>
            </div>
          </Panel>

          <Breakdown f={last} contracts={data.contracts} roomsCount={roomsCount} templateId={templateId} />
        </>
      )}
    </div>
  );

}

function Breakdown({ f, contracts, roomsCount, templateId }: { f: FinanceExt; contracts: Parameters<typeof activeContracts>[0]; roomsCount: number; templateId: string }) {
  const active = activeContracts(contracts, f.round);
  const realCosts = readParts(f.costBreakdown);
  const realRevenue = readParts(f.revenueBreakdown);
  const costParts =
    realCosts ??
    estimateCostParts(f, { staffCost: staffCostFor(templateId, roomsCount), roomsCount, contractsCost: active.reduce((s, c) => s + c.monthlyCost, 0) });
  const revenueParts = realRevenue ?? estimateRevenueParts(f, contractRevenue(active));
  return (
    <Panel title={`Raspodjela: ${label(f.round).toLowerCase()}`}>
      <div className="grid gap-6 md:grid-cols-2">
        <StackedBar title="Rashodi" parts={costParts} />
        <StackedBar title="Prihodi" parts={revenueParts} />
      </div>
      {(!realCosts || !realRevenue) && (
        <p className="mt-4 rounded-xl bg-sand px-3 py-2 text-xs">
          Procjena iz stavki: {!realCosts && !realRevenue ? "rashodi i prihodi" : !realCosts ? "rashodi" : "prihodi"} su izračunati iz plaća, soba, ugovora i ulaganja
          {!realCosts && "; marketing je ostatak"}. Točna raspodjela dolazi iz obračuna kad je motor pošalje.
        </p>
      )}
    </Panel>
  );
}
