// CSV za hrvatski Excel: UTF-8 s BOM-om, separator ";", redovi završavaju s CRLF, polja s ";", navodnikom ili novim
// redom idu u navodnicima, a tekst koji bi Excel mogao izvršiti kao formulu dobiva ' ispred. Bez baze i bez Reacta.

export const CSV_BOM = "\uFEFF"; // bez njega Excel čita UTF-8 kao Windows-1250 i č, ć, š, ž, đ se pokvare
export const CSV_SEPARATOR = ";"; // hrvatski Excel: zarez je decimalni znak, pa je separator točka-zarez
export const CSV_NEWLINE = "\r\n";

export type CsvCell = string | number | null | undefined;

// Početak ćelije koji Excel i LibreOffice čitaju kao formulu: = + - @ te tab i CR (OWASP, CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * Tekst ćelije bez opasnosti od formule: ako počinje s = + - @ (ili tabom ili CR-om), ispred ide ' pa ga tablica
 * prikaže kao običan tekst. Samo za tekst koji unosi korisnik; brojeve (npr. negativan napredak) ne treba čuvati.
 */
export function neutralizeFormula(text: string): string {
  return FORMULA_START.test(text) ? `'${text}` : text;
}

/** Broj za hrvatski Excel: decimalni zarez (12,5), bez tisućica i bez eksponenta za naše raspone. */
export function formatCsvNumber(n: number): string {
  return Number.isFinite(n) ? String(n).replace(".", ",") : "";
}

/** Jedno polje: null i undefined su prazno polje, broj dobiva decimalni zarez, tekst se čuva od formule pa navodi po potrebi. */
export function csvField(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  const text = typeof cell === "number" ? formatCsvNumber(cell) : neutralizeFormula(cell);
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function csvRow(cells: CsvCell[]): string {
  return cells.map(csvField).join(CSV_SEPARATOR);
}

/** Cijela datoteka: BOM, pa svaki redak s CRLF na kraju. Bez redaka daje samo BOM. */
export function toCsv(rows: CsvCell[][]): string {
  return CSV_BOM + rows.map((r) => csvRow(r) + CSV_NEWLINE).join("");
}
