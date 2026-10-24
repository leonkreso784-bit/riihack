// Public AI API for the game (plan S1). Leon and Rino call these; until S2-S4 land they return the fallbacks.
import type { LanguageModel } from "ai";
import type { MentorInput } from "@/lib/types";
import { fallbackDebrief, fallbackMentorQuestion } from "./fallbacks";

export { judge } from "./judge";
export { streamCharacterReply } from "./character";
export { aiEnabled, MODELS, withAi } from "./client";
export { CHARACTER_FALLBACK, fallbackDebrief, fallbackMentorQuestion } from "./fallbacks";

export async function mentorQuestion(input: MentorInput, _model?: LanguageModel): Promise<string> {
  return fallbackMentorQuestion(input); // S4
}

export async function mentorDebrief(
  input: MentorInput & { question: string; reflection: string },
  _model?: LanguageModel,
): Promise<string> {
  return fallbackDebrief(input); // S4
}
