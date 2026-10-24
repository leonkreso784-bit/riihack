import { Coins, MessageSquare, Settings, User, Users, type LucideIcon } from "lucide-react";
import type { MetricKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export const METRIC_ICONS: Record<MetricKey, LucideIcon> = {
  guests: User,
  reviews: MessageSquare,
  staff: Users,
  operations: Settings,
  finance: Coins,
};

export function Delta({ value, className }: { value: number; className?: string }) {
  const tone = value > 0 ? "text-up" : value < 0 ? "text-down" : "text-muted-foreground";
  const text = value > 0 ? `▲ +${value}` : value < 0 ? `▼ −${-value}` : "±0";
  return <span className={cn("font-bold whitespace-nowrap tabular-nums", tone, className)}>{text}</span>;
}

// One metric 0–100: the bar shows "now", the tick marks where the company started.
export function MetricBar({ label, start, now, icon: Icon }: { label: string; start: number; now: number; icon?: LucideIcon }) {
  const delta = now - start;
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 py-2">
      {Icon ? (
        <span className="grid size-8 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
      ) : (
        <span />
      )}
      <span className="text-sm font-semibold">{label}</span>
      <span className="flex items-baseline gap-3 text-sm">
        <span className="tabular-nums">
          <strong className="text-base font-extrabold">{now}</strong>
          <span className="text-muted-foreground">/100</span>
        </span>
        <Delta value={delta} className="min-w-12 text-right text-xs" />
      </span>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={now}
        aria-valuetext={`${now} od 100, početak ${start}`}
        className="relative col-span-3 h-2 rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", delta < 0 ? "bg-down" : "bg-primary")}
          style={{ width: `${now}%` }}
        />
        <div
          aria-hidden
          title={`Početak: ${start}`}
          className="absolute -top-1 h-4 w-0.5 rounded-full bg-foreground/50"
          style={{ left: `${start}%` }}
        />
      </div>
    </div>
  );
}
