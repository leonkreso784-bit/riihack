"use client";

import { api, usePoll } from "@/lib/client";
import { PageHeader } from "@/components/page-header";
import { FormError } from "@/components/form";
import { DepartmentsFlow } from "@/components/tokovi/departments-flow";
import { BackLink } from "@/components/back-link";

// Tokovi, skica 3: odjeli kao staze (ljudi, upozorenja, ulaganje, situacije) koje teku u pokazatelje.
// Samo postojeći API: /api/me, osoblje i sobe. Osoblje i sobe se rijetko mijenjaju, pa se čitaju sporo.
export default function DepartmentsFlowPage() {
  const { data, error } = usePoll(api.me);
  const { data: staff } = usePoll(api.staff, 60_000);
  const { data: rooms } = usePoll(api.rooms, 60_000);
  const back = (
    <BackLink href="/igra/osoblje" label="Odjeli" />
  );
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
      <PageHeader title="Kako odjeli utječu na hotel" subtitle="Svaki odjel je jedna staza: tko u njemu radi, što ga muči, koliko ulažeš i kako su prošle situacije. Desno je pokazatelj koji odjel hrani." />
      {!data ? (
        <div className="h-80 animate-pulse rounded-[var(--radius)] bg-muted" aria-busy="true" aria-label="Učitavam" />
      ) : (
        <DepartmentsFlow
          input={{
            metrics: data.company.metrics,
            plan: data.plan.investments ?? {},
            staff: staff ?? null,
            rooms: rooms ?? null,
            situations: data.situations,
            round: data.world.round,
            // After the close and the settlement these effects are already in company.metrics (review AI-TOKOVI-01).
            closed: data.company.closedRound >= data.world.round,
            settled: data.finances.some((f) => f.round === data.world.round),
          }}
        />
      )}
    </div>
  );
}
