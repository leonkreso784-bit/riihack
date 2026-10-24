import { describe, expect, it } from "vitest";
import { counterError, negotiate } from "./negotiate";

const agency = { pricePerNight: 70, monthlyCost: 0, nights: 60 };
const laundry = { pricePerNight: 0, monthlyCost: 1500, nights: 0 };

describe("negotiate", () => {
  it("agencija: do 15 % više → prihvaćeno po protuponudi", () => {
    expect(negotiate(agency, { pricePerNight: 80 })).toEqual({ outcome: "accepted", pricePerNight: 80, monthlyCost: 0 });
  });

  it("agencija: 15–30 % više → agencija nudi sredinu", () => {
    expect(negotiate(agency, { pricePerNight: 90 })).toEqual({ outcome: "countered", pricePerNight: 80, monthlyCost: 0 });
  });

  it("agencija: više od 30 % → odbijeno, ostaje ponuda", () => {
    expect(negotiate(agency, { pricePerNight: 95 })).toEqual({ outcome: "rejected", pricePerNight: 70, monthlyCost: 0 });
  });

  it("agencija: niža cijena (u korist agencije) → prihvaćeno odmah", () => {
    expect(negotiate(agency, { pricePerNight: 60 })).toEqual({ outcome: "accepted", pricePerNight: 60, monthlyCost: 0 });
  });

  it("granice: točno 15 % i točno 30 %", () => {
    const o = { pricePerNight: 100, monthlyCost: 0, nights: 30 };
    expect(negotiate(o, { pricePerNight: 115 }).outcome).toBe("accepted");
    expect(negotiate(o, { pricePerNight: 116 }).outcome).toBe("countered");
    expect(negotiate(o, { pricePerNight: 130 })).toEqual({ outcome: "countered", pricePerNight: 115, monthlyCost: 0 });
    expect(negotiate(o, { pricePerNight: 131 }).outcome).toBe("rejected");
  });

  it("dobavljač: do 15 % manje → prihvaćeno", () => {
    expect(negotiate(laundry, { monthlyCost: 1300 })).toEqual({ outcome: "accepted", pricePerNight: 0, monthlyCost: 1300 });
  });

  it("dobavljač: 15–30 % manje → sredina", () => {
    expect(negotiate(laundry, { monthlyCost: 1100 })).toEqual({ outcome: "countered", pricePerNight: 0, monthlyCost: 1300 });
  });

  it("dobavljač: više od 30 % manje → odbijeno; više od ponude → prihvaćeno", () => {
    expect(negotiate(laundry, { monthlyCost: 1000 }).outcome).toBe("rejected");
    expect(negotiate(laundry, { monthlyCost: 1600 })).toEqual({ outcome: "accepted", pricePerNight: 0, monthlyCost: 1600 });
  });

  it("ugovor s noćenjima i naknadom: odlučuje polje koje je zadano, drugo ostaje", () => {
    const both = { pricePerNight: 70, monthlyCost: 1000, nights: 40 };
    expect(negotiate(both, { pricePerNight: 90 })).toEqual({ outcome: "countered", pricePerNight: 80, monthlyCost: 1000 });
    expect(negotiate(both, { monthlyCost: 900 })).toEqual({ outcome: "accepted", pricePerNight: 70, monthlyCost: 900 });
  });
});

describe("counterError", () => {
  it("ispravna protuponuda → null", () => {
    expect(counterError(agency, { pricePerNight: 80 })).toBeNull();
    expect(counterError(laundry, { monthlyCost: 1300, message: "Molim nižu cijenu" })).toBeNull();
  });

  it("točno jedno polje, cijeli broj, polje koje ponuda ima", () => {
    expect(counterError(agency, {})).not.toBeNull();
    expect(counterError(agency, { pricePerNight: 80, monthlyCost: 10 })).not.toBeNull();
    expect(counterError(agency, { monthlyCost: 10 })).not.toBeNull();
    expect(counterError(laundry, { pricePerNight: 10 })).not.toBeNull();
    expect(counterError(agency, { pricePerNight: 80.5 })).not.toBeNull();
    expect(counterError(agency, { pricePerNight: 0 })).not.toBeNull();
    expect(counterError(agency, { pricePerNight: "80" as unknown as number })).not.toBeNull();
    expect(counterError(agency, { pricePerNight: 80, message: "x".repeat(1001) })).not.toBeNull();
  });

  it("ista cijena kao ponuda je ispravna (prihvaćeno po ponudi)", () => {
    expect(counterError(agency, { pricePerNight: 70 })).toBeNull();
    expect(negotiate(agency, { pricePerNight: 70 }).outcome).toBe("accepted");
  });
});
