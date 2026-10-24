import { describe, expect, it } from "vitest";
import { MAX_ROUNDS, ROUND_LABELS, SEASON_DEMAND_BP } from "@/lib/rules";

describe("rules", () => {
  it("has a four-month season", () => {
    expect(MAX_ROUNDS).toBe(4);
    expect(ROUND_LABELS).toHaveLength(MAX_ROUNDS);
    expect(SEASON_DEMAND_BP).toHaveLength(MAX_ROUNDS);
  });
});
