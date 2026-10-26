// Izvoz ocjena (CSV) za profesora: jedan redak po studentu, pa za svaku situaciju ocjena, vrsta odgovora i mjesec.
// Čiste funkcije bez baze i bez Reacta, pa ih smije uvesti i sučelje (lažni način). Brojke su već izračunate:
// kvaliteta u odgovoru je ocjena nakon profesorovih promjena (override.ts piše u isti stupac).
import { toCsv, type CsvCell } from "@/lib/csv";
import { isWrittenAnswer } from "@/lib/engine/round";
import { MISSED_QUALITY, ROUND_LABELS } from "@/lib/rules";

export type GradeAnswer = { mode: string; text: string | null; copied: boolean; quality: number };
/** Situacija jednog studenta; `answer` je null dok nema retka odgovora (krug još traje ili je stariji od zatvaranja). */
export type GradeSituation = { round: number; templateId: string; answer: GradeAnswer | null };
export type GradeStudent = {
  nickname: string;
  hotel: string;
  progress: number;
  closedRound: number; // zadnji krug koji je student zatvorio; situacija u zatvorenom krugu bez odgovora vrijedi kao propuštena
  situations: GradeSituation[];
};
export type GradesInput = { students: GradeStudent[]; titles: Record<string, string> }; // titles: templateId → naslov

export const ANSWER_OWN = "vlastiti";
export const ANSWER_OFFERED = "ponuđeni";
export const ANSWER_PASTED = "zalijepljeni";
export const ANSWER_NONE = "bez odgovora";
export const ANSWER_PENDING = "u tijeku";

/** Mjesec kruga: Lipanj … Rujan; izvan sezone „N. mjesec". */
export const monthLabel = (round: number) => ROUND_LABELS[round - 1] ?? `${round}. mjesec`;

/**
 * Vrsta odgovora: klik na ponuđeni (i tekst prepisan od ponuđenog) = „ponuđeni"; napisan svoj tekst = „vlastiti"
 * (isWrittenAnswer, isto pravilo kao motor); zalijepljen svoj tekst = „zalijepljeni" (nije vlastiti rad, ADR-046);
 * prazan ili propušten odgovor = „bez odgovora".
 */
export function answerKind(answer: GradeAnswer): string {
  if (answer.mode === "click") return ANSWER_OFFERED;
  if (isWrittenAnswer(answer)) return ANSWER_OWN;
  if (answer.mode === "own" && answer.copied && (answer.text ?? "").trim() !== "") return ANSWER_PASTED;
  return ANSWER_NONE;
}

/**
 * Tri ćelije situacije: ocjena (1 do 5), vrsta odgovora i mjesec. Bez retka odgovora: u zatvorenom krugu je to
 * propuštena situacija s ocjenom MISSED_QUALITY (kao roundResults pri zatvaranju), u krugu koji traje ocjena je prazna.
 */
export function situationCells(s: GradeSituation, closedRound: number): [CsvCell, CsvCell, CsvCell] {
  const month = monthLabel(s.round);
  if (s.answer) return [s.answer.quality, answerKind(s.answer), month];
  if (closedRound >= s.round) return [MISSED_QUALITY, ANSWER_NONE, month];
  return [null, ANSWER_PENDING, month];
}

const columnKey = (s: Pick<GradeSituation, "round" | "templateId">) => `${s.round}|${s.templateId}`;

/** Naslov situacije za zaglavlje stupca: {soba} i {hotel} nemaju smisla za cijeli razred, pa se izbace. */
export function columnTitle(title: string | undefined, templateId: string): string {
  const clean = (title ?? "").replaceAll("{soba}", "").replaceAll("{hotel}", "hotel").replace(/\s+/g, " ").trim();
  return clean || templateId;
}

/**
 * Zaglavlje stupca koje se ne ponavlja: dvije situacije s istim naslovom u istom mjesecu (npr. profesorova ili AI-jeva
 * s naslovom iz banke) inače bi imale ista imena stupaca. Drugi i dalje dobivaju šifru situacije u uglatim zagradama.
 */
function uniqueLabel(label: string, templateId: string, used: Set<string>): string {
  let unique = label;
  if (used.has(unique)) unique = `${label} [${templateId}]`;
  for (let n = 2; used.has(unique); n++) unique = `${label} [${templateId} ${n}]`; // šifra je već zauzeta samo u iznimnom slučaju
  used.add(unique);
  return unique;
}

/**
 * CSV s BOM-om i separatorom ";". Stupci: Nadimak, Hotel, Napredak, pa za svaku situaciju koju je ijedan student
 * dobio (po mjesecu, pa po šifri) tri stupca: ocjena, odgovor, mjesec. Redci abecedno po nadimku. Student koji
 * situaciju nije dobio ima tu prazna polja. Prazna igra daje samo zaglavlje.
 */
export function buildGradesCsv(input: GradesInput): string {
  const columns = new Map<string, Pick<GradeSituation, "round" | "templateId">>();
  for (const st of input.students) for (const s of st.situations) columns.set(columnKey(s), { round: s.round, templateId: s.templateId });
  const ordered = [...columns.entries()].sort(([, a], [, b]) => a.round - b.round || a.templateId.localeCompare(b.templateId));

  const header: CsvCell[] = ["Nadimak", "Hotel", "Napredak"];
  const usedLabels = new Set<string>();
  for (const [, c] of ordered) {
    const label = uniqueLabel(`${columnTitle(input.titles[c.templateId], c.templateId)} (${monthLabel(c.round)})`, c.templateId, usedLabels);
    header.push(`${label}: ocjena`, `${label}: odgovor`, `${label}: mjesec`);
  }

  const students = [...input.students].sort((a, b) => a.nickname.localeCompare(b.nickname, "hr") || a.hotel.localeCompare(b.hotel, "hr"));
  const rows = students.map((st) => {
    const own = new Map(st.situations.map((s) => [columnKey(s), s]));
    const cells: CsvCell[] = [st.nickname, st.hotel, st.progress];
    for (const [key] of ordered) {
      const s = own.get(key);
      cells.push(...(s ? situationCells(s, st.closedRound) : [null, null, null]));
    }
    return cells;
  });
  return toCsv([header, ...rows]);
}

// ---------- Naziv datoteke i preuzimanje ----------

/** Datum u Zagrebu kao GGGG-MM-DD (poslužitelj radi u UTC-u, a profesor traži današnji datum). */
export function zagrebDate(now: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zagreb", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Naziv igre za naziv datoteke: bez dijakritika, malim slovima, samo a-z, 0-9 i crtica, najviše 40 znakova. */
export function fileSlug(name: string): string {
  return name
    .replaceAll("đ", "d")
    .replaceAll("Đ", "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

/** ocjene-<naziv igre>-<datum>.csv, samo ASCII (sigurno u zaglavlju Content-Disposition). */
export function gradesFilename(gameName: string, now: Date = new Date()): string {
  return `ocjene-${fileSlug(gameName) || "igra"}-${zagrebDate(now)}.csv`;
}

export const gradesContentDisposition = (filename: string) => `attachment; filename="${filename}"`;

/** Naziv datoteke iz zaglavlja Content-Disposition (sučelje); bez njega zadani naziv. */
export function filenameFromDisposition(header: string | null): string {
  const match = header?.match(/filename="([^"\\\r\n]+)"/);
  return match?.[1] ?? "ocjene.csv";
}

export type GradesFile = { filename: string; blob: Blob };
