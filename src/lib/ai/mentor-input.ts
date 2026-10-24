// S4: builds the MentorInput for a closed round from the company's situations and answers.
// Leon's getReport returns only the metrics row, so the items are assembled here.
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { answers, situations } from "@/db/schema";
import type { RoundReportRow } from "@/db/schema";
import { getSituation } from "@/content";
import { MISSED_QUALITY } from "@/lib/rules";
import type { AnswerMode, MentorInput, MentorItem, Quality } from "@/lib/types";

export async function buildMentorInput(report: RoundReportRow, hotelName: string): Promise<MentorInput> {
  const rows = await db
    .select({ situation: situations, answer: answers })
    .from(situations)
    .leftJoin(answers, eq(answers.situationId, situations.id))
    .where(and(eq(situations.companyId, report.companyId), eq(situations.round, report.round)));

  const items: MentorItem[] = rows.map(({ situation, answer }) => {
    const template = getSituation(situation.templateId);
    if (!answer) {
      return { title: template.title, mode: "none" as AnswerMode, quality: MISSED_QUALITY as Quality, criteriaMissed: template.rubric.map((c) => c.text) };
    }
    const met =
      answer.mode === "click"
        ? (template.options.find((o) => o.id === answer.optionId)?.criteria ?? [])
        : (answer.verdict?.criteriaMet ?? null);
    return {
      title: template.title,
      mode: answer.mode as AnswerMode,
      quality: answer.quality as Quality,
      answerText: answer.mode === "own" ? (answer.text ?? undefined) : answer.mode === "click" ? template.options.find((o) => o.id === answer.optionId)?.text : undefined,
      criteriaMissed: met ? template.rubric.filter((c) => !met.includes(c.id)).map((c) => c.text) : [],
    };
  });

  return { hotelName, round: report.round, items, metricsBefore: report.metricsBefore, metricsAfter: report.metricsAfter };
}
