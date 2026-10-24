// Pravila igre (Global Constraints u planu izvedbe). Mijenja ih samo Leon, uz najavu timu.
import type { MetricKey, StaffDepartment, StaffShift } from "./types";

// Krugovi i situacije
export const MAX_ROUNDS = 4; // lipanj, srpanj, kolovoz, rujan
export const SITUATIONS_PER_ROUND = 2;
export const ROUND_LABELS = ["Lipanj", "Srpanj", "Kolovoz", "Rujan"];

// Kvaliteta odgovora (1–5)
export const CLICK_QUALITY_CAP = 4;
export const FALLBACK_QUALITY = 3;
export const MISSED_QUALITY = 1;

// Prepisivanje i lijepljenje
export const COPY_OVERLAP = 0.7;
export const PASTE_SHARE = 0.5;

// Razgovor i vlastiti odgovor
export const MAX_STUDENT_MESSAGES = 6;
export const MIN_OWN_ANSWER_CHARS = 0; // bez donje granice (Rino, Leon sub ~23:50): i prazan odgovor prolazi, a sudac i mentor ga prepoznaju
export const MAX_OWN_ANSWER_CHARS = 2000;

// Osvježavanje sučelja
export const POLL_MS = 3000;

// Pokazatelji
export const METRIC_TOTAL = 250;
export const METRIC_LABELS: Record<MetricKey, string> = {
  guests: "Zadovoljstvo gostiju",
  reviews: "Recenzije",
  staff: "Zaposlenici",
  operations: "Operativa",
  finance: "Financije",
};

// Osoblje hotela
export const STAFF_DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  reception: "Recepcija",
  housekeeping: "Domaćinstvo",
  kitchen: "Kuhinja i restoran",
  maintenance: "Održavanje",
  management: "Uprava",
};
export const STAFF_SHIFT_LABELS: Record<StaffShift, string> = {
  morning: "Jutarnja smjena",
  afternoon: "Popodnevna smjena",
  night: "Noćna smjena",
};

// Kodovi
export const JOIN_CODE_LENGTH = 6;
export const PROF_CODE_LENGTH = 12;
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bez 0, O, 1, I, L

// Ekonomija grada (sve u eurima)
export const NIGHTS_PER_ROUND = 30;
export const SEASON_DEMAND_BP = [6000, 8500, 9500, 5500]; // lipanj–rujan, udio kapaciteta grada u baznim bodovima
// Kvaliteta hotela za tržište (BUG-024, ADR-045): ponderi pokazatelja u postocima, zbroj 100.
export const MARKET_QUALITY_WEIGHTS: Record<MetricKey, number> = { guests: 30, reviews: 30, staff: 15, operations: 15, finance: 10 };
// Kalibracija prema kvarnerskim hotelima (docs: simpolis-research/hotel-financije.md, PR "kalibracija"). Svaka konstanta ima izvor.
export const FIXED_COST_PER_ROOM = 450; // izvor: Liburnia Riviera Hoteli 2025, ostali vanjski i ostali poslovni rashodi (energija, održavanje, A&G, osiguranje) oko 630 € po jedinici i mjesecu, Kvarner 2014 neraspoređeni troškovi (benchmarking BHH); 450 je konzervativan dio jer materijal i osoblje idu zasebno
// Osoblje, € po sobi i mjesecu, prema zvjezdicama (hotels.json: staffCost = sobe × ova vrijednost). Izvor: Liburnia 2025 oko 1.000 do 1.100 € po jedinici (rad 24,3 M € / 2.027 jedinica / 12), trošak po zaposleniku 2.300 do 2.700 € (Liburnia Q3 2025: 2.663 €), Valamar i Imperial 2025 oko 1.000 € po sobi u sezoni; niže zvjezdice niže.
export const STAFF_COST_PER_ROOM_BY_STARS: Partial<Record<2 | 3 | 4 | 5, number>> = { 2: 500, 3: 700, 4: 1000 };
export const VAT_PCT = 13; // izvor: Zakon o PDV-u (snižena stopa 13 % na usluge smještaja); izvještaji Liburnije, Valamara i Imperiala iskazuju prihod bez PDV-a
export const COMMISSION_PCT = 8; // izvor: Valamar 2025 OTA 9,9 % prodaje x provizija 15 do 25 %; mali neovisni hotel s 50 do 60 % rezervacija preko portala plaća efektivno 8 do 12 % prihoda (hotel-financije.md A5), uzeto donje
export const MATERIALS_PCT = 17; // izvor: Liburnia Riviera Hoteli 2025, sirovine i potrošni materijal 11,12 M € od 64,86 M € = 17,1 % prihoda
export const PRICE_MIN = 30;
export const PRICE_MAX = 400;
export const MARKETING_MAX = 2000; // izvor: prodaja i marketing 3,5 do 4,4 % prihoda (Kvarner 2014 3,7 %, HR 3,5 %), 2.000 € je oko 4 do 6 % prihoda malog hotela u vrhu
export const FINANCE_EFFECT_DIVISOR = 2000;
export const FINANCE_EFFECT_CAP = 5;
export const START_CASH = 20000;

// Ulaganje u odjele (odluka 24.10.): budžet po odjelu u planu mjeseca. Trošak ulazi u obračun, a pokazatelj odjela
// raste za min(INVEST_EFFECT_CAP, floor(ulog / INVEST_EFFECT_DIVISOR)) po odjelu i mjesecu.
export const INVEST_MAX = 3000;
export const INVEST_EFFECT_DIVISOR = 1000;
export const INVEST_EFFECT_CAP = 3;
export const DEPARTMENT_METRIC: Record<StaffDepartment, MetricKey> = {
  reception: "guests",
  housekeeping: "reviews",
  kitchen: "guests",
  maintenance: "operations",
  management: "staff",
};

// Pregovaranje s agencijama (L15): protuponuda do NEGOTIATE_OK_PCT % u korist hotela → prihvaćeno; do
// NEGOTIATE_COUNTER_PCT % → agencija jednom nudi sredinu; više → odbijeno i ponuda propada.
export const NEGOTIATE_OK_PCT = 15;
export const NEGOTIATE_COUNTER_PCT = 30;
export const MAIL_SUBJECT_MAX = 80;
export const MAIL_BODY_MAX = 1000;
