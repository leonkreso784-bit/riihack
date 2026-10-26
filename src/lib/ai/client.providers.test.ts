import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateText, Output, streamText } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { z } from "zod";
import { CHARACTER_FALLBACK } from "./fallbacks";
import { streamCharacterReply } from "./character";
import { judge } from "./judge";
import { proposeSituation } from "./propose";
import type { CharacterInput, JudgeInput, SituationIdeaInput } from "@/lib/types";
import { aiEnabled, CACHE_SYSTEM, GROQ_LOW_EFFORT, LOW_EFFORT, maxOutputFor, modelFor, NO_THINKING, NON_CLAUDE_MAX_OUTPUT_TOKENS } from "./client";
import { setUsageSink, withAiContext, type AiCallRecord } from "./usage";

const AI_ENV = ["AI_PROVIDER", "AI_PROVIDER_CHARACTER", "AI_PROVIDER_JUDGE", "AI_PROVIDER_MENTOR", "AI_MODEL_CHARACTER", "AI_MODEL_JUDGE", "AI_MODEL_MENTOR", "AI_GROQ_FREE"];
let records: AiCallRecord[];

beforeEach(() => {
  for (const name of AI_ENV) vi.stubEnv(name, "");
  vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic");
  vi.stubEnv("GROQ_API_KEY", "test-groq");
  vi.stubEnv("MISTRAL_API_KEY", "test-mistral");
  records = [];
  setUsageSink((r) => records.push(...r));
});
afterEach(() => {
  setUsageSink(null);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

/** Replaces fetch, keeps the request bodies, answers every call with `response`. */
function stubFetch(response: unknown) {
  const bodies: Record<string, unknown>[] = [];
  const urls: string[] = [];
  vi.stubGlobal("fetch", async (url: string, init: { body: string }) => {
    urls.push(String(url));
    bodies.push(JSON.parse(init.body));
    return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json" } });
  });
  return { bodies, urls };
}

const claudeReply = {
  id: "msg_1", type: "message", role: "assistant", model: "claude-sonnet-5-5", stop_reason: "end_turn", stop_sequence: null,
  content: [{ type: "text", text: "{\"a\":\"x\"}" }],
  usage: { input_tokens: 5, output_tokens: 7, cache_creation_input_tokens: 3, cache_read_input_tokens: 2 },
};
const chatReply = (model: string) => ({
  id: "c1", object: "chat.completion", created: 1, model,
  choices: [{ index: 0, message: { role: "assistant", content: "{\"a\":\"x\"}" }, finish_reason: "stop" }],
  usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15, prompt_tokens_details: { cached_tokens: 4 } },
});

const providerOf = (model: ReturnType<typeof modelFor>) => String((model as unknown as { provider: string }).provider);

const call = (model: ReturnType<typeof modelFor>) =>
  generateText({
    model,
    output: Output.object({ schema: z.object({ a: z.string() }) }),
    instructions: { role: "system", content: "stabilni sustav", providerOptions: CACHE_SYSTEM },
    prompt: "pitanje",
    maxOutputTokens: 123,
    providerOptions: LOW_EFFORT,
    maxRetries: 0,
  });

describe("modelFor", () => {
  it("returns a model passed in by a test untouched and records nothing", async () => {
    const mock = new MockLanguageModelV4({});
    expect(modelFor("judge", mock, "sudac")).toBe(mock);
  });

  it("is Claude by default, with the models production runs today", () => {
    expect(modelFor("character", undefined, "lik")).toMatchObject({ modelId: "claude-haiku-5-5" });
    expect(modelFor("judge", undefined, "sudac")).toMatchObject({ modelId: "claude-sonnet-5-5" });
    expect(modelFor("mentor", undefined, "mentor-pitanje")).toMatchObject({ modelId: "claude-sonnet-5-5" });
    expect(providerOf(modelFor("judge"))).toContain("anthropic");
  });

  it("follows AI_PROVIDER and AI_MODEL_<JOB>", () => {
    vi.stubEnv("AI_PROVIDER", "groq");
    expect(modelFor("judge")).toMatchObject({ modelId: "openai/gpt-oss-120b" });
    expect(providerOf(modelFor("judge"))).toContain("groq");
    vi.stubEnv("AI_PROVIDER_MENTOR", "mistral");
    vi.stubEnv("AI_MODEL_MENTOR", "mistral-small-latest");
    expect(modelFor("mentor")).toMatchObject({ modelId: "mistral-small-latest" });
    expect(providerOf(modelFor("mentor"))).toContain("mistral");
  });
});

describe("providerOptions are scoped by provider", () => {
  it("Claude gets the cache breakpoint and the effort, as before", async () => {
    const { bodies, urls } = stubFetch(claudeReply);
    await call(modelFor("judge", undefined, "sudac"));
    expect(urls[0]).toContain("api.anthropic.com");
    const text = JSON.stringify(bodies[0]);
    expect(text).toContain("cache_control");
    expect(text).toContain("\"effort\":\"low\"");
    expect(bodies[0].max_tokens).toBe(123);
    expect(text).not.toContain("reasoning_effort");
    // and the call was recorded with the cache numbers
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ provider: "anthropic", cacheWriteTokens: 3, cachedInputTokens: 2, inputTokens: 10, outputTokens: 7, action: "sudac" });
  });

  it("Groq gets reasoning_effort and none of the Claude-only fields", async () => {
    vi.stubEnv("AI_PROVIDER", "groq");
    const { bodies, urls } = stubFetch(chatReply("openai/gpt-oss-120b"));
    await call(modelFor("judge", undefined, "sudac"));
    expect(urls[0]).toContain("api.groq.com");
    const text = JSON.stringify(bodies[0]);
    expect(bodies[0].reasoning_effort).toBe("low");
    expect(text).not.toContain("cache_control");
    expect(bodies[0]).not.toHaveProperty("output_config");
    expect(text).not.toContain("thinking");
    expect((bodies[0].response_format as { type: string }).type).toBe("json_schema");
    expect(records[0]).toMatchObject({ provider: "groq", model: "openai/gpt-oss-120b", inputTokens: 10, cachedInputTokens: 4, outputTokens: 5, ok: true });
  });

  it("Mistral gets none of the Claude-only fields either", async () => {
    vi.stubEnv("AI_PROVIDER", "mistral");
    const { bodies, urls } = stubFetch(chatReply("mistral-medium-latest"));
    await call(modelFor("judge", undefined, "sudac"));
    expect(urls[0]).toContain("api.mistral.ai");
    const text = JSON.stringify(bodies[0]);
    expect(text).not.toContain("cache_control");
    expect(text).not.toContain("thinking");
    expect(text).not.toContain("reasoning_effort");
    expect(records[0]).toMatchObject({ provider: "mistral", model: "mistral-medium-latest", ok: true });
    expect(records[0].costUsd).toBeGreaterThan(0);
  });

  it("the option sets name the right provider keys", () => {
    expect(Object.keys(CACHE_SYSTEM)).toEqual(["anthropic"]);
    expect(NO_THINKING).toEqual({ anthropic: { thinking: { type: "disabled" } }, groq: { reasoningEffort: "low" } });
    expect(LOW_EFFORT).toEqual({ anthropic: { effort: "low" }, groq: { reasoningEffort: "low" } });
    expect(GROQ_LOW_EFFORT).toEqual({ groq: { reasoningEffort: "low" } });
  });
});

// The real call sites of the two jobs that carry no Claude-only reasoning setting (judge, proposal): on Groq gpt-oss
// reasons at medium effort and the reasoning ate the 1500 token ceiling (4 of 10 live proposals died with HTTP 400).
describe("judge and proposal send low reasoning effort to Groq only", () => {
  const judgeInput: JudgeInput = {
    hotelName: "Hotel Test",
    text: "Ispričavam se i vraćam vam novac.",
    transcript: [{ role: "character", text: "Ovo je nepodnošljivo!" }],
    template: {
      id: "t1", title: "Gost traži povrat", text: "Klima ne radi.", area: "recepcija", difficulty: 2,
      character: { name: "Marko", role: "gost", personality: "ljut", goal: "povrat" },
      rubric: [{ id: "c1", text: "Ispriča se", skill: "empathy" }],
      options: [], effects: {},
    },
  };
  const ideaInput: SituationIdeaInput = {
    hotelName: "Hotel Test", place: "Opatija", stars: 4, rooms: [],
    metrics: { guests: 70, reviews: 40, staff: 60, operations: 65, finance: 55 },
  };
  const cases: [string, () => Promise<unknown>][] = [
    ["judge", () => judge(judgeInput)],
    ["proposeSituation", () => proposeSituation(ideaInput)],
  ];

  for (const [name, run] of cases) {
    it(`${name}: Groq gets reasoning_effort low and the output ceiling`, async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubEnv("AI_PROVIDER", "groq");
      const { bodies } = stubFetch(chatReply("openai/gpt-oss-120b"));
      await run(); // the stub answers with an object the schema rejects: the fallback path, the request body is what counts
      expect(bodies.length).toBeGreaterThan(0);
      for (const body of bodies) {
        expect(body.reasoning_effort).toBe("low");
        expect(body.max_tokens).toBe(NON_CLAUDE_MAX_OUTPUT_TOKENS);
        expect(JSON.stringify(body)).not.toContain("cache_control");
      }
    });

    it(`${name}: Claude gets no Groq field and no ceiling, as before`, async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const { bodies, urls } = stubFetch(claudeReply);
      await run();
      expect(urls[0]).toContain("api.anthropic.com");
      for (const body of bodies) {
        const text = JSON.stringify(body);
        expect(text).toContain("cache_control");
        expect(text).not.toContain("reasoning_effort");
        expect(text).not.toContain("groq");
        expect(text).not.toContain("thinking");
        expect(body.max_tokens).not.toBe(NON_CLAUDE_MAX_OUTPUT_TOKENS);
      }
    });

    it(`${name}: Mistral gets no reasoning field`, async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubEnv("AI_PROVIDER", "mistral");
      const { bodies } = stubFetch(chatReply("mistral-medium-latest"));
      await run();
      expect(bodies.length).toBeGreaterThan(0);
      expect(JSON.stringify(bodies[0])).not.toContain("reasoning_effort");
    });
  }
});

/** Answers with a server-sent-events body, the way the real APIs stream. */
function stubSse(events: unknown[]) {
  const body = events.map((e) => `data: ${typeof e === "string" ? e : JSON.stringify(e)}\n\n`).join("");
  vi.stubGlobal("fetch", async () => new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } }));
}

describe("streamed calls are recorded from the real provider stream formats", () => {
  it("Claude: input and cache numbers from message_start, output from message_delta", async () => {
    stubSse([
      { type: "message_start", message: { id: "m", type: "message", role: "assistant", model: "claude-haiku-5-5", content: [], stop_reason: null, usage: { input_tokens: 12, cache_creation_input_tokens: 5, cache_read_input_tokens: 30, output_tokens: 1 } } },
      { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Pa dobro." } },
      { type: "content_block_stop", index: 0 },
      { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 9 } },
      { type: "message_stop" },
    ]);
    const result = streamText({ model: modelFor("character", undefined, "lik"), prompt: "x", maxRetries: 0 });
    expect(await result.text).toBe("Pa dobro.");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      ok: true, provider: "anthropic", model: "claude-haiku-5-5", action: "lik",
      inputTokens: 47, cachedInputTokens: 30, cacheWriteTokens: 5, outputTokens: 9,
    });
    expect(records[0].costUsd).toBeCloseTo((12 * 0.1 + 30 * 0.01 + 5 * 0.125 + 9 * 0.5) / 1e6, 10);
  });

  it("Groq: usage from the closing chunk", async () => {
    vi.stubEnv("AI_PROVIDER", "groq");
    const chunk = (delta: object, finish: string | null, extra: object = {}) => ({
      id: "c", object: "chat.completion.chunk", created: 1, model: "openai/gpt-oss-120b", choices: [{ index: 0, delta, finish_reason: finish }], ...extra,
    });
    stubSse([
      chunk({ role: "assistant", content: "" }, null),
      chunk({ content: "Pa dobro." }, null),
      chunk({}, "stop", { x_groq: { usage: { prompt_tokens: 80, completion_tokens: 20, prompt_tokens_details: { cached_tokens: 16 }, completion_tokens_details: { reasoning_tokens: 12 } } } }),
      "[DONE]",
    ]);
    const result = streamText({ model: modelFor("character", undefined, "lik"), prompt: "x", maxRetries: 0 });
    expect(await result.text).toBe("Pa dobro.");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ ok: true, provider: "groq", inputTokens: 80, cachedInputTokens: 16, outputTokens: 20 });
    expect(records[0].costUsd).toBeCloseTo((64 * 0.15 + 16 * 0.075 + 20 * 0.6) / 1e6, 10);
  });

  it("Groq free tier: real cost 0, would-be cost kept", async () => {
    vi.stubEnv("AI_PROVIDER", "groq");
    vi.stubEnv("AI_GROQ_FREE", "1");
    stubFetch(chatReply("openai/gpt-oss-120b"));
    await call(modelFor("mentor", undefined, "mentor-pitanje"));
    expect(records[0].costUsd).toBe(0);
    expect(records[0].listCostUsd).toBeGreaterThan(0);
  });
});

const characterInput: CharacterInput = {
  hotelName: "Hotel Test", roomNumber: "204", transcript: [], message: "Dobar dan", pasted: false,
  template: {
    id: "t1", title: "Gost", text: "Gost u sobi {soba}.", area: "recepcija", difficulty: 2,
    character: { name: "Marko", role: "gost", personality: "ljut", goal: "povrat" }, rubric: [], options: [], effects: {},
  },
};
const WORLD = "11111111-1111-4111-8111-111111111111";
const COMPANY = "22222222-2222-4222-8222-222222222222";

describe("the character stream end to end (real modelFor path, stubbed network)", () => {
  it("records the reply with world and company and fallback_used=false", async () => {
    stubSse([
      { type: "message_start", message: { id: "m", type: "message", role: "assistant", model: "claude-haiku-5-5", content: [], stop_reason: null, usage: { input_tokens: 10, output_tokens: 1 } } },
      { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Pa dobro." } },
      { type: "content_block_stop", index: 0 },
      { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 4 } },
      { type: "message_stop" },
    ]);
    const res = withAiContext({ worldId: WORLD, companyId: COMPANY }, () => streamCharacterReply(characterInput));
    expect(await res.text()).toBe("Pa dobro.");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ action: "lik", job: "character", ok: true, fallbackUsed: false, worldId: WORLD, companyId: COMPANY, inputTokens: 10, outputTokens: 4 });
  });

  it("an API error streams the fallback line and records ok=false with fallback_used=true", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "Bad request" } }), { status: 400 }));
    const res = withAiContext({ worldId: WORLD }, () => streamCharacterReply(characterInput));
    expect(await res.text()).toBe(CHARACTER_FALLBACK);
    expect(records).toHaveLength(1); // a retryable status would be retried by the SDK, and every request is a row
    expect(records[0]).toMatchObject({ ok: false, error: "400", fallbackUsed: true, worldId: WORLD });
  });

  it("without the key of its provider no request is made and nothing is recorded", async () => {
    vi.stubEnv("AI_PROVIDER", "groq");
    vi.stubEnv("GROQ_API_KEY", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await streamCharacterReply(characterInput).text()).toBe(CHARACTER_FALLBACK);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(records).toHaveLength(0);
  });
});

describe("an HTTP 429 from Groq", () => {
  it("is recorded as ok=false with the status and rethrown, so withAi falls back", async () => {
    vi.stubEnv("AI_PROVIDER", "groq");
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ error: { message: "Rate limit reached", type: "tokens" } }), { status: 429 }));
    await expect(call(modelFor("character", undefined, "lik"))).rejects.toThrow();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ ok: false, error: "429", provider: "groq", action: "lik" });
  });
});

describe("maxOutputFor", () => {
  it("leaves Claude exactly as the call site wants it, including no cap", () => {
    expect(maxOutputFor("character", 300)).toBe(300);
    expect(maxOutputFor("judge")).toBeUndefined();
  });

  it("gives Groq and Mistral a ceiling and never raises a smaller request", () => {
    vi.stubEnv("AI_PROVIDER", "groq");
    expect(maxOutputFor("judge")).toBe(NON_CLAUDE_MAX_OUTPUT_TOKENS);
    expect(maxOutputFor("character", 300)).toBe(300);
    expect(maxOutputFor("mentor", 5000)).toBe(NON_CLAUDE_MAX_OUTPUT_TOKENS);
    vi.stubEnv("AI_PROVIDER", "mistral");
    expect(maxOutputFor("judge")).toBe(NON_CLAUDE_MAX_OUTPUT_TOKENS);
  });
});

describe("aiEnabled", () => {
  it("is true with the Anthropic key by default and false without it", () => {
    expect(aiEnabled()).toBe(true);
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(aiEnabled()).toBe(false);
    expect(aiEnabled("character")).toBe(false);
  });

  it("with Groq for everything it needs the Groq key, not the Anthropic one", () => {
    vi.stubEnv("AI_PROVIDER", "groq");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(aiEnabled()).toBe(true);
    vi.stubEnv("GROQ_API_KEY", "");
    expect(aiEnabled()).toBe(false);
  });

  it("mixed: every configured provider needs its key, or ask per job", () => {
    vi.stubEnv("AI_PROVIDER", "groq");
    vi.stubEnv("AI_PROVIDER_JUDGE", "anthropic");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(aiEnabled()).toBe(false);
    expect(aiEnabled("character")).toBe(true);
    expect(aiEnabled("judge")).toBe(false);
  });
});
