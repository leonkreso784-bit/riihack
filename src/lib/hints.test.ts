import { describe, expect, it } from "vitest";
import { BLOCKADE_RANK_RULE, HINTS } from "./hints";

describe("pomoć uz ljestvicu (ADR-059)", () => {
  it("napredak i rang objašnjavaju da hotel u blokadi stoji iza hotela s novcem", () => {
    expect(HINTS.progress).toContain(BLOCKADE_RANK_RULE);
    expect(HINTS.rank).toContain(BLOCKADE_RANK_RULE);
    expect(BLOCKADE_RANK_RULE).toMatch(/ispod nule/);
    expect(BLOCKADE_RANK_RULE).toMatch(/bez obzira na napredak/);
  });
});
