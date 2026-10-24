"use client";

import Link from "next/link";
import { BedDouble, ChartColumn, ChevronRight, MessageCircle, Moon, Store, Wallet } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { METRIC_LABELS } from "@/lib/rules";
import { num } from "@/lib/format";
import type { MetricKey, SituationView } from "@/lib/types";
import { Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { MetricBar, METRIC_ICONS, Delta } from "@/components/metric-bar";
import { Pill } from "@/components/pill";
import { RoundBanner } from "@/components/round-banner";
import { Leaderboard } from "@/components/leaderboard";

// ponytail: R0 preview of the hotel dashboard on mock data; R4 adds closing the round and the empty/finished states.
export default function GamePage() {
  const { data, error, syncedAt } = usePoll(api.me);
  if (error) return <p role="alert" className="rounded-xl bg-down-soft px-4 py-3 text-down">{error.message}</p>;
  if (!data) return <Skeleton />;

  const { company, world } = data;
  const june = data.finances.at(-1);
  const initials = company.hotelName.split(" ").map((w) => w[0]).join("").slice(0, 2);
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-4 pt-4 md:pt-0">
        <span aria-hidden className="gloss-night grid size-14 shrink-0 place-items-center rounded-2xl text-xl font-extrabold">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl font-extrabold tracking-tight">{company.hotelName}</h1>
          <p className="text-sm text-muted-foreground">
            {company.place} · <span aria-label={`${company.stars} zvjezdice`}>{"★".repeat(company.stars)}</span> ·{" "}
            {company.roomsCount} soba · vodi {company.playerName}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Napredak</p>
          <Delta value={company.progress} className="text-2xl" />
        </div>
      </header>

      <RoundBanner world={world} syncedAt={syncedAt} />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <Panel title="Pokazatelji" action={<span className="text-xs text-muted-foreground">0–100 · od početka</span>}>
          {(Object.keys(METRIC_LABELS) as MetricKey[]).map((k) => (
            <MetricBar key={k} icon={METRIC_ICONS[k]} label={METRIC_LABELS[k]} start={company.startMetrics[k]} now={company.metrics[k]} />
          ))}
        </Panel>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Wallet} label="Stanje računa" value={num(company.cash)} unit="€" tone="accent" note="obračun kad profesor zatvori mjesec" />
            <StatCard icon={BedDouble} label="Popunjenost" value={june?.occupancyPct ?? "—"} unit="%" note="lipanj" />
            <StatCard icon={ChartColumn} label="Dobit" value={june ? num(june.profit) : "—"} unit="€" tone={june && june.profit < 0 ? "down" : "up"} note="lipanj" />
            <StatCard icon={Moon} label="Noćenja" value={june ? num(june.nights + june.contractNights) : "—"} unit="" note={june ? `${june.marketSharePct} % turista grada` : undefined} />
          </div>

          <Panel title="Situacije ovog kruga" pad="list">
            <ul className="divide-y">
              {data.situations.map((s) => (
                <SituationRow key={s.id} s={s} />
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <Panel title="Ljestvica razreda" action={<span className="text-xs text-muted-foreground">po napretku</span>}>
          <Leaderboard rows={data.leaderboard} youId={company.id} />
        </Panel>
        <Panel title="Ponude grada" tone="sand">
          <div className="flex items-start gap-3 text-sm">
            <Store className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p>
              {data.contracts.filter((c) => c.status === "offered").length} nova ponuda i{" "}
              {data.contracts.filter((c) => c.status === "accepted").length} aktivan ugovor. Ponude s uvjetima stižu ovdje (S6).
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SituationRow({ s }: { s: SituationView }) {
  return (
    <li>
      <Link
        href={`/igra/situacija/${s.id}`}
        className="-mx-2 flex min-h-16 items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-[#eef4ff] to-[#dde8ff] text-secondary-foreground shadow-[inset_0_1px_0_#fff]">
          <MessageCircle className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{s.title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {s.character.name} · {s.character.role}
          </span>
        </span>
        {s.answer ? <Pill tone="up">{s.answer.quality} / 5</Pill> : <Pill tone="accent">Otvorena</Pill>}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 pt-2" aria-busy="true" aria-label="Učitavam">
      <div className="h-14 w-64 animate-pulse rounded-2xl bg-muted" />
      <div className="h-16 animate-pulse rounded-[var(--radius)] bg-muted" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-[var(--radius)] bg-muted" />
        <div className="h-80 animate-pulse rounded-[var(--radius)] bg-muted" />
      </div>
    </div>
  );
}
