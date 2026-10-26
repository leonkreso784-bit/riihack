// AI spend report: pure aggregation and formatting of ai_calls rows. The script scripts/ai-potrosnja.ts only reads and prints.

/** The columns of ai_calls the report needs; numeric columns already converted to numbers. */
export type ReportRow = {
  createdAt: Date;
  action: string;
  provider: string;
  model: string;
  inputTokens: number | null;
  cachedInputTokens: number | null;
  cacheWriteTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  listCostUsd: number | null;
  durationMs: number;
  ok: boolean;
  fallbackUsed: boolean;
  worldId: string | null;
};

export type Totals = {
  calls: number;
  failed: number;
  fallbacks: number;
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  outputTokens: number;
  /** What we pay. */
  costUsd: number;
  /** The same calls at list price (differs from costUsd on the Groq free tier). */
  listCostUsd: number;
  /** Successful calls whose model has no price in pricing.ts, so their cost is missing from the sums. */
  unpriced: number;
  totalMs: number;
};

export type Group = Totals & { key: string };

export type Report = {
  total: Totals;
  byDay: Group[];
  byAction: Group[];
  byModel: Group[];
  topWorlds: Group[];
};

export const NO_WORLD = "(bez igre)";

const empty = (): Totals => ({
  calls: 0,
  failed: 0,
  fallbacks: 0,
  inputTokens: 0,
  cachedInputTokens: 0,
  cacheWriteTokens: 0,
  outputTokens: 0,
  costUsd: 0,
  listCostUsd: 0,
  unpriced: 0,
  totalMs: 0,
});

function add(t: Totals, r: ReportRow): void {
  t.calls += 1;
  if (!r.ok) t.failed += 1;
  if (r.fallbackUsed) t.fallbacks += 1;
  t.inputTokens += r.inputTokens ?? 0;
  t.cachedInputTokens += r.cachedInputTokens ?? 0;
  t.cacheWriteTokens += r.cacheWriteTokens ?? 0;
  t.outputTokens += r.outputTokens ?? 0;
  t.costUsd += r.costUsd ?? 0;
  t.listCostUsd += r.listCostUsd ?? 0;
  if (r.ok && r.listCostUsd === null) t.unpriced += 1;
  t.totalMs += r.durationMs;
}

function group(rows: ReportRow[], keyOf: (r: ReportRow) => string): Group[] {
  const map = new Map<string, Group>();
  for (const r of rows) {
    const key = keyOf(r);
    let g = map.get(key);
    if (!g) map.set(key, (g = { key, ...empty() }));
    add(g, r);
  }
  return [...map.values()];
}

/** Most expensive first (by list price, so the free tier still ranks); ties by calls, then by name. */
const byCostDesc = (a: Group, b: Group) =>
  b.listCostUsd - a.listCostUsd || b.costUsd - a.costUsd || b.calls - a.calls || a.key.localeCompare(b.key);

/** Calendar day in the given zone as YYYY-MM-DD. */
export function dayKey(date: Date, timeZone = "Europe/Zagreb"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function summarize(rows: ReportRow[], options: { topWorlds?: number; timeZone?: string } = {}): Report {
  const total = empty();
  for (const r of rows) add(total, r);
  return {
    total,
    byDay: group(rows, (r) => dayKey(r.createdAt, options.timeZone)).sort((a, b) => a.key.localeCompare(b.key)),
    byAction: group(rows, (r) => r.action).sort(byCostDesc),
    byModel: group(rows, (r) => `${r.provider}/${r.model}`).sort(byCostDesc),
    topWorlds: group(rows, (r) => r.worldId ?? NO_WORLD)
      .sort(byCostDesc)
      .slice(0, options.topWorlds ?? 10),
  };
}

/** `7`, `--days 14`, `--days=14` or `-d 3` from the command line; 7 when absent. Throws on anything else. */
export function parseDays(args: string[]): number {
  let raw: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--days" || a === "-d") raw = args[++i];
    else if (a.startsWith("--days=")) raw = a.slice("--days=".length);
    else if (/^\d+$/.test(a)) raw = a;
  }
  if (raw === undefined) return 7;
  const days = Number(raw);
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error(`Broj dana mora biti cijeli broj od 1 do 365, a dobio sam "${raw}"`);
  return days;
}

// ---------- text output ----------

const num = (n: number) => n.toLocaleString("hr-HR");
const usd = (n: number) => n.toFixed(4);
const avgMs = (t: Totals) => (t.calls ? Math.round(t.totalMs / t.calls) : 0);

function table(title: string, firstHeader: string, groups: Group[], label: (key: string) => string = (k) => k): string[] {
  const head = [firstHeader, "pozivi", "greške", "rezerva", "ulaz", "cache", "izlaz", "ms/poziv", "USD", "cjenik USD"];
  const body = groups.map((g) => [
    label(g.key),
    num(g.calls),
    num(g.failed),
    num(g.fallbacks),
    num(g.inputTokens),
    num(g.cachedInputTokens),
    num(g.outputTokens),
    String(avgMs(g)),
    usd(g.costUsd),
    usd(g.listCostUsd),
  ]);
  const widths = head.map((h, c) => Math.max(h.length, ...body.map((row) => row[c].length)));
  const line = (cells: string[]) => cells.map((cell, c) => (c === 0 ? cell.padEnd(widths[c]) : cell.padStart(widths[c]))).join("  ");
  return ["", title, line(head), ...body.map(line)];
}

/** The report as plain text. `worldNames` maps a world id to its name for the top-games table. */
export function formatReport(report: Report, options: { days: number; since: Date; worldNames?: Map<string, string> }): string {
  const t = report.total;
  const names = options.worldNames ?? new Map<string, string>();
  const lines = [
    `AI potrošnja, zadnjih ${options.days} dana (od ${dayKey(options.since)})`,
    `Ukupno: ${num(t.calls)} poziva (${num(t.failed)} neuspjelih, ${num(t.fallbacks)} s rezervnim tekstom)`,
    `Tokeni: ulaz ${num(t.inputTokens)} (od toga cache čitanje ${num(t.cachedInputTokens)}, cache pisanje ${num(t.cacheWriteTokens)}), izlaz ${num(t.outputTokens)}`,
    `Trošak: ${usd(t.costUsd)} USD stvarno, ${usd(t.listCostUsd)} USD po cjeniku`,
  ];
  if (t.unpriced > 0) lines.push(`Pažnja: ${num(t.unpriced)} uspješnih poziva nema cijenu u pricing.ts i nije u zbroju.`);
  if (t.calls === 0) lines.push("", "Nema zapisa u tom razdoblju.");
  else {
    lines.push(
      ...table("Po danu", "dan", report.byDay),
      ...table("Po akciji", "akcija", report.byAction),
      ...table("Po modelu", "model", report.byModel),
      ...table("Najskuplje igre", "igra", report.topWorlds, (key) => {
        const name = names.get(key);
        return name ? `${name} (${key.slice(0, 8)})` : key === NO_WORLD ? key : key.slice(0, 8);
      }),
    );
  }
  return lines.join("\n");
}
