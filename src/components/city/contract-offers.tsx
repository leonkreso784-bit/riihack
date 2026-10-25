"use client";

import { useState } from "react";
import { Check, Handshake, X } from "lucide-react";
import { api } from "@/lib/client";
import { activeIn } from "@/lib/finance-view";
import { eur, plural } from "@/lib/format";
import { MAX_ROUNDS } from "@/lib/rules";
import type { BusinessKind, ContractView } from "@/lib/types";
import { Panel } from "@/components/panel";
import { Pill } from "@/components/pill";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<BusinessKind, string> = {
  agency: "Agencija",
  laundry: "Praonica",
  bakery: "Pekara",
  security: "Zaštita",
  supplier: "Dobavljač",
};

const BTN =
  "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 sm:flex-none";

/** Months the contract can still run: the season ends with month MAX_ROUNDS (review GAP4-04). */
const monthsLeft = (c: ContractView) => Math.max(1, Math.min(c.durationRounds, MAX_ROUNDS - c.roundOffered + 1));

function terms(c: ContractView) {
  const n = monthsLeft(c);
  const months = `${n} ${n === 1 ? "mjesec" : "mjeseca"}`;
  // An open offer the agency countered is signed at the counter (decideContract), so show that number (review IGRA-B-02).
  const counter = c.status === "offered";
  const price = counter ? (c.counterPricePerNight ?? c.pricePerNight) : c.pricePerNight;
  const cost = counter ? (c.counterMonthlyCost ?? c.monthlyCost) : c.monthlyCost;
  const main = c.nights > 0 ? `${c.nights} ${plural(c.nights, "noćenje", "noćenja", "noćenja")} po ${eur(price)} po noćenju` : `${eur(cost)} mjesečno`;
  return `${main} · ${months}`;
}

const isCountered = (c: ContractView) => c.counterPricePerNight !== undefined || c.counterMonthlyCost !== undefined;

// Offers of this round (Prihvati / Odbij) and the contracts running this round. onDecide fires after the server accepted the answer.
// `round` is world.round: without it ended contracts would still be listed as active (review GAP1-01).
export function ContractOffers({ contracts, round, onDecide }: { contracts: ContractView[]; round: number; onDecide?: (id: string, accept: boolean) => void }) {
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [decided, setDecided] = useState<Record<string, ContractView["status"]>>({});

  const current = contracts.map((c) => (decided[c.id] ? { ...c, status: decided[c.id] } : c));
  // An offer of an earlier month can no longer be decided (openOffer answers 409), so it is not offered again.
  const offers = current.filter((c) => c.status === "offered" && c.roundOffered === round);
  const active = activeIn(current, round);

  async function decide(c: ContractView, accept: boolean) {
    setBusy(c.id);
    setError(undefined);
    try {
      const res = await api.decideContract(c.id, { accept });
      setDecided((d) => ({ ...d, [c.id]: res.status }));
      onDecide?.(c.id, accept);
    } catch (e) {
      setError((e as Error).message || "Odluka nije spremljena. Pokušaj ponovno.");
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <div className="space-y-5">
      <Panel title="Ponude ugovora ovog kruga" tone="sand">
        {error && (
          <p role="alert" className="mb-3 rounded-xl bg-down-soft px-4 py-3 text-sm text-down">
            {error}
          </p>
        )}
        {offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nema novih ponuda. Nove stižu na početku sljedećeg mjeseca.</p>
        ) : (
          <ul className="space-y-3">
            {offers.map((c) => (
              <li key={c.id} className="surface rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Handshake className="size-4 text-secondary-foreground" aria-hidden />
                  <h3 className="font-bold">{c.businessName}</h3>
                  <Pill tone="accent">{KIND_LABELS[c.businessKind]}</Pill>
                </div>
                <p className="mt-1 text-sm font-semibold">{c.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                <p className="mt-2 text-sm font-bold tabular-nums">{terms(c)}</p>
                {isCountered(c) && <p className="mt-1 text-xs font-semibold text-secondary-foreground">Protuponuda agencije: Prihvati potpisuje ovaj iznos.</p>}
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={busy === c.id} onClick={() => decide(c, true)} className={cn(BTN, "bg-primary text-primary-foreground hover:bg-primary/90")}>
                    <Check className="size-4" aria-hidden />
                    Prihvati
                  </button>
                  <button type="button" disabled={busy === c.id} onClick={() => decide(c, false)} className={cn(BTN, "border bg-background hover:bg-muted")}>
                    <X className="size-4" aria-hidden />
                    Odbij
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {active.length > 0 && (
        <Panel title="Aktivni ugovori" pad="list">
          <ul className="divide-y">
            {active.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="min-w-0">
                  <span className="block font-bold">{c.businessName}</span>
                  <span className="block text-sm text-muted-foreground tabular-nums">{terms(c)}</span>
                </span>
                {c.activeUntilRound !== undefined && <Pill tone="up">do kruga {Math.min(c.activeUntilRound, MAX_ROUNDS)}</Pill>}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
