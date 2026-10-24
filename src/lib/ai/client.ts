// AI client: provider, models and the safety net every AI call goes through.
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

export const MODELS = {
  character: "claude-haiku-5-5",
  judge: "claude-sonnet-5-5",
  mentor: "claude-sonnet-5-5",
} as const;

export type AiJob = keyof typeof MODELS;

export const AI_TIMEOUT_MS = 20_000;

/** True when the server has an AI key; without it every function returns its fallback. */
export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function modelFor(job: AiJob, override?: LanguageModel): LanguageModel {
  return override ?? anthropic(MODELS[job]);
}

/** Runs an AI call with a 20 s deadline. Any error or timeout returns `fallback`, so the game never stops. */
export async function withAi<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`AI timeout after ${AI_TIMEOUT_MS} ms`)), AI_TIMEOUT_MS);
  });
  try {
    return await Promise.race([fn(), deadline]);
  } catch (error) {
    console.error("[ai]", error instanceof Error ? error.message : error);
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
