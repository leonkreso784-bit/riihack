import { describe, expect, it } from "vitest";
import type { JoinRequest } from "@/lib/types";
import { validateJoin, validateOwnAnswer } from "./validate";

describe("validateJoin", () => {
  it("odbija prekratko ime", () => {
    expect(validateJoin({ joinCode: "KVRN26", name: "A", hotelName: "Vila" })).toBe("Ime mora imati od 2 do 40 znakova");
  });
  it("odbija neispravno ime hotela", () => {
    expect(validateJoin({ joinCode: "KVRN26", name: "Ana", hotelName: "V" })).toBe("Ime hotela mora imati od 2 do 40 znakova");
  });
  it("prihvaća ispravan unos", () => {
    expect(validateJoin({ joinCode: "KVRN26", name: "Ana", hotelName: "Vila" })).toBeNull();
    expect(validateJoin({ joinCode: "KVRN26", name: null, hotelName: "Vila" } as unknown as JoinRequest)).toBe("Ime mora imati od 2 do 40 znakova");
  });
});

describe("validateOwnAnswer", () => {
  it("odbija prekratak odgovor", () => {
    expect(validateOwnAnswer("kratko")).toBe("Napiši barem jednu rečenicu (najmanje 20 znakova)");
  });
  it("odbija predug odgovor", () => {
    expect(validateOwnAnswer("a".repeat(2001))).toBe("Odgovor je predug (najviše 2000 znakova)");
  });
  it("prihvaća ispravan odgovor", () => {
    expect(validateOwnAnswer("a".repeat(40))).toBeNull();
  });
});
