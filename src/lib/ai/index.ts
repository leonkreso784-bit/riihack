// Public AI API for the game (plan S1). Leon and Rino call these; until S2-S4 land they return the fallbacks.
import type { LanguageModel } from "ai";
import type { CharacterInput, JudgeInput, MentorInput, Verdict } from "@/lib/types";
import { CHARACTER_FALLBACK, fallbackDebrief, fallbackMentorQuestion } from "./fallbacks";

export { aiEnabled, MODELS, withAi } from "./client";
export { CHARACTER_FALLBACK, fallbackDebrief, fallbackMentorQuestion } from "./fallbacks";

/** Which rubric criteria the student's answer meets. `null` means "no verdict": the engine uses FALLBACK_QUALITY. */
export async function judge(_input: JudgeInput, _model?: LanguageModel): Promise<Verdict | null> {
  return null; // S2
}

/** The character's next line as a plain text stream. */
export function streamCharacterReply(_input: CharacterInput, _model?: LanguageModel): Response {
  return new Response(CHARACTER_FALLBACK, { headers: { "content-type": "text/plain; charset=utf-8" } }); // S3
}

export async function mentorQuestion(input: MentorInput, _model?: LanguageModel): Promise<string> {
  return fallbackMentorQuestion(input); // S4
}

export async function mentorDebrief(
  input: MentorInput & { question: string; reflection: string },
  _model?: LanguageModel,
): Promise<string> {
  return fallbackDebrief(input); // S4
}
