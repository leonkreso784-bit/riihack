import { describe, expect, it } from "vitest";
import { isInsolvent } from "./ranking";
import type { CompanyPublicView, MeResponse } from "./types";
import { BIZ_EXTRA_LOTS, BIZ_LOTS, DISTRICTS, GRID, HOTEL_H_MAX, HOTEL_H_MIN, HOTEL_HALF, TERRAIN_ROWS, LOTS, allocateLots, bonitet, businessLots, cityTier, districtOfPlace, fmtDec, growth, hotelHeight, inBlockade, profilesFromMe, publicBonitet, rank, reviewsCount, score, simId, terrainCell, visibleBusinesses, word } from "./karta";

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
  it("rang po napretku, isti napredak zadržava redoslijed ljestvice s poslužitelja (ne naziv)", () => {
    const rows = [
      { id: "a", progress: 5, hotelName: "Zora" },
      { id: "b", progress: 9, hotelName: "Maris" },
      { id: "c", progress: 5, hotelName: "Adria" },
    ];
    expect(rank("b", rows)).toBe(1);
    expect(rank("a", rows)).toBe(2);
    expect(rank("c", rows)).toBe(3);
  });
  it("blokada i insolventnost su ista definicija: račun ispod nule", () => {
    for (const cash of [-1, 0, 1, -51600, 20000]) expect(inBlockade(cash)).toBe(isInsolvent({ cash }));
    expect(inBlockade(-1)).toBe(true);
    expect(inBlockade(0)).toBe(false);
  });
  it("hotel u blokadi ne stoji iznad solventnog, ni uz veći napredak (ADR-059)", () => {
    const rows = [
      { id: "bankrot", progress: 71.7, hotelName: "Zora", insolvent: true },
      { id: "solventan", progress: 35.7, hotelName: "Maris" },
      { id: "vlastiti", progress: 10, hotelName: "Adria", cash: -5 },
    ];
    expect(rank("solventan", rows)).toBe(1);
    expect(rank("bankrot", rows)).toBe(2);
    expect(rank("vlastiti", rows)).toBe(3);
  });
});

const row = (companyId: string, place: string, progress: number, cash: number) => ({ companyId, hotelName: `Hotel ${companyId}`, playerName: `Igrač ${companyId}`, place, progress, closedRound: 1, cash, roundGain: 2 });
const me = {
  company: { id: "me", hotelName: "Moj", playerName: "Ja", place: "Rijeka", stars: 4, roomsCount: 12, startCash: 20000, cash: 25000, metrics: { guests: 70, reviews: 80, staff: 60, operations: 65, finance: 50 }, templateId: "nepoznat" },
  plan: { round: 2, price: 99, marketing: 0 },
  finances: [{ round: 1, nights: 100, contractNights: 0, capacityNights: 300, occupancyPct: 60, marketSharePct: 12, revenue: 9000, costs: 7000, profit: 2000, cashAfter: 25000 }],
  contracts: [],
  leaderboard: [],
  city: {
    businesses: [{ id: "b-adria", name: "Agencija Adria", kind: "agency", description: "" }],
    links: [{ companyId: "o1", businessId: "b-adria" }],
    hotels: [row("me", "Rijeka", 4, 25000), row("o1", "Opatija", 8, 12000), row("o2", "Rab", 1, -300)],
  },
} as unknown as MeResponse;

describe("profili: samo pravi podaci", () => {
  const ps = profilesFromMe(me);
  it("tuđi hotel nema cijenu, ocjene ni financije, ali ima stvarne podatke", () => {
    const o = ps.o1;
    expect(o.isYou).toBe(false);
    expect(o.detail).toBeNull();
    expect(o.cash).toBeNull();
    expect(o.startCash).toBeNull();
    expect(o.progress).toBe(8);
    expect(o.roundGain).toBe(2);
    expect(o.stars).toBeGreaterThan(0);
    expect(o.rooms).toBeGreaterThan(0);
    expect(o.staff).toBeGreaterThan(0);
    expect(o.partners).toEqual([{ name: "Agencija Adria", kind: "agency" }]);
  });
  it("rang po napretku s ljestvice", () => {
    expect(ps.o1.rank).toBe(1);
    expect(ps.me.rank).toBe(2);
    expect(ps.o2.rank).toBe(3);
  });
  it("tuđi hotel ne nosi novac nigdje u pogledu kartice (ADR-040)", () => {
    const pub = { companyId: "o2", hotelName: "Hotel o2", playerName: "Igrač o2", place: "Rab", stars: 3, roomsCount: 9, price: 80, reviews: 50, guests: 40, staffByDepartment: { management: 1, reception: 1, housekeeping: 1, maintenance: 1, kitchen: 1 }, contracts: [], finances: [{ round: 1, revenue: 8000, profit: -200 }] } as unknown as CompanyPublicView;
    for (const o of [ps.o2, profilesFromMe(me, { o2: pub }).o2]) {
      expect(o.cash).toBeNull();
      expect(o.startCash).toBeNull();
      expect(JSON.stringify(o)).not.toMatch(/-300|12000/);
    }
    expect(profilesFromMe(me, { o2: pub }).o2.detail?.publicFinances).toEqual([{ round: 1, revenue: 8000, profit: -200 }]);
  });
  it("tvoj hotel zadržava svoj novac", () => {
    expect(ps.me.cash).toBe(25000);
    expect(ps.me.detail?.publicFinances).toBeNull();
  });
  it("bonitet tuđeg hotela samo iz javne dobiti", () => {
    expect(publicBonitet([]).grade).toBe("–");
    expect(publicBonitet([{ round: 1, revenue: 9, profit: 5 }]).grade).toBe("A");
    expect(publicBonitet([{ round: 1, revenue: 9, profit: 5 }, { round: 2, revenue: 9, profit: 3 }]).grade).toBe("B");
    expect(publicBonitet([{ round: 1, revenue: 9, profit: 5 }, { round: 2, revenue: 9, profit: -1 }]).grade).toBe("C");
  });
  it("tvoj hotel ima puni detalj iz plana i financija", () => {
    const d = ps.me.detail!;
    expect(ps.me.isYou).toBe(true);
    expect(d.price).toBe(99);
    expect(d.share).toBe(12);
    expect(d.months).toHaveLength(1);
    expect(d.metrics!.reviews).toBe(80);
  });
  it("javni profil (L14) popunjava detalj tuđeg hotela", () => {
    const pub = { companyId: "o1", hotelName: "Hotel o1", playerName: "Igrač o1", place: "Opatija", stars: 4, roomsCount: 17, price: 120, reviews: 70, guests: 60, occupancyPct: 66, staffByDepartment: { management: 2, reception: 3, housekeeping: 0, maintenance: 1, kitchen: 2 }, contracts: [] } as unknown as CompanyPublicView;
    const withPub = profilesFromMe(me, { o1: pub });
    expect(withPub.o1.detail).toMatchObject({ price: 120, reviews: 70, guests: 60, occupancyPct: 66, months: null, publicFinances: [] });
    expect(withPub.o1.staff).toBe(8);
    expect(withPub.o1.staffByDept.housekeeping).toBeUndefined();
    expect(withPub.o2.detail).toBeNull();
  });
  it("determinističan SIM id po poretku na ljestvici", () => {
    expect(ps.me.simId).toBe("SIM-0001");
    expect(ps.o1.simId).toBe("SIM-0002");
  });
});

const PLACES = ["Rijeka", "Opatija", "Crikvenica", "Mali Lošinj", "Rab", "Omišalj, Krk", "Nigdje"];
const fakeHotels = (n: number) => Array.from({ length: n }, (_, i) => ({ companyId: `c-${String(i).padStart(2, "0")}`, place: PLACES[i % PLACES.length] }));
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const spaced = (a: number[], b: number[], m: number) => Math.abs(a[0] - b[0]) >= m || Math.abs(a[1] - b[1]) >= m;

describe("teren i okruzi", () => {
  it("mreža je GRID x GRID", () => {
    expect(TERRAIN_ROWS.length).toBe(GRID);
    for (const r of TERRAIN_ROWS) expect(r.length).toBe(GRID);
  });
  it("mjesto -> okrug", () => {
    expect(districtOfPlace("Rijeka")).toBe("luka");
    expect(districtOfPlace("Opatija")).toBe("setnica");
    expect(districtOfPlace("Crikvenica")).toBe("plaza");
    expect(districtOfPlace("Mali Lošinj")).toBe("ana");
    expect(districtOfPlace("Rab")).toBe("otok");
    expect(districtOfPlace("Omišalj, Krk")).toBe("brdo");
    expect(districtOfPlace("Nigdje")).toBe("luka");
  });
  it("kopneni okruzi imaju >= 6 parcela, otoci >= 3", () => {
    for (const d of DISTRICTS) expect(d.slots.length).toBeGreaterThanOrEqual(d.id === "ana" || d.id === "otok" ? 3 : 6);
  });
  it("sve parcele stoje na kopnu (ne na moru ni molu) i ne dodiruju se", () => {
    const all = DISTRICTS.flatMap((d) => d.slots);
    for (const [x, y] of all) {
      for (let cx = Math.floor(x - HOTEL_HALF); cx <= Math.floor(x + HOTEL_HALF); cx++)
        for (let cy = Math.floor(y - HOTEL_HALF); cy <= Math.floor(y + HOTEL_HALF); cy++) expect("sghH".includes(terrainCell(cx, cy))).toBe(true);
    }
    all.forEach((a, i) => all.slice(i + 1).forEach((b) => expect(spaced(a, b, 1.5)).toBe(true)));
  });
  it("parcele tvrtki su na kopnu i ne sudaraju se s hotelima", () => {
    const biz = [...BIZ_LOTS.map((b) => b[1]), ...BIZ_EXTRA_LOTS];
    for (const [x, y] of biz) expect("sghH".includes(terrainCell(Math.floor(x), Math.floor(y)))).toBe(true);
    for (const b of biz) for (const d of DISTRICTS) for (const s of d.slots) expect(spaced(b, s, 1.3)).toBe(true);
  });
  it("poznate tvrtke dobivaju svoju parcelu, nepoznate dodatnu", () => {
    const l = businessLots([{ id: "b-adria", name: "Agencija Adria" }, { id: "x", name: "Nešto" }]);
    expect(l["b-adria"]).toEqual(BIZ_LOTS[0][1]);
    expect(l.x).toEqual(BIZ_EXTRA_LOTS[0]);
  });
});

describe("raspored hotela", () => {
  for (const n of [1, 5, 30]) {
    it(`${n} hotela: parcele su jedinstvene i unutar karte`, () => {
      const hs = fakeHotels(n);
      const lots = allocateLots(hs);
      expect(Object.keys(lots).length).toBe(n);
      const keys = Object.values(lots).map((l) => l.slot.join());
      expect(new Set(keys).size).toBe(n);
      for (const l of Object.values(lots)) {
        expect(l.slot[0]).toBeGreaterThan(1);
        expect(l.slot[0]).toBeLessThan(GRID - 1);
        expect(l.slot[1]).toBeGreaterThan(1);
        expect(l.slot[1]).toBeLessThan(GRID - 1);
      }
    });
  }
  it("prvi hotel ide u središte, a hotel iz drugog mjesta dobiva svoj okrug tek kad je blizu", () => {
    const one = allocateLots([{ companyId: "a", place: "Opatija" }]);
    expect(one.a.index).toBe(0);
    expect(dist(one.a.slot, [8.5, 7.5])).toBeLessThan(1.5);
    const hs = fakeHotels(14).map((h) => ({ ...h, place: "Opatija" }));
    const many = allocateLots(hs);
    expect(Object.values(many).some((l) => l.district === "setnica")).toBe(true);
  });
  it("kad se okrug napuni, prelijeva se dalje, a prostora ima za barem 40 hotela", () => {
    expect(LOTS.length).toBeGreaterThanOrEqual(40);
    const many = allocateLots(Array.from({ length: 12 }, (_, i) => ({ companyId: `r${i}`, place: "Rijeka" })));
    expect(Object.values(many).filter((l) => l.district === "luka").length).toBe(DISTRICTS[0].slots.length);
  });
  for (const n of Array.from({ length: 40 }, (_, i) => i + 1)) {
    it(`${n} hotela: svaki ima svoju parcelu i nema preklapanja`, () => {
      const lots = Object.values(allocateLots(fakeHotels(n)));
      expect(new Set(lots.map((l) => l.index)).size).toBe(n);
      lots.forEach((a, i) => lots.slice(i + 1).forEach((b) => expect(spaced(a.slot, b.slot, 1.5)).toBe(true)));
    });
  }
  it("pripeti hoteli ne mijenjaju parcelu kad se pridruži novi (N -> N + 1)", () => {
    let pinned: Record<string, number> = {};
    let prev: ReturnType<typeof allocateLots> = {};
    const hs: { companyId: string; place: string }[] = [];
    for (let n = 1; n <= 40; n++) {
      // novi hotel ima id koji se razvrstava bilo gdje (i prije postojećih): najgori slučaj
      hs.push({ companyId: n % 2 ? `a-${n}` : `z-${n}`, place: PLACES[n % PLACES.length] });
      const next = allocateLots(hs, pinned);
      for (const [id, lot] of Object.entries(prev)) expect(next[id].index).toBe(lot.index);
      expect(Object.keys(next).length).toBe(n);
      pinned = Object.fromEntries(Object.entries(next).map(([id, l]) => [id, l.index]));
      prev = next;
    }
  });
  it("bez spremišta isti skup hotela daje isti raspored, neispravni pinovi se ignoriraju", () => {
    const hs = fakeHotels(10);
    expect(allocateLots(hs, { "c-00": 999, "c-01": -1, "c-02": 0.5 })).toEqual(allocateLots(hs));
    const dup = allocateLots(hs, { "c-00": 3, "c-01": 3 });
    expect(new Set(Object.values(dup).map((l) => l.index)).size).toBe(10);
    expect(dup["c-00"].index).toBe(3);
  });
  it("veličina grada i broj prikazanih tvrtki", () => {
    expect([cityTier(2), cityTier(8), cityTier(9), cityTier(24), cityTier(25)]).toEqual(["small", "small", "medium", "medium", "large"]);
    const bs = [{ id: "b-adria", name: "Agencija Adria" }, { id: "b-ucka", name: "Učka" }, { id: "b-praonica", name: "Praonica" }, { id: "b-pekara", name: "Pekara" }, { id: "b-zastita", name: "Zaštita" }, { id: "b-vinarija", name: "Vinarija" }];
    expect(visibleBusinesses(bs, new Set(), 2).length).toBe(3);
    expect(visibleBusinesses(bs, new Set(["b-vinarija"]), 2).map((b) => b.id)).toContain("b-vinarija");
    expect(visibleBusinesses(bs, new Set(), 9)).toEqual(bs);
    expect(visibleBusinesses(bs, new Set(), 2).map((b) => b.id)).toEqual(["b-adria", "b-ucka", "b-praonica"]);
  });
  it("raspored ne ovisi o redoslijedu ljestvice", () => {
    const hs = fakeHotels(12);
    expect(allocateLots(hs)).toEqual(allocateLots([...hs].reverse()));
  });
});

describe("visina zgrade", () => {
  it("raste s napretkom, najnapredniji je najviši, nula i minus su minimum", () => {
    expect(hotelHeight(10, 10)).toBe(HOTEL_H_MAX);
    expect(hotelHeight(5, 10)).toBeGreaterThan(HOTEL_H_MIN);
    expect(hotelHeight(5, 10)).toBeLessThan(HOTEL_H_MAX);
    expect(hotelHeight(-1, 10)).toBe(HOTEL_H_MIN);
    expect(hotelHeight(0, 0)).toBe(HOTEL_H_MIN);
    expect(hotelHeight(12, 10)).toBe(HOTEL_H_MAX);
  });
});

describe("id", () => {
  it("SIM id", () => {
    expect(simId(0)).toBe("SIM-0001");
    expect(simId(11)).toBe("SIM-0012");
  });
});
