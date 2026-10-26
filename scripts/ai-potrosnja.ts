// AI potrošnja po danu, akciji, modelu i igri. Pokretanje: npm run ai:potrosnja [-- 14] (zadano zadnjih 7 dana).
// SAMO ČITA tablicu ai_calls (i imena igara iz worlds); ništa ne upisuje ni briše. Traži DATABASE_URL u .env.local.
import { config } from "dotenv";
config({ path: ".env.local" });
import { desc, gte, inArray } from "drizzle-orm";
import { db } from "../src/db";
import { aiCalls, worlds } from "../src/db/schema";
import { formatReport, NO_WORLD, parseDays, summarize, type ReportRow } from "../src/lib/ai/report";

const MAX_ROWS = 200_000;

function isMissingTable(error: unknown): boolean {
  const e = error as { code?: unknown; message?: unknown; cause?: unknown } | null;
  if (!e) return false;
  if (e.code === "42P01" || (typeof e.message === "string" && /relation "ai_calls" does not exist/.test(e.message))) return true;
  return e.cause !== undefined && e.cause !== error && isMissingTable(e.cause);
}

async function main() {
  const days = parseDays(process.argv.slice(2));
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL nije postavljen (.env.local).");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      createdAt: aiCalls.createdAt,
      action: aiCalls.action,
      provider: aiCalls.provider,
      model: aiCalls.model,
      inputTokens: aiCalls.inputTokens,
      cachedInputTokens: aiCalls.cachedInputTokens,
      cacheWriteTokens: aiCalls.cacheWriteTokens,
      outputTokens: aiCalls.outputTokens,
      costUsd: aiCalls.costUsd,
      listCostUsd: aiCalls.listCostUsd,
      durationMs: aiCalls.durationMs,
      ok: aiCalls.ok,
      fallbackUsed: aiCalls.fallbackUsed,
      worldId: aiCalls.worldId,
    })
    .from(aiCalls)
    .where(gte(aiCalls.createdAt, since))
    .orderBy(desc(aiCalls.createdAt))
    .limit(MAX_ROWS);

  // numeric columns come back as strings
  const data: ReportRow[] = rows.map((r) => ({
    ...r,
    costUsd: r.costUsd === null ? null : Number(r.costUsd),
    listCostUsd: r.listCostUsd === null ? null : Number(r.listCostUsd),
  }));
  const report = summarize(data, { topWorlds: 10 });

  const ids = report.topWorlds.map((g) => g.key).filter((key) => key !== NO_WORLD);
  const worldNames = new Map<string, string>();
  if (ids.length > 0) {
    for (const w of await db.select({ id: worlds.id, name: worlds.name }).from(worlds).where(inArray(worlds.id, ids))) {
      worldNames.set(w.id, w.name);
    }
  }

  console.log(formatReport(report, { days, since, worldNames }));
  if (rows.length >= MAX_ROWS) console.log(`\nPažnja: prikazano je zadnjih ${MAX_ROWS} redaka, zbrojevi su nepotpuni. Smanji broj dana.`);
}

main().catch((error) => {
  if (isMissingTable(error)) console.error("Tablica ai_calls ne postoji. Primijeni scripts/sql/2026-10-26-ai-calls.sql (vidi docs/AI-POTROSNJA.md).");
  else console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
