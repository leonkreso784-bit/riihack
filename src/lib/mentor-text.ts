// Mentor's text of a month: the automatic review (written once the month is settled) and, after the student's
// reflection, the debrief appended below it. One column (round_reports.mentor_text), paragraphs split by a blank line.

export const MENTOR_SEPARATOR = "\n\n";

/** A review is always the first paragraph; a debrief alone never has a blank line, so the separator marks a review. */
export function hasReview(mentorText: string | null | undefined, hasReflection: boolean): boolean {
  const text = mentorText?.trim();
  if (!text) return false;
  return hasReflection ? text.includes(MENTOR_SEPARATOR) : true;
}

/**
 * The review is written only when the month's numbers are final (the professor closed it or the game ended) and
 * there is no review yet: either no text at all, or only the debrief of a reflection sent before the month was closed.
 */
export function reviewDue(
  world: { round: number; settledRound: number; status: string },
  round: number,
  mentorText: string | null | undefined,
  hasReflection = false,
): boolean {
  if (hasReview(mentorText, hasReflection)) return false;
  return world.status === "finished" || world.settledRound >= round || world.round > round;
}

/** A debrief is one block: inner blank lines would read as the review separator. */
const oneBlock = (text: string) => text.trim().replace(/\n\s*\n+/g, "\n");

/** Appends the debrief below an existing review; never overwrites it. */
export function appendDebrief(current: string | null | undefined, debrief: string): string {
  const review = current?.trim();
  return review ? `${review}${MENTOR_SEPARATOR}${oneBlock(debrief)}` : oneBlock(debrief);
}

/** Puts the review first; an earlier debrief (reflection before the month was closed) stays below it. */
export function withReview(review: string, previous: string | null | undefined): string {
  return previous?.trim() ? `${oneBlock(review)}${MENTOR_SEPARATOR}${oneBlock(previous)}` : oneBlock(review);
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
