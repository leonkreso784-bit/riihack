"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { checkSendMail } from "@/lib/engine/mail-send";
import { MAIL_BODY_MAX, MAIL_SUBJECT_MAX } from "@/lib/rules";
import type { LeaderboardRow, MailMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BackLink } from "./back-link";
import { Field, FormError, SubmitButton } from "./form";

const fieldError = "text-sm font-medium text-down";
const counter = (used: number, max: number) => (
  <span className={cn("shrink-0 text-xs font-semibold whitespace-nowrap tabular-nums", used > max ? "text-down" : "text-muted-foreground")}>{used} / {max}</span>
);

// #303: a new message to another hotel of the same game. The checks come from engine/mail-send.ts, the same ones the
// server runs, so the form and POST /api/me/mail never disagree. Field errors appear after the first "Pošalji";
// server errors (limit, game not running, network) show in the alert above the button. The fields have no
// maxLength on purpose: pasted text is never cut silently, the counter turns red and the error says what to shorten.
// `initial` fills the recipient and subject for a reply. `onSent(message, stillOpen)`: stillOpen is false when the
// form was closed (the player opened another thread) before the request finished, so the page must not navigate.
export function MailComposer({
  meId,
  recipients,
  initial,
  onSent,
  onCancel,
}: {
  meId: string;
  recipients: LeaderboardRow[];
  initial?: { to: string; subject: string };
  onSent: (sent: MailMessage, stillOpen: boolean) => void;
  onCancel: () => void;
}) {
  const [to, setTo] = useState(initial?.to ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false); // a ref guard, so a double click sends a single request
  const open = useRef(false); // false once the form is gone, so a late answer does not steer the page

  // Focus moves into the form when it opens: the body for a reply (recipient and subject are filled), else the recipient.
  useEffect(() => {
    open.current = true;
    document.getElementById(initial ? "mail-body" : "mail-toCompanyId")?.focus();
    return () => {
      open.current = false;
    };
  }, [initial]);

  const check = checkSendMail({ toCompanyId: to, subject, body }, meId);
  const fields = tried && !check.ok ? check.fields : {};

  async function submit() {
    if (sending.current) return;
    setTried(true);
    setError(null);
    if (!check.ok) {
      const first = (["toCompanyId", "subject", "body"] as const).find((k) => check.fields[k]);
      if (first) document.getElementById(`mail-${first}`)?.focus();
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      const sent = await api.sendMail(check.data);
      onSent(sent, open.current);
    } catch (err) {
      // No status = the request never reached the server (offline); otherwise the server's own Croatian message.
      setError((err as { status?: number }).status === undefined ? "Poruka nije poslana. Provjeri vezu i pokušaj ponovno." : (err as Error).message);
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <form
      noValidate
      aria-label="Nova poruka"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="surface min-w-0 space-y-4 rounded-[var(--radius)] p-5 md:p-6"
    >
      <BackLink onClick={onCancel} label="Sva pošta" className="lg:hidden" disabled={busy} />
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">Nova poruka</h2>
        <p className="text-sm text-muted-foreground">Poruku vidi hotel kojem pišeš.</p>
      </div>

      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <div className="space-y-2">
          <label htmlFor="mail-toCompanyId" className="text-sm font-semibold">Hotel</label>
          <select
            id="mail-toCompanyId"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-invalid={fields.toCompanyId ? true : undefined}
            aria-describedby={fields.toCompanyId ? "mail-toCompanyId-error" : undefined}
            className="h-12 w-full rounded-xl border bg-card px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 aria-invalid:border-down"
          >
            <option value="">Odaberi hotel</option>
            {recipients.map((h) => (
              <option key={h.companyId} value={h.companyId}>
                {h.hotelName} ({h.playerName})
              </option>
            ))}
          </select>
          {fields.toCompanyId && <p id="mail-toCompanyId-error" className={fieldError}>{fields.toCompanyId}</p>}
        </div>

        <div className="space-y-2">
          <Field
            id="mail-subject"
            label="Naslov"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            autoComplete="off"
            placeholder="Npr. Prijedlog suradnje"
            aria-invalid={fields.subject ? true : undefined}
            aria-describedby={fields.subject ? "mail-subject-error" : undefined}
          />
          <div className="flex items-baseline justify-between gap-3">
            <p id="mail-subject-error" className={fieldError}>{fields.subject}</p>
            {counter(subject.trim().length, MAIL_SUBJECT_MAX)}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="mail-body" className="text-sm font-semibold">Poruka</label>
          <textarea
            id="mail-body"
            rows={7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Napiši što predlažeš ili pitaš."
            aria-invalid={fields.body ? true : undefined}
            aria-describedby={fields.body ? "mail-body-error" : undefined}
            className="w-full resize-y rounded-xl border bg-card px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 aria-invalid:border-down"
          />
          <div className="flex items-baseline justify-between gap-3">
            <p id="mail-body-error" className={fieldError}>{fields.body}</p>
            {counter(body.trim().length, MAIL_BODY_MAX)}
          </div>
        </div>
      </fieldset>

      {error && <FormError key={error}>{error}</FormError>}
      <div className="space-y-3">
        <SubmitButton busy={busy} busyText="Šaljem poruku…">Pošalji poruku</SubmitButton>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="min-h-12 w-full rounded-xl bg-muted px-4 text-base font-bold transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
        >
          Odustani
        </button>
      </div>
    </form>
  );
}
