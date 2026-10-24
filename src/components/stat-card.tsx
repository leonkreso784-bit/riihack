import type { LucideIcon } from "lucide-react";
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
  icon: Icon,
  note,
}: {
  label: string;
  value: string | number;
  unit: string;
  tone?: Tone;
  icon?: LucideIcon;
  note?: string;
}) {
  return (
    <div className="surface lift rounded-[var(--radius)] p-4">
      <div className="flex items-center gap-2 text-[0.8rem] font-semibold text-muted-foreground">
        {Icon && (
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-b from-[#eef4ff] to-[#dde8ff] text-secondary-foreground shadow-[inset_0_1px_0_#fff]">
            <Icon className="size-3.5" aria-hidden />
          </span>
        )}
        {label}
      </div>
      <p className={cn("mt-3 text-[1.7rem] leading-none font-extrabold tracking-tight tabular-nums", VALUE_TONES[tone])}>
        {value}
        {unit && <span className="ml-1 text-base font-bold text-muted-foreground">{unit}</span>}
      </p>
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
