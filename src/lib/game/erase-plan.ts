// Brisanje podataka (#297, GDPR): što se briše i kojim redom. Čisto (bez baze), pa ga koristi i sučelje i testovi.
// Redoslijed je redoslijed stranih ključeva: djeca prije roditelja (nema onDelete: cascade u shemi igre).
// Test erase-plan.test.ts čita Drizzle shemu i ne dopušta novu tablicu koja upire na igru ili tvrtku, a nije u planu.
import { normalizeCode } from "@/lib/engine/codes";

/** "game" = cijela igra sa svim studentima; "student" = jedna tvrtka (hotel) sa svime što na nju upire. */
export type EraseScope = "game" | "student";

export type EraseTable =
  | "mail"
  | "answers"
  | "situations"
  | "round_reports"
  | "events"
  | "contracts"
  | "finances"
  | "plans"
  | "rooms"
  | "players"
  | "custom_situations"
  | "dispatches"
  | "companies"
  | "worlds";

/**
 * "delete" briše retke; "prune" čisti tvrtku iz tablica koje je spominju samo u JSON-u, bez stranog ključa:
 * `dispatches.company_ids` (ciljana slanja) i `events.payload` (događaj "round.settled" nosi ime najboljeg hotela).
 */
export type EraseStep = { table: EraseTable; action: "delete" | "prune" };

const del = (table: EraseTable): EraseStep => ({ table, action: "delete" });

/** Tablice koje upiru na tvrtku (izravno ili preko situacija i ugovora), pa idu i pri uklanjanju jednog studenta. */
const COMPANY_STEPS: EraseStep[] = [
  del("mail"), // i pošta drugih hotela koja pokazuje na ovu tvrtku ili njezine ugovore
  del("answers"), // preko situacija tvrtke
  del("situations"),
  del("round_reports"),
  del("events"),
  del("contracts"),
  del("finances"),
  del("plans"),
  del("rooms"),
  del("players"),
];

const GAME_PLAN: EraseStep[] = [
  ...COMPANY_STEPS,
  del("custom_situations"),
  del("dispatches"),
  del("companies"),
  del("worlds"),
];

const STUDENT_PLAN: EraseStep[] = [
  ...COMPANY_STEPS,
  del("companies"),
  { table: "events", action: "prune" },
  { table: "dispatches", action: "prune" },
];

/** Koraci brisanja redom kojim se izvršavaju (u jednom db.batch, dakle u jednoj transakciji). */
export function erasurePlan(scope: EraseScope): EraseStep[] {
  return (scope === "game" ? GAME_PLAN : STUDENT_PLAN).map((s) => ({ ...s }));
}

/**
 * Upisana potvrda brisanja igre: točan naziv igre (bez obzira na velika i mala slova) ili kod igre (i s razmakom ili crticom).
 * Isti uvjet provjerava sučelje (tipka) i poslužitelj (DELETE traži tijelo `{ confirm }`).
 */
export function matchesDeleteConfirmation(world: { name: string; joinCode: string }, typed: unknown): boolean {
  if (typeof typed !== "string") return false;
  const text = typed.trim();
  if (text === "") return false;
  const same = (a: string, b: string) => a.toLocaleLowerCase("hr") === b.toLocaleLowerCase("hr");
  return same(text, world.name.trim()) || normalizeCode(text) === world.joinCode;
}
