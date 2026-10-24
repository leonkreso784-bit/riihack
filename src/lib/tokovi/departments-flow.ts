// Tokovi, skica 3: kako odjeli utječu na hotel. Čista funkcija: ništa ne izmišlja, samo prikazuje pravila motora
// (engine/departments.ts, engine/round.ts, engine/economy.ts) nad podacima koje student već ima. Sve brojke i pragovi
// dolaze iz motora i rules.ts, ništa se ne prepisuje, pa promjena pravila odmah promijeni i ovaj prikaz.
import { departmentViews, investmentEffects, investmentTotal } from "@/lib/engine/departments";
import {
  DEPARTMENT_METRIC,
  FINANCE_EFFECT_CAP,
  FINANCE_EFFECT_DIVISOR,
  INVEST_EFFECT_CAP,
  INVEST_EFFECT_DIVISOR,
  INVEST_MAX,
  METRIC_LABELS,
  ROUND_LABELS,
  STAFF_DEPARTMENT_LABELS,
} from "@/lib/rules";
import type { DepartmentInvestments, MetricKey, Metrics, RoomStatus, SituationView, StaffDepartment, StaffMember } from "@/lib/types";
import { activeEffects, departmentsForMetric, metricDelta, signed } from "@/lib/tokovi/answer-flow";
import { eur } from "@/lib/tokovi/month-flow";

export type DeptStepId = "ljudi" | "upozorenja" | "ulaganje" | "pravilo" | "situacije" | "pokazatelj" | "trosak";
export type DeptRow = { label: string; value: string; strong?: boolean };
export type DeptStep = {
  id: DeptStepId;
  title: string;
  small: string;
  big?: string;
  tone?: "dark" | "up" | "down";
  inputs: DeptRow[];
  rule: string[];
  calc?: string;
  outputs: DeptRow[];
  note?: string;
};

export type DepartmentsFlowInput = {
  metrics: Metrics;
  plan: DepartmentInvestments;
  /** Null kad popis još nije stigao: tok to kaže umjesto da pogađa. */
  staff: StaffMember[] | null;
  rooms: { status: RoomStatus; number: string }[] | null;
  situations: SituationView[] | null;
  /** Tekući mjesec (world.round). */
  round: number;
};

export type DepartmentFlow = {
  department: StaffDepartment;
  label: string;
  metric: MetricKey;
  metricLabel: string;
  metricValue: number;
  /** Učinak ulaganja ovog odjela (bez ostalih odjela na istom pokazatelju). */
  ownEffect: number;
  /** Zbroj situacija ovog mjeseca na ovom pokazatelju. */
  situationsDelta: number;
  /** Očekivana vrijednost po zatvaranju mjeseca (ulaganja svih odjela na pokazatelju + situacije, 0 do 100). */
  expectedValue: number;
  steps: DeptStep[];
};

export const AI_NOTE = "Pravila računaju. AI samo glumi goste i označava kriterije.";
export const CLOSE_NOTE = "Primjenjuje se tek kad se mjesec zatvori. Do tada pokazatelj ostaje isti.";
export const WHATIF_LABEL = "Procjena: mijenjaš samo ulaganje ovog odjela, sve ostalo ostaje kako je u planu.";

const DEPARTMENTS = Object.keys(STAFF_DEPARTMENT_LABELS) as StaffDepartment[];
const clampPct = (n: number) => Math.min(100, Math.max(0, n));

/** Prag niskog pokazatelja iz motora: najmanja vrijednost kod koje departmentViews više ne javlja upozorenje. */
export function lowMetricThreshold(): number {
  const probe = (v: number) => departmentViews({ metrics: { guests: v, reviews: v, staff: v, operations: v, finance: v }, staff: [], rooms: [], investments: {} })[0].alerts.length > 0;
  for (let v = 0; v <= 100; v++) if (!probe(v)) return v;
  return 100;
}

export type AlertKind = "cleaning" | "broken" | "note" | "low";
export const ALERT_KIND_LABEL: Record<AlertKind, string> = {
  cleaning: "Sobe čekaju čišćenje",
  broken: "Sobe u kvaru",
  note: "Napomena uz zaposlenika",
  low: "Nizak pokazatelj",
};

function alertKind(text: string, department: StaffDepartment, staff: StaffMember[]): AlertKind {
  if (text.startsWith("Pokazatelj je nizak")) return "low";
  if (staff.some((s) => s.department === department && s.note && text === `${s.name}: ${s.note}`)) return "note";
  return department === "maintenance" ? "broken" : "cleaning";
}

/** Učinak ulaganja jednog odjela na njegov pokazatelj: isto pravilo kao motor (investmentEffects). */
export function ownInvestEffect(department: StaffDepartment, amount: number): number {
  return investmentEffects({ [department]: amount })[DEPARTMENT_METRIC[department]] ?? 0;
}

/** Situacije tekućeg mjeseca s odgovorom i učinkom na zadani pokazatelj. */
export function situationDeltas(situations: SituationView[], round: number, metric: MetricKey): { title: string; quality: number; effect: number; delta: number }[] {
  const out: { title: string; quality: number; effect: number; delta: number }[] = [];
  for (const s of situations) {
    if (s.round !== round || !s.answer) continue;
    const e = activeEffects(s.effects).find(([k]) => k === metric);
    if (e) out.push({ title: s.title, quality: s.answer.quality, effect: e[1], delta: metricDelta(s.answer.quality, e[1]) });
  }
  return out;
}

/** Što ako: ulaganje odjela je `amount` (ostali odjeli kao u planu). */
export function whatIfDepartment(input: Pick<DepartmentsFlowInput, "metrics" | "plan" | "situations" | "round">, department: StaffDepartment, amount: number) {
  const metric = DEPARTMENT_METRIC[department];
  const value = input.metrics[metric];
  const withAmount: DepartmentInvestments = { ...input.plan, [department]: amount };
  const delta = (inv: DepartmentInvestments) => {
    const eff = investmentEffects(inv)[metric] ?? 0;
    const sit = input.situations ? situationDeltas(input.situations, input.round, metric).reduce((s, r) => s + r.delta, 0) : 0;
    return { eff, expected: clampPct(value + eff + sit) };
  };
  const now = delta(input.plan);
  const next = delta(withAmount);
  const own = ownInvestEffect(department, amount);
  const planned = input.plan[department] ?? 0;
  return {
    metric,
    ownEffect: own,
    metricEffect: next.eff,
    expected: next.expected,
    expectedPlan: now.expected,
    cost: amount,
    costDelta: amount - planned,
    totalCost: investmentTotal(withAmount),
    atCap: own >= INVEST_EFFECT_CAP,
    /** Iznos od kojeg ulaganje daje još +1; null kad je strop dosegnut ili ga ulaganje ne može dosegnuti. */
    nextAt: own >= INVEST_EFFECT_CAP ? null : (Math.floor(amount / INVEST_EFFECT_DIVISOR) + 1) * INVEST_EFFECT_DIVISOR,
  };
}

export function buildDepartmentFlows(input: DepartmentsFlowInput): DepartmentFlow[] {
  const staffList = input.staff ?? [];
  const views = departmentViews({ metrics: input.metrics, staff: staffList, rooms: input.rooms ?? [], investments: input.plan });
  const effectsAll = investmentEffects(input.plan);
  const low = lowMetricThreshold();
  const month = (ROUND_LABELS[input.round - 1] ?? `krug ${input.round}`).toLowerCase();

  return DEPARTMENTS.map((department) => {
    const view = views.find((v) => v.department === department)!;
    const metric = view.metric;
    const metricLabel = METRIC_LABELS[metric];
    const value = view.metricValue;
    const people = staffList.filter((s) => s.department === department);
    const planned = input.plan[department] ?? 0;
    const own = ownInvestEffect(department, planned);
    const sameMetric = departmentsForMetric(metric);
    const others = sameMetric.filter((d) => d !== department);
    const totalEffect = effectsAll[metric] ?? 0;
    const sit = input.situations ? situationDeltas(input.situations, input.round, metric) : [];
    const sitSum = sit.reduce((s, r) => s + r.delta, 0);
    const expected = clampPct(value + totalEffect + sitSum);
    const change = expected - value;
    const steps: DeptStep[] = [];

    // 1. Ljudi
    steps.push({
      id: "ljudi",
      title: "Ljudi",
      big: input.staff ? String(people.length) : undefined,
      small: input.staff ? "zaposlenika u odjelu" : "Popis osoblja se još učitava",
      tone: "dark",
      inputs: [
        { label: "Odjel", value: view.label },
        { label: "Pokazatelj odjela", value: metricLabel },
      ],
      rule: ["Odjel čine zaposlenici iz popisa osoblja tvog hotela.", "Popis se tijekom igre ne mijenja."],
      outputs: !input.staff
        ? [{ label: "Zaposlenici", value: "Popis još nije stigao" }]
        : people.length === 0
          ? [{ label: "Zaposlenici", value: "Nema nikoga u ovom odjelu" }]
          : [{ label: "Broj ljudi", value: String(people.length), strong: true }, ...people.map((p) => ({ label: p.name, value: p.role }))],
    });

    // 2. Upozorenja
    const alertRows = view.alerts.map((a) => ({ label: ALERT_KIND_LABEL[alertKind(a, department, staffList)], value: a }));
    const rulesFor: string[] = [];
    if (department === "housekeeping") rulesFor.push("Za svaku sobu koja ima status čišćenje odjel javlja upozorenje.");
    if (department === "maintenance") rulesFor.push("Za svaku sobu koja ima status kvar odjel javlja upozorenje.");
    rulesFor.push("Svaka napomena uz zaposlenika postaje upozorenje.", `Ako je pokazatelj odjela ispod ${low}, javlja se upozorenje o niskom pokazatelju.`);
    steps.push({
      id: "upozorenja",
      title: "Upozorenja",
      big: String(alertRows.length),
      small: alertRows.length === 0 ? "Sve je u redu" : alertRows.length === 1 ? "upozorenje" : "upozorenja",
      tone: alertRows.length > 0 ? "down" : undefined,
      inputs: [
        { label: "Pokazatelj odjela", value: `${value}/100` },
        ...(department === "housekeeping" || department === "maintenance"
          ? [{ label: department === "housekeeping" ? "Sobe u čišćenju" : "Sobe u kvaru", value: input.rooms ? String(input.rooms.filter((r) => r.status === (department === "housekeeping" ? "cleaning" : "broken")).length) : "Nije učitano" }]
          : []),
        { label: "Napomene osoblja", value: input.staff ? String(people.filter((p) => p.note).length) : "Nije učitano" },
      ],
      rule: rulesFor,
      outputs: alertRows.length ? alertRows : [{ label: "Upozorenja", value: "Nema" }],
      note: !input.rooms && (department === "housekeeping" || department === "maintenance") ? "Stanje soba još nije stiglo, pa upozorenja o sobama ovdje nisu prikazana." : undefined,
    });

    // 3. Ulaganje ovaj mjesec
    steps.push({
      id: "ulaganje",
      title: "Ulaganje ovaj mjesec",
      big: eur(planned),
      small: planned > 0 ? `iz plana za ${month}` : `nije planirano za ${month}`,
      inputs: [
        { label: "Plan mjeseca", value: month },
        { label: "Najviše po odjelu", value: eur(INVEST_MAX) },
      ],
      rule: [`Ulaganje biraš u planu mjeseca, od 0 do ${eur(INVEST_MAX)} po odjelu.`, "Ulaganje vrijedi za jedan mjesec."],
      outputs: [{ label: view.label, value: eur(planned), strong: true }],
    });

    // 4. Pravilo ulaganja
    steps.push({
      id: "pravilo",
      title: "Pravilo ulaganja",
      big: signed(own),
      small: `${metricLabel.toLowerCase()}`,
      tone: own > 0 ? "up" : undefined,
      inputs: [
        { label: "Ulaganje", value: eur(planned) },
        { label: "Djelitelj", value: eur(INVEST_EFFECT_DIVISOR) },
        { label: "Strop", value: signed(INVEST_EFFECT_CAP) },
      ],
      rule: [
        `Učinak je ulaganje podijeljeno s ${eur(INVEST_EFFECT_DIVISOR)} i zaokruženo dolje, ali najviše ${signed(INVEST_EFFECT_CAP)}.`,
        `Učinak ide na pokazatelj ${metricLabel.toLowerCase()}.`,
      ],
      calc: `min(${INVEST_EFFECT_CAP}, ⌊${eur(planned)} / ${eur(INVEST_EFFECT_DIVISOR)}⌋) = ${signed(own)}`,
      outputs: [
        { label: `Učinak odjela ${view.label}`, value: signed(own), strong: true },
        ...(others.length ? [{ label: `Isti pokazatelj: ${others.map((d) => STAFF_DEPARTMENT_LABELS[d]).join(", ")}`, value: signed(others.reduce((s, d) => s + ownInvestEffect(d, input.plan[d] ?? 0), 0)) }, { label: `Zbroj na pokazatelju`, value: signed(totalEffect), strong: true }] : []),
      ],
      note: others.length ? `Pokazatelj ${metricLabel.toLowerCase()} prati i ${others.map((d) => STAFF_DEPARTMENT_LABELS[d]).join(", ")}. Učinci odjela na istom pokazatelju se zbrajaju.` : undefined,
    });

    // 5. Situacije ovog mjeseca
    const thisMonth = (input.situations ?? []).filter((s) => s.round === input.round);
    const answered = thisMonth.filter((s) => s.answer);
    const noEffects = answered.filter((s) => activeEffects(s.effects).length === 0).length;
    steps.push({
      id: "situacije",
      title: "Situacije ovog mjeseca",
      big: sit.length ? signed(sitSum) : undefined,
      small: !input.situations ? "Situacije se još učitavaju" : sit.length ? `Odgovorenih na ovom pokazatelju: ${sit.length}` : "Nijedna odgovorena situacija ne dira ovaj pokazatelj",
      tone: sitSum > 0 ? "up" : sitSum < 0 ? "down" : undefined,
      inputs: [
        { label: "Situacije u mjesecu", value: input.situations ? String(thisMonth.length) : "Nije učitano" },
        { label: "Odgovorene", value: input.situations ? String(answered.length) : "Nije učitano" },
        { label: "Na ovom pokazatelju", value: String(sit.length) },
      ],
      rule: ["Promjena pokazatelja = (kvaliteta − 3) × učinak situacije.", "Računaju se samo odgovorene situacije koje imaju učinak na ovaj pokazatelj."],
      calc: sit.length ? sit.map((r) => `(${r.quality} − 3) × ${r.effect} = ${signed(r.delta)}`).join("  ·  ") : undefined,
      outputs: sit.length ? [...sit.map((r) => ({ label: r.title, value: `kvaliteta ${r.quality}/5, ${signed(r.delta)}` })), { label: "Zbroj", value: signed(sitSum), strong: true }] : [{ label: "Zbroj", value: "0", strong: true }],
      note: noEffects > 0 ? `Situacije kojima učinak još nije poznat (${noEffects}) ne brojimo.` : undefined,
    });

    // 6. Pokazatelj odjela
    steps.push({
      id: "pokazatelj",
      title: "Pokazatelj odjela",
      big: `${value} → ${expected}`,
      small: `${metricLabel}, očekivano po zatvaranju`,
      tone: change > 0 ? "up" : change < 0 ? "down" : undefined,
      inputs: [
        { label: "Sada", value: `${value}/100` },
        { label: "Ulaganja na pokazatelju", value: signed(totalEffect) },
        { label: "Situacije", value: signed(sitSum) },
      ],
      rule: ["Nova vrijednost = sadašnja + učinak ulaganja + promjene iz situacija.", "Pokazatelj ostaje između 0 i 100.", CLOSE_NOTE],
      calc: `${value} ${totalEffect < 0 ? "−" : "+"} ${Math.abs(totalEffect)} ${sitSum < 0 ? "−" : "+"} ${Math.abs(sitSum)} = ${expected}`,
      outputs: [
        { label: "Očekivana promjena", value: signed(change), strong: true },
        { label: "Očekivana vrijednost", value: `${expected}/100`, strong: true },
      ],
      note: "To je procjena iz onoga što već znaš. Ugovori s agencijama i obračun Financija mogu pomaknuti pokazatelje, a to ovdje nije uračunato.",
    });

    // 7. Trošak
    steps.push({
      id: "trosak",
      title: "Trošak",
      big: eur(planned),
      small: "ulazi u troškove mjeseca",
      inputs: [
        { label: `Ulaganje: ${view.label}`, value: eur(planned) },
        { label: "Ulaganja svih odjela", value: eur(investmentTotal(input.plan)) },
      ],
      rule: [
        "Ulaganja svih odjela zbrajaju se i ulaze u troškove mjeseca.",
        "Dobit = prihod − troškovi, pa svako ulaganje snižava dobit za isti iznos.",
        `Niža dobit može sniziti pokazatelj Financije: dobit podijeljena s ${eur(FINANCE_EFFECT_DIVISOR)}, od ${signed(-FINANCE_EFFECT_CAP)} do ${signed(FINANCE_EFFECT_CAP)}.`,
      ],
      outputs: [
        { label: "Trošak ovog odjela", value: eur(planned), strong: true },
        { label: "Svi odjeli zajedno", value: eur(investmentTotal(input.plan)) },
      ],
      note: "Cijeli mjesečni obračun ovdje ne računamo. Vidi ga u izvještaju mjeseca kad se zatvori.",
    });

    return { department, label: view.label, metric, metricLabel, metricValue: value, ownEffect: own, situationsDelta: sitSum, expectedValue: expected, steps };
  });
}
