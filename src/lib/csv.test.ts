import { describe, expect, it } from "vitest";
import { CSV_BOM, csvField, csvRow, formatCsvNumber, neutralizeFormula, toCsv } from "./csv";

describe("neutralizeFormula", () => {
  it.each(["=1+1", "+385911234567", "-2+3", "@SUM(A1)", "\t=1", "\r=1"])("stavlja ' ispred %j", (text) => {
    expect(neutralizeFormula(text)).toBe(`'${text}`);
  });

  it.each(["Ana", "Hotel Lungomare", "1+1", "a=b", "'=1", "", " =1"])("ne dira %j", (text) => {
    expect(neutralizeFormula(text)).toBe(text);
  });
});

describe("formatCsvNumber", () => {
  it("decimalni zarez, cijeli broj bez njega", () => {
    expect(formatCsvNumber(12.5)).toBe("12,5");
    expect(formatCsvNumber(4)).toBe("4");
    expect(formatCsvNumber(-3.5)).toBe("-3,5");
    expect(formatCsvNumber(0)).toBe("0");
  });

  it("NaN i beskonačno daju prazno polje", () => {
    expect(formatCsvNumber(NaN)).toBe("");
    expect(formatCsvNumber(Infinity)).toBe("");
  });
});

describe("csvField", () => {
  it("običan tekst ostaje kakav jest, s č ć š ž đ", () => {
    expect(csvField("Šime Đurđević")).toBe("Šime Đurđević");
  });

  it("null i undefined su prazno polje", () => {
    expect(csvField(null)).toBe("");
    expect(csvField(undefined)).toBe("");
  });

  it("separator ; stavlja polje u navodnike", () => {
    expect(csvField("Hotel A; Opatija")).toBe('"Hotel A; Opatija"');
  });

  it("zarez ne traži navodnike (separator je ;)", () => {
    expect(csvField("Villa Petra, Lošinj")).toBe("Villa Petra, Lošinj");
  });

  it("navodnik se udvostruči i polje ide u navodnike", () => {
    expect(csvField('Gost kaže "ne"')).toBe('"Gost kaže ""ne"""');
  });

  it("novi redak (LF i CRLF) ostaje unutar navodnika", () => {
    expect(csvField("a\nb")).toBe('"a\nb"');
    expect(csvField("a\r\nb")).toBe('"a\r\nb"');
  });

  it("formula se čuva prije navođenja: ' je unutar navodnika", () => {
    expect(csvField('=HYPERLINK("http://x";"klik")')).toBe('"\'=HYPERLINK(""http://x"";""klik"")"');
  });

  it.each(["=cmd|' /C calc'!A0", "+1", "-1", "@x"])("tekst %j počinje s '", (text) => {
    expect(csvField(text).startsWith("'") || csvField(text).startsWith(`"'`)).toBe(true);
  });

  it("broj se ne čuva od formule: negativan napredak ostaje broj", () => {
    expect(csvField(-3.5)).toBe("-3,5");
    expect(csvField("-3,5")).toBe("'-3,5"); // isti znakovi kao tekst jesu opasni
  });
});

describe("csvRow", () => {
  it("spaja polja s ;", () => {
    expect(csvRow(["Ana", "Hotel A", 12.5, null, 4])).toBe("Ana;Hotel A;12,5;;4");
  });
});

describe("toCsv", () => {
  it("počinje BOM-om (UTF-8 EF BB BF), a redci završavaju s CRLF", () => {
    const csv = toCsv([["a", "b"], ["c", "d"]]);
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect([...new TextEncoder().encode(csv).slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(csv.slice(1)).toBe("a;b\r\nc;d\r\n");
  });

  it("bez redaka je samo BOM", () => {
    expect(toCsv([])).toBe(CSV_BOM);
  });

  it("BOM je samo na početku, ne ispred svakog retka", () => {
    expect(toCsv([["a"], ["b"]]).split(CSV_BOM)).toHaveLength(2);
  });
});
