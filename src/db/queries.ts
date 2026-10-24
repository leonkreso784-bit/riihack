// Zajednički upiti. Atomičnost: neon-http nema transakcija, pa jedna SQL naredba po operaciji.
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "./index";
import { events, roundReports, situations } from "./schema";
import type { RoundReportRow } from "./schema";
import type { ChatTurn } from "@/lib/types";

/** Atomično dopisuje poruke u transkript (jedan UPDATE, bez čitanja prije pisanja). */
export async function appendTranscript(
  situationId: string,
  turns: ChatTurn[],
): Promise<void> {
  if (turns.length === 0) return;
  await db
    .update(situations)
    .set({
      transcript: sql`${situations.transcript} || ${JSON.stringify(turns)}::jsonb`,
    })
    .where(eq(situations.id, situationId));
}

export async function getReport(
  companyId: string,
  round: number,
): Promise<RoundReportRow | null> {
  const rows = await db
    .select()
    .from(roundReports)
    .where(and(eq(roundReports.companyId, companyId), eq(roundReports.round, round)))
    .limit(1);
  return rows[0] ?? null;
}

export async function saveReflection(
  companyId: string,
  round: number,
  reflection: string,
  mentorText: string,
): Promise<void> {
  await db
    .update(roundReports)
    .set({ reflection, mentorText })
    .where(and(eq(roundReports.companyId, companyId), eq(roundReports.round, round)));
}

/** Piše pitanje samo ako ga još nema (WHERE mentor_question IS NULL). */
export async function saveMentorQuestion(
  companyId: string,
  round: number,
  question: string,
): Promise<void> {
  await db
    .update(roundReports)
    .set({ mentorQuestion: question })
    .where(
      and(
        eq(roundReports.companyId, companyId),
        eq(roundReports.round, round),
        isNull(roundReports.mentorQuestion),
      ),
    );
}

export async function logEvent(e: {
  worldId: string;
  companyId?: string;
  round: number;
  type: string;
  payload: unknown;
}): Promise<void> {
  await db.insert(events).values({
    worldId: e.worldId,
    companyId: e.companyId ?? null,
    round: e.round,
    type: e.type,
    payload: e.payload,
  });
}
