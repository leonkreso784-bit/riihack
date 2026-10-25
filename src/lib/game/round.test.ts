import { describe, expect, it } from "vitest";
import type { AnswerRow, SituationRow } from "@/db/schema";
import type { SituationTemplate } from "@/lib/types";
import { roundResults } from "./round";

const situation = (id: string, templateId: string) => ({ id, templateId }) as SituationRow;
const answer = (a: Partial<AnswerRow>) => ({ mode: "own", text: null, quality: 1, ...a }) as AnswerRow;
const templates = [{ id: "t1", effects: { guests: 3 } }] as unknown as SituationTemplate[];

describe("roundResults", () => {
  it("napisan svoj tekst nosi written, prazan, klik, propušten i zalijepljen ne (ADR-046)", () => {
    const out = roundResults(
      [
        { situation: situation("s1", "t1"), answer: answer({ text: "Ispričat ću se i ponuditi popust." }) },
        { situation: situation("s2", "t1"), answer: answer({ text: "" }) },
        { situation: situation("s3", "t1"), answer: answer({ mode: "click", text: null, quality: 2 }) },
        { situation: situation("s4", "t1"), answer: null },
        { situation: situation("s5", "t1"), answer: answer({ text: "Zalijepljeno.", copied: true }) },
      ],
      templates,
    );
    expect(out).toEqual([
      { quality: 1, effects: { guests: 3 }, written: true },
      { quality: 1, effects: { guests: 3 }, written: false },
      { quality: 2, effects: { guests: 3 }, written: false },
      { quality: 1, effects: { guests: 3 }, written: false },
      { quality: 1, effects: { guests: 3 }, written: false },
    ]);
  });

  it("nepoznat predložak → bez učinka", () => {
    expect(roundResults([{ situation: situation("s1", "nema"), answer: null }], templates)).toEqual([
      { quality: 1, effects: {}, written: false },
    ]);
  });
});
