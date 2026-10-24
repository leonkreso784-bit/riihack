import type { Skill } from "@/lib/types";
import { MOCK_CLASS_SKILLS, MOCK_STUDENT_SKILLS } from "@/lib/mock-wow";
import { Pill } from "@/components/pill";

const AXES: { key: Skill; label: string[] }[] = [
  { key: "empathy", label: ["Empatija"] },
  { key: "communication", label: ["Komunikacija"] },
  { key: "finance", label: ["Financije"] },
  { key: "problemSolving", label: ["Rješavanje", "problema"] },
  { key: "ethics", label: ["Etika"] },
];
const CX = 180, CY = 160, R = 100;
const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
const pt = (i: number, v: number) => {
  const r = (Math.max(0, Math.min(100, v)) / 100) * R;
  return [CX + r * Math.cos(angle(i)), CY + r * Math.sin(angle(i))] as const;
};
const poly = (vals: Record<Skill, number>) => AXES.map((a, i) => pt(i, vals[a.key]).map((n) => n.toFixed(1)).join(",")).join(" ");

// Radar of the 5 skills, values 0 to 100. `compare` is drawn dashed behind `values`.
export function SkillRadar({
  values,
  compare,
  labels = ["Ti", "Razred"],
}: {
  values: Record<Skill, number>;
  compare?: Record<Skill, number>;
  labels?: [string, string];
}) {
  const sample = [MOCK_CLASS_SKILLS, MOCK_STUDENT_SKILLS].some((m) => m === values || m === compare);
  const summary = AXES.map((a) => `${a.label.join(" ")} ${Math.round(values[a.key])} od 100`).join(", ");
  return (
    <figure className="space-y-2">
      {sample && <Pill tone="warn">primjer</Pill>}
      <svg viewBox="-30 0 420 330" className="mx-auto block w-full max-w-md" role="img" aria-label={`Radar vještina: ${summary}`}>
        {[25, 50, 75, 100].map((ring) => (
          <polygon key={ring} points={AXES.map((_, i) => pt(i, ring).join(",")).join(" ")} fill="none" stroke="var(--border)" strokeWidth={1.5} />
        ))}
        {AXES.map((_, i) => (
          <line key={i} x1={CX} y1={CY} x2={pt(i, 100)[0]} y2={pt(i, 100)[1]} stroke="var(--border)" strokeWidth={1.5} />
        ))}
        {compare && (
          <polygon points={poly(compare)} fill="var(--warn)" fillOpacity={0.1} stroke="var(--warn)" strokeWidth={2.5} strokeDasharray="6 5" strokeLinejoin="round" />
        )}
        <polygon points={poly(values)} fill="var(--primary)" fillOpacity={0.22} stroke="var(--primary)" strokeWidth={3} strokeLinejoin="round" />
        {AXES.map((a, i) => {
          const [x, y] = pt(i, values[a.key]);
          return <circle key={a.key} cx={x} cy={y} r={4.5} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />;
        })}
        {AXES.map((a, i) => {
          const lx = CX + (R + 24) * Math.cos(angle(i));
          const ly = CY + (R + 24) * Math.sin(angle(i));
          const anchor = Math.abs(lx - CX) < 4 ? "middle" : lx > CX ? "start" : "end";
          const dy = a.label.length > 1 ? -8 : 4;
          return (
            <text key={a.key} x={lx} y={ly + dy} textAnchor={anchor} className="fill-foreground text-[13px] font-bold">
              {a.label.map((line, j) => (
                <tspan key={j} x={lx} dy={j === 0 ? 0 : 15}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>
      {compare && (
        <figcaption className="flex justify-center gap-5 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-5 bg-primary" /> {labels[0]}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="w-5 border-t-2 border-dashed border-warn" /> {labels[1]}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
