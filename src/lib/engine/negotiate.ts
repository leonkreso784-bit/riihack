// Pregovaranje s agencijom (L15). Motor odlučuje po pravilu, AI samo piše odgovor agenta.
// Agencija (nights > 0) plaća hotelu, pa hotel traži višu cijenu noćenja; dobavljač (monthlyCost > 0) naplaćuje,
// pa hotel traži nižu naknadu. Ugovor s oba: odlučuje polje koje je student zadao, drugo ostaje kao u ponudi.
import { MAIL_BODY_MAX, NEGOTIATE_COUNTER_PCT, NEGOTIATE_OK_PCT } from "@/lib/rules";
import type { CounterOfferRequest, NegotiationOutcome } from "@/lib/types";

export type NegotiationOffer = { pricePerNight: number; monthlyCost: number; nights: number };
export type NegotiationDeal = { outcome: NegotiationOutcome; pricePerNight: number; monthlyCost: number };

const COUNTER_MAX = 100000;
const isAmount = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= COUNTER_MAX;

/** Greška protuponude na hrvatskom ili null: točno jedno polje, cijeli broj, polje koje ponuda ima, u korist hotela. */
export function counterError(offer: NegotiationOffer, c: CounterOfferRequest): string | null {
  const hasPrice = c.pricePerNight !== undefined;
  const hasCost = c.monthlyCost !== undefined;
  if (hasPrice === hasCost) return "Predloži ili cijenu noćenja ili mjesečnu naknadu";
  if (hasPrice && offer.nights <= 0) return "Ova ponuda nema noćenja, predloži mjesečnu naknadu";
  if (hasCost && offer.monthlyCost <= 0) return "Ova ponuda nema naknadu, predloži cijenu noćenja";
  if (!isAmount(hasPrice ? c.pricePerNight : c.monthlyCost)) return `Iznos mora biti cijeli broj od 1 do ${COUNTER_MAX} €`;
  // #227.3: ista ili lošija ponuda nije pregovor; bez ove greške potroši jedini pregovor i sklopi ugovor po ponudi
  if (hasPrice ? (c.pricePerNight as number) <= offer.pricePerNight : (c.monthlyCost as number) >= offer.monthlyCost) {
    return hasPrice
      ? `Protuponuda nije u korist hotela: predloži cijenu noćenja višu od ${offer.pricePerNight} €`
      : `Protuponuda nije u korist hotela: predloži naknadu nižu od ${offer.monthlyCost} €`;
  }
  if (c.message !== undefined && (typeof c.message !== "string" || c.message.length > MAIL_BODY_MAX)) {
    return `Poruka smije imati najviše ${MAIL_BODY_MAX} znakova`;
  }
  return null;
}

/** Ishod protuponude. Pretpostavlja ispravnu protuponudu (counterError → null). */
export function negotiate(offer: NegotiationOffer, c: CounterOfferRequest): NegotiationDeal {
  const byPrice = c.pricePerNight !== undefined;
  const base = byPrice ? offer.pricePerNight : offer.monthlyCost;
  const counter = (byPrice ? c.pricePerNight : c.monthlyCost) as number;
  // u korist hotela: viša cijena noćenja ili niža naknada
  const gain = byPrice ? counter - base : base - counter;
  const deal = (outcome: NegotiationOutcome, value: number): NegotiationDeal => ({
    outcome,
    pricePerNight: byPrice ? value : offer.pricePerNight,
    monthlyCost: byPrice ? offer.monthlyCost : value,
  });
  // cijeli brojevi umjesto postotaka: gain / base × 100 ≤ pct  ⇔  gain × 100 ≤ pct × base
  if (gain * 100 <= NEGOTIATE_OK_PCT * base) return deal("accepted", counter);
  if (gain * 100 <= NEGOTIATE_COUNTER_PCT * base) return deal("countered", Math.round((base + counter) / 2));
  return deal("rejected", base);
}
