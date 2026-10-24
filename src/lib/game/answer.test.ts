import { describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/http";
import { CLICK_QUALITY_CAP, FALLBACK_QUALITY } from "@/lib/rules";
import type { ChatTurn, JudgeInput, SituationTemplate, Verdict } from "@/lib/types";
import { ALREADY_ANSWERED, EMPTY_ANSWER_REASONING, ROUND_OVER, answerBlocked, gradeAnswer, parseAnswerRequest, toAnswerViewFromGraded } from "./answer";

const TEMPLATE: SituationTemplate = {
  id: "t1",
  title: "Kvar klime",
  text: "Klima u sobi 204 ne radi.",
  area: "Smještaj",
  difficulty: 2,
  character: { name: "Goran", role: "Gost", personality: "nestrpljiv", goal: "hladna soba" },
  rubric: ["c1", "c2", "c3", "c4", "c5"].map((id) => ({ id, text: `Kriterij ${id}`, skill: "empathy" as const })),
  options: [
    { id: "o1", text: "Ispričajte se i obećajte da će majstor doći sutra ujutro.", criteria: ["c1"] },
    { id: "o2", text: "Odmah ponudite drugi apartman s pogledom na more i besplatan doručak.", criteria: ["c1", "c2", "c3", "c4", "c5"] },
  ],
  effects: { guests: 3 },
  room: { type: "double", problemStatus: "broken" },
};
const OWN = "Gorane, žao mi je što vas klima muči po ovoj vrućini; za deset minuta dolazi tehničar, a do tada vam nosim ventilator.";
const TRANSCRIPT: ChatTurn[] = [{ role: "student", text: "Dobar dan" }, { role: "character", text: "Vruće je!" }];
const input = { template: TEMPLATE, hotelName: "Vila Ana", transcript: TRANSCRIPT };

function statusOf(fn: () => unknown): number | null {
  try {
    fn();
    return null;
  } catch (err) {
    return err instanceof HttpError ? err.status : -1;
  }
}

describe("parseAnswerRequest", () => {
  const ids = ["o1", "o2"];
  it("klik na poznatu opciju", () => expect(parseAnswerRequest({ optionId: "o2" }, ids)).toEqual({ kind: "click", optionId: "o2" }));
  it("nepoznata opcija → 400", () => {
    expect(statusOf(() => parseAnswerRequest({ optionId: "o9" }, ids))).toBe(400);
    expect(statusOf(() => parseAnswerRequest({ optionId: 2 }, ids))).toBe(400);
  });
  it("ni klik ni tekst → 400", () => expect(statusOf(() => parseAnswerRequest({}, ids))).toBe(400));
  it("bez donje granice: kratak i prazan tekst prolaze, predug → 400", () => {
    expect(parseAnswerRequest({ text: "Hvala", pastedChars: 0 }, ids)).toEqual({ kind: "text", text: "Hvala", pastedChars: 0 });
    expect(parseAnswerRequest({ text: "   " }, ids)).toEqual({ kind: "text", text: "", pastedChars: 0 });
    expect(statusOf(() => parseAnswerRequest({ text: "a".repeat(2001), pastedChars: 0 }, ids))).toBe(400);
  });
  it("pastedChars mora biti broj ≥ 0; bez njega 0; reže se na duljinu teksta", () => {
    expect(statusOf(() => parseAnswerRequest({ text: OWN, pastedChars: -1 }, ids))).toBe(400);
    expect(statusOf(() => parseAnswerRequest({ text: OWN, pastedChars: "5" }, ids))).toBe(400);
    expect(parseAnswerRequest({ text: `  ${OWN}  ` }, ids)).toEqual({ kind: "text", text: OWN, pastedChars: 0 });
    expect(parseAnswerRequest({ text: OWN, pastedChars: 99999.7 }, ids)).toEqual({ kind: "text", text: OWN, pastedChars: OWN.length });
  });
});

describe("answerBlocked", () => {
  const now = new Date("2026-10-24T15:00:00Z");
  const running = { round: 2, status: "running", roundDeadline: null };
  it("otvorena situacija tekućeg kruga → null", () => {
    expect(answerBlocked({ round: 2, state: "open" }, { closedRound: 1 }, running, now)).toBeNull();
    expect(answerBlocked({ round: 2, state: "open" }, { closedRound: 1 }, { ...running, roundDeadline: new Date("2026-10-24T15:05:00Z") }, now)).toBeNull();
  });
  it("već odgovoreno", () => expect(answerBlocked({ round: 2, state: "answered" }, { closedRound: 1 }, running, now)).toBe(ALREADY_ANSWERED));
  it("stari krug, zatvoren krug, istekla situacija, istekao rok, igra gotova → krug je završio", () => {
    expect(answerBlocked({ round: 1, state: "open" }, { closedRound: 0 }, running, now)).toBe(ROUND_OVER);
    expect(answerBlocked({ round: 2, state: "open" }, { closedRound: 2 }, running, now)).toBe(ROUND_OVER);
    expect(answerBlocked({ round: 2, state: "expired" }, { closedRound: 1 }, running, now)).toBe(ROUND_OVER);
    expect(answerBlocked({ round: 2, state: "open" }, { closedRound: 1 }, { ...running, roundDeadline: now }, now)).toBe(ROUND_OVER);
    expect(answerBlocked({ round: 2, state: "open" }, { closedRound: 1 }, { ...running, status: "finished" }, now)).toBe(ROUND_OVER);
  });
});

describe("gradeAnswer", () => {
  const verdict = (criteriaMet: string[]): Verdict => ({ criteriaMet, reasoning: "Obrazloženje." });

  it("klik: kvaliteta iz opcije, najviše 4, bez presude", async () => {
    const judge = vi.fn();
    const g = await gradeAnswer({ kind: "click", optionId: "o2" }, input, judge);
    expect(g).toMatchObject({ mode: "click", optionId: "o2", quality: CLICK_QUALITY_CAP, copied: false, verdict: null });
    expect(judge).not.toHaveBeenCalled();
  });

  it("prepisana opcija: vrijedi kao klik, copied, bez presude", async () => {
    const judge = vi.fn();
    const copied = "odmah ponudite drugi apartman s pogledom na more i besplatan doručak!";
    const g = await gradeAnswer({ kind: "text", text: copied, pastedChars: 0 }, input, judge);
    expect(g).toMatchObject({ mode: "click", optionId: "o2", text: copied, quality: 4, copied: true, verdict: null });
    expect(judge).not.toHaveBeenCalled();
  });

  it("vlastiti tekst: presuda s transkriptom, kvaliteta do 5", async () => {
    const judge = vi.fn<(i: JudgeInput) => Promise<Verdict>>(async () => verdict(["c1", "c2", "c3", "c4", "c5"]));
    const g = await gradeAnswer({ kind: "text", text: OWN, pastedChars: 0 }, input, judge);
    expect(g).toMatchObject({ mode: "own", quality: 5, copied: false, verdict: verdict(["c1", "c2", "c3", "c4", "c5"]) });
    expect(judge).toHaveBeenCalledWith({ template: TEMPLATE, hotelName: "Vila Ana", text: OWN, transcript: TRANSCRIPT });
  });

  it("prazan tekst: bez AI-ja, ništa ispunjeno, kvaliteta 1 i obrazloženje da nije ništa napisano", async () => {
    const judge = vi.fn();
    const g = await gradeAnswer({ kind: "text", text: "", pastedChars: 0 }, input, judge);
    expect(g).toMatchObject({ mode: "own", text: "", quality: 1, copied: false, verdict: { criteriaMet: [], reasoning: EMPTY_ANSWER_REASONING } });
    expect(judge).not.toHaveBeenCalled();
  });

  it("zalijepljen tekst: presuda, najviše 4, copied", async () => {
    const judge = vi.fn(async () => verdict(["c1", "c2", "c3", "c4", "c5"]));
    const g = await gradeAnswer({ kind: "text", text: OWN, pastedChars: OWN.length }, input, judge);
    expect(g).toMatchObject({ mode: "own", quality: 4, copied: true });
  });

  it("AI ne odgovori (null) → rezerva 3", async () => {
    const g = await gradeAnswer({ kind: "text", text: OWN, pastedChars: 0 }, input, async () => null);
    expect(g).toMatchObject({ mode: "own", quality: FALLBACK_QUALITY, verdict: null });
    expect(toAnswerViewFromGraded(g)).toEqual({ mode: "own", text: OWN, quality: 3, copied: false });
  });
});
