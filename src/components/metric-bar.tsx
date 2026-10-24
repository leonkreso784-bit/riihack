import { Coins, MessageSquare, Settings, User, Users, type LucideIcon } from "lucide-react";
import type { MetricKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { num } from "@/lib/format";

export const METRIC_ICONS: Record<MetricKey, LucideIcon> = {
  guests: User,
  reviews: MessageSquare,
  staff: Users,
  operations: Settings,
  finance: Coins,
};

export function Delta({ value, className }: { value: number; className?: string }) {
  const tone = value > 0 ? "text-up" : value < 0 ? "text-down" : "text-muted-foreground";
  const text = value > 0 ? `▲ +${num(value)}` : value < 0 ? `▼ −${num(-value)}` : "±0"; // hr-HR: 19,3
  return <span className={cn("font-bold whitespace-nowrap tabular-nums", tone, className)}>{text}</span>;
}

// One metric 0–100: the bar shows "now", the tick marks where the company started.
export function MetricBar({
  label,
  start,
  now,
  icon: Icon,
  order = 0,
}: {
  label: string;
  start: number;
  now: number;
  icon?: LucideIcon;
  /** Position in a list, staggers the grow-in animation. */
  order?: number;
}) {
  const delta = now - start;
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 py-2">
      {Icon ? (
        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-b from-[#eef4ff] to-[#dde8ff] text-secondary-foreground shadow-[inset_0_1px_0_#fff]">
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
        className="relative col-span-3 h-2.5 rounded-full bg-muted shadow-[inset_0_1px_2px_rgb(21_27_43_/_0.08)]"
      >
        <div
          className={cn("anim-grow h-full rounded-full transition-[width] duration-700", delta < 0 ? "bar-fill-down" : "bar-fill")}
          style={{ width: `${now}%`, ["--i" as string]: order }}
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
