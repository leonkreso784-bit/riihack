"use client";

import Link from "next/link";
import { BedDouble, ChartColumn, ChevronRight, MessageCircle, Moon, Store, Wallet } from "lucide-react";
import { api, blocksPage, usePoll } from "@/lib/client";
import { METRIC_LABELS, ROUND_LABELS } from "@/lib/rules";
import type { MetricKey, SituationView } from "@/lib/types";
import { Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { MetricBar, METRIC_ICONS, Delta } from "@/components/metric-bar";
import { Pill } from "@/components/pill";
import { RoundBanner } from "@/components/round-banner";
import { Leaderboard } from "@/components/leaderboard";
import { CountUp } from "@/components/count-up";
import { CloseRound } from "@/components/close-round";
import { PollNotice } from "@/components/poll-notice";
import { plural, starsLabel } from "@/lib/format";
import { BackLink } from "@/components/back-link";
import { Hint } from "@/components/hint";
import { HINTS, METRIC_HINTS } from "@/lib/hints";

// Hotel dashboard (R0, R4): metrics, money, this month's situations, ranking, and "Završi mjesec".
export default function GamePage() {
  const { data, error, syncedAt, refresh } = usePoll(api.me);
  if (error && blocksPage(error, data))
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded-xl bg-down-soft px-4 py-3 text-down">{error.message}</p>
        <BackLink href="/ulaz" label="Uđi u igru" />
      </div>
    );
  if (!data) return <Skeleton />;

  const { company, world } = data;
  const offered = data.contracts.filter((c) => c.status === "offered").length;
  const accepted = data.contracts.filter((c) => c.status === "accepted").length;
  const june = data.finances.at(-1); // last settled month
  const settled = june ? (ROUND_LABELS[june.round - 1] ?? `krug ${june.round}`).toLowerCase() : undefined;
  const initials = company.hotelName.split(" ").map((w) => w[0]).join("").slice(0, 2);
  return (
    <div className="space-y-5">
      <PollNotice error={error} className="mt-4 md:mt-0" />
      <header className="anim-rise flex items-center gap-4 pt-4 md:pt-0">
        <span aria-hidden className="gloss-night grid size-14 shrink-0 place-items-center rounded-2xl text-xl font-extrabold">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="line-clamp-2 text-3xl font-extrabold tracking-tight">{company.hotelName}</h1>
          <p className="text-sm text-muted-foreground">
            {company.place} · <span aria-label={starsLabel(company.stars)}>{"★".repeat(company.stars)}</span> ·{" "}
            {company.roomsCount} {plural(company.roomsCount, "soba", "sobe", "soba")} · vodi {company.playerName}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="flex items-center justify-end gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Napredak <Hint label="Napredak" text={HINTS.progress} />
          </p>
          <Delta value={company.progress} className="text-2xl" />
        </div>
      </header>

      <div className="anim-rise [--i:1]">
        <RoundBanner world={world} syncedAt={syncedAt} />
      </div>

      <div className="anim-rise [--i:1]">
        <CloseRound world={world} company={company} situations={data.situations} onStale={refresh} />
      </div>

      {/* BUG-073: two independent columns from xl, so a short left column leaves no hole; below xl `contents` + order
          interleaves them into one column. On a phone the situations come first (#266, 7: they used to start 1.3
          screens below the metrics), then metrics and money; from xl the order inside each column is unchanged. */}
      <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:items-start">
        <div className="contents xl:flex xl:flex-col xl:gap-5">
          <Panel className="anim-rise order-2 xl:order-1 [--i:2]" title="Pokazatelji" action={<span className="text-xs text-muted-foreground">0 do 100 · od početka</span>}>
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map((k, i) => (
              <MetricBar key={k} order={i} icon={METRIC_ICONS[k]} label={METRIC_LABELS[k]} hint={METRIC_HINTS[k]} start={company.startMetrics[k]} now={company.metrics[k]} />
            ))}
          </Panel>
          <Panel className="anim-rise order-4 [--i:5]" title="Ljestvica razreda" action={<span className="text-xs text-muted-foreground">po napretku</span>}>
            <Leaderboard rows={data.leaderboard} youId={company.id} />
          </Panel>
        </div>

        <div className="contents xl:flex xl:flex-col xl:gap-5">
          <div className="anim-rise order-3 grid grid-cols-2 gap-3 xl:order-1 [--i:3]">
            <StatCard icon={Wallet} label="Stanje računa" hint={HINTS.cash} value={<CountUp value={company.cash} />} unit="€" tone="accent" note={world.status === "finished" ? "konačno stanje, sezona je gotova" : "obračun kad profesor zatvori mjesec"} />
            <StatCard icon={BedDouble} label="Popunjenost" hint={HINTS.occupancy} value={june ? <CountUp value={june.occupancyPct} /> : "—"} unit="%" note={settled} />
            <StatCard icon={ChartColumn} label="Dobit" hint={HINTS.profit} value={june ? <CountUp value={june.profit} /> : "—"} unit="€" tone={june && june.profit < 0 ? "down" : "up"} note={settled} />
            <StatCard icon={Moon} label="Noćenja" hint={HINTS.nights} value={june ? <CountUp value={june.nights + june.contractNights} /> : "—"} unit="" note={june ? `${june.marketSharePct} % turista grada` : undefined} />
          </div>

          <Panel className="anim-rise order-1 xl:order-2 [--i:4]" title="Situacije ovog kruga" pad="list">
            <ul className="divide-y">
              {data.situations.map((s) => (
                <SituationRow key={s.id} s={s} />
              ))}
            </ul>
          </Panel>

          <Panel className="anim-rise order-5 [--i:6]" title="Ponude grada" tone="sand">
            <Link href="/igra/posta" className="-m-2 flex items-start gap-3 rounded-xl p-2 text-sm transition-colors hover:bg-white/50 focus-visible:outline-2 focus-visible:outline-primary">
              <Store className="mt-0.5 size-5 shrink-0" aria-hidden />
              <p className="flex-1">
                {offered} {plural(offered, "nova ponuda", "nove ponude", "novih ponuda")} i {accepted}{" "}
                {plural(accepted, "aktivan ugovor", "aktivna ugovora", "aktivnih ugovora")}.
              </p>
              <ChevronRight className="size-4 shrink-0 self-center text-muted-foreground" aria-hidden />
            </Link>
          </Panel>
        </div>
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
          <span className="line-clamp-2 font-bold">{s.title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {s.character.name} · {s.character.role}
          </span>
        </span>
        {s.source && s.source !== "bank" && <Pill tone="warn" className="hidden sm:inline-flex">od profesora</Pill>}
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
