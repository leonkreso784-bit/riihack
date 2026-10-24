import { describe, expect, it } from "vitest";
import { messagesLeft, unreadLabel } from "./format";

describe("unreadLabel", () => {
  it("uses the Croatian plural", () => {
    expect([1, 2, 4, 5, 11, 12, 21, 22].map(unreadLabel)).toEqual([
      "1 nepročitana", "2 nepročitane", "4 nepročitane", "5 nepročitanih", "11 nepročitanih", "12 nepročitanih", "21 nepročitana", "22 nepročitane",
    ]);
  });
});

describe("messagesLeft", () => {
  it("uses the Croatian plural", () => {
    expect([1, 2, 4, 5, 6, 11, 12, 21, 22].map(messagesLeft)).toEqual([
      "Još 1 poruka", "Još 2 poruke", "Još 4 poruke", "Još 5 poruka", "Još 6 poruka",
      "Još 11 poruka", "Još 12 poruka", "Još 21 poruka", "Još 22 poruke",
    ]);
  });
});
