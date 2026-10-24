import { cn } from "@/lib/utils";
import type { Tone } from "./pill";

const VALUE_TONES: Record<Tone, string> = {
  neutral: "text-foreground",
  accent: "text-primary",
  up: "text-up",
  down: "text-down",
  warn: "text-warn",
};

// Every number on screen has a name and a unit (plan, Global Constraints).
export function StatCard({
  label,
  value,
  unit,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  unit: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-[var(--radius)] border bg-card p-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-extrabold tabular-nums", VALUE_TONES[tone])}>
        {value} <span className="text-base font-bold text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
