// AI usage log. Every provider request made through modelFor is recorded once: tokens, cost, time, outcome.
// Metadata only: never prompts, student answers, chat text or names. A failure here must never reach the game.
import { AsyncLocalStorage } from "node:async_hooks";
import { after } from "next/server";
import type { LanguageModelMiddleware } from "ai";
import { listCostUsd, type TokenCounts } from "./pricing";
import type { AiJob, AiProvider, Env } from "./providers";

type WrapGenerate = NonNullable<LanguageModelMiddleware["wrapGenerate"]>;
type WrapStream = NonNullable<LanguageModelMiddleware["wrapStream"]>;
type RawUsage = Awaited<ReturnType<WrapGenerate>>["usage"];
type StreamPart = Awaited<ReturnType<WrapStream>>["stream"] extends ReadableStream<infer P> ? P : never;

/** Who the call is for. Set once at the route (see withAiContext); both ids are optional. */
export type AiContext = { worldId?: string | null; companyId?: string | null };

/** What modelFor knows about a call. `action` is the Croatian label of the function ("lik", "sudac", ...). */
export type CallMeta = { job: AiJob; action: string; provider: AiProvider; model: string };

export type AiCallRecord = {
  createdAt: Date;
  job: AiJob;
  action: string;
  provider: AiProvider;
  model: string;
  /** Total prompt tokens; cached reads and cache writes are parts of it. */
  inputTokens: number | null;
  cachedInputTokens: number | null;
  cacheWriteTokens: number | null;
  outputTokens: number | null;
  /** What we actually pay (0 on the Groq free tier). */
  costUsd: number | null;
  /** The same call at list price, so the free tier still shows what it would cost. */
  listCostUsd: number | null;
  durationMs: number;
  ok: boolean;
  /** HTTP status or error class only, never the message. */
  error: string | null;
  /** The action ended with its fixed fallback text. */
  fallbackUsed: boolean;
  worldId: string | null;
  companyId: string | null;
};

// ---------- context and scope ----------

type Store = { ctx?: AiContext; scope?: UsageScope };
const storage = new AsyncLocalStorage<Store>();

/** Runs `fn` with a world and company attached to every AI call made inside it (also after `await`s and in streams). */
export function withAiContext<T>(ctx: AiContext, fn: () => T): T {
  return storage.run({ ...storage.getStore(), ctx }, fn);
}

/** A provider request that has started and not yet ended. The scope keeps these so close() can account for them. */
export type InFlight = { meta: CallMeta; started: number; ctx?: AiContext };

/**
 * Collects the records of one action (withAi, one character stream) so they can all carry the same `fallbackUsed`.
 * A request still running when the scope closes (withAi gave up at the deadline) gets its row at once, as ok=false
 * "timeout" without tokens: on Vercel the function may be frozen before that request ends, so waiting would lose the row.
 * When such a request ends later it only reaches the log (`[ai-usage-late]`, with the real tokens and cost), never a second row.
 */
export class UsageScope {
  private pending: AiCallRecord[] = [];
  private inFlight = new Set<InFlight>();
  private abandoned = new WeakSet<InFlight>();
  private closed = false;
  private fallback = false;

  /** A request starts. One that starts after close() belongs to an action that already gave up. */
  begin(call: InFlight): void {
    if (this.closed) this.abandoned.add(call);
    else this.inFlight.add(call);
  }

  /** A request ended with this record. */
  add(record: AiCallRecord, call?: InFlight): Promise<void> {
    if (call && this.abandoned.has(call)) {
      console.info(logLine(record, LATE_TAG));
      return Promise.resolve();
    }
    if (call) this.inFlight.delete(call);
    if (!this.closed) {
      this.pending.push(record);
      return Promise.resolve();
    }
    return emitUsage([{ ...record, fallbackUsed: this.fallback }]);
  }

  close(fallbackUsed: boolean): Promise<void> {
    this.closed = true;
    this.fallback = fallbackUsed;
    const now = Date.now();
    const timedOut = [...this.inFlight].map((call) => {
      this.abandoned.add(call);
      return buildRecord({ meta: call.meta, durationMs: now - call.started, ok: false, error: "timeout", ctx: call.ctx });
    });
    this.inFlight.clear();
    const records = [...this.pending, ...timedOut].map((r) => ({ ...r, fallbackUsed }));
    this.pending = [];
    return emitUsage(records);
  }
}

export function runInScope<T>(scope: UsageScope, fn: () => T): T {
  return storage.run({ ...storage.getStore(), scope }, fn);
}

// ---------- records ----------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidOrNull = (value: string | null | undefined) => (value && UUID.test(value) ? value : null);

/** Token counts from the provider's usage. Missing usage (a failed call) gives all nulls. */
export function tokensFromUsage(usage: RawUsage | undefined): TokenCounts {
  const none: TokenCounts = { input: null, cachedInput: null, cacheWrite: null, output: null };
  if (!usage) return none;
  const { total, noCache, cacheRead, cacheWrite } = usage.inputTokens;
  const input = total ?? (noCache !== undefined ? noCache + (cacheRead ?? 0) + (cacheWrite ?? 0) : null);
  const output = usage.outputTokens.total ?? null;
  if (input === null) return { ...none, output };
  return { input, cachedInput: cacheRead ?? 0, cacheWrite: cacheWrite ?? 0, output };
}

const CLEAN_LABELS = new Set(["cancelled", "no-finish", "timeout"]);

/** A short, content-free reason: HTTP status, error class, or one of our own labels. */
export function errorLabel(error: unknown): string {
  if (typeof error === "string") return CLEAN_LABELS.has(error) ? error : "error";
  const e = error as { statusCode?: unknown; name?: unknown } | null;
  if (typeof e?.statusCode === "number") return String(e.statusCode);
  return typeof e?.name === "string" && e.name ? e.name.slice(0, 40) : "error";
}

/** AI_GROQ_FREE=1: the Groq Free plan costs nothing (the paid plan is called Developer), so the real cost is 0 and the list cost is kept alongside. */
export function isGroqFree(provider: AiProvider, env: Env = process.env): boolean {
  return provider === "groq" && ["1", "true"].includes((env.AI_GROQ_FREE ?? "").trim().toLowerCase());
}

export function buildRecord(args: {
  meta: CallMeta;
  usage?: RawUsage;
  durationMs: number;
  ok: boolean;
  error?: unknown;
  ctx?: AiContext;
  env?: Env;
  now?: Date;
}): AiCallRecord {
  const { meta, usage, durationMs, ok, ctx } = args;
  const tokens = tokensFromUsage(usage);
  const list = listCostUsd(meta.provider, meta.model, tokens);
  return {
    createdAt: args.now ?? new Date(),
    job: meta.job,
    action: meta.action,
    provider: meta.provider,
    model: meta.model,
    inputTokens: tokens.input,
    cachedInputTokens: tokens.cachedInput,
    cacheWriteTokens: tokens.cacheWrite,
    outputTokens: tokens.output,
    costUsd: isGroqFree(meta.provider, args.env) ? 0 : list,
    listCostUsd: list,
    durationMs: Math.max(0, Math.round(durationMs)),
    ok,
    error: ok ? null : errorLabel(args.error),
    fallbackUsed: false,
    worldId: uuidOrNull(ctx?.worldId),
    companyId: uuidOrNull(ctx?.companyId),
  };
}

// ---------- middleware ----------

/** Records one row per provider request. Retries by the SDK are separate requests and get separate rows. */
export function usageMiddleware(meta: CallMeta): LanguageModelMiddleware {
  // The scope learns about a request when it starts, so it can still account for it if the action gives up first.
  const begin = (origin: Store, started: number): InFlight | undefined => {
    if (!origin.scope) return undefined;
    const call: InFlight = { meta, started, ctx: origin.ctx };
    origin.scope.begin(call);
    return call;
  };

  const record = async (
    origin: Store,
    started: number,
    call: InFlight | undefined,
    outcome: { ok: boolean; usage?: RawUsage; error?: unknown },
  ): Promise<void> => {
    try {
      const rec = buildRecord({ meta, ...outcome, durationMs: Date.now() - started, ctx: origin.ctx });
      await (origin.scope ? origin.scope.add(rec, call) : emitUsage([rec]));
    } catch {
      console.warn("[ai-usage] could not record a call");
    }
  };

  return {
    specificationVersion: "v4",

    wrapGenerate: async ({ doGenerate }) => {
      const origin: Store = { ...storage.getStore() }; // taken now: the store is not reliable once a stream is being read
      const started = Date.now();
      const call = begin(origin, started);
      let result: Awaited<ReturnType<typeof doGenerate>>;
      try {
        result = await doGenerate();
      } catch (error) {
        await record(origin, started, call, { ok: false, error });
        throw error;
      }
      await record(origin, started, call, { ok: true, usage: result.usage });
      return result;
    },

    wrapStream: async ({ doStream }) => {
      const origin: Store = { ...storage.getStore() };
      const started = Date.now();
      const call = begin(origin, started);
      let result: Awaited<ReturnType<typeof doStream>>;
      try {
        result = await doStream();
      } catch (error) {
        await record(origin, started, call, { ok: false, error });
        throw error;
      }

      const reader = result.stream.getReader();
      let usage: RawUsage | undefined;
      let streamError: unknown;
      let settled = false;
      // Once only, however the stream ends: finished, failed, or cancelled by the reader.
      const settle = async (failure?: unknown) => {
        if (settled) return;
        settled = true;
        const error = failure ?? streamError ?? (usage ? undefined : "no-finish");
        await record(origin, started, call, error === undefined ? { ok: true, usage } : { ok: false, usage, error });
      };

      const stream = new ReadableStream<StreamPart>({
        async pull(controller) {
          let next: ReadableStreamReadResult<StreamPart>;
          try {
            next = await reader.read();
          } catch (error) {
            await settle(error);
            controller.error(error);
            return;
          }
          if (next.done) {
            await settle();
            controller.close();
            return;
          }
          const part = next.value as StreamPart & { type?: string; usage?: RawUsage; error?: unknown };
          if (part.type === "finish") usage = part.usage;
          else if (part.type === "error") streamError = part.error ?? "error";
          controller.enqueue(next.value);
        },
        async cancel(reason) {
          await settle(usage ? undefined : "cancelled");
          await reader.cancel(reason);
        },
      });
      return { ...result, stream };
    },
  };
}

// ---------- output: log line and database ----------

/** Set in tests to capture records instead of logging and inserting. */
let sink: ((records: AiCallRecord[]) => void) | null = null;
export function setUsageSink(fn: ((records: AiCallRecord[]) => void) | null): void {
  sink = fn;
}

const LATE_TAG = "ai-usage-late";

export function logLine(r: AiCallRecord, tag = "ai-usage"): string {
  return `[${tag}] ${JSON.stringify({ ...r, createdAt: r.createdAt.toISOString() })}`;
}

export async function emitUsage(records: AiCallRecord[]): Promise<void> {
  if (records.length === 0) return;
  if (sink) {
    sink(records);
    return;
  }
  for (const r of records) console.info(logLine(r));
  await persistUsage(records);
}

const INSERT_TIMEOUT_MS = 2000;
const MISSING_TABLE_PAUSE_MS = 60_000;
let missingTableUntil = 0; // after "table does not exist" stop trying for a minute, so the SQL can be applied without a redeploy

export function toRow(r: AiCallRecord) {
  const usd = (n: number | null) => (n === null ? null : n.toFixed(8));
  return {
    createdAt: r.createdAt,
    job: r.job,
    action: r.action,
    provider: r.provider,
    model: r.model,
    inputTokens: r.inputTokens,
    cachedInputTokens: r.cachedInputTokens,
    cacheWriteTokens: r.cacheWriteTokens,
    outputTokens: r.outputTokens,
    costUsd: usd(r.costUsd),
    listCostUsd: usd(r.listCostUsd),
    durationMs: r.durationMs,
    ok: r.ok,
    error: r.error,
    fallbackUsed: r.fallbackUsed,
    worldId: r.worldId,
    companyId: r.companyId,
  };
}

/** One INSERT for all records. The db module is imported here so that importing this file never touches the database. */
export async function insertUsageRows(records: AiCallRecord[]): Promise<void> {
  const [{ db }, { aiCalls }] = await Promise.all([import("@/db"), import("@/db/schema")]);
  await db.insert(aiCalls).values(records.map(toRow));
}

/** Postgres 42P01 (undefined_table), possibly wrapped by drizzle as `cause`. */
export function isMissingTable(error: unknown): boolean {
  const e = error as { code?: unknown; message?: unknown; cause?: unknown } | null;
  if (!e) return false;
  if (e.code === "42P01") return true;
  if (typeof e.message === "string" && /relation "ai_calls" does not exist/.test(e.message)) return true;
  return e.cause !== undefined && e.cause !== error && isMissingTable(e.cause);
}

type PersistDeps = {
  insert?: (records: AiCallRecord[]) => Promise<void>;
  schedule?: (task: () => Promise<void>) => void;
  timeoutMs?: number;
};

/**
 * Saves records without ever failing. Inside a request the insert runs in Next's after() (after the response);
 * elsewhere (scripts, tests) it is awaited for at most `timeoutMs`. No DATABASE_URL or no table: silent skip.
 * Any other error: one console.warn with the error code, no message.
 */
export async function persistUsage(records: AiCallRecord[], deps: PersistDeps = {}): Promise<void> {
  if (!process.env.DATABASE_URL || Date.now() < missingTableUntil) return;
  const insert = deps.insert ?? insertUsageRows;
  const run = async () => {
    try {
      await insert(records);
    } catch (error) {
      if (isMissingTable(error)) missingTableUntil = Date.now() + MISSING_TABLE_PAUSE_MS;
      else console.warn(`[ai-usage] insert failed (${errorLabel(error)})`);
    }
  };
  try {
    (deps.schedule ?? after)(run);
    return;
  } catch {
    // Not inside a request: fall through and wait a moment.
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, deps.timeoutMs ?? INSERT_TIMEOUT_MS);
  });
  try {
    await Promise.race([run(), limit]);
  } finally {
    clearTimeout(timer);
  }
}

/** For tests: forget a "table missing" pause. */
export function resetUsageState(): void {
  missingTableUntil = 0;
}
