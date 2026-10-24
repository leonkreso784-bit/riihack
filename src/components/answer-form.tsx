"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/client";
import { CLICK_QUALITY_CAP, MAX_OWN_ANSWER_CHARS, MIN_OWN_ANSWER_CHARS } from "@/lib/rules";
import { cn } from "@/lib/utils";
import { charsLeft } from "@/lib/format";
import type { AnswerRequest, AnswerView } from "@/lib/types";
import { FormError, SubmitButton } from "./form";

// One submit for both answer kinds: a ref guard so a double click sends a single request, and the button stays locked
// with "{name} razmišlja…" while the judge works (up to 20 s on the real API).
function useSubmit(situationId: string, onAnswered: (a: AnswerView) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);

  async function submit(req: AnswerRequest) {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    try {
      onAnswered(await api.answer(situationId, req));
    } catch (err) {
      setError((err as Error).message);
      sending.current = false;
      setBusy(false);
    }
  }
  return { busy, error, submit };
}

export function OwnAnswerForm({ situationId, firstName, onAnswered }: { situationId: string; firstName: string; onAnswered: (a: AnswerView) => void }) {
  const [text, setText] = useState("");
  const [pastedChars, setPastedChars] = useState(0);
  const { busy, error, submit } = useSubmit(situationId, onAnswered);
  const length = text.trim().length;
  const short = length < MIN_OWN_ANSWER_CHARS;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!short) submit({ text: text.trim(), pastedChars: Math.min(pastedChars, length) });
      }}
      className="space-y-3"
    >
      <label htmlFor="own-answer" className="text-sm font-semibold">Što ćeš učiniti i reći?</label>
      <textarea
        id="own-answer"
        rows={5}
        value={text}
        maxLength={MAX_OWN_ANSWER_CHARS}
        disabled={busy}
        onChange={(e) => setText(e.target.value)}
        onPaste={(e) => setPastedChars((n) => n + e.clipboardData.getData("text").length)}
        placeholder="Napiši kako bi to riješio, svojim riječima."
        className="w-full resize-y rounded-xl border bg-card px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
      />
      <p className={cn("text-xs font-semibold tabular-nums", short ? "text-muted-foreground" : "text-up")}>
        {short ? charsLeft(MIN_OWN_ANSWER_CHARS - length) : `${length} / ${MAX_OWN_ANSWER_CHARS} znakova`}
      </p>
      {error && <FormError key={error}>{error}</FormError>}
      <SubmitButton busy={busy} busyText={`${firstName} razmišlja o tvom odgovoru…`}>
        Pošalji odgovor
      </SubmitButton>
    </form>
  );
}

export function OptionsForm({
  situationId,
  firstName,
  options,
  onAnswered,
}: {
  situationId: string;
  firstName: string;
  options: { id: string; text: string }[];
  onAnswered: (a: AnswerView) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const { busy, error, submit } = useSubmit(situationId, onAnswered);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (picked) submit({ optionId: picked });
      }}
      className="space-y-3"
    >
      <p className="rounded-xl bg-sand px-4 py-2.5 text-sm">Ponuđeni odgovor vrijedi najviše {CLICK_QUALITY_CAP} od 5.</p>
      <fieldset className="space-y-2" disabled={busy}>
        <legend className="sr-only">Ponuđeni odgovori</legend>
        {options.map((o) => (
          <label
            key={o.id}
            className={cn(
              "flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted has-focus-visible:ring-2 has-focus-visible:ring-primary",
              picked === o.id && "border-primary bg-secondary",
            )}
          >
            <input type="radio" name="option" value={o.id} checked={picked === o.id} onChange={() => setPicked(o.id)} className="mt-1 accent-primary" />
            <span>{o.text}</span>
          </label>
        ))}
      </fieldset>
      {error && <FormError key={error}>{error}</FormError>}
      <SubmitButton busy={busy || !picked} busyText={busy ? `${firstName} razmišlja o tvom odgovoru…` : "Odaberi jedan odgovor"}>
        Pošalji odgovor
      </SubmitButton>
    </form>
  );
}
