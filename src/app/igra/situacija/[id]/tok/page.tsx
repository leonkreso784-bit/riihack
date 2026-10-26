"use client";

import { useParams } from "next/navigation";
import { api, usePoll } from "@/lib/client";
import { findSituation } from "@/lib/find-situation";
import { flowInputFromSituation } from "@/lib/tokovi/answer-flow";
import { PageHeader } from "@/components/page-header";
import { FormError } from "@/components/form";
import { AnswerFlow } from "@/components/tokovi/answer-flow";
import { BackLink } from "@/components/back-link";
import { Loading } from "@/components/loading";

// Tokovi, skica 2: kako je odgovor na situaciju prošao kroz hotel (odgovor, sudac, kvaliteta, učinak, odjeli).
export default function AnswerFlowPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = usePoll(api.me);
  const back = (
    <BackLink href={`/igra/situacija/${id}`} label="Natrag na situaciju" />
  );
  if (error && !data) return <FormError>{error.message}</FormError>;
  if (!data) return <Loading />;

  const s = findSituation(data, id);
  if (!s)
    return (
      <div className="space-y-4 pt-4 md:pt-0">
        {back}
        <p className="text-muted-foreground">Ova situacija nije tvoja ili više ne postoji.</p>
      </div>
    );
  const input = flowInputFromSituation(s, data.company.closedRound >= s.round);
  if (!input)
    return (
      <div className="space-y-4 pt-4 md:pt-0">
        {back}
        <p className="text-lg text-muted-foreground">Ovo vidiš nakon što odgovoriš.</p>
      </div>
    );
  return (
    <div className="space-y-5 pt-4 md:pt-0">
      {back}
      <PageHeader title="Kako je tvoj odgovor prošao kroz hotel" subtitle={`${s.title}, razgovor s likom ${s.character.name}`} />
      <AnswerFlow input={input} />
    </div>
  );
}
