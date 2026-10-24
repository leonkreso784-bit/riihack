"use client";

import { useMemo, useState } from "react";
import { api, usePoll } from "@/lib/client";
import { Panel } from "@/components/panel";
import { PageHeader } from "@/components/page-header";
import { Leaderboard } from "@/components/leaderboard";
import { CityBoard } from "@/components/city/city-board";
import { CompanyCard } from "@/components/city/company-card";
import { allocateLots, districtById, profilesFromMe } from "@/lib/karta";
import { NewsFeed } from "@/components/city/news-feed";

export default function CityPage() {
  const { data, error } = usePoll(api.me);
  const [selectedId, setSelectedId] = useState<string>();
  // L14: javni profili tuđih hotela (cijena, ocjene, popunjenost). Ako ruta zakaže, kartica pokaže samo podatke iz ljestvice.
  const { data: publicList } = usePoll(() => (data ? api.worldCompanies(data.world.id) : Promise.resolve([])));
  const publicViews = useMemo(() => Object.fromEntries((publicList ?? []).map((p) => [p.companyId, p])), [publicList]);
  const profiles = useMemo(() => (data ? profilesFromMe(data, publicViews) : {}), [data, publicViews]);
  const lots = useMemo(() => (data ? allocateLots(data.city.hotels) : {}), [data]);
  if (error) return <p role="alert" className="rounded-xl bg-down-soft px-4 py-3 text-down">{error.message}</p>;
  if (!data) return <Skeleton />;

  return (
    <div className="space-y-5">
      <div className="pt-4 md:pt-0">
        <PageHeader title="Grad" subtitle="Svi hoteli i gradske tvrtke na jednoj karti. Turisti biraju između svih hotela." />
      </div>
      <Panel title="Grad" pad="sm">
        <div className="relative lg:flex lg:items-stretch lg:gap-4">
          <div className="min-w-0 flex-1">
            <CityBoard city={data.city} youId={data.company.id} profiles={profiles} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          {selectedId && profiles[selectedId] && (
            <div className="contents lg:relative lg:block lg:w-[380px] lg:shrink-0">
              <CompanyCard profile={profiles[selectedId]} district={lots[selectedId] ? districtById(lots[selectedId].district).name : "Stara luka"} onClose={() => setSelectedId(undefined)} />
            </div>
          )}
        </div>
      </Panel>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <Panel title="Ljestvica grada" action={<span className="text-xs text-muted-foreground">napredak</span>}>
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
