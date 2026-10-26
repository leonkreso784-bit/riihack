import { describe, expect, it } from "vitest";
import { applyRound } from "@/lib/engine/round";
import { qualityFromVerdict } from "@/lib/engine/quality";
import { CLICK_QUALITY_CAP, DEPARTMENT_METRIC, STAFF_DEPARTMENT_LABELS } from "@/lib/rules";
import type { AnswerView, Metrics, Quality, RubricCriterion, SituationView } from "@/lib/types";
import { buildAnswerFlow, flowInputFromSituation, LEGACY_QUALITY_NOTE, metricDelta, NO_EFFECTS_TEXT, CLOSE_NOTE, APPLIED_NOTE, type AnswerFlowInput } from "./answer-flow";

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

  it("rubrika od 4 kriterija: kvaliteta je udio preračunat na 1 do 5, pa objašnjenje to kaže i potpun odgovor daje 5", () => {
    const rubric4 = RUBRIC.slice(0, 4);
    const engine4 = ENGINE_RUBRIC.slice(0, 4);
    const met = ["c1", "c2", "c3", "c4"];
    const answer = own(met, { quality: qualityFromVerdict(met, engine4) });
    const q = step(flow({ answer, rubric: rubric4, effects: EFFECTS }), "kvaliteta");
    expect(q.big).toBe("5 / 5");
    expect(q.calc).toBe("4 od 4 kriterija → kvaliteta 5");
    expect(q.rule.join(" ")).toMatch(/udio ispunjenih kriterija/);
    const half = own(["c1", "c2"], { quality: qualityFromVerdict(["c1", "c2"], engine4) });
    expect(step(flow({ answer: half, rubric: rubric4 }), "kvaliteta").calc).toBe("2 od 4 kriterija → kvaliteta 3");
  });

  it("rubrika od 5 kriterija zadržava staro objašnjenje (broj kriterija)", () => {
    const q = step(flow({ answer: own(["c1", "c2", "c3"]), rubric: RUBRIC }), "kvaliteta");
    expect(q.rule.join(" ")).toMatch(/broj ispunjenih kriterija/);
    expect(q.calc).toBe("3 kriterija → kvaliteta 3");
  });

  it("klik na rubrici od 3 ili 4 kriterija: objašnjenje kaže udio i strop klika, bez računice", () => {
    for (const n of [3, 4]) {
      const click: AnswerView = { mode: "click", optionId: "o2", quality: CLICK_QUALITY_CAP, copied: false };
      const q = step(flow({ answer: click, rubric: RUBRIC.slice(0, n) }), "kvaliteta");
      const rule = q.rule.join(" ");
      expect(rule).toMatch(/udio kriterija/);
      expect(rule).toMatch(new RegExp(`najviše ${CLICK_QUALITY_CAP} od 5`));
      expect(rule).not.toMatch(/najviše 5/);
      expect(q.calc).toBeUndefined();
    }
  });

  it("klik na rubrici od 5 kriterija zadržava staro objašnjenje (broj kriterija) i strop klika", () => {
    const click: AnswerView = { mode: "click", optionId: "o2", quality: CLICK_QUALITY_CAP, copied: false };
    const q = step(flow({ answer: click, rubric: RUBRIC }), "kvaliteta");
    const rule = q.rule.join(" ");
    expect(rule).toMatch(/broj kriterija/);
    expect(rule).not.toMatch(/udio/);
    expect(rule).toMatch(new RegExp(`najviše ${CLICK_QUALITY_CAP} od 5`));
    expect(q.calc).toBeUndefined();
  });

  it("ulaz kvalitete pokazuje ispunjeno od ukupno kriterija kad se rubrika zna", () => {
    const rubric4 = RUBRIC.slice(0, 4);
    const met = ["c1", "c2", "c3"];
    const withRubric = step(flow({ answer: own(met, { quality: qualityFromVerdict(met, ENGINE_RUBRIC.slice(0, 4)) }), rubric: rubric4 }), "kvaliteta");
    expect(withRubric.inputs).toContainEqual({ label: "Ispunjeno kriterija", value: "3 od 4" });
    const without = step(flow({ answer: own(met) }), "kvaliteta");
    expect(without.inputs).toContainEqual({ label: "Ispunjeno kriterija", value: "3" });
  });

  it("odgovor ocijenjen starim pravilom (4 od 4 spremljeno kao 4) ne tvrdi da puna rubrika daje 5", () => {
    const rubric4 = RUBRIC.slice(0, 4);
    const old = own(["c1", "c2", "c3", "c4"], { quality: 4 }); // prije promjene: kvaliteta = broj kriterija
    const q = step(flow({ answer: old, rubric: rubric4 }), "kvaliteta");
    expect(q.big).toBe("4 / 5");
    expect(q.rule.join(" ")).not.toMatch(/kad su ispunjeni svi/);
    expect(q.rule.join(" ")).toMatch(/broj ispunjenih kriterija/);
    expect(q.calc).toBe("4 kriterija → kvaliteta 4");
    expect(q.note).toBe(LEGACY_QUALITY_NOTE);
  });

  it("odgovor ocijenjen novim pravilom, zalijepljen ili s profesorovom ocjenom, nije stari", () => {
    const rubric4 = RUBRIC.slice(0, 4);
    const all = ["c1", "c2", "c3", "c4"];
    const pasted = step(flow({ answer: own(all, { quality: CLICK_QUALITY_CAP, copied: true }), rubric: rubric4 }), "kvaliteta"); // strop klika za zalijepljeno
    expect(pasted.note).toBeUndefined();
    expect(pasted.rule.join(" ")).toMatch(/udio ispunjenih kriterija/);
    const fresh = step(flow({ answer: own(all, { quality: 5 }), rubric: rubric4 }), "kvaliteta");
    expect(fresh.note).toBeUndefined();
    const overridden = step(flow({ answer: own(all, { quality: 2, overridden: true }), rubric: rubric4 }), "kvaliteta");
    expect(overridden.note).toBe("Profesor je promijenio ocjenu.");
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

  it("za zatvoreni mjesec učinak kaže da je već upisan, a ne da se tek upisuje (#239)", () => {
    const open = step(flow({ answer: own(["c2", "c3"]), effects: EFFECTS }), "ucinak");
    expect(open.note).toBe(CLOSE_NOTE);
    const closed = step(flow({ answer: own(["c2", "c3"]), effects: EFFECTS, closed: true }), "ucinak");
    expect(closed.note).toBe(APPLIED_NOTE);
    expect(closed.note).not.toBe(CLOSE_NOTE);
  });

  it("kartice kažu koliko je kriterija ispunjeno od koliko, koji broj je koji pokazatelj i tko ga osjeti", () => {
    const steps = flow({ answer: own(["c1", "c2", "c3", "c4"]), rubric: RUBRIC, effects: { ...EFFECTS, finance: 2 } });
    expect(step(steps, "sudac").small).toBe("Ispunjeno 4 od 5 kriterija");
    expect(step(flow({ answer: own(["c1", "c2"]) }), "sudac").small).toBe("Ispunjeno kriterija: 2"); // bez rubrike ne znamo "od koliko"
    expect(step(steps, "ucinak").calc).toContain("Zadovoljstvo gostiju: +2 × 3 = +6");
    expect(step(steps, "ucinak").calc).toContain("Financije: +2 × 2 = +4");
    const guestsDeps = (Object.keys(DEPARTMENT_METRIC) as (keyof typeof DEPARTMENT_METRIC)[]).filter((d) => DEPARTMENT_METRIC[d] === "guests").map((d) => STAFF_DEPARTMENT_LABELS[d]);
    const small = step(steps, "odjeli").small;
    expect(small).toContain(`${guestsDeps.join(" te ")} +6`);
    expect(small).toContain("Financije (bez odjela) +4");
  });

  it("ocjena koju je promijenio profesor", () => {
    const q = step(flow({ answer: own(["c2"], { quality: 5, overridden: true }), effects: EFFECTS }), "kvaliteta");
    expect(q.big).toBe("5 / 5");
    expect(q.note).toMatch(/profesor je promijenio ocjenu/i);
    expect(q.calc).toBeUndefined();
  });

  it("klik, prepisano, bez presude i bez odgovora", () => {
    const click = flow({ answer: { mode: "click", optionId: "o1", quality: CLICK_QUALITY_CAP, copied: false } });
    expect(step(click, "kvaliteta").rule.join(" ")).toMatch(new RegExp(`najviše ${CLICK_QUALITY_CAP}`));
    expect(step(click, "sudac").small).toMatch(/unaprijed/);
    const copied = flow({ answer: own(["c1", "c2", "c3"], { copied: true, quality: 3 }) });
    expect(step(copied, "odgovor").rule.join(" ")).toMatch(new RegExp(`najviše ${CLICK_QUALITY_CAP}`));
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
    expect(flowInputFromSituation({ ...s, answer: a })).toMatchObject({ closed: false });
    expect(flowInputFromSituation({ ...s, answer: a }, true)).toMatchObject({ closed: true });
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
    const pasted = step(flow({ answer: own([], { text: "Zalijepljeno.", copied: true }), rubric: RUBRIC, effects: EFFECTS }), "ucinak");
    expect(pasted.calc).toContain("−2 × 4 = −8");
    const pasted3 = step(flow({ answer: own(["c1", "c2", "c3"], { text: "Zalijepljeno.", copied: true }), rubric: RUBRIC, effects: EFFECTS }), "ucinak");
    expect(pasted3.calc).toContain("+1 × 4 = +4");
    expect(metricDelta(1, 4, true)).toBe(0);
    expect(metricDelta(1, 4)).toBe(-8);
  });
});
