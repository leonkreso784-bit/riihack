import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MODELS, keysPresent, MODELS, providerFor, resolveJob } from "./providers";

afterEach(() => vi.restoreAllMocks());

describe("resolveJob", () => {
  it("defaults to Claude with the models production runs today", () => {
    expect(resolveJob("character", {})).toEqual({ provider: "anthropic", model: "claude-haiku-5-5" });
    expect(resolveJob("judge", {})).toEqual({ provider: "anthropic", model: "claude-sonnet-5-5" });
    expect(resolveJob("mentor", {})).toEqual({ provider: "anthropic", model: "claude-sonnet-5-5" });
    expect(DEFAULT_MODELS.anthropic).toBe(MODELS);
  });

  it("AI_PROVIDER switches every job; Groq uses gpt-oss-120b everywhere", () => {
    for (const job of ["character", "judge", "mentor"] as const) {
      expect(resolveJob(job, { AI_PROVIDER: "groq" })).toEqual({ provider: "groq", model: "openai/gpt-oss-120b" });
    }
  });

  it("Mistral: small for the character, medium for judge and mentor", () => {
    const env = { AI_PROVIDER: "mistral" };
    expect(resolveJob("character", env).model).toBe("mistral-small-latest");
    expect(resolveJob("judge", env).model).toBe("mistral-medium-latest");
    expect(resolveJob("mentor", env).model).toBe("mistral-medium-latest");
  });

  it("AI_PROVIDER_<JOB> beats AI_PROVIDER for that job only", () => {
    const env = { AI_PROVIDER: "groq", AI_PROVIDER_JUDGE: "anthropic" };
    expect(providerFor("judge", env)).toBe("anthropic");
    expect(providerFor("character", env)).toBe("groq");
    expect(providerFor("mentor", env)).toBe("groq");
    expect(resolveJob("judge", env).model).toBe("claude-sonnet-5-5");
  });

  it("AI_MODEL_<JOB> overrides the provider's default model", () => {
    const env = { AI_PROVIDER: "mistral", AI_MODEL_JUDGE: "mistral-small-2603", AI_MODEL_MENTOR: "  " };
    expect(resolveJob("judge", env)).toEqual({ provider: "mistral", model: "mistral-small-2603" });
    expect(resolveJob("mentor", env).model).toBe("mistral-medium-latest"); // blank is ignored
  });

  it("ignores case and spaces in the provider name", () => {
    expect(providerFor("mentor", { AI_PROVIDER: "  GROQ " })).toBe("groq");
  });

  it("an unknown provider falls back to the default with one warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const env = { AI_PROVIDER: "openai-typo" };
    expect(providerFor("character", env)).toBe("anthropic");
    expect(providerFor("judge", env)).toBe("anthropic");
    expect(providerFor("mentor", env)).toBe("anthropic");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("the warning names the variable and never prints its value (it might be a pasted key)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    providerFor("character", { AI_PROVIDER_CHARACTER: "not-a-provider-SECRET-VALUE" });
    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0][0]);
    expect(message).toContain("AI_PROVIDER_CHARACTER");
    expect(message).not.toContain("not-a-provider-SECRET-VALUE");
  });
});

describe("keysPresent", () => {
  it("needs the Anthropic key by default, as before", () => {
    expect(keysPresent(undefined, {})).toBe(false);
    expect(keysPresent("judge", { ANTHROPIC_API_KEY: "k" })).toBe(true);
    expect(keysPresent(undefined, { ANTHROPIC_API_KEY: "k" })).toBe(true);
  });

  it("needs the key of every provider used when asked for all jobs", () => {
    const env = { AI_PROVIDER: "groq", AI_PROVIDER_JUDGE: "anthropic", GROQ_API_KEY: "g" };
    expect(keysPresent(undefined, env)).toBe(false); // judge runs on Claude, no Anthropic key
    expect(keysPresent(undefined, { ...env, ANTHROPIC_API_KEY: "a" })).toBe(true);
  });

  it("per job: a missing key of another job's provider does not matter", () => {
    const env = { AI_PROVIDER: "groq", AI_PROVIDER_JUDGE: "anthropic", GROQ_API_KEY: "g" };
    expect(keysPresent("character", env)).toBe(true);
    expect(keysPresent("mentor", env)).toBe(true);
    expect(keysPresent("judge", env)).toBe(false);
  });

  it("an empty key counts as missing", () => {
    expect(keysPresent("character", { AI_PROVIDER: "mistral", MISTRAL_API_KEY: "" })).toBe(false);
  });
});
