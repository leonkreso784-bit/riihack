// S4: the round report with the mentor's question; the question is generated on first read and saved.
import { getReport, saveMentorQuestion } from "@/db/queries";
import { mentorQuestion } from "@/lib/ai";
import { buildMentorInput } from "@/lib/ai/mentor-input";
import { HttpError, route } from "@/lib/http";
import { requirePlayer } from "@/lib/session";
import type { RoundReportView } from "@/lib/types";

export const GET = route(async (_req, ctx): Promise<RoundReportView> => {
  const { company } = await requirePlayer();
  const round = Number((await ctx.params).round);
  const report = Number.isInteger(round) && round > 0 ? await getReport(company.id, round) : null;
  if (!report) throw new HttpError(404, "Krug nije zatvoren");

  let question = report.mentorQuestion ?? undefined;
  if (!question) {
    question = await mentorQuestion(await buildMentorInput(report, company.name));
    await saveMentorQuestion(company.id, round, question); // writes only while still null; the first save wins
    question = (await getReport(company.id, round))?.mentorQuestion ?? question;
  }
  return {
    round,
    metricsBefore: report.metricsBefore,
    metricsAfter: report.metricsAfter,
    mentorQuestion: question,
    reflection: report.reflection ?? undefined,
    mentorText: report.mentorText ?? undefined,
  };
});
