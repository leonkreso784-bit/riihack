import { afterEach, describe, expect, it, vi } from "vitest";
import { withAi } from "./client";
import { fallbackDebrief, fallbackMentorQuestion, MENTOR_FALLBACK_QUESTION } from "./fallbacks";
import type { MentorInput } from "@/lib/types";

const input: MentorInput = {
  hotelName: "Hotel Đurđica",
  round: 2,
  items: [],
  metricsBefore: { guests: 58, reviews: 61, staff: 48, operations: 68, finance: 53 },
  metricsAfter: { guests: 64, reviews: 58, staff: 41, operations: 70, finance: 52 },
};

describe("withAi", () => {
  afterEach(() => vi.useRealTimers());

  it("returns the fallback when the call throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(withAi(() => Promise.reject(new Error("x")), "rezerva")).resolves.toBe("rezerva");
  });

  it("returns the fallback when the call is slower than the deadline", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve("prekasno"), 60_000));
    const result = withAi(() => slow, "rezerva");
    await vi.advanceTimersByTimeAsync(20_001);
    await expect(result).resolves.toBe("rezerva");
  });

  it("returns the real value when the call succeeds", async () => {
    await expect(withAi(() => Promise.resolve("odgovor"), "rezerva")).resolves.toBe("odgovor");
  });
});

describe("fallbacks", () => {
  it("mentor question is the fixed text", () => {
    expect(fallbackMentorQuestion(input)).toBe("Koja bi odluka iz ovog kruga sljedeći put bila drukčija i zašto?");
    expect(MENTOR_FALLBACK_QUESTION).toBe(fallbackMentorQuestion(input));
  });

  it("debrief names the metric that rose most and the one that fell most", () => {
    const text = fallbackDebrief(input);
    expect(text).toContain("Najviše je porastao pokazatelj zadovoljstvo gostiju (+6/100)");
    expect(text).toContain("zaposlenici (−7/100)");
  });

  it("debrief handles a round where nothing changed", () => {
    expect(fallbackDebrief({ ...input, metricsAfter: input.metricsBefore })).toContain("nisu promijenili");
  });
});
