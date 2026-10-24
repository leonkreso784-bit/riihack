import { eur } from "@/lib/format";
import type { Part } from "@/lib/finance-view";

const COLORS = ["bg-primary", "bg-[#38bdf8]", "bg-warn", "bg-up", "bg-down", "bg-muted-foreground"];

// Složeni stupac s legendom: širine su udjeli u zbroju, svaka stavka ima iznos i postotak.
export function StackedBar({ title, parts }: { title: string; parts: Part[] }) {
  const items = parts.filter((p) => p.amount > 0);
  const total = items.reduce((s, p) => s + p.amount, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold">{title}</h3>
        <span className="text-sm font-extrabold tabular-nums">{eur(total)}</span>
      </div>
      <div className="mt-2 flex h-4 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${title}: ${items.map((p) => `${p.label} ${eur(p.amount)}`).join(", ")}`}>
        {items.map((p, i) => (
          <div key={p.key} className={COLORS[i % COLORS.length]} style={{ width: `${(p.amount / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((p, i) => (
          <li key={p.key} className="flex items-center gap-2 text-sm">
            <span className={`size-3 shrink-0 rounded-sm ${COLORS[i % COLORS.length]}`} aria-hidden />
            <span className="min-w-0 flex-1 text-muted-foreground">{p.label}</span>
            <span className="font-bold tabular-nums">{eur(p.amount)}</span>
            <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{Math.round((p.amount / total) * 100)} %</span>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted-foreground">Nema stavki.</li>}
      </ul>
    </div>
  );
}
