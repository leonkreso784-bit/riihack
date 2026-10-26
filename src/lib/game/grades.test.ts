import { describe, expect, it } from "vitest";
import type { CompanyRow, PlayerRow } from "@/db/schema";
import { CSV_BOM } from "@/lib/csv";
import type { Metrics } from "@/lib/types";
import { toGradesInput } from "./grades";
import { buildGradesCsv } from "./grades-csv";

const START: Metrics = { guests: 50, reviews: 50, staff: 50, operations: 50, finance: 50 };
const NOW: Metrics = { guests: 60, reviews: 50, staff: 50, operations: 50, finance: 50 };

function entry(id: string, nickname: string, hotel: string, over: Partial<CompanyRow> = {}) {
  const company = { id, name: hotel, kind: "hotel", startMetrics: START, metrics: NOW, closedRound: 1, ...over } as CompanyRow;
  const player = { id: `p-${id}`, companyId: id, displayName: nickname, tokenHash: "x" } as PlayerRow;
  return { company, player };
}

const TEMPLATES = [{ id: "kvar-klime", title: "Klima ne radi usred sezone" }];

describe("toGradesInput", () => {
  it("botovi nisu studenti i nemaju redak", () => {
    const input = toGradesInput([entry("c1", "Ana", "Hotel A"), entry("c2", "Računalo · srednje", "Hotel Bonavia (bot)", { kind: "bot" })], [], TEMPLATES);
    expect(input.students.map((s) => s.nickname)).toEqual(["Ana"]);
  });

  it("napredak je isti broj kao na ljestvici (Hakeov normalizirani dobitak)", () => {
    const [s] = toGradesInput([entry("c1", "Ana", "Hotel A")], [], TEMPLATES).students;
    expect(s.progress).toBe(4); // 0.2 × (60 − 50) / (100 − 50) × 100
  });

  it("situacije idu svom studentu, a naslov iz predloška", () => {
    const rows = [
      { companyId: "c1", round: 1, templateId: "kvar-klime", answer: { mode: "click", text: null, copied: false, quality: 4 } },
      { companyId: "c2", round: 1, templateId: "kvar-klime", answer: null },
    ];
    const input = toGradesInput([entry("c1", "Ana", "Hotel A"), entry("c2", "Bruno", "Hotel B", { closedRound: 0 })], rows, TEMPLATES);
    expect(input.students[0].situations).toEqual([{ round: 1, templateId: "kvar-klime", answer: rows[0].answer }]);
    expect(input.students[1].situations[0].answer).toBeNull();
    expect(input.titles["kvar-klime"]).toBe("Klima ne radi usred sezone");
  });

  it("igra bez studenata (samo botovi ili prazna) daje CSV samo sa zaglavljem", () => {
    const empty = buildGradesCsv(toGradesInput([], [], TEMPLATES));
    const onlyBots = buildGradesCsv(toGradesInput([entry("c2", "Računalo", "Hotel (bot)", { kind: "bot" })], [], TEMPLATES));
    expect(empty).toBe(`${CSV_BOM}"Nadimak";"Hotel";"Napredak"\r\n`);
    expect(onlyBots).toBe(empty);
  });

  it("cijeli put: ocjena iz retka odgovora stiže u CSV", () => {
    const rows = [{ companyId: "c1", round: 1, templateId: "kvar-klime", answer: { mode: "own", text: "Ispričao sam se.", copied: false, quality: 5 } }];
    const csv = buildGradesCsv(toGradesInput([entry("c1", "Ana", "Hotel A")], rows, TEMPLATES));
    expect(csv.split("\r\n")[1]).toBe('"Ana";"Hotel A";4;5;"vlastiti";"Lipanj"');
  });
});
