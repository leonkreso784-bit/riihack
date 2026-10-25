// S4: the round report with the mentor's question; the question is generated on first read and saved.
// Once the month is settled the mentor also writes its own review (mentorText) on the first read, without being asked.
import { getReport, saveMentorQuestion, saveMentorReview } from "@/db/queries";
import { mentorQuestion, mentorReview } from "@/lib/ai";
import { buildMentorInput } from "@/lib/ai/mentor-input";
import { HttpError, route } from "@/lib/http";
import { reviewDue } from "@/lib/mentor-text";
import { requirePlayer } from "@/lib/session";
import type { RoundReportView } from "@/lib/types";

export const GET = route(async (_req, ctx): Promise<RoundReportView> => {
  const { company, world } = await requirePlayer();
  const round = Number((await ctx.params).round);
  const report = Number.isInteger(round) && round > 0 ? await getReport(company.id, round) : null;
  if (!report) {
    // Kasni ulaz: tvrtka ulazi s closedRound = tekući krug − 1 i nema izvještaje za mjesece prije ulaska.
    const beforeJoin = Number.isInteger(round) && round > 0 && round <= company.closedRound;
    throw new HttpError(404, beforeJoin ? "U tom mjesecu još nisi bio u igri" : "Krug nije zatvoren");
  }

  let question = report.mentorQuestion ?? undefined;
  let mentorText = report.mentorText ?? undefined;
  const needsReview = reviewDue(world, round, report.mentorText);
  if (!question || needsReview) {
    const input = await buildMentorInput(report, company.name);
    if (!question) {
      question = await mentorQuestion(input);
      await saveMentorQuestion(company.id, round, question); // writes only while still null; the first save wins
      question = (await getReport(company.id, round))?.mentorQuestion ?? question;
    }
    // Before settlement the numbers are provisional (#226/#271), so the review waits for the professor to close the month.
    if (needsReview) await saveMentorReview(company.id, round, await mentorReview({ ...input, question }));
    const saved = await getReport(company.id, round);
    question = saved?.mentorQuestion ?? question;
    mentorText = saved?.mentorText ?? mentorText;
  }
  return {
    round,
    metricsBefore: report.metricsBefore,
    metricsAfter: report.metricsAfter,
    mentorQuestion: question,
    reflection: report.reflection ?? undefined,
    mentorText,
  };
});
