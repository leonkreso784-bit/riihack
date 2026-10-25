import { describe, expect, it } from "vitest";
import { appendDebrief, hasReview, reviewDue, splitMentorText, withReview } from "./mentor-text";
import type { WorldRow } from "@/db/schema";

const world = (w: Partial<WorldRow>) => ({ round: 2, settledRound: 1, status: "running", ...w }) as WorldRow;

describe("reviewDue", () => {
  it("waits while the month is provisional", () => {
    expect(reviewDue(world({ round: 2, settledRound: 1 }), 2, null)).toBe(false);
  });
  it("writes once the professor settled the month", () => {
    expect(reviewDue(world({ round: 2, settledRound: 2 }), 2, null)).toBe(true);
    expect(reviewDue(world({ round: 3, settledRound: 1 }), 2, null)).toBe(true);
  });
  it("writes when the game is finished", () => {
    expect(reviewDue(world({ round: 2, settledRound: 1, status: "finished" }), 2, null)).toBe(true);
  });
  it("never writes over an existing text", () => {
    expect(reviewDue(world({ settledRound: 5 }), 2, "Osvrt.")).toBe(false);
  });
  it("writes when a reflection before the closing left only a debrief", () => {
    expect(reviewDue(world({ settledRound: 2 }), 2, "Debrief.", true)).toBe(true);
    expect(reviewDue(world({ settledRound: 1 }), 2, "Debrief.", true)).toBe(false);
  });
  it("does not write twice when review and debrief are both there", () => {
    expect(reviewDue(world({ settledRound: 2 }), 2, "Osvrt.\n\nDebrief.", true)).toBe(false);
  });
});

describe("hasReview", () => {
  it("without a reflection any text is the review", () => {
    expect(hasReview("Osvrt.", false)).toBe(true);
    expect(hasReview(null, false)).toBe(false);
  });
  it("with a reflection only the blank line marks a review", () => {
    expect(hasReview("Debrief.", true)).toBe(false);
    expect(hasReview("Osvrt.\n\nDebrief.", true)).toBe(true);
  });
});

describe("withReview", () => {
  it("is the review alone when there was no text", () => {
    expect(withReview("Osvrt.", null)).toBe("Osvrt.");
  });
  it("puts the review above an earlier debrief", () => {
    const text = withReview("Osvrt.", "Debrief.");
    expect(text).toBe("Osvrt.\n\nDebrief.");
    expect(splitMentorText(text, true)).toEqual({ review: "Osvrt.", debrief: "Debrief." });
  });
});

describe("appendDebrief", () => {
  it("keeps the review and puts the debrief below it", () => {
    expect(appendDebrief("Osvrt.", "Debrief.")).toBe("Osvrt.\n\nDebrief.");
  });
  it("keeps a debrief one block so it never looks like a review", () => {
    const text = appendDebrief(null, "Prvi dio.\n\nDrugi dio.");
    expect(text).toBe("Prvi dio.\nDrugi dio.");
    expect(hasReview(text, true)).toBe(false);
  });
  it("is only the debrief when there is no review", () => {
    expect(appendDebrief(null, "Debrief.")).toBe("Debrief.");
    expect(appendDebrief("  ", "Debrief.")).toBe("Debrief.");
  });
});

describe("splitMentorText", () => {
  it("is the review before a reflection", () => {
    expect(splitMentorText("Osvrt.", false)).toEqual({ review: "Osvrt." });
  });
  it("splits review and debrief after a reflection", () => {
    expect(splitMentorText(appendDebrief("Osvrt.", "Debrief."), true)).toEqual({ review: "Osvrt.", debrief: "Debrief." });
  });
  it("is only a debrief when the student answered before settlement", () => {
    expect(splitMentorText("Debrief.", true)).toEqual({ debrief: "Debrief." });
  });
  it("is empty without text", () => {
    expect(splitMentorText(undefined, true)).toEqual({});
  });
});
