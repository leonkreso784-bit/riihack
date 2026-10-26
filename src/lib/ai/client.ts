// AI client: providers, models and the safety net every AI call goes through.
// Defaults are Claude exactly as before; AI_PROVIDER / AI_PROVIDER_<JOB> / AI_MODEL_<JOB> switch a job to Groq or Mistral.
import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";
import { mistral } from "@ai-sdk/mistral";
import { wrapLanguageModel, type JSONValue, type LanguageModel } from "ai";
import { keysPresent, MODELS, resolveJob, type AiJob, type AiProvider } from "./providers";
import { runInScope, UsageScope, usageMiddleware } from "./usage";

export { MODELS };
export type { AiJob };

export const AI_TIMEOUT_MS = 20_000;

/**
 * True when the server can run AI. With a `job`, when the key of the provider that job uses exists; without, when the
 * key exists for every job. Without a key every function returns its fallback.
 */
export function aiEnabled(job?: AiJob): boolean {
  return keysPresent(job);
}

function providerModel(provider: AiProvider, id: string): Exclude<LanguageModel, string> {
  switch (provider) {
    case "groq":
      return groq(id);
    case "mistral":
      return mistral(id);
    default:
      return anthropic(id);
  }
}

/**
 * The model for a job, wrapped so every request is recorded in the usage log (see usage.ts). `action` names the
 * calling function ("lik", "sudac", "mentor-pitanje", ...). A model passed in by a test is returned as is, unrecorded.
 */
export function modelFor(job: AiJob, override?: LanguageModel, action: string = job): LanguageModel {
  if (override) return override;
  const { provider, model } = resolveJob(job);
  return wrapLanguageModel({
    model: providerModel(provider, model),
    middleware: usageMiddleware({ job, action, provider, model }),
  });
}

// providerOptions are looked up by provider name, so a provider ignores the entries of the others: the Claude-only
// entries below cost nothing on Groq and Mistral. Groq's gpt-oss reasons by default, so it gets the low effort too.
type ProviderOptions = Record<string, Record<string, JSONValue>>;
/** Cache breakpoint on the stable system prompt (Claude). */
export const CACHE_SYSTEM: ProviderOptions = { anthropic: { cacheControl: { type: "ephemeral" } } };
/** Short text that needs no reasoning (Haiku thinking ate the whole token budget, audit 24.10.). */
export const NO_THINKING: ProviderOptions = { anthropic: { thinking: { type: "disabled" } }, groq: { reasoningEffort: "low" } };
/** Explaining given facts needs little reasoning; Sonnet 5.5 cannot turn thinking off, so low effort. */
export const LOW_EFFORT: ProviderOptions = { anthropic: { effort: "low" }, groq: { reasoningEffort: "low" } };
/**
 * Groq only, for calls whose Claude request must stay exactly as it was (judge, proposal). gpt-oss reasons at medium
 * effort by default and the reasoning counts against the output cap: 4 of 10 live proposals died with 400
 * json_validate_failed at 1500 tokens. Low effort used 590 to 700.
 */
export const GROQ_LOW_EFFORT: ProviderOptions = { groq: { reasoningEffort: "low" } };

/**
 * Output cap per call. Claude keeps exactly what each call site asks for (maybe nothing). Groq's free tier allows
 * only 8000 tokens per minute and Mistral has no such need, but both get a ceiling so one runaway reply cannot eat the minute.
 */
export const NON_CLAUDE_MAX_OUTPUT_TOKENS = 1500;
export function maxOutputFor(job: AiJob, wanted?: number): number | undefined {
  if (resolveJob(job).provider === "anthropic") return wanted;
  return Math.min(wanted ?? NON_CLAUDE_MAX_OUTPUT_TOKENS, NON_CLAUDE_MAX_OUTPUT_TOKENS);
}

const sameValue = (a: unknown, b: unknown) => Object.is(a, b) || (typeof a === "object" && a !== null && JSON.stringify(a) === JSON.stringify(b));

/**
 * Runs an AI call with a 20 s deadline. Any error or timeout returns `fallback`, so the game never stops.
 * Also the unit of the usage log: calls made inside `fn` are recorded with `fallbackUsed` set when the action
 * ended with the fallback (error, timeout, or `fn` returning the fallback itself).
 */
export async function withAi<T>(fn: () => Promise<T>, fallback: T, timeoutMs: number = AI_TIMEOUT_MS): Promise<T> {
  const scope = new UsageScope();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`AI timeout after ${timeoutMs} ms`)), timeoutMs);
  });
  let fellBack = true;
  try {
    const value = await Promise.race([runInScope(scope, fn), deadline]);
    // Only the log depends on this: a comparison that throws must never replace a good result with the fallback.
    try {
      fellBack = sameValue(value, fallback);
    } catch {
      fellBack = false;
    }
    return value;
  } catch (error) {
    console.error("[ai]", error instanceof Error ? error.message : error);
    return fallback;
  } finally {
    clearTimeout(timer);
    await scope.close(fellBack).catch(() => {});
  }
}
