import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { afterReservation, studentTurnsBelow, toGradeAnswer } from "./queries";
import type { ChatTurn } from "@/lib/types";

describe("studentTurnsBelow", () => {
  it("broji samo studentove poruke u transkriptu istog retka i uspoređuje s granicom", () => {
    const { sql, params } = new PgDialect().sqlToQuery(studentTurnsBelow(6));
    expect(sql).toContain(`jsonb_array_elements("situations"."transcript")`);
    expect(sql).toContain(`->>'role' = 'student'`);
    expect(sql).toMatch(/\) < \$1$/);
    expect(params).toEqual([6]);
  });
});

describe("afterReservation", () => {
  it("prva poruka: prazan raniji razgovor, redni broj 1", () => {
    expect(afterReservation([{ role: "student", text: "Dobar dan" }])).toEqual({ prior: [], messageNo: 1 });
  });

  it("vraća razgovor prije upravo dodane poruke i njen redni broj", () => {
    const transcript: ChatTurn[] = [
      { role: "character", text: "Gdje je moja soba?" },
      { role: "student", text: "Provjerit ću." },
      { role: "character", text: "Požurite." },
      { role: "student", text: "Soba je spremna." },
    ];
    expect(afterReservation(transcript)).toEqual({ prior: transcript.slice(0, 3), messageNo: 2 });
  });

  it("nespareni studentov red (pao AI) se broji u ograničenje", () => {
    const transcript: ChatTurn[] = [
      { role: "student", text: "Prva" },
      { role: "student", text: "Druga" },
    ];
    expect(afterReservation(transcript).messageNo).toBe(2);
  });
});

describe("toGradeAnswer", () => {
  it("bez retka odgovora (leftJoin vrati sve stupce null) nema odgovora", () => {
    expect(toGradeAnswer({ mode: null, text: null, copied: null, quality: null })).toBeNull();
  });

  it("klik na ponuđeni odgovor: red postoji iako je tekst null", () => {
    expect(toGradeAnswer({ mode: "click", text: null, copied: false, quality: 4 })).toEqual({ mode: "click", text: null, copied: false, quality: 4 });
  });

  it("vlastiti odgovor s tekstom null (prazan) i dalje je odgovor, ne propuštena situacija", () => {
    expect(toGradeAnswer({ mode: "own", text: null, copied: false, quality: 1 })).toEqual({ mode: "own", text: null, copied: false, quality: 1 });
  });

  it("ocjena 0 nije isto što i bez odgovora", () => {
    expect(toGradeAnswer({ mode: "own", text: "Ispričavam se.", copied: true, quality: 0 })).toEqual({ mode: "own", text: "Ispričavam se.", copied: true, quality: 0 });
  });
});
