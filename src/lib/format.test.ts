import { describe, expect, it } from "vitest";
import { messagesLeft } from "./format";

describe("messagesLeft", () => {
  it("uses the Croatian plural", () => {
    expect([1, 2, 4, 5, 6, 11, 12, 21, 22].map(messagesLeft)).toEqual([
      "Još 1 poruka", "Još 2 poruke", "Još 4 poruke", "Još 5 poruka", "Još 6 poruka",
      "Još 11 poruka", "Još 12 poruka", "Još 21 poruka", "Još 22 poruke",
    ]);
  });
});
