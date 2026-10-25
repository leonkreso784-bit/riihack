import { describe, expect, it } from "vitest";
import { applyRound } from "@/lib/engine/round";
import { qualityFromVerdict } from "@/lib/engine/quality";
import { DEPARTMENT_METRIC } from "@/lib/rules";
import type { AnswerView, Metrics, Quality, RubricCriterion, SituationView } from "@/lib/types";
import { buildAnswerFlow, flowInputFromSituation, metricDelta, NO_EFFECTS_TEXT, CLOSE_NOTE, type AnswerFlowInput } from "./answer-flow";

const RUBRIC = [
  { id: "c1", text: "Zove hitnu pomoć" },
  { id: "c2", text: "Smiruje goste" },
  { id: "c3", text: "Daje upute osoblju" },
  { id: "c4", text: "Zadrži uzorak jela" },
  { id: "c5", text: "Javi osiguratelju" },
];
const ENGINE_RUBRIC: RubricCriterion[] = RUBRIC.map((c) => ({ ...c, skill: "empathy" }));
const EFFECTS = { reviews: 4, guests: 3, operations: 3 };
const base = { title: "Alergija", character: { name: "Helena Bogdan", role: "Gošća" } };
const own = (met: string[], extra: Partial<AnswerView> = {}): AnswerView => ({
  mode: "own",
  quality: qualityFromVerdict(met, ENGINE_RUBRIC),
  copied: false,
  verdict: { criteriaMet: met, reasoning: "Dobro." },
  ...extra,
});
const flow = (i: Partial<AnswerFlowInput> & { answer: AnswerView }) => buildAnswerFlow({ ...base, ...i });
const step = (steps: ReturnType<typeof buildAnswerFlow>, id: string) => steps.find((s) => s.id === id)!;

describe("buildAnswerFlow", () => {
  it("kvaliteta prikaza je ona koju računa motor (broj kriterija, najmanje 1)", () => {
    for (const met of [[], ["c2"], ["c2", "c3"], ["c1", "c2", "c3", "c4", "c5"]]) {
      const a = own(met);
      const q = step(flow({ answer: a, rubric: RUBRIC, effects: EFFECTS }), "kvaliteta");
      expect(q.big).toBe(`${qualityFromVerdict(met, ENGINE_RUBRIC)} / 5`);
    }
    expect(own([]).quality).toBe(1);
  });

  it("promjena pokazatelja je jednaka onoj iz applyRound", () => {
    const start: Metrics = { guests: 50, reviews: 50, staff: 50, operations: 50, finance: 50 };
    for (const q of [1, 2, 3, 4, 5] as Quality[]) {
      const after = applyRound(start, [{ quality: q, effects: EFFECTS }]);
      const steps = flow({ answer: own(["c1"], { quality: q }), rubric: RUBRIC, effects: EFFECTS });
      const outs = step(steps, "ucinak").outputs;
      for (const [k, e] of Object.entries(EFFECTS)) {
        expect(metricDelta(q, e)).toBe(after[k as keyof Metrics] - 50);
      }
      expect(outs).toHaveLength(3);
    }
    const q2 = step(flow({ answer: own(["c2", "c3"]), rubric: RUBRIC, effects: EFFECTS }), "ucinak");
    expect(q2.outputs.map((o) => o.value)).toEqual(["0", "0", "0"]);
    expect(q2.calc).toContain("0 × 4 = 0");
  });

  it("s rubrikom pokazuje tekst kriterija, bez nje samo brojeve i napomenu", () => {
    const withText = step(flow({ answer: own(["c2", "c3"]), rubric: RUBRIC }), "sudac");
    expect(withText.outputs.some((o) => o.value.includes("Ispunjeno: Smiruje goste"))).toBe(true);
    expect(withText.outputs.some((o) => o.value.includes("Nije ispunjeno: Zove hitnu pomoć"))).toBe(true);
    const without = step(flow({ answer: own(["c2", "c3"]) }), "sudac");
    expect(without.outputs[0]).toMatchObject({ label: "Ispunjeno kriterija", value: "2" });
    expect(without.outputs.map((o) => o.label)).toContain("Kriterij 3");
    expect(without.note).toMatch(/Tekstove kriterija/);
  });

  it("bez učinka ostaje kvaliteta i rečenica o izvještaju, bez izmišljenih brojki i bez koraka odjela", () => {
    const steps = flow({ answer: own(["c2", "c3"]) });
    expect(steps.map((s) => s.id)).toEqual(["odgovor", "sudac", "kvaliteta", "ucinak"]);
    expect(step(steps, "ucinak").note).toBe(NO_EFFECTS_TEXT);
    const empty = flow({ answer: own(["c2"]), effects: {} });
    expect(empty.map((s) => s.id)).not.toContain("odjeli");
  });

  it("s učinkom dodaje odjele iz DEPARTMENT_METRIC i napomenu o zatvaranju mjeseca", () => {
    const steps = flow({ answer: own(["c2", "c3"]), rubric: RUBRIC, effects: { ...EFFECTS, finance: 2 } });
    expect(steps.map((s) => s.id)).toEqual(["odgovor", "sudac", "kvaliteta", "ucinak", "odjeli"]);
    expect(step(steps, "ucinak").note).toBe(CLOSE_NOTE);
    const dep = step(steps, "odjeli").outputs;
    const guests = dep.find((o) => o.label === "Zadovoljstvo gostiju")!;
    const expected = Object.entries(DEPARTMENT_METRIC).filter(([, m]) => m === "guests").length;
    expect(guests.value.split(",").length).toBe(expected);
    expect(dep.find((o) => o.label === "Financije")!.value).toMatch(/Nema svog odjela/);
  });

  it("ocjena koju je promijenio profesor", () => {
    const q = step(flow({ answer: own(["c2"], { quality: 5, overridden: true }), effects: EFFECTS }), "kvaliteta");
    expect(q.big).toBe("5 / 5");
    expect(q.note).toMatch(/profesor je promijenio ocjenu/i);
    expect(q.calc).toBeUndefined();
  });

  it("klik, prepisano, bez presude i bez odgovora", () => {
    const click = flow({ answer: { mode: "click", optionId: "o1", quality: 4, copied: false } });
    expect(step(click, "kvaliteta").rule.join(" ")).toMatch(/najviše 4/);
    expect(step(click, "sudac").small).toMatch(/unaprijed/);
    const copied = flow({ answer: own(["c1", "c2", "c3"], { copied: true, quality: 3 }) });
    expect(step(copied, "odgovor").rule.join(" ")).toMatch(/najviše 4/);
    const nojudge = flow({ answer: { mode: "own", quality: 3, copied: false } });
    expect(step(nojudge, "sudac").small).toBe("Sudac nije odgovorio");
    const none = flow({ answer: { mode: "none", quality: 1, copied: false } });
    expect(step(none, "kvaliteta").big).toBe("1 / 5");
  });

  it("flowInputFromSituation čita neobavezna polja i vraća null bez odgovora", () => {
    const s: SituationView = { id: "x", templateId: "t", round: 1, title: "T", text: "", area: "", difficulty: 1, character: { name: "A", role: "B" }, options: [], state: "answered", transcript: [] };
    expect(flowInputFromSituation({ ...s })).toBeNull();
    const a = own(["c1"]);
    expect(flowInputFromSituation({ ...s, answer: a })).toMatchObject({ rubric: undefined, effects: undefined });
    expect(flowInputFromSituation({ ...s, answer: a, rubric: RUBRIC, effects: EFFECTS } as never)).toMatchObject({ rubric: RUBRIC, effects: EFFECTS });
  });
  it("napisan svoj tekst s kvalitetom 1 → množitelj 0, prazan i propušten −2, kao applyRound (ADR-046)", () => {
    const start: Metrics = { guests: 50, reviews: 50, staff: 50, operations: 50, finance: 50 };
    const written = step(flow({ answer: own([], { text: "Ispričat ću se gošći." }), rubric: RUBRIC, effects: EFFECTS }), "ucinak");
    expect(written.outputs.map((o) => o.value)).toEqual(["0", "0", "0"]);
    expect(written.calc).toContain("0 × 4 = 0");
    const after = applyRound(start, [{ quality: 1, effects: EFFECTS, written: true }]);
    expect(after).toEqual(start);
    const empty = step(flow({ answer: own([], { text: "" }), rubric: RUBRIC, effects: EFFECTS }), "ucinak");
    expect(empty.calc).toContain("−2 × 4 = −8");
    const none = step(flow({ answer: { mode: "none", quality: 1, copied: false }, effects: EFFECTS }), "ucinak");
    expect(none.calc).toContain("−2 × 4 = −8");
    expect(metricDelta(1, 4, true)).toBe(0);
    expect(metricDelta(1, 4)).toBe(-8);
  });
});
