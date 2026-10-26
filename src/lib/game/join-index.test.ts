import { describe, expect, it } from "vitest";
import { nextJoinIndex } from "./join";

describe("nextJoinIndex (#297)", () => {
  it("prvi hotel dobije 1", () => {
    expect(nextJoinIndex([])).toBe(1);
  });

  it("bez rupa: broj hotela + 1", () => {
    expect(nextJoinIndex([1, 2, 3])).toBe(4);
  });

  it("nakon uklanjanja studenta ne daje broj koji već postoji", () => {
    // hoteli 1, 2, 3; student 2 je uklonjen: ostaju 1 i 3, pa novi ne smije dobiti 3
    expect(nextJoinIndex([1, 3])).toBe(4);
    expect(nextJoinIndex([3, 1])).toBe(4);
  });
});
