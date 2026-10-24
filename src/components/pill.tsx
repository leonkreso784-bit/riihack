import { cn } from "@/lib/utils";

export type Tone = "neutral" | "accent" | "up" | "down" | "warn";

// Background + text pairs that pass WCAG AA (warn uses ink on sand; amber text on sand is too faint).
const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-foreground",
  accent: "bg-secondary text-secondary-foreground",
  up: "bg-mint text-up",
  down: "bg-down-soft text-down",
  warn: "bg-sand text-foreground",
};

export function Pill({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", TONES[tone], className)}>
      {children}
    </span>
  );
}
