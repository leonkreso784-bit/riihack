import { describe, expect, it } from "vitest";
import { departmentViews, investmentEffects, investmentTotal } from "@/lib/engine/departments";
import { applyRound } from "@/lib/engine/round";
import { DEPARTMENT_METRIC, INVEST_EFFECT_CAP, INVEST_EFFECT_DIVISOR, INVEST_MAX, STAFF_DEPARTMENT_LABELS } from "@/lib/rules";
import type { DepartmentInvestments, Metrics, Quality, SituationView, StaffDepartment, StaffMember } from "@/lib/types";
import { buildDepartmentFlows, buildDepartmentsBoard, LANE_ORDER, laneForSituation, lowMetricThreshold, ownInvestEffect, situationDeltas, whatIfDepartment, type DepartmentsFlowInput } from "./departments-flow";

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

  it("pravilo situacija koristi množitelj iz motora, ne (kvaliteta − 3)", () => {
    const f = flowOf(base({ situations: [sit("a", 2, 4, { reviews: 3 })] }), "housekeeping");
    expect(step(f, "situacije").calc).toBe("+2 × 3 = +6");
    expect(step(f, "situacije").rule.join(" ")).not.toContain("− 3");
  });
});

describe("departments board (staze)", () => {
  const sits = [
    sit("hrana", 2, 5, { guests: 2, reviews: 1 }),
    sit("recepcija", 2, 1, { guests: 3 }),
    sit("smjene", 2, 2, { staff: 4 }),
    sit("stara", 1, 5, { guests: 9 }),
    sit("otvorena", 2, null),
  ].map((s) => (s.id === "hrana" ? { ...s, area: "Restoran i sigurnost hrane" } : s));

  it("staze idu redom, Recepcija i Kuhinja jedna uz drugu", () => {
    const b = buildDepartmentsBoard(base());
    expect(b.lanes.map((l) => l.department)).toEqual(LANE_ORDER);
    expect([...LANE_ORDER].sort()).toEqual([...DEPTS].sort());
    expect(b.results.map((r) => r.metric)).toEqual(["guests", "reviews", "operations", "staff"]);
    expect(b.results[0].departments).toEqual(["reception", "kitchen"]);
  });

  it("situacija na zajedničkom pokazatelju ide u jednu stazu po području", () => {
    expect(laneForSituation({ area: "Restoran i sigurnost hrane", title: "x" }, "guests")).toBe("kitchen");
    expect(laneForSituation({ area: "Recepcija i rezervacije", title: "x" }, "guests")).toBe("reception");
    expect(laneForSituation({ area: "Bilo što", title: "x" }, "reviews")).toBe("housekeeping");
    expect(laneForSituation({ area: "Bilo što", title: "x" }, "finance")).toBeNull();
  });

  it("zbroj staza na pokazatelju jednak je motoru (applyRound + investmentEffects), ništa dvaput", () => {
    const plan: DepartmentInvestments = { reception: 1000, kitchen: 2500, management: 3000 };
    const b = buildDepartmentsBoard(base({ situations: sits, plan }));
    const after = applyRound(METRICS, [
      { quality: 5, effects: { guests: 2, reviews: 1 } },
      { quality: 1, effects: { guests: 3 } },
      { quality: 2, effects: { staff: 4 } },
    ]);
    const inv = investmentEffects(plan);
    for (const r of b.results) {
      const lanesOn = b.lanes.filter((l) => l.metric === r.metric);
      expect(lanesOn.reduce((a, l) => a + l.contribution, 0)).toBe(r.change);
      expect(r.expected).toBe(Math.min(100, Math.max(0, after[r.metric] + (inv[r.metric] ?? 0))));
    }
    const kitchen = b.lanes.find((l) => l.department === "kitchen")!;
    const reception = b.lanes.find((l) => l.department === "reception")!;
    expect(kitchen.situations.map((s) => s.title)).toEqual(["Situacija hrana"]);
    expect(reception.situations.map((s) => [s.title, s.delta, s.tone])).toEqual([["Situacija recepcija", -6, "bad"]]);
    expect(kitchen.situations[0].tone).toBe("good");
    const mgmt = b.lanes.find((l) => l.department === "management")!;
    expect(mgmt.situations[0].tone).toBe("neutral");
    expect(mgmt.ownEffect).toBe(INVEST_EFFECT_CAP);
    expect(mgmt.nextAt).toBeNull();
    expect(kitchen.nextAt).toBe(3000);
  });

  it("sažetak: trošak, pomaci, čekanje, situacije bez učinka", () => {
    const plan: DepartmentInvestments = { reception: 1000, maintenance: 400 };
    const b = buildDepartmentsBoard(base({ situations: [...sits, sit("bez", 2, 4)], plan }));
    expect(b.summary.totalCost).toBe(1400);
    expect(b.summary.answered).toBe(4);
    expect(b.summary.waiting).toBe(1);
    expect(b.summary.unknownEffects).toBe(1);
    expect(b.summary.empty).toBe(false);
    expect(b.summary.moves.map((m) => m.metric)).toEqual(b.results.filter((r) => r.change !== 0).map((r) => r.metric));
    expect(b.summary.month).toBe("Srpanj");
  });

  it("prazan početak mjeseca: bez ulaganja i odgovora tok je prazan, ali ljudi i upozorenja su tu", () => {
    const b = buildDepartmentsBoard(base({ situations: [sit("otvorena", 2, null)] }));
    expect(b.summary.empty).toBe(true);
    expect(b.summary.waiting).toBe(1);
    expect(b.results.every((r) => r.change === 0)).toBe(true);
    const hk = b.lanes.find((l) => l.department === "housekeeping")!;
    expect(hk.people?.map((p) => p.name)).toEqual(["Ana Kos", "Ivo Pek"]);
    expect(hk.alerts.map((a) => a.kind)).toEqual(["cleaning", "note", "low"]);
    expect(hk.situations).toEqual([]);
    expect(buildDepartmentsBoard(base({ staff: null })).lanes[0].people).toBeNull();
  });

  it("ulaganje ispod praga: trošak bez boda, sljedeći bod na pragu", () => {
    const b = buildDepartmentsBoard(base({ plan: { maintenance: 400 } }));
    const m = b.lanes.find((l) => l.department === "maintenance")!;
    expect(m.ownEffect).toBe(0);
    expect(m.nextAt).toBe(INVEST_EFFECT_DIVISOR);
    expect(m.details.ulaganje.outputs.at(-1)).toEqual({ label: "Trošak u mjesecu", value: expect.stringContaining("400"), strong: true });
  });
  it("napisan svoj tekst s kvalitetom 1 ne spušta pokazatelj, klik s 1 spušta (ADR-046)", () => {
    const written = { ...sit("w", 2, 1, { reviews: 3 }), answer: { mode: "own", text: "Ispričat ću se.", quality: 1, copied: false } } as SituationView;
    const click = sit("k", 2, 1, { reviews: 3 });
    const d = situationDeltas([written, click], 2, "reviews");
    expect(d.map((r) => r.delta)).toEqual([0, -6]);
    const after = applyRound(METRICS, [
      { quality: 1, effects: { reviews: 3 }, written: true },
      { quality: 1, effects: { reviews: 3 } },
    ]);
    expect(d.reduce((a, r) => a + r.delta, 0)).toBe(after.reviews - METRICS.reviews);
    const f = flowOf(base({ situations: [written, click] }), "housekeeping");
    expect(step(f, "situacije").calc).toBe("0 × 3 = 0  ·  −2 × 3 = −6");
    const hk = buildDepartmentsBoard(base({ situations: [written] })).lanes.flatMap((l) => l.situations);
    expect(hk.map((s) => [s.delta, s.tone])).toEqual([[0, "neutral"]]);
    expect(hk[0].detail.calc).toBe("0 × 3 = 0");
  });
});
