import { describe, expect, it } from "vitest";
import { CSV_BOM } from "@/lib/csv";
import {
  ANSWER_NONE,
  ANSWER_OFFERED,
  ANSWER_OWN,
  ANSWER_PASTED,
  ANSWER_PENDING,
  answerKind,
  buildGradesCsv,
  columnTitle,
  fileSlug,
  filenameFromDisposition,
  gradesContentDisposition,
  gradesFilename,
  monthLabel,
  situationCells,
  zagrebDate,
  type GradeAnswer,
  type GradeStudent,
} from "./grades-csv";

const click = (quality: number): GradeAnswer => ({ mode: "click", text: null, copied: false, quality });
const own = (quality: number, text = "Ispričao sam se gostu i ponudio drugu sobu."): GradeAnswer => ({ mode: "own", text, copied: false, quality });

const TITLES = { "kvar-klime": "Klima ne radi usred sezone", "losa-recenzija": "Loša recenzija na internetu" };

function student(over: Partial<GradeStudent> = {}): GradeStudent {
  return { nickname: "Ana", hotel: "Hotel Lungomare", progress: 12.5, closedRound: 1, situations: [], ...over };
}

/** CSV bez BOM-a kao popis redaka. */
const lines = (csv: string) => csv.slice(1).split("\r\n").slice(0, -1);

describe("answerKind", () => {
  it("klik je ponuđeni, i kad je tekst prepisan od ponuđenog (copied)", () => {
    expect(answerKind(click(4))).toBe(ANSWER_OFFERED);
    expect(answerKind({ mode: "click", text: "prepisano", copied: true, quality: 3 })).toBe(ANSWER_OFFERED);
  });

  it("napisan svoj tekst je vlastiti", () => {
    expect(answerKind(own(5))).toBe(ANSWER_OWN);
  });

  it("zalijepljen svoj tekst nije vlastiti nego zalijepljeni", () => {
    expect(answerKind({ mode: "own", text: "tuđi tekst", copied: true, quality: 4 })).toBe(ANSWER_PASTED);
  });

  it("prazan i propušten odgovor su bez odgovora", () => {
    expect(answerKind({ mode: "own", text: "", copied: false, quality: 1 })).toBe(ANSWER_NONE);
    expect(answerKind({ mode: "own", text: "   ", copied: false, quality: 1 })).toBe(ANSWER_NONE);
    expect(answerKind({ mode: "none", text: null, copied: false, quality: 1 })).toBe(ANSWER_NONE);
  });
});

describe("monthLabel", () => {
  it("krug 1 do 4 su lipanj do rujan, izvan sezone N. mjesec", () => {
    expect([1, 2, 3, 4].map(monthLabel)).toEqual(["Lipanj", "Srpanj", "Kolovoz", "Rujan"]);
    expect(monthLabel(7)).toBe("7. mjesec");
  });
});

describe("situationCells", () => {
  it("odgovor daje ocjenu, vrstu i mjesec", () => {
    expect(situationCells({ round: 2, templateId: "a", answer: click(4) }, 2)).toEqual([4, ANSWER_OFFERED, "Srpanj"]);
  });

  it("zatvoren krug bez retka odgovora je propuštena situacija s ocjenom 1", () => {
    expect(situationCells({ round: 1, templateId: "a", answer: null }, 1)).toEqual([1, ANSWER_NONE, "Lipanj"]);
  });

  it("krug koji traje bez odgovora ima praznu ocjenu", () => {
    expect(situationCells({ round: 2, templateId: "a", answer: null }, 1)).toEqual([null, ANSWER_PENDING, "Srpanj"]);
  });
});

describe("columnTitle", () => {
  it("izbacuje {soba}, mijenja {hotel} i sređuje razmake", () => {
    expect(columnTitle("Gost u sobi {soba} kvari {hotel}", "x")).toBe("Gost u sobi kvari hotel");
  });

  it("bez naslova koristi šifru", () => {
    expect(columnTitle(undefined, "custom-1")).toBe("custom-1");
    expect(columnTitle("  ", "custom-1")).toBe("custom-1");
  });
});

// Redak CSV-a u ćelije: skida navodnike i "" pretvara u ". Testovi sadržaja ne ovise o tome kako je polje citirano.
function cells(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ";") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
const row = (text: string) => text.split(";");

describe("buildGradesCsv", () => {
  it("prazna igra: BOM i samo zaglavlje", () => {
    const csv = buildGradesCsv({ students: [], titles: {} });
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(lines(csv).map(cells)).toEqual([row("Nadimak;Hotel;Napredak")]);
  });

  it("student bez situacija (lobby): redak s nadimkom, hotelom i napretkom", () => {
    const csv = buildGradesCsv({ students: [student({ progress: 0, closedRound: 0 })], titles: {} });
    expect(lines(csv).map(cells)).toEqual([row("Nadimak;Hotel;Napredak"), row("Ana;Hotel Lungomare;0")]);
  });

  it("jedan redak po studentu, po situaciji ocjena, odgovor i mjesec; napredak s decimalnim zarezom", () => {
    const csv = buildGradesCsv({
      titles: TITLES,
      students: [
        student({
          situations: [
            { round: 1, templateId: "kvar-klime", answer: click(4) },
            { round: 1, templateId: "losa-recenzija", answer: own(5) },
          ],
        }),
      ],
    });
    expect(lines(csv).map(cells)).toEqual([
      row(
        "Nadimak;Hotel;Napredak;" +
          "Klima ne radi usred sezone (Lipanj): ocjena;Klima ne radi usred sezone (Lipanj): odgovor;Klima ne radi usred sezone (Lipanj): mjesec;" +
          "Loša recenzija na internetu (Lipanj): ocjena;Loša recenzija na internetu (Lipanj): odgovor;Loša recenzija na internetu (Lipanj): mjesec",
      ),
      row("Ana;Hotel Lungomare;12,5;4;ponuđeni;Lipanj;5;vlastiti;Lipanj"),
    ]);
  });

  it("ocjena je ona nakon profesorove promjene (quality iz retka odgovora)", () => {
    // override.ts piše novu ocjenu u answers.quality; izvoz čita taj stupac, pa je 1 → 4 odmah u CSV-u
    const csv = buildGradesCsv({ titles: TITLES, students: [student({ situations: [{ round: 1, templateId: "kvar-klime", answer: own(4) }] })] });
    expect(cells(lines(csv)[1])).toEqual(row("Ana;Hotel Lungomare;12,5;4;vlastiti;Lipanj"));
  });

  it("negativan napredak ostaje broj, bez apostrofa", () => {
    const csv = buildGradesCsv({ students: [student({ progress: -3.5 })], titles: {} });
    expect(cells(lines(csv)[1])).toEqual(row("Ana;Hotel Lungomare;-3,5"));
    expect(lines(csv)[1].endsWith(";-3,5")).toBe(true); // broj bez navodnika i bez apostrofa
  });

  it("stupci po mjesecu pa po šifri; student koji situaciju nije dobio ima prazna polja", () => {
    const csv = buildGradesCsv({
      titles: TITLES,
      students: [
        student({ nickname: "Ana", closedRound: 2, situations: [{ round: 2, templateId: "kvar-klime", answer: click(3) }, { round: 1, templateId: "losa-recenzija", answer: click(5) }] }),
        student({ nickname: "Bruno", hotel: "Villa Petra", closedRound: 2, situations: [{ round: 1, templateId: "losa-recenzija", answer: click(2) }] }),
      ],
    });
    const [header, ana, bruno] = lines(csv).map(cells);
    expect(header.slice(3)).toEqual([
      "Loša recenzija na internetu (Lipanj): ocjena",
      "Loša recenzija na internetu (Lipanj): odgovor",
      "Loša recenzija na internetu (Lipanj): mjesec",
      "Klima ne radi usred sezone (Srpanj): ocjena",
      "Klima ne radi usred sezone (Srpanj): odgovor",
      "Klima ne radi usred sezone (Srpanj): mjesec",
    ]);
    expect(ana).toEqual(row("Ana;Hotel Lungomare;12,5;5;ponuđeni;Lipanj;3;ponuđeni;Srpanj"));
    expect(bruno).toEqual(row("Bruno;Villa Petra;12,5;2;ponuđeni;Lipanj;;;"));
  });

  it("ista situacija u dva mjeseca daje dva stupca", () => {
    const csv = buildGradesCsv({
      titles: TITLES,
      students: [student({ closedRound: 2, situations: [{ round: 1, templateId: "kvar-klime", answer: click(3) }, { round: 2, templateId: "kvar-klime", answer: click(4) }] })],
    });
    const [header, ana] = lines(csv).map(cells);
    expect(header).toHaveLength(3 + 6);
    expect(ana).toEqual(row("Ana;Hotel Lungomare;12,5;3;ponuđeni;Lipanj;4;ponuđeni;Srpanj"));
  });

  it("dvije situacije s istim naslovom u istom mjesecu dobivaju različita zaglavlja (drugoj ide šifra)", () => {
    const csv = buildGradesCsv({
      titles: { "kvar-klime": "Klima ne radi", "custom-1": "Klima ne radi" },
      students: [student({ situations: [{ round: 1, templateId: "kvar-klime", answer: click(3) }, { round: 1, templateId: "custom-1", answer: click(5) }] })],
    });
    const [header, ana] = lines(csv).map(cells);
    const columns = header.slice(3);
    expect(new Set(columns).size).toBe(6);
    // poredak po šifri: custom-1 je prvi i zadržava čisto ime, kvar-klime dobiva šifru
    expect(columns.slice(0, 3)).toEqual(["Klima ne radi (Lipanj): ocjena", "Klima ne radi (Lipanj): odgovor", "Klima ne radi (Lipanj): mjesec"]);
    expect(columns.slice(3, 6)).toEqual(["Klima ne radi (Lipanj) [kvar-klime]: ocjena", "Klima ne radi (Lipanj) [kvar-klime]: odgovor", "Klima ne radi (Lipanj) [kvar-klime]: mjesec"]);
    expect(ana).toEqual(row("Ana;Hotel Lungomare;12,5;5;ponuđeni;Lipanj;3;ponuđeni;Lipanj"));
  });

  it("isti naslov u različitim mjesecima ne dobiva šifru (mjesec ih već razlikuje)", () => {
    const csv = buildGradesCsv({
      titles: { "kvar-klime": "Klima ne radi" },
      students: [student({ closedRound: 2, situations: [{ round: 1, templateId: "kvar-klime", answer: click(3) }, { round: 2, templateId: "kvar-klime", answer: click(4) }] })],
    });
    expect(lines(csv)[0]).not.toContain("[");
  });

  it("redci su abecedno po nadimku (hrvatski poredak: č iza c, š iza s)", () => {
    const names = ["Šime", "Zoran", "Čedo", "Cvita", "Ana"].map((nickname) => student({ nickname }));
    const csv = buildGradesCsv({ students: names, titles: {} });
    expect(lines(csv).slice(1).map((l) => cells(l)[0])).toEqual(["Ana", "Cvita", "Čedo", "Šime", "Zoran"]);
  });

  it("zatvoren mjesec bez odgovora: ocjena 1 i bez odgovora; mjesec koji traje: prazna ocjena", () => {
    const csv = buildGradesCsv({
      titles: TITLES,
      students: [
        student({ closedRound: 1, situations: [{ round: 1, templateId: "kvar-klime", answer: null }, { round: 2, templateId: "kvar-klime", answer: null }] }),
      ],
    });
    expect(cells(lines(csv)[1])).toEqual(row("Ana;Hotel Lungomare;12,5;1;bez odgovora;Lipanj;;u tijeku;Srpanj"));
  });

  it("citira polja s ; i navodnicima, a č ć š ž đ prolaze netaknuti", () => {
    const csv = buildGradesCsv({
      titles: {},
      students: [student({ nickname: 'Đuro "Šef"', hotel: "Hotel Lošinj; Čikat" })],
    });
    expect(lines(csv)[1]).toBe('"Đuro ""Šef""";"Hotel Lošinj; Čikat";12,5');
  });

  it("CSV injection: nadimak, hotel i naslov situacije s = + - @ dobivaju ' ispred", () => {
    const csv = buildGradesCsv({
      titles: { "custom-1": '=HYPERLINK("http://zlo.example";"klik")' },
      students: [
        student({ nickname: "=1+1", hotel: "@SUM(A1:A9)", situations: [{ round: 1, templateId: "custom-1", answer: click(3) }] }),
        student({ nickname: "+385", hotel: "-2+3" }),
      ],
    });
    const out = lines(csv);
    expect(cells(out[0])[3].startsWith("'=HYPERLINK(")).toBe(true);
    expect(out[1]).toBe(`"'+385";"'-2+3";12,5;;;`);
    expect(out[2]).toBe(`"'=1+1";"'@SUM(A1:A9)";12,5;3;"ponuđeni";"Lipanj"`);
    // nijedna ćelija ne počinje opasnim znakom (osim brojeva koje piše izvoz)
    for (const line of out.slice(1)) for (const cell of cells(line)) expect(cell).not.toMatch(/^[=+@]/);
  });

  it("CSV injection preko drugog separatora: tekst iza zareza ne može postati formula", () => {
    const csv = buildGradesCsv({ titles: {}, students: [student({ nickname: "Ana,=1+1", hotel: "Hotel\t@SUM(A1)" })] });
    const line = lines(csv)[1];
    // i kad ga program podijeli po zarezu ili tabu, nijedan dio ne počinje formulom
    for (const part of line.split(/[,\t]/)) expect(part.replace(/^"/, "")).not.toMatch(/^[=+\-@]/);
    expect(cells(line).slice(0, 2)).toEqual(["Ana,'=1+1", "Hotel\t'@SUM(A1)"]);
  });

  it("novi red u naslovu situacije postaje razmak, a u nadimku ostaje unutar navodnika", () => {
    const csv = buildGradesCsv({
      titles: { x: "Prvi\nDrugi" },
      students: [student({ nickname: "Ana\nEva", situations: [{ round: 1, templateId: "x", answer: click(2) }] })],
    });
    expect(csv).toContain("Prvi Drugi (Lipanj): ocjena");
    expect(csv).toContain('"Ana\nEva";"Hotel Lungomare";12,5;2;"ponuđeni";"Lipanj"');
  });
});

describe("zagrebDate", () => {
  it("datum po zagrebačkom vremenu, ne po UTC-u", () => {
    expect(zagrebDate(new Date("2026-10-25T23:30:00Z"))).toBe("2026-10-26"); // CET: već ponoć prošla
    expect(zagrebDate(new Date("2026-07-14T12:00:00Z"))).toBe("2026-07-14");
  });
});

describe("fileSlug", () => {
  it("bez dijakritika, malim slovima, crtice umjesto razmaka", () => {
    expect(fileSlug("Hotelijerstvo 2A, ljeto")).toBe("hotelijerstvo-2a-ljeto");
    expect(fileSlug("Čaršija Đakovo šž ć")).toBe("carsija-dakovo-sz-c");
  });

  it("izbacuje znakove opasne za naziv datoteke i zaglavlje", () => {
    expect(fileSlug('../etc/passwd"; x=1\r\n')).toBe("etc-passwd-x-1");
  });

  it("najviše 40 znakova, bez crtice na kraju", () => {
    const slug = fileSlug("a".repeat(39) + " bbbbbbbb");
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("samo posebni znakovi daju prazan niz", () => {
    expect(fileSlug("???")).toBe("");
  });
});

describe("gradesFilename", () => {
  it("ocjene-<igra>-<datum>.csv", () => {
    expect(gradesFilename("Hotelijerstvo 2A", new Date("2026-10-26T10:00:00Z"))).toBe("ocjene-hotelijerstvo-2a-2026-10-26.csv");
  });

  it("igra bez slova u nazivu dobiva 'igra'", () => {
    expect(gradesFilename("!!!", new Date("2026-10-26T10:00:00Z"))).toBe("ocjene-igra-2026-10-26.csv");
  });

  it("samo ASCII, pa je siguran u Content-Disposition", () => {
    const name = gradesFilename('Šime "Đ" <script>', new Date("2026-10-26T10:00:00Z"));
    expect(name).toMatch(/^[a-z0-9.-]+$/);
    expect(gradesContentDisposition(name)).toBe(`attachment; filename="${name}"`);
  });
});

describe("filenameFromDisposition", () => {
  it("čita naziv iz zaglavlja koje piše poslužitelj", () => {
    const name = gradesFilename("Igra", new Date("2026-10-26T10:00:00Z"));
    expect(filenameFromDisposition(gradesContentDisposition(name))).toBe(name);
  });

  it("bez zaglavlja zadani naziv", () => {
    expect(filenameFromDisposition(null)).toBe("ocjene.csv");
    expect(filenameFromDisposition("attachment")).toBe("ocjene.csv");
  });
});
