// S4: the student's reflection on the mentor's question; answers with the mentor's debrief.
import { getReport, saveMentorQuestion, saveReflection } from "@/db/queries";
import { mentorDebrief, mentorQuestion, withAiContext } from "@/lib/ai";
import { buildMentorInput } from "@/lib/ai/mentor-input";
import { appendDebrief } from "@/lib/mentor-text";
import { validateOwnAnswer } from "@/lib/engine/validate";
import { HttpError, route } from "@/lib/http";
import { readJson, requirePlayer } from "@/lib/session";
import type { ReflectionRequest, RoundReportView } from "@/lib/types";

const EMPTY_REFLECTION_NOTE = "Nisi ništa napisao, pa ti kažem što vidim u brojkama.";

export const POST = route(async (req): Promise<RoundReportView> => {
  const { company } = await requirePlayer();
  const body = await readJson(req);
  const round = body.round;
  const text = body.text;
  if (typeof round !== "number" || !Number.isInteger(round) || round < 1 || typeof text !== "string") {
    throw new HttpError(400, "Neispravan zahtjev: očekujem krug i tekst");
  }
  const request: ReflectionRequest = { round, text: text.trim() };
  const invalid = validateOwnAnswer(request.text);
  if (invalid) throw new HttpError(400, invalid);

  const report = await getReport(company.id, request.round);
  if (!report) throw new HttpError(404, "Krug nije zatvoren");
  if (report.reflection !== null) throw new HttpError(409, "Na ovo si već odgovorio");

  const input = await buildMentorInput(report, company.name);
  const usage = { worldId: company.worldId, companyId: company.id }; // for the AI usage log (ai_calls)
  let question = report.mentorQuestion;
  if (!question) {
    question = await withAiContext(usage, () => mentorQuestion(input));
    await saveMentorQuestion(company.id, request.round, question);
    question = (await getReport(company.id, request.round))?.mentorQuestion ?? question;
  }
  // Bez donje granice: prazan odgovor mentor prepozna (uvodna rečenica i bez AI-ja), pa nastavi od brojki.
  const empty = request.text === "";
  const reflection = empty ? "(Student nije ništa napisao. Mentor je to već rekao, ne ponavljaj.)" : request.text;
  const debrief = await withAiContext(usage, () => mentorDebrief({ ...input, question, reflection }));
  // The automatic review (written once the month is settled) stays; the debrief goes below it. Read again, because
  // the review may have been saved while the debrief was being written.
  const current = (await getReport(company.id, request.round))?.mentorText ?? report.mentorText;
  const mentorText = appendDebrief(current, empty ? `${EMPTY_REFLECTION_NOTE} ${debrief}` : debrief);
  await saveReflection(company.id, request.round, request.text, mentorText);
  return {
    round: request.round,
    metricsBefore: report.metricsBefore,
    metricsAfter: report.metricsAfter,
    mentorQuestion: question,
    reflection: request.text,
    mentorText,
  };
});
