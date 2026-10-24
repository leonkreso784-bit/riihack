"use client";

import { useRef, useState } from "react";
import { GraduationCap } from "lucide-react";
import { api } from "@/lib/client";
import { MAX_OWN_ANSWER_CHARS, MIN_OWN_ANSWER_CHARS } from "@/lib/rules";
import type { RoundReportView } from "@/lib/types";
import { cn } from "@/lib/utils";
import { charsLeft } from "@/lib/format";
import { FormError, SubmitButton } from "./form";

function Bubble({ who, children, mine }: { who: string; children: React.ReactNode; mine?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1", mine && "items-end")}>
      <span className="text-xs font-bold text-muted-foreground">{who}</span>
      <p className={cn("anim-pop max-w-[90%] rounded-2xl px-4 py-3 whitespace-pre-line", mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted")}>{children}</p>
    </div>
  );
}

// R7: the Socratic mentor asks first; the student answers in their own words; only then the mentor's debrief.
export function MentorDialog({ report, onAnswered }: { report: RoundReportView; onAnswered: (r: RoundReportView) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);
  const length = text.trim().length;
  const short = length < MIN_OWN_ANSWER_CHARS;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (sending.current) return;
    // The server also wants MIN_OWN_ANSWER_CHARS, so say why instead of a silent grey button.
    if (short) return setError(`Mentoru napiši barem ${MIN_OWN_ANSWER_CHARS} znakova, on odgovara na tvoje razmišljanje. ${charsLeft(MIN_OWN_ANSWER_CHARS - length)}.`);
    sending.current = true;
    setBusy(true);
    setError(null);
    try {
      onAnswered(await api.reflection({ round: report.round, text: text.trim() }));
    } catch (err) {
      setError((err as Error).message);
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <GraduationCap className="size-5 text-secondary-foreground" aria-hidden /> Mentor ne daje odgovore. Pita, a ti razmisliš.
      </p>
      {report.mentorQuestion ? <Bubble who="Mentor">{report.mentorQuestion}</Bubble> : <p className="text-muted-foreground">Mentor razmišlja…</p>}

      {report.reflection ? (
        <>
          <Bubble who="Ti" mine>{report.reflection}</Bubble>
          {report.mentorText && <Bubble who="Mentor">{report.mentorText}</Bubble>}
        </>
      ) : (
        report.mentorQuestion && (
          <form onSubmit={send} className="space-y-2">
            <label htmlFor="reflection" className="text-sm font-semibold">Tvoj odgovor mentoru</label>
            <textarea
              id="reflection"
              rows={4}
              value={text}
              maxLength={MAX_OWN_ANSWER_CHARS}
              disabled={busy}
              onChange={(e) => setText(e.target.value)}
              placeholder="Što misliš da se dogodilo i zašto?"
              className="w-full resize-y rounded-xl border bg-card px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            />
            <p className={cn("text-xs font-semibold tabular-nums", short ? "text-muted-foreground" : "text-up")}>
              {short ? charsLeft(MIN_OWN_ANSWER_CHARS - length) : `${length} / ${MAX_OWN_ANSWER_CHARS} znakova`}
            </p>
            {error && <FormError key={error}>{error}</FormError>}
            <SubmitButton busy={busy} busyText="Mentor čita tvoj odgovor…">Pošalji mentoru</SubmitButton>
          </form>
        )
      )}
    </div>
  );
}
