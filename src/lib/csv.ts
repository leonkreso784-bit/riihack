// CSV za hrvatski Excel: UTF-8 s BOM-om, separator ";", redovi završavaju s CRLF. Svako tekstualno polje ide u
// navodnike, a tekst koji bi Excel mogao izvršiti kao formulu dobiva ' ispred. Bez baze i bez Reacta.

export const CSV_BOM = "\uFEFF"; // bez njega Excel čita UTF-8 kao Windows-1250 i č, ć, š, ž, đ se pokvare
export const CSV_SEPARATOR = ";"; // hrvatski Excel: zarez je decimalni znak, pa je separator točka-zarez
export const CSV_NEWLINE = "\r\n";

export type CsvCell = string | number | null | undefined;

// Početak ćelije koji Excel i LibreOffice čitaju kao formulu: = + - @ te tab i CR (OWASP, CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;
// Isto iza znaka koji neki program može uzeti kao granicu ćelije: ako datoteku otvori sa zarezom ili tabom kao
// separatorom (drugačije regionalne postavke), dio teksta iza zareza postaje nova ćelija i ne smije početi formulom.
const FORMULA_AFTER_DELIMITER = /([,;\t\r\n])(\s*)([=+\-@])/g;

/**
 * Tekst ćelije bez opasnosti od formule: ' ide ispred = + - @ na početku teksta (i ispred taba ili CR-a), te iza
 * svakog zareza, točke-zareza, taba ili novog reda. Samo za tekst koji unosi korisnik; brojeve ne treba čuvati.
 */
export function neutralizeFormula(text: string): string {
  const inner = text.replace(FORMULA_AFTER_DELIMITER, "$1$2'$3");
  return FORMULA_START.test(inner) ? `'${inner}` : inner;
}

/** Broj za hrvatski Excel: decimalni zarez (12,5), bez tisućica i bez eksponenta za naše raspone. */
export function formatCsvNumber(n: number): string {
  return Number.isFinite(n) ? String(n).replace(".", ",") : "";
}

/**
 * Jedno polje: null i undefined su prazno polje, broj dobiva decimalni zarez i ostaje bez navodnika, a tekst se
 * čuva od formule i uvijek ide u navodnike (tako ga ni drugačiji separator ne razbije na ćelije).
 */
export function csvField(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "number") return formatCsvNumber(cell);
  return `"${neutralizeFormula(cell).replaceAll('"', '""')}"`;
}

export function csvRow(cells: CsvCell[]): string {
  return cells.map(csvField).join(CSV_SEPARATOR);
}

/** Cijela datoteka: BOM, pa svaki redak s CRLF na kraju. Bez redaka daje samo BOM. */
export function toCsv(rows: CsvCell[][]): string {
  return CSV_BOM + rows.map((r) => csvRow(r) + CSV_NEWLINE).join("");
}
