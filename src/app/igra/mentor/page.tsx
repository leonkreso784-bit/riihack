"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, GraduationCap } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { ROUND_LABELS } from "@/lib/rules";
import type { RoundReportView } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { MentorDialog } from "@/components/mentor-dialog";
import { Loading, Thinking } from "@/components/loading";
import { Pill } from "@/components/pill";

// BUG-070: the mentor's own page. Every closed month's conversation, newest first; the open question is answered here.
export default function MentorPage() {
  const { data, error } = usePoll(api.me, 5_000);
  if (error) return <p role="alert" className="rounded-xl bg-down-soft px-4 py-3 text-down">{error.message}</p>;
  if (!data) return <Loading />;

  const rounds = data.reports.map((r) => r.round).sort((a, b) => b - a);
  const live = data.world.status !== "finished" ? data.world.round : 0;
  return (
    <div className="space-y-5 pt-4 md:pt-0">
      <PageHeader title="Mentor" subtitle="Mentor ne daje odgovore. Pita, a ti razmisliš. Ovdje su svi vaši razgovori." />
      {rounds.length === 0 ? (
        <Panel tone="mint">
          <p className="flex items-center gap-3 text-sm">
            <GraduationCap className="size-5 shrink-0 text-secondary-foreground" aria-hidden />
            Mentor se javlja kad završiš prvi mjesec.
          </p>
        </Panel>
      ) : (
        <ol className="space-y-5">
          {rounds.map((round) => (
            <li key={round}>
              <Month round={round} live={round === live} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// One month's conversation. The question is generated on the first read (AI, a few seconds), so closed months poll rarely.
function Month({ round, live }: { round: number; live: boolean }) {
  const { data } = usePoll(() => api.report(round), live ? 15_000 : 10 * 60_000);
  const [answered, setAnswered] = useState<RoundReportView>();
  const report = answered ?? data;
  const month = ROUND_LABELS[round - 1] ?? `Krug ${round}`;
  const waiting = report?.mentorQuestion && !report.reflection;
  return (
    <Panel
      id={`mjesec-${round}`}
      tone="mint"
      className="scroll-mt-20"
      title={month}
      action={
        <span className="flex items-center gap-2">
          {waiting && <Pill tone="accent">čeka tvoj odgovor</Pill>}
          <Link
            href={`/igra/izvjestaj/${round}`}
            className="flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-secondary-foreground hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-primary"
          >
            Izvještaj mjeseca <ChevronRight className="size-4" aria-hidden />
          </Link>
        </span>
      }
    >
      {report ? <MentorDialog report={report} onAnswered={setAnswered} /> : <Thinking who="Mentor" text="smišlja pitanje" />}
    </Panel>
  );
}
