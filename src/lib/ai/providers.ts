// Which provider and model runs each AI job, decided from env. Pure: the env is passed in, so tests need no stubs.
export const AI_JOBS = ["character", "judge", "mentor"] as const;
export type AiJob = (typeof AI_JOBS)[number];

export const AI_PROVIDERS = ["anthropic", "groq", "mistral"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export type Env = Record<string, string | undefined>;

/** The env var that holds each provider's key. */
export const KEY_ENV: Record<AiProvider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  groq: "GROQ_API_KEY",
  mistral: "MISTRAL_API_KEY",
};

/** The Anthropic models production runs today. */
export const MODELS = {
  character: "claude-haiku-5-5",
  judge: "claude-sonnet-5-5",
  mentor: "claude-sonnet-5-5",
} as const;

/**
 * Default model per provider and job. Anthropic is what production runs today and must not change.
 * Groq: openai/gpt-oss-120b everywhere (strict JSON schema works). Mistral ids come from GET /v1/models (26.10.2026):
 * mistral-small-latest is Mistral Small 4 (mistral-small-2603), mistral-medium-latest is Medium 3.5 (mistral-medium-2604).
 */
export const DEFAULT_MODELS: Record<AiProvider, Record<AiJob, string>> = {
  anthropic: MODELS,
  groq: { character: "openai/gpt-oss-120b", judge: "openai/gpt-oss-120b", mentor: "openai/gpt-oss-120b" },
  mistral: { character: "mistral-small-latest", judge: "mistral-medium-latest", mentor: "mistral-medium-latest" },
};

export type JobModel = { provider: AiProvider; model: string };

const warned = new Set<string>();

function parseProvider(raw: string | undefined, name: string): AiProvider | null {
  const value = raw?.trim().toLowerCase();
  if (!value) return null;
  if ((AI_PROVIDERS as readonly string[]).includes(value)) return value as AiProvider;
  if (!warned.has(name)) {
    warned.add(name);
    // Never print the value: a key pasted into the wrong variable would end up in the logs.
    console.warn(`[ai] ${name} is not one of ${AI_PROVIDERS.join(", ")}; using the default`);
  }
  return null;
}

/** AI_PROVIDER_<JOB>, else AI_PROVIDER, else anthropic. An unknown value is ignored with one warning. */
export function providerFor(job: AiJob, env: Env = process.env): AiProvider {
  const name = `AI_PROVIDER_${job.toUpperCase()}`;
  return parseProvider(env[name], name) ?? parseProvider(env.AI_PROVIDER, "AI_PROVIDER") ?? "anthropic";
}

/** Provider and model id for a job: AI_MODEL_<JOB> overrides the provider's default model. */
export function resolveJob(job: AiJob, env: Env = process.env): JobModel {
  const provider = providerFor(job, env);
  const model = env[`AI_MODEL_${job.toUpperCase()}`]?.trim() || DEFAULT_MODELS[provider][job];
  return { provider, model };
}

/** True when the key of the provider that runs `job` exists; without `job`, when it exists for every job. */
export function keysPresent(job?: AiJob, env: Env = process.env): boolean {
  return (job ? [job] : AI_JOBS).every((j) => Boolean(env[KEY_ENV[providerFor(j, env)]]));
}
