import { describe, expect, it } from "vitest";
import { MAX_ROUNDS } from "@/lib/rules";

describe("rules", () => {
  it("sezona ima 4 kruga", () => {
    expect(MAX_ROUNDS).toBe(4);
  });
});
