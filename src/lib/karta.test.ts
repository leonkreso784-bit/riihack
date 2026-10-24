import { describe, expect, it } from "vitest";
import { bonitet, fmtDec, growth, hotelPositions, placeLatLng, rank, reviewsCount, score, simId, word } from "./karta";

describe("ocjena gostiju", () => {
  it("score = 5 + reviews / 20", () => {
    expect(score(0)).toBe(5);
    expect(score(78)).toBe(8.9);
    expect(score(100)).toBe(10);
    expect(fmtDec(score(78))).toBe("8,9");
  });
  it("riječi po pragovima", () => {
    expect(word(9)).toBe("Izvanredno");
    expect(word(8.9)).toBe("Vrlo dobro");
    expect(word(8)).toBe("Vrlo dobro");
    expect(word(7)).toBe("Dobro");
    expect(word(6.9)).toBe("Prihvatljivo");
  });
  it("broj recenzija = 15 % noćenja", () => {
    expect(reviewsCount(340)).toBe(51);
  });
});

describe("bonitet", () => {
  it("blokada je uvijek D", () => {
    expect(bonitet(-1, 20000, 5000)).toMatchObject({ grade: "D", tone: "down" });
  });
  it("pragovi A+, A, B, C", () => {
    expect(bonitet(24000, 20000, 1)).toMatchObject({ grade: "A+" });
    expect(bonitet(23999, 20000, 1)).toMatchObject({ grade: "A" });
    expect(bonitet(20000, 20000, 1)).toMatchObject({ grade: "A" });
    expect(bonitet(19999, 20000, 1)).toMatchObject({ grade: "B" });
    expect(bonitet(30000, 20000, 0)).toMatchObject({ grade: "C" });
  });
  it("bez zatvorenog mjeseca nema ocjene", () => {
    expect(bonitet(20000, 20000, null).grade).toBe("–");
  });
});

describe("rast i rang", () => {
  it("rast zaokružen, null bez dva mjeseca", () => {
    expect(growth([{ revenue: 15800 }, { revenue: 18900 }])).toBe(20);
    expect(growth([{ revenue: 10000 }, { revenue: 9000 }])).toBe(-10);
    expect(growth([{ revenue: 1 }])).toBeNull();
    expect(growth([{ revenue: 0 }, { revenue: 5 }])).toBeNull();
  });
  it("rang po prihodu zadnjeg mjeseca", () => {
    const ps = [
      { id: "a", months: [{ revenue: 100 }] },
      { id: "b", months: [{ revenue: 300 }] },
      { id: "c", months: [] },
    ];
    expect(rank("b", ps)).toBe(1);
    expect(rank("a", ps)).toBe(2);
    expect(rank("c", ps)).toBe(3);
  });
});

describe("položaji i id", () => {
  it("nepoznato mjesto je Rijeka, Omišalj, Krk prepoznat", () => {
    expect(placeLatLng("Nigdje")).toEqual(placeLatLng("Rijeka"));
    expect(placeLatLng("Omišalj, Krk")).toEqual([45.211, 14.553]);
  });
  it("više hotela u istom mjestu ide u krug, sam ostaje na točki", () => {
    const pos = hotelPositions([
      { companyId: "x", place: "Rab" },
      { companyId: "y", place: "Rab" },
      { companyId: "z", place: "Opatija" },
    ]);
    expect(pos.z).toEqual(placeLatLng("Opatija"));
    expect(pos.x).not.toEqual(pos.y);
  });
  it("SIM id", () => {
    expect(simId(0)).toBe("SIM-0001");
    expect(simId(11)).toBe("SIM-0012");
  });
});
