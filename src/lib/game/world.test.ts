import { describe, expect, it } from "vitest";
import { HttpError } from "@/lib/http";
import { isStaleRoundRequest, parseFromRound } from "./world";

describe("dvoklik na zatvaranje mjeseca", () => {
  it("parseFromRound: bez polja undefined, cijeli broj 1+ prolazi, ostalo 400", () => {
    expect(parseFromRound(undefined)).toBeUndefined();
    expect(parseFromRound(null)).toBeUndefined();
    expect(parseFromRound(2)).toBe(2);
    expect(() => parseFromRound(0)).toThrow(HttpError);
    expect(() => parseFromRound(1.5)).toThrow(HttpError);
    expect(() => parseFromRound("2")).toThrow(HttpError);
  });

  it("isStaleRoundRequest: mjesec je već zatvoren kad se krug igre razlikuje od fromRound", () => {
    expect(isStaleRoundRequest({ round: 3 }, 2)).toBe(true); // drugi klik stigao nakon prvog
    expect(isStaleRoundRequest({ round: 2 }, 2)).toBe(false);
    expect(isStaleRoundRequest({ round: 4 }, undefined)).toBe(false); // stari klijent bez fromRound
  });
});
