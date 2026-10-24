import { describe, expect, it } from "vitest";
import type { HotelTemplate } from "@/lib/types";
import { assignHotel } from "./assign";

const bank3 = [{ id: "h1" }, { id: "h2" }, { id: "h3" }] as HotelTemplate[];

describe("assignHotel", () => {
  it("daje prvi hotel kad nitko nije uzet", () => {
    expect(assignHotel(bank3, [])).toBe(bank3[0]);
  });

  it("daje prvi neuzeti redom banke", () => {
    expect(assignHotel(bank3, ["h1"])).toBe(bank3[1]);
  });

  it("kad su svi uzeti, bira najmanje korišten, izjednačenje redom banke", () => {
    expect(assignHotel(bank3, ["h1", "h2", "h3", "h1"])).toBe(bank3[1]);
  });
});
