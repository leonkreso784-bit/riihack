"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Flag, Hourglass } from "lucide-react";
import { api } from "@/lib/client";
import { plural } from "@/lib/format";
import { MISSED_QUALITY, ROUND_LABELS } from "@/lib/rules";
import type { CompanyView, SituationView, WorldView } from "@/lib/types";
import { FormError } from "./form";
import { Dots } from "./loading";

const month = (round: number) => (ROUND_LABELS[round - 1] ?? `krug ${round}`).toLowerCase();
// "od N situacije/situacija": genitive after "od", 1–4 → situacije, 5+ (and 11–14) → situacija.
const ofSituations = (n: number) => `${n} ${n % 10 >= 1 && n % 10 <= 4 && !(n % 100 >= 11 && n % 100 <= 14) ? "situacije" : "situacija"}`;

// R4: the student says "I'm done with this month". The professor sees it on the board and opens the next month for
// everyone (the city settles all hotels together), so after closing the student waits. Closing opens the month's
// report; the mentor's question and all past conversations live on /igra/mentor (BUG-070).
// `onStale` pulls fresh data right away when the server refuses the click as stale (409), so the card shows the real month.
export function CloseRound(props: { world: WorldView; company: CompanyView; situations: SituationView[]; onStale?: () => void }) {
  return <Status {...props} />;
}

function Status({ world, company, situations, onStale }: { world: WorldView; company: CompanyView; situations: SituationView[]; onStale?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // The month is stored with the message: after a stale click the poll switches the card to the new month, and an error
  // about the old month must not stay on it (it would tell the student to refresh when the refresh already happened).
  const [error, setError] = useState<{ round: number; message: string } | null>(null);
  const sending = useRef(false);

  if (world.status === "finished")
    return (
      <p className="surface flex items-center gap-3 rounded-[var(--radius)] p-4 font-semibold">
        <Flag className="size-5 text-secondary-foreground" aria-hidden /> Sezona je gotova. Hvala na igri!
      </p>
    );
  if (world.status !== "running") return null;

  if (company.closedRound >= world.round)
    return (
      <p role="status" className="flex items-start gap-3 rounded-[var(--radius)] bg-mint p-4 text-up">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
        <span>
          <strong>Zatvorio si {month(world.round)}.</strong>{" "}
          {world.round < world.maxRounds ? `Čekaš da profesor otvori ${month(world.round + 1)}.` : "Čekaš da profesor završi sezonu."}
        </span>
      </p>
    );

  const current = situations.filter((s) => s.round === world.round);
  const open = current.filter((s) => !s.answer && s.state === "open").length;

  async function close() {
    if (sending.current) return;
    if (open > 0 && !confirm(`Imaš ${open} ${plural(open, "neodgovorenu situaciju", "neodgovorene situacije", "neodgovorenih situacija")}. ${open === 1 ? "Ona vrijedi" : "One vrijede"} ${MISSED_QUALITY} od 5. Svejedno završiti ${month(world.round)}?`)) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    try {
      // Send the month on the screen: if the professor has opened the next one in the meantime the server answers 409
      // instead of closing the new month with every situation unanswered (#266, item 1).
      const report = await api.closeRound(world.round);
      router.push(`/igra/izvjestaj/${report.round}`);
    } catch (err) {
      setError({ round: world.round, message: (err as Error).message });
      if ((err as { status?: number }).status === 409) onStale?.();
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="surface space-y-3 rounded-[var(--radius)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-3">
          <Hourglass className="size-5 shrink-0 text-secondary-foreground" aria-hidden />
          <span>
            <strong>{ROUND_LABELS[world.round - 1] ?? `Krug ${world.round}`}: jesi li gotov?</strong>{" "}
            <span className="text-muted-foreground">
              Riješeno {current.length - open} od {ofSituations(current.length)}. Profesor vidi tko je gotov i otvara sljedeći mjesec svima.
            </span>
          </span>
        </p>
        <button
          type="button"
          onClick={close}
          disabled={busy}
          className="min-h-11 shrink-0 rounded-xl bg-primary px-5 font-bold text-primary-foreground transition-colors hover:bg-[#1f5fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
        >
          {busy ? <span className="inline-flex items-center gap-2"><Dots /> Zatvaram</span> : `Završi ${month(world.round)}`}
        </button>
      </div>
      {error && error.round === world.round && <FormError key={error.message}>{error.message}</FormError>}
    </div>
  );
}
