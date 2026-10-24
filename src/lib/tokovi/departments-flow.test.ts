import { describe, expect, it } from "vitest";
import { departmentViews, investmentEffects, investmentTotal } from "@/lib/engine/departments";
import { applyRound } from "@/lib/engine/round";
import { DEPARTMENT_METRIC, INVEST_EFFECT_CAP, INVEST_EFFECT_DIVISOR, INVEST_MAX, STAFF_DEPARTMENT_LABELS } from "@/lib/rules";
import type { DepartmentInvestments, Metrics, Quality, SituationView, StaffDepartment, StaffMember } from "@/lib/types";
import { buildDepartmentFlows, lowMetricThreshold, ownInvestEffect, situationDeltas, whatIfDepartment, type DepartmentsFlowInput } from "./departments-flow";

const DEPTS = Object.keys(STAFF_DEPARTMENT_LABELS) as StaffDepartment[];
const METRICS: Metrics = { guests: 60, reviews: 35, staff: 70, operations: 50, finance: 55 };
const STAFF: StaffMember[] = [
  { name: "Ana Kos", department: "housekeeping", role: "Sobarica", shift: "morning", note: "Na bolovanju" },
  { name: "Ivo Pek", department: "housekeeping", role: "Voditelj domaćinstva", shift: "afternoon" },
  { name: "Mia Bil", department: "reception", role: "Recepcionerka", shift: "morning" },
];
const ROOMS = [
  { number: "101", status: "cleaning" as const },
  { number: "102", status: "cleaning" as const },
  { number: "204", status: "broken" as const },
  { number: "205", status: "free" as const },
];
const sit = (id: string, round: number, quality: Quality | null, effects?: SituationView["effects"]): SituationView =>
  ({
    id, templateId: id, round, title: `Situacija ${id}`, text: "", area: "Gosti", difficulty: 2, character: { name: "X", role: "Y" }, options: [], state: quality ? "answered" : "open", transcript: [],
    answer: quality ? { mode: "click", quality, copied: false } : undefined,
    effects,
  }) as SituationView;
const base = (over: Partial<DepartmentsFlowInput> = {}): DepartmentsFlowInput => ({ metrics: METRICS, plan: {}, staff: STAFF, rooms: ROOMS, situations: [], round: 2, ...over });
const flowOf = (i: DepartmentsFlowInput, d: StaffDepartment) => buildDepartmentFlows(i).find((f) => f.department === d)!;
const step = (f: ReturnType<typeof flowOf>, id: string) => f.steps.find((s) => s.id === id)!;

describe("departments flow", () => {
  it("ima sedam koraka za svaki odjel", () => {
    const flows = buildDepartmentFlows(base());
    expect(flows.map((f) => f.department)).toEqual(DEPTS);
    for (const f of flows) expect(f.steps.map((s) => s.id)).toEqual(["ljudi", "upozorenja", "ulaganje", "pravilo", "situacije", "pokazatelj", "trosak"]);
  });

  it("učinak ulaganja jednak je onom iz motora, uključujući pragove i strop", () => {
    for (const d of DEPTS) {
      for (const amount of [0, 400, INVEST_EFFECT_DIVISOR - 1, INVEST_EFFECT_DIVISOR, INVEST_EFFECT_DIVISOR * 2 + 1, INVEST_MAX, INVEST_EFFECT_DIVISOR * (INVEST_EFFECT_CAP + 5)]) {
        const inv: DepartmentInvestments = { [d]: amount };
        expect(ownInvestEffect(d, amount)).toBe(investmentEffects(inv)[DEPARTMENT_METRIC[d]] ?? 0);
        const f = flowOf(base({ plan: inv }), d);
        expect(f.ownEffect).toBe(investmentEffects(inv)[DEPARTMENT_METRIC[d]] ?? 0);
      }
    }
  });

  it("odjeli na istom pokazatelju se zbrajaju", () => {
    const plan: DepartmentInvestments = { reception: INVEST_EFFECT_DIVISOR, kitchen: INVEST_EFFECT_DIVISOR * 2 };
    const total = investmentEffects(plan).guests ?? 0;
    const f = flowOf(base({ plan }), "reception");
    expect(f.expectedValue).toBe(Math.min(100, METRICS.guests + total));
    expect(step(f, "pravilo").note).toContain(STAFF_DEPARTMENT_LABELS.kitchen);
    expect(step(f, "pokazatelj").inputs[1].value).toBe(`+${total}`);
  });

  it("upozorenja se poklapaju s departmentViews", () => {
    const views = departmentViews({ metrics: METRICS, staff: STAFF, rooms: ROOMS, investments: {} });
    for (const d of DEPTS) {
      const alerts = views.find((v) => v.department === d)!.alerts;
      const out = step(flowOf(base(), d), "upozorenja").outputs;
      if (alerts.length === 0) expect(out).toEqual([{ label: "Upozorenja", value: "Nema" }]);
      else expect(out.map((o) => o.value)).toEqual(alerts);
    }
    const hk = step(flowOf(base(), "housekeeping"), "upozorenja").outputs.map((o) => o.label);
    expect(hk).toEqual(["Sobe čekaju čišćenje", "Napomena uz zaposlenika", "Nizak pokazatelj"]);
    expect(step(flowOf(base(), "maintenance"), "upozorenja").outputs[0].label).toBe("Sobe u kvaru");
  });

  it("prag niskog pokazatelja dolazi iz motora", () => {
    const t = lowMetricThreshold();
    const mk = (v: number) => departmentViews({ metrics: { ...METRICS, guests: v }, staff: [], rooms: [], investments: {} }).find((x) => x.department === "reception")!.alerts.length;
    expect(mk(t - 1)).toBe(1);
    expect(mk(t)).toBe(0);
  });

  it("promjene iz situacija jednake su onima iz applyRound, samo odgovorene s učinkom ovog mjeseca", () => {
    const sits = [
      sit("a", 2, 5, { reviews: 4, guests: 1 }),
      sit("b", 2, 2, { reviews: 3 }),
      sit("c", 2, null, { reviews: 9 }), // bez odgovora
      sit("d", 1, 5, { reviews: 9 }), // drugi mjesec
      sit("e", 2, 4), // odgovorena, učinak nepoznat
    ];
    const start: Metrics = { ...METRICS };
    const after = applyRound(start, [
      { quality: 5, effects: { reviews: 4, guests: 1 } },
      { quality: 2, effects: { reviews: 3 } },
    ]);
    const d = situationDeltas(sits, 2, "reviews");
    expect(d.map((r) => r.title)).toEqual(["Situacija a", "Situacija b"]);
    expect(d.reduce((s, r) => s + r.delta, 0)).toBe(after.reviews - start.reviews);
    const f = flowOf(base({ situations: sits }), "housekeeping");
    expect(f.situationsDelta).toBe(after.reviews - start.reviews);
    expect(step(f, "situacije").note).toContain("(1)");
    expect(f.expectedValue).toBe(after.reviews);
  });

  it("očekivana vrijednost je ograničena na 0 do 100", () => {
    const hi = flowOf(base({ metrics: { ...METRICS, operations: 99 }, plan: { maintenance: INVEST_MAX } }), "maintenance");
    expect(hi.expectedValue).toBe(100);
    const lo = flowOf(base({ metrics: { ...METRICS, reviews: 1 }, situations: [sit("a", 2, 1, { reviews: 5 })] }), "housekeeping");
    expect(lo.expectedValue).toBe(0);
  });

  it("što ako: učinak i trošak prate motor, trošak je razlika od plana", () => {
    const plan: DepartmentInvestments = { maintenance: 1000, kitchen: 500 };
    const i = base({ plan });
    for (const amount of [0, 100, 1000, 2500, INVEST_MAX]) {
      const w = whatIfDepartment(i, "maintenance", amount);
      const inv = { ...plan, maintenance: amount };
      expect(w.ownEffect).toBe(investmentEffects({ maintenance: amount }).operations ?? 0);
      expect(w.totalCost).toBe(investmentTotal(inv));
      expect(w.costDelta).toBe(amount - 1000);
      expect(w.expected).toBe(Math.min(100, METRICS.operations + (investmentEffects(inv).operations ?? 0)));
      expect(w.atCap).toBe(w.ownEffect >= INVEST_EFFECT_CAP);
    }
    expect(whatIfDepartment(i, "maintenance", INVEST_MAX).expectedPlan).toBe(whatIfDepartment(i, "maintenance", 1000).expected);
    expect(whatIfDepartment(i, "maintenance", 0).nextAt).toBe(INVEST_EFFECT_DIVISOR);
  });

  it("trošak ulazi u troškove: pokazuje zbroj svih odjela", () => {
    const plan: DepartmentInvestments = { maintenance: 1000, kitchen: 500 };
    const t = step(flowOf(base({ plan }), "maintenance"), "trosak");
    expect(t.outputs[1].value).toContain("1.500");
    expect(t.rule.join(" ")).toContain("troškove");
  });

  it("nedostajući podaci ne ruše tok i to piše", () => {
    const f = flowOf(base({ staff: null, rooms: null, situations: null, plan: {} }), "housekeeping");
    expect(step(f, "ljudi").outputs[0].value).toBe("Popis još nije stigao");
    expect(step(f, "upozorenja").note).toContain("Stanje soba");
    expect(step(f, "situacije").small).toContain("učitavaju");
    expect(f.expectedValue).toBe(METRICS.reviews);
    const empty = flowOf(base({ staff: [] }), "kitchen");
    expect(step(empty, "ljudi").outputs[0].value).toBe("Nema nikoga u ovom odjelu");
    expect(step(flowOf(base({ situations: [] }), "kitchen"), "situacije").outputs[0].value).toBe("0");
  });

  it("ljudi: imena i uloge odjela", () => {
    const f = flowOf(base(), "housekeeping");
    expect(step(f, "ljudi").outputs.map((o) => [o.label, o.value])).toEqual([["Broj ljudi", "2"], ["Ana Kos", "Sobarica"], ["Ivo Pek", "Voditelj domaćinstva"]]);
  });
});
