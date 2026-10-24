"use client";

import { useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/client";
import { counterError } from "@/lib/engine/negotiate";
import { eur } from "@/lib/format";
import { MAIL_BODY_MAX, NEGOTIATE_COUNTER_PCT, NEGOTIATE_OK_PCT } from "@/lib/rules";
import type { ContractView } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FormError } from "./form";

const button = "min-h-11 rounded-xl px-5 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";

// R13: a contract offer inside a mail thread. An agency pays per night (the hotel asks for more), a supplier charges
// monthly (the hotel asks for less). One counter-offer per offer; after the agency's counter only accept or decline.
// The engine decides (L15); the hint below uses the same thresholds from rules.ts.
export function OfferCard({ contract: c, onChange }: { contract: ContractView; onChange: () => void }) {
  const byPrice = c.nights > 0;
  const base = byPrice ? c.pricePerNight : c.monthlyCost;
  const total = byPrice ? c.nights * c.pricePerNight : c.monthlyCost;
  const [counter, setCounter] = useState(false);
  const [value, setValue] = useState(base);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);

  async function run(action: () => Promise<unknown>) {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
      setCounter(false);
      onChange();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  if (c.status === "accepted")
    return (
      <p className="flex items-start gap-2 rounded-xl bg-mint px-4 py-3 text-up">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
        <span>
          <strong>Ugovor potpisan.</strong>{" "}
          {byPrice ? `${c.nights} noćenja po ${eur(c.pricePerNight)} = ${eur(total)}` : `${eur(c.monthlyCost)} mjesečno`}, {c.durationRounds} mj.
        </span>
      </p>
    );
  if (c.status !== "offered")
    return (
      <p className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-muted-foreground">
        <XCircle className="size-5 shrink-0" aria-hidden /> {c.status === "rejected" ? "Ponudu si odbio." : "Ponuda je propala."}
      </p>
    );

  // The agency's counter (after our counter-offer): only accept or decline, at the agency's numbers.
  const theirs = byPrice ? c.counterPricePerNight : c.counterMonthlyCost;
  const shown = theirs ?? base;
  const gain = byPrice ? value - base : base - value; // in the hotel's favour
  const pct = base ? Math.round((gain / base) * 100) : 0;
  const bucket = gain <= 0 || pct <= NEGOTIATE_OK_PCT ? 0 : pct <= NEGOTIATE_COUNTER_PCT ? 1 : 2;
  const invalid = counterError(c, byPrice ? { pricePerNight: value, message: message || undefined } : { monthlyCost: value, message: message || undefined });

  return (
    <section aria-label="Ponuda ugovora" className="space-y-4 rounded-2xl border border-sand bg-[#fbf6ec] p-4 md:p-5">
      {theirs !== undefined && <p className="text-sm font-semibold">Agencija je odgovorila protuponudom. Sad možeš samo prihvatiti ili odbiti.</p>}
      <dl className="grid grid-cols-3 gap-3">
        {byPrice ? (
          <>
            <div><dt className="text-xs font-bold text-muted-foreground">Noćenja</dt><dd className="text-xl font-extrabold tabular-nums">{c.nights}</dd></div>
            <div><dt className="text-xs font-bold text-muted-foreground">Po noći</dt><dd className="text-xl font-extrabold tabular-nums">{eur(shown)}</dd></div>
            <div><dt className="text-xs font-bold text-muted-foreground">Ukupno</dt><dd className="text-xl font-extrabold text-up tabular-nums">{eur(c.nights * shown)}</dd></div>
          </>
        ) : (
          <>
            <div><dt className="text-xs font-bold text-muted-foreground">Mjesečno</dt><dd className="text-xl font-extrabold tabular-nums">{eur(shown)}</dd></div>
            <div><dt className="text-xs font-bold text-muted-foreground">Trajanje</dt><dd className="text-xl font-extrabold tabular-nums">{c.durationRounds} mj.</dd></div>
            <div><dt className="text-xs font-bold text-muted-foreground">Ukupno</dt><dd className="text-xl font-extrabold tabular-nums">{eur(shown * c.durationRounds)}</dd></div>
          </>
        )}
      </dl>

      {counter ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!invalid) run(() => api.counter(c.id, byPrice ? { pricePerNight: value, message: message.trim() || undefined } : { monthlyCost: value, message: message.trim() || undefined }));
          }}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1">
              <span className="block text-sm font-semibold">{byPrice ? "Tvoja cijena po noći" : "Tvoja mjesečna naknada"}</span>
              <span className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={value}
                  onChange={(e) => setValue(Math.round(Number(e.target.value)))}
                  className="h-12 w-32 rounded-xl border bg-card px-3 text-xl font-extrabold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <span className="text-lg font-bold">€</span>
              </span>
            </label>
            <p className={cn("pb-3 text-sm font-semibold tabular-nums", gain > 0 ? "text-up" : "text-muted-foreground")}>
              {gain > 0 ? `+${pct} % u tvoju korist` : "nije u tvoju korist"}
            </p>
          </div>
          <ol className="grid grid-cols-3 gap-2 text-xs" aria-label="Kako agencija odlučuje">
            {[
              [`do ${NEGOTIATE_OK_PCT} %`, "prihvaća"],
              [`${NEGOTIATE_OK_PCT}–${NEGOTIATE_COUNTER_PCT} %`, "nudi sredinu"],
              [`više od ${NEGOTIATE_COUNTER_PCT} %`, "odbija"],
            ].map(([range, what], i) => (
              <li key={range} className={cn("rounded-xl bg-card p-2", i === bucket && "ring-2 ring-primary")}>
                <strong className="block">{range}</strong>
                {what}
              </li>
            ))}
          </ol>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Poruka (neobavezno)</span>
            <textarea
              rows={3}
              maxLength={MAIL_BODY_MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Objasni zašto tražiš drugu cijenu."
              className="w-full resize-y rounded-xl border bg-card px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>
          {error && <FormError key={error}>{error}</FormError>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy || !!invalid} className={cn(button, "bg-primary text-primary-foreground hover:bg-[#1f5fe0]")}>
              {busy ? "Šaljem…" : "Pošalji protuponudu"}
            </button>
            <button type="button" onClick={() => setCounter(false)} className={cn(button, "bg-muted font-semibold")}>Odustani</button>
          </div>
        </form>
      ) : (
        <>
          {error && <FormError key={error}>{error}</FormError>}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => run(() => api.decideContract(c.id, { accept: true }))} className={cn(button, "bg-primary text-primary-foreground hover:bg-[#1f5fe0]")}>
              Prihvati{theirs !== undefined && ` ${eur(theirs)}`}
            </button>
            {!c.negotiated && (
              <button type="button" disabled={busy} onClick={() => setCounter(true)} className={cn(button, "border border-[#c9d6f2] bg-card text-secondary-foreground")}>
                Predloži cijenu
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => run(() => api.decideContract(c.id, { accept: false }))} className={cn(button, "bg-muted font-semibold")}>
              Odbij
            </button>
          </div>
          {!c.negotiated && <p className="text-xs text-muted-foreground">Pregovarati možeš jednom po ponudi.</p>}
        </>
      )}
    </section>
  );
}
