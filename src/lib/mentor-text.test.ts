import { describe, expect, it } from "vitest";
import { appendDebrief, reviewDue, splitMentorText } from "./mentor-text";
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
});

describe("appendDebrief", () => {
  it("keeps the review and puts the debrief below it", () => {
    expect(appendDebrief("Osvrt.", "Debrief.")).toBe("Osvrt.\n\nDebrief.");
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
