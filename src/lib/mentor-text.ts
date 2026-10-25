// Mentor's text of a month: the automatic review (written once the month is settled) and, after the student's
// reflection, the debrief appended below it. One column (round_reports.mentor_text), paragraphs split by a blank line.

export const MENTOR_SEPARATOR = "\n\n";

/** The review is written only when the month's numbers are final: the professor closed it or the game ended. */
export function reviewDue(
  world: { round: number; settledRound: number; status: string },
  round: number,
  mentorText: string | null | undefined,
): boolean {
  if (mentorText) return false;
  return world.status === "finished" || world.settledRound >= round || world.round > round;
}

/** Appends the debrief below an existing review; never overwrites it. */
export function appendDebrief(current: string | null | undefined, debrief: string): string {
  const review = current?.trim();
  return review ? `${review}${MENTOR_SEPARATOR}${debrief}` : debrief;
}

/**
 * Splits mentorText for the UI. Both the review and the debrief are single paragraphs, so:
 * no reflection yet → the whole text is the review; reflection with a blank line → review + debrief;
 * reflection without one → only a debrief (the student answered before the month was settled).
 */
export function splitMentorText(
  mentorText: string | undefined,
  hasReflection: boolean,
): { review?: string; debrief?: string } {
  const text = mentorText?.trim();
  if (!text) return {};
  if (!hasReflection) return { review: text };
  const at = text.indexOf(MENTOR_SEPARATOR);
  if (at < 0) return { debrief: text };
  return { review: text.slice(0, at).trim(), debrief: text.slice(at).trim() };
}
