import { describe, expect, it } from "vitest";
import { messagesLeft, plural, unreadLabel } from "./format";

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

describe("plural", () => {
  it("picks 1 / 2–4 / 0 and 5+ forms", () => {
    const ugovor = (n: number) => `${n} ${plural(n, "aktivan ugovor", "aktivna ugovora", "aktivnih ugovora")}`;
    expect([0, 1, 2, 5, 11, 21, 22, 112].map(ugovor)).toEqual([
      "0 aktivnih ugovora", "1 aktivan ugovor", "2 aktivna ugovora", "5 aktivnih ugovora",
      "11 aktivnih ugovora", "21 aktivan ugovor", "22 aktivna ugovora", "112 aktivnih ugovora",
    ]);
  });
});
