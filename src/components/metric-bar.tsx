import { cn } from "@/lib/utils";

// One metric 0–100: bar shows "now", the tick marks where the company started.
export function MetricBar({ label, start, now }: { label: string; start: number; now: number }) {
  const delta = now - start;
  const tone = delta > 0 ? "text-up" : delta < 0 ? "text-down" : "text-muted-foreground";
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums">
          <span className="font-bold">{now}</span>
          <span className="text-muted-foreground">/100</span>
          <span className={cn("ml-2 font-bold", tone)}>
            {delta > 0 ? `+${delta}` : delta < 0 ? `−${-delta}` : "±0"}
          </span>
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={now}
        aria-valuetext={`${now} od 100, početak ${start}`}
        className="relative h-2.5 rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full", delta < 0 ? "bg-down" : "bg-primary")}
          style={{ width: `${now}%` }}
        />
        <div aria-hidden className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-foreground/60" style={{ left: `${start}%` }} />
      </div>
    </div>
  );
}
