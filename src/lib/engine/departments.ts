// Ulaganje u odjele: provjera ulaganja iz plana, trošak, učinak na pokazatelje i stanje odjela (čisto, bez baze).
import { DEPARTMENT_METRIC, INVEST_EFFECT_CAP, INVEST_EFFECT_DIVISOR, INVEST_MAX, STAFF_DEPARTMENT_LABELS } from "@/lib/rules";
import type {
  DepartmentInvestments,
  DepartmentView,
  MetricKey,
  Metrics,
  RoomStatus,
  StaffDepartment,
  StaffMember,
} from "@/lib/types";

export const INVESTMENT_ERROR = "Ulaganje po odjelu mora biti cijeli broj od 0 do 3.000 €";
const LOW_METRIC = 40;

const DEPARTMENTS = Object.keys(STAFF_DEPARTMENT_LABELS) as StaffDepartment[];
const isDepartment = (k: string): k is StaffDepartment => (DEPARTMENTS as string[]).includes(k);

/** Ulaganja iz tijela zahtjeva: samo poznati odjeli, cijeli brojevi 0–INVEST_MAX; nule se ispuste. Neispravno → null. */
export function parseInvestments(raw: unknown): DepartmentInvestments | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const out: DepartmentInvestments = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!isDepartment(k)) return null;
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > INVEST_MAX) return null;
    if (v > 0) out[k] = v;
  }
  return out;
}

/** Zbroj ulaganja u sve odjele (€ mjesečno, ide u troškove). */
export function investmentTotal(inv: DepartmentInvestments): number {
  return Object.values(inv).reduce<number>((s, v) => s + (v ?? 0), 0);
}

/** Učinak ulaganja na pokazatelje: po odjelu min(strop, floor(ulog / djelitelj)); odjeli na istom pokazatelju se zbrajaju. */
export function investmentEffects(inv: DepartmentInvestments): Partial<Record<MetricKey, number>> {
  const out: Partial<Record<MetricKey, number>> = {};
  for (const d of DEPARTMENTS) {
    const e = Math.min(INVEST_EFFECT_CAP, Math.floor(Math.max(0, inv[d] ?? 0) / INVEST_EFFECT_DIVISOR));
    if (e > 0) out[DEPARTMENT_METRIC[d]] = (out[DEPARTMENT_METRIC[d]] ?? 0) + e;
  }
  return out;
}

/** Stanje odjela: pokazatelj, broj ljudi, upozorenja i ulaganje iz plana tekućeg mjeseca. */
export function departmentViews(i: {
  metrics: Metrics;
  staff: StaffMember[];
  rooms: { status: RoomStatus; number: string }[];
  investments: DepartmentInvestments;
}): DepartmentView[] {
  const cleaning = i.rooms.filter((r) => r.status === "cleaning").length;
  const broken = i.rooms.filter((r) => r.status === "broken").length;
  return DEPARTMENTS.map((department) => {
    const metric = DEPARTMENT_METRIC[department];
    const metricValue = i.metrics[metric];
    const people = i.staff.filter((s) => s.department === department);
    const alerts: string[] = [];
    if (department === "housekeeping" && cleaning > 0) alerts.push(`${cleaning} soba čeka čišćenje`);
    if (department === "maintenance" && broken > 0) alerts.push(`${broken} soba u kvaru`);
    for (const s of people) if (s.note) alerts.push(`${s.name}: ${s.note}`);
    if (metricValue < LOW_METRIC) alerts.push(`Pokazatelj je nizak (${metricValue}/100)`);
    return {
      department,
      label: STAFF_DEPARTMENT_LABELS[department],
      metric,
      metricValue,
      staffCount: people.length,
      alerts,
      investment: i.investments[department] ?? 0,
    };
  });
}
