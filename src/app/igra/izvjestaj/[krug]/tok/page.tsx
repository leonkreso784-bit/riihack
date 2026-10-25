"use client";

import { useParams } from "next/navigation";
import { api, usePoll } from "@/lib/client";
import { ROUND_LABELS } from "@/lib/rules";
import { Panel } from "@/components/panel";
import { FormError } from "@/components/form";
import { MonthFlow } from "@/components/tokovi/month-flow";
import { BackLink } from "@/components/back-link";

// Tokovi: how a closed month was calculated, step by step. Real numbers only, from /api/me (finances with breakdown)
// and the room prices. Polls rarely: a closed month does not change.
export default function MonthFlowPage() {
  const round = Number(useParams<{ krug: string }>().krug);
  const { data, error } = usePoll(async () => {
    const [me, rooms] = await Promise.all([api.me(), api.rooms()]);
    return { me, rooms };
  }, 60_000);
  const month = ROUND_LABELS[round - 1] ?? `Krug ${round}`;
  const back = (
    <BackLink href={`/igra/izvjestaj/${round}`} label="Izvještaj mjeseca" />
  );

  if (!Number.isInteger(round) || round < 1 || round > ROUND_LABELS.length)
    return (
      <div className="space-y-4 pt-4 md:pt-0">
        <BackLink href="/igra" label="Moja tvrtka" />
        <Panel tone="sand">
          <p className="text-sm">Taj mjesec ne postoji. Igra ima {ROUND_LABELS.length} mjeseca, od lipnja do rujna.</p>
        </Panel>
      </div>
    );

  if (error && !data)
    return (
      <div className="space-y-4 pt-4 md:pt-0">
        {back}
        <FormError>{error.message}</FormError>
      </div>
    );

  const finance = data?.me.finances.find((f) => f.round === round);
  // Kasni ulaz: tvrtka ulazi s closedRound = tekući krug − 1 i nema obračun za mjesece prije ulaska.
  const beforeJoin = !!data && !finance && round <= data.me.company.closedRound;

  return (
    <div className="space-y-5 pt-4 md:pt-0">
      {back}
      <header className="space-y-1">
        <p className="text-sm font-semibold text-muted-foreground">Tokovi</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Kako je izračunat {month.toLowerCase()}</h1>
        <p className="text-muted-foreground">Sve brojke računaju pravila igre. AI ovdje ne sudjeluje.</p>
      </header>

      {!data ? (
        <div className="h-80 animate-pulse rounded-[var(--radius)] bg-muted" aria-busy="true" aria-label="Učitavam" />
      ) : !finance ? (
        <Panel tone="sand">
          <p className="text-sm">{beforeJoin ? "U tom mjesecu još nisi bio u igri." : "Obračun za ovaj mjesec još nije gotov. Stiže kad profesor zatvori mjesec, a onda ovdje vidiš korak po korak kako je nastao."}</p>
        </Panel>
      ) : (
        <MonthFlow finance={finance} rooms={data.rooms} hotelsInCity={data.me.city.hotels.length} round={round} />
      )}
    </div>
  );
}
