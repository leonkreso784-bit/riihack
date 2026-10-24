// Game rules. Values from the plan's Global Constraints; changed only by Leon, announced to the team.
import type { MetricKey } from "./types";

export const MAX_ROUNDS = 4; // lipanj, srpanj, kolovoz, rujan
export const SITUATIONS_PER_ROUND = 2;
export const CLICK_QUALITY_CAP = 4;
export const FALLBACK_QUALITY = 3;
export const MISSED_QUALITY = 1;
export const COPY_OVERLAP = 0.7;
export const PASTE_SHARE = 0.5;
export const MAX_STUDENT_MESSAGES = 6;
export const MIN_OWN_ANSWER_CHARS = 20;
export const MAX_OWN_ANSWER_CHARS = 2000;
export const POLL_MS = 3000;
export const METRIC_TOTAL = 250;
export const JOIN_CODE_LENGTH = 6;
export const PROF_CODE_LENGTH = 12;
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bez 0, O, 1, I, L

// City economy (all amounts in euros)
export const NIGHTS_PER_ROUND = 30;
export const SEASON_DEMAND_BP = [6000, 8500, 9500, 5500]; // lipanj–rujan
export const FIXED_COST_PER_ROOM = 300;
export const STAFF_COST_PER_ROOM = 450;
export const PRICE_MIN = 30;
export const PRICE_MAX = 400;
export const MARKETING_MAX = 5000;
export const FINANCE_EFFECT_DIVISOR = 2000;
export const FINANCE_EFFECT_CAP = 5;
export const START_CASH = 20000;

export const ROUND_LABELS = ["Lipanj", "Srpanj", "Kolovoz", "Rujan"];
export const METRIC_LABELS: Record<MetricKey, string> = {
  guests: "Zadovoljstvo gostiju",
  reviews: "Recenzije",
  staff: "Zaposlenici",
  operations: "Operativa",
  finance: "Financije",
};
