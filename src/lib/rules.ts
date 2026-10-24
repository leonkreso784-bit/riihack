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
export const MIN_OWN_ANSWER_CHARS = 20;
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
export const FIXED_COST_PER_ROOM = 300;
export const STAFF_COST_PER_ROOM = 450;
export const PRICE_MIN = 30;
export const PRICE_MAX = 400;
export const MARKETING_MAX = 5000;
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
