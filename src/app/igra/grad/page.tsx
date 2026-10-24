"use client";

import { api, usePoll } from "@/lib/client";
import { Panel } from "@/components/panel";
import { PageHeader } from "@/components/page-header";
import { Leaderboard } from "@/components/leaderboard";
import { CityMap } from "@/components/city/city-map";
import { NewsFeed } from "@/components/city/news-feed";

export default function CityPage() {
  const { data, error } = usePoll(api.me);
  if (error) return <p role="alert" className="rounded-xl bg-down-soft px-4 py-3 text-down">{error.message}</p>;
  if (!data) return <Skeleton />;

  return (
    <div className="space-y-5">
      <div className="pt-4 md:pt-0">
        <PageHeader title="Grad" subtitle="Svi hoteli i gradske tvrtke na jednoj karti. Turisti biraju između svih hotela." />
      </div>
      <Panel pad="sm">
        <CityMap city={data.city} round={data.world.round} highlightCompanyId={data.company.id} />
      </Panel>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <Panel title="Ljestvica grada" action={<span className="text-xs text-muted-foreground">napredak i stanje računa</span>}>
          <Leaderboard rows={data.city.hotels} youId={data.company.id} limit={8} />
        </Panel>
        <Panel title="Vijesti grada" pad="list">
          <NewsFeed items={data.news} />
        </Panel>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 pt-2" aria-busy="true" aria-label="Učitavam">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-muted" />
      <div className="h-80 animate-pulse rounded-[var(--radius)] bg-muted" />
    </div>
  );
}
