import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APICallError, generateText, simulateReadableStream, streamText, wrapLanguageModel } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { withAi } from "./client";
import {
  buildRecord,
  emitUsage,
  errorLabel,
  isGroqFree,
  isMissingTable,
  logLine,
  persistUsage,
  resetUsageState,
  setUsageSink,
  tokensFromUsage,
  toRow,
  runInScope,
  UsageScope,
  usageMiddleware,
  withAiContext,
  type AiCallRecord,
  type CallMeta,
} from "./usage";

const WORLD = "11111111-1111-4111-8111-111111111111";
const COMPANY = "22222222-2222-4222-8222-222222222222";

const meta: CallMeta = { job: "judge", action: "sudac", provider: "anthropic", model: "claude-sonnet-5-5" };

// Anthropic-style usage: 1500 prompt tokens, of which 1000 read from the cache and 300 written to it.
const usage = {
  inputTokens: { total: 1500, noCache: 200, cacheRead: 1000, cacheWrite: 300 },
  outputTokens: { total: 100, text: 100, reasoning: undefined },
};

const reply = (text = "ok") => ({
  content: [{ type: "text" as const, text }],
  finishReason: { unified: "stop" as const, raw: "stop" },
  usage,
  warnings: [],
});

const wrapped = (model: MockLanguageModelV4, m: CallMeta = meta) => wrapLanguageModel({ model, middleware: usageMiddleware(m) });

let records: AiCallRecord[];
beforeEach(() => {
  records = [];
  setUsageSink((r) => records.push(...r));
});
afterEach(() => {
  setUsageSink(null);
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  resetUsageState();
});

describe("tokensFromUsage", () => {
  it("reads Anthropic usage with cache reads and writes", () => {
    expect(tokensFromUsage(usage)).toEqual({ input: 1500, cachedInput: 1000, cacheWrite: 300, output: 100 });
  });

  it("treats missing cache numbers (Groq, Mistral) as 0 once the input is known", () => {
    const u = { inputTokens: { total: 50, noCache: 50, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 7, text: 7, reasoning: 3 } };
    expect(tokensFromUsage(u)).toEqual({ input: 50, cachedInput: 0, cacheWrite: 0, output: 7 });
  });

  it("rebuilds the total from the parts when the provider sends no total", () => {
    const u = { inputTokens: { total: undefined, noCache: 20, cacheRead: 5, cacheWrite: 1 }, outputTokens: { total: 2, text: 2, reasoning: undefined } };
    expect(tokensFromUsage(u).input).toBe(26);
  });

  it("gives all nulls without usage, and keeps only output when the input is unknown", () => {
    expect(tokensFromUsage(undefined)).toEqual({ input: null, cachedInput: null, cacheWrite: null, output: null });
    const u = { inputTokens: { total: undefined, noCache: undefined, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 9, text: 9, reasoning: undefined } };
    expect(tokensFromUsage(u)).toEqual({ input: null, cachedInput: null, cacheWrite: null, output: 9 });
  });
});

describe("errorLabel", () => {
  it("is the HTTP status, the error class, or one of our own labels; never the message", () => {
    expect(errorLabel(new APICallError({ message: "secret prompt text", url: "u", requestBodyValues: {}, statusCode: 429 }))).toBe("429");
    expect(errorLabel(new DOMException("timed out with private text", "TimeoutError"))).toBe("TimeoutError");
    expect(errorLabel(new TypeError("x"))).toBe("TypeError");
    expect(errorLabel("cancelled")).toBe("cancelled");
    expect(errorLabel("some free text from somewhere")).toBe("error");
    expect(errorLabel(undefined)).toBe("error");
  });
});

describe("buildRecord", () => {
  it("computes cost from the tokens and carries job, action, provider, model", () => {
    const r = buildRecord({ meta, usage, durationMs: 812.4, ok: true, now: new Date("2026-10-26T10:00:00Z") });
    const expected = (200 * 2.0 + 1000 * 0.1 + 300 * 2.5 + 100 * 10.0) / 1e6;
    expect(r).toMatchObject({
      job: "judge", action: "sudac", provider: "anthropic", model: "claude-sonnet-5-5",
      inputTokens: 1500, cachedInputTokens: 1000, cacheWriteTokens: 300, outputTokens: 100,
      durationMs: 812, ok: true, error: null, fallbackUsed: false, worldId: null, companyId: null,
    });
    expect(r.costUsd).toBeCloseTo(expected, 10);
    expect(r.listCostUsd).toBeCloseTo(expected, 10);
  });

  it("a failed call has no tokens, no cost and a short error", () => {
    const r = buildRecord({ meta, durationMs: 20_001, ok: false, error: new DOMException("x", "TimeoutError") });
    expect(r).toMatchObject({ ok: false, error: "TimeoutError", inputTokens: null, outputTokens: null, costUsd: null, listCostUsd: null });
  });

  it("keeps our own timeout label as it is", () => {
    expect(buildRecord({ meta, durationMs: 20_000, ok: false, error: "timeout" }).error).toBe("timeout");
  });

  it("AI_GROQ_FREE=1 records cost 0 and keeps the would-be cost", () => {
    const groq: CallMeta = { job: "character", action: "lik", provider: "groq", model: "openai/gpt-oss-120b" };
    const u = { inputTokens: { total: 1000, noCache: 1000, cacheRead: 0, cacheWrite: undefined }, outputTokens: { total: 100, text: 100, reasoning: undefined } };
    const paid = buildRecord({ meta: groq, usage: u, durationMs: 1, ok: true, env: {} });
    const free = buildRecord({ meta: groq, usage: u, durationMs: 1, ok: true, env: { AI_GROQ_FREE: "1" } });
    expect(paid.costUsd).toBeCloseTo((1000 * 0.15 + 100 * 0.6) / 1e6, 10);
    expect(free.costUsd).toBe(0);
    expect(free.listCostUsd).toBeCloseTo(paid.costUsd!, 10);
  });

  it("the free flag only applies to Groq", () => {
    expect(isGroqFree("groq", { AI_GROQ_FREE: "1" })).toBe(true);
    expect(isGroqFree("groq", { AI_GROQ_FREE: "true" })).toBe(true);
    expect(isGroqFree("groq", { AI_GROQ_FREE: "0" })).toBe(false);
    expect(isGroqFree("anthropic", { AI_GROQ_FREE: "1" })).toBe(false);
    expect(isGroqFree("mistral", { AI_GROQ_FREE: "1" })).toBe(false);
  });

  it("an unpriced Mistral model records null cost", () => {
    const m: CallMeta = { job: "mentor", action: "mentor-pitanje", provider: "mistral", model: "mistral-large-latest" };
    expect(buildRecord({ meta: m, usage, durationMs: 1, ok: true }).costUsd).toBeNull();
  });

  it("keeps world and company only when they are valid uuids", () => {
    expect(buildRecord({ meta, usage, durationMs: 1, ok: true, ctx: { worldId: WORLD, companyId: COMPANY } })).toMatchObject({ worldId: WORLD, companyId: COMPANY });
    expect(buildRecord({ meta, usage, durationMs: 1, ok: true, ctx: { worldId: "not-a-uuid", companyId: null } })).toMatchObject({ worldId: null, companyId: null });
  });
});

describe("usage middleware: generate", () => {
  it("records one successful call with tokens, cost and time", async () => {
    const model = wrapped(new MockLanguageModelV4({ doGenerate: async () => reply("odgovor") }));
    const { text } = await generateText({ model, prompt: "tajni tekst studenta" });
    expect(text).toBe("odgovor");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ ok: true, inputTokens: 1500, cachedInputTokens: 1000, cacheWriteTokens: 300, outputTokens: 100, action: "sudac" });
    expect(records[0].costUsd).toBeGreaterThan(0);
    expect(records[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it("never stores prompt or answer text", async () => {
    const model = wrapped(new MockLanguageModelV4({ doGenerate: async () => reply("privatni odgovor") }));
    await generateText({ model, prompt: "privatni upit studenta Ivana Horvata" });
    const stored = JSON.stringify(records);
    expect(stored).not.toContain("privatni");
    expect(stored).not.toContain("Horvat");
  });

  it("records a failure once as ok=false with the status, and rethrows", async () => {
    const boom = new APICallError({ message: "overloaded: prompt echo", url: "u", requestBodyValues: {}, statusCode: 529, isRetryable: false });
    const model = wrapped(new MockLanguageModelV4({ doGenerate: async () => { throw boom; } }));
    await expect(generateText({ model, prompt: "x", maxRetries: 0 })).rejects.toThrow();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ ok: false, error: "529", inputTokens: null, costUsd: null });
    expect(JSON.stringify(records)).not.toContain("echo");
  });

  it("records each provider request: a retried 429 is two rows", async () => {
    let n = 0;
    const throttled = new APICallError({ message: "rate limit", url: "u", requestBodyValues: {}, statusCode: 429, isRetryable: true });
    const model = wrapped(new MockLanguageModelV4({ doGenerate: async () => { if (n++ === 0) throw throttled; return reply(); } }));
    vi.useFakeTimers();
    const run = generateText({ model, prompt: "x" });
    await vi.runAllTimersAsync();
    await run;
    vi.useRealTimers();
    expect(records.map((r) => [r.ok, r.error])).toEqual([[false, "429"], [true, null]]);
  });

  it("a failing sink never breaks the model call", async () => {
    setUsageSink(() => { throw new Error("sink down"); });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const model = wrapped(new MockLanguageModelV4({ doGenerate: async () => reply("i dalje radi") }));
    expect((await generateText({ model, prompt: "x" })).text).toBe("i dalje radi");
  });
});

const finish = { type: "finish" as const, finishReason: { unified: "stop" as const, raw: undefined }, usage };
const streamModel = (chunks: unknown[]) =>
  wrapped(new MockLanguageModelV4({ doStream: async () => ({ stream: simulateReadableStream({ chunks: chunks as never[] }) }) }), {
    job: "character", action: "lik", provider: "anthropic", model: "claude-haiku-5-5",
  });
const textChunks = [{ type: "text-start", id: "t" }, { type: "text-delta", id: "t", delta: "Pa dobro." }, { type: "text-end", id: "t" }];

describe("usage middleware: stream", () => {
  it("records a streamed call once, when the finish part passes, with the usage from it", async () => {
    const result = streamText({ model: streamModel([...textChunks, finish]), prompt: "x" });
    expect(await result.text).toBe("Pa dobro.");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ ok: true, job: "character", action: "lik", inputTokens: 1500, outputTokens: 100 });
  });

  it("a stream that errors is ok=false", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new APICallError({ message: "m", url: "u", requestBodyValues: {}, statusCode: 500 });
    const result = streamText({ model: streamModel([...textChunks, { type: "error", error: err }]), prompt: "x", maxRetries: 0, onError: () => {} });
    for await (const _ of result.textStream) void _;
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ ok: false, error: "500" });
  });

  it("a stream that ends without a finish part is ok=false", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = streamText({ model: streamModel(textChunks), prompt: "x", onError: () => {} });
    for await (const _ of result.textStream) void _;
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ ok: false, error: "no-finish" });
  });

  it("a request that fails before any stream exists is recorded once", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const model = wrapped(new MockLanguageModelV4({ doStream: async () => { throw new DOMException("t", "TimeoutError"); } }));
    const result = streamText({ model, prompt: "x", maxRetries: 0, onError: () => {} });
    for await (const _ of result.textStream) void _;
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ ok: false, error: "TimeoutError" });
  });

  it("a reader that cancels before the finish part is recorded once as cancelled", async () => {
    const model = streamModel([...textChunks, finish]);
    const { stream } = await model.doStream({ prompt: [{ role: "user", content: [{ type: "text", text: "x" }] }] });
    const reader = stream.getReader();
    await reader.read();
    await reader.cancel();
    await reader.cancel().catch(() => {});
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ ok: false, error: "cancelled" });
  });
});

describe("world and company", () => {
  it("attaches the ids set with withAiContext, also after awaits", async () => {
    const model = wrapped(new MockLanguageModelV4({ doGenerate: async () => reply() }));
    await withAiContext({ worldId: WORLD, companyId: COMPANY }, async () => {
      await Promise.resolve();
      await generateText({ model, prompt: "x" });
    });
    await generateText({ model, prompt: "y" }); // outside: no ids
    expect(records.map((r) => [r.worldId, r.companyId])).toEqual([[WORLD, COMPANY], [null, null]]);
  });

  it("attaches the ids to a streamed call too", async () => {
    const result = withAiContext({ worldId: WORLD }, () => streamText({ model: streamModel([...textChunks, finish]), prompt: "x" }));
    await result.text;
    expect(records[0]).toMatchObject({ worldId: WORLD, companyId: null });
  });
});

describe("fallback_used via withAi", () => {
  const ok = () => wrapped(new MockLanguageModelV4({ doGenerate: async () => reply() }));

  it("is false when the action returns the model's result", async () => {
    const model = ok();
    await withAi(async () => (await generateText({ model, prompt: "x" })).text, "rezerva");
    expect(records).toHaveLength(1);
    expect(records[0].fallbackUsed).toBe(false);
  });

  it("is true when the action ends with its fallback value after calling the model (e.g. two rejected replies)", async () => {
    const model = ok();
    await withAi(async () => {
      await generateText({ model, prompt: "a" });
      await generateText({ model, prompt: "b" });
      return "rezerva";
    }, "rezerva");
    expect(records.map((r) => r.fallbackUsed)).toEqual([true, true]);
  });

  it("is true for an object fallback compared by value", async () => {
    const model = ok();
    await withAi(async () => {
      await generateText({ model, prompt: "a" });
      return { title: "rezerva" };
    }, { title: "rezerva" });
    expect(records[0].fallbackUsed).toBe(true);
  });

  it("is true, and ok=false, when the call throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const model = wrapped(new MockLanguageModelV4({ doGenerate: async () => { throw new TypeError("x"); } }));
    await expect(withAi(async () => (await generateText({ model, prompt: "x", maxRetries: 0 })).text, "rezerva")).resolves.toBe("rezerva");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ ok: false, fallbackUsed: true });
  });

  const lateLines = (info: { mock: { calls: unknown[][] } }) =>
    info.mock.calls.map((c) => String(c[0])).filter((l) => l.startsWith("[ai-usage-late] "));

  it("a timeout returns the fallback at once with its own row; the request that ends later reaches only the log", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const slow = wrapped(new MockLanguageModelV4({ doGenerate: async () => { await new Promise((r) => setTimeout(r, 60)); return reply(); } }));
    const value = await withAi(async () => (await generateText({ model: slow, prompt: "x" })).text, "rezerva", 10);
    expect(value).toBe("rezerva");
    expect(records).toHaveLength(1); // written at the deadline, not when the request ends
    expect(records[0]).toMatchObject({
      ok: false, error: "timeout", fallbackUsed: true, action: "sudac", inputTokens: null, outputTokens: null, costUsd: null, listCostUsd: null,
    });
    await new Promise((r) => setTimeout(r, 120));
    expect(records).toHaveLength(1); // one request, one row
    const late = lateLines(info);
    expect(late).toHaveLength(1);
    expect(JSON.parse(late[0].slice("[ai-usage-late] ".length))).toMatchObject({ ok: true, outputTokens: 100, costUsd: expect.any(Number) });
  });

  it("a finished attempt and an attempt still running at the deadline both get a row when the action closes", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    let n = 0;
    const model = wrapped(new MockLanguageModelV4({
      doGenerate: async () => {
        if (n++ > 0) await new Promise((r) => setTimeout(r, 80));
        return reply();
      },
    }));
    await withAi(async () => {
      await generateText({ model, prompt: "a" });
      await generateText({ model, prompt: "b" });
      return "nikad";
    }, "rezerva", 20);
    expect(records.map((r) => [r.ok, r.error, r.fallbackUsed])).toEqual([[true, null, true], [false, "timeout", true]]);
    expect(records[0].outputTokens).toBe(100);
    await new Promise((r) => setTimeout(r, 120)); // let the abandoned attempt end
    expect(records).toHaveLength(2);
  });

  it("a request that only starts after the action gave up reaches only the log", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const model = ok();
    await withAi(async () => {
      await new Promise((r) => setTimeout(r, 40));
      return (await generateText({ model, prompt: "x" })).text;
    }, "rezerva", 10);
    await new Promise((r) => setTimeout(r, 80));
    expect(records).toHaveLength(0);
    expect(lateLines(info)).toHaveLength(1);
  });

  it("a stream still open when the scope closes gets a timeout row; ending later adds no row", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    let open!: ReadableStreamDefaultController<never>;
    let requested = false;
    const model = wrapped(
      new MockLanguageModelV4({
        doStream: async () => {
          requested = true;
          return { stream: new ReadableStream<never>({ start: (c) => { open = c; } }) };
        },
      }),
      { job: "character", action: "lik", provider: "anthropic", model: "claude-haiku-5-5" },
    );
    const scope = new UsageScope();
    const result = runInScope(scope, () => streamText({ model, prompt: "x", maxRetries: 0, onError: () => {} }));
    void result.consumeStream();
    await vi.waitFor(() => expect(requested).toBe(true));
    await scope.close(true);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ ok: false, error: "timeout", action: "lik", fallbackUsed: true, inputTokens: null });
    open.close();
    await vi.waitFor(() => expect(lateLines(info)).toHaveLength(1));
    expect(records).toHaveLength(1);
  });

  it("a comparison that throws (circular value) never replaces a good result with the fallback", async () => {
    const good: { self?: unknown } = {};
    good.self = good; // JSON.stringify throws on this
    await expect(withAi(async () => good, { self: "rezerva" })).resolves.toBe(good);
  });

  it("an action that never calls a model records nothing", async () => {
    await withAi(async () => "bez poziva", "rezerva");
    expect(records).toHaveLength(0);
  });
});

describe("emitUsage: log line", () => {
  it("prints one parseable [ai-usage] JSON line per call", async () => {
    setUsageSink(null);
    vi.stubEnv("DATABASE_URL", "");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const r = buildRecord({ meta, usage, durationMs: 5, ok: true, ctx: { worldId: WORLD }, now: new Date("2026-10-26T10:00:00Z") });
    await emitUsage([r, { ...r, action: "lik" }]);
    expect(info).toHaveBeenCalledTimes(2);
    const line = String(info.mock.calls[0][0]);
    expect(line.startsWith("[ai-usage] ")).toBe(true);
    expect(JSON.parse(line.slice("[ai-usage] ".length))).toMatchObject({
      createdAt: "2026-10-26T10:00:00.000Z", job: "judge", action: "sudac", provider: "anthropic", worldId: WORLD, ok: true,
    });
    expect(logLine(r)).toBe(line);
  });
});

describe("persistUsage", () => {
  const one = () => [buildRecord({ meta, usage, durationMs: 5, ok: true })];

  it("skips silently without DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const insert = vi.fn(async () => {});
    await persistUsage(one(), { insert, schedule: (task) => void task() });
    expect(insert).not.toHaveBeenCalled();
  });

  it("inside a request the insert is handed to after() and not awaited", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://test");
    const insert = vi.fn(async () => {});
    let scheduled: (() => Promise<void>) | undefined;
    await persistUsage(one(), { insert, schedule: (task) => { scheduled = task; } });
    expect(insert).not.toHaveBeenCalled(); // runs after the response
    await scheduled!();
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("outside a request (after() throws) the insert is awaited", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://test");
    const insert = vi.fn(async () => {});
    await persistUsage(one(), { insert, schedule: () => { throw new Error("`after` was called outside a request scope"); } });
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("a hung database does not hold the caller longer than the timeout", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://test");
    const insert = () => new Promise<void>(() => {});
    const started = Date.now();
    await persistUsage(one(), { insert, schedule: () => { throw new Error("outside"); }, timeoutMs: 30 });
    expect(Date.now() - started).toBeLessThan(500);
  });

  it("a missing table is silent and pauses further attempts", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://test");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const insert = vi.fn(async () => { throw Object.assign(new Error("Failed query"), { cause: { code: "42P01" } }); });
    const run = { insert, schedule: (task: () => Promise<void>) => void task() };
    await persistUsage(one(), run);
    await persistUsage(one(), run);
    expect(warn).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("any other error is one console.warn with the code and no message", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://test");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const insert = async () => { throw Object.assign(new Error("duplicate key value violates ... secret row"), { name: "NeonDbError", statusCode: undefined }); };
    await persistUsage(one(), { insert, schedule: (task) => void task() });
    await vi.waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(String(warn.mock.calls[0][0])).toBe("[ai-usage] insert failed (NeonDbError)");
  });

  it("isMissingTable reads the code, the message and nested causes", () => {
    expect(isMissingTable({ code: "42P01" })).toBe(true);
    expect(isMissingTable(new Error('relation "ai_calls" does not exist'))).toBe(true);
    expect(isMissingTable({ message: "Failed query", cause: { cause: { code: "42P01" } } })).toBe(true);
    expect(isMissingTable({ code: "23505" })).toBe(false);
    expect(isMissingTable(null)).toBe(false);
  });
});

describe("toRow", () => {
  it("writes numeric columns as fixed-point strings and keeps nulls", () => {
    const r = buildRecord({ meta, usage, durationMs: 5, ok: true });
    const row = toRow(r);
    expect(row.costUsd).toMatch(/^\d+\.\d{8}$/);
    expect(Number(row.costUsd)).toBeCloseTo(r.costUsd!, 8);
    const failed = toRow(buildRecord({ meta, durationMs: 5, ok: false, error: "cancelled" }));
    expect(failed).toMatchObject({ costUsd: null, listCostUsd: null, inputTokens: null, error: "cancelled", ok: false });
  });
});
