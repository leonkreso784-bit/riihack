import { describe, expect, it } from "vitest";
import { CITY, CONTRACTS, HOTELS, SITUATIONS, getBusiness, getContract, getHotel, getSituation } from "@/content";
import { METRIC_TOTAL, START_CASH, STAFF_COST_PER_ROOM_BY_STARS } from "@/lib/rules";
import type { RoomType, StaffDepartment } from "@/lib/types";

const ROOM_TYPES: RoomType[] = ["single", "double", "suite", "family"];
const DEPARTMENTS: StaffDepartment[] = ["reception", "housekeeping", "kitchen", "maintenance", "management"];
const VIEWS = ["more", "park", "ulica"];
const STATUSES = ["free", "occupied", "cleaning", "broken"];

describe("banka hotela", () => {
  it("ima 6 hotela s jedinstvenim id-jevima", () => {
    expect(HOTELS).toHaveLength(6);
    expect(new Set(HOTELS.map((h) => h.id)).size).toBe(HOTELS.length);
  });

  for (const hotel of HOTELS) {
    describe(hotel.id, () => {
      it("pokazatelji zbrajaju METRIC_TOTAL, svaki 20-80", () => {
        const values = Object.values(hotel.startMetrics);
        expect(values).toHaveLength(5);
        expect(values.reduce((a, b) => a + b, 0)).toBe(METRIC_TOTAL);
        for (const v of values) {
          expect(v).toBeGreaterThanOrEqual(20);
          expect(v).toBeLessThanOrEqual(80);
        }
      });

      it("ekonomija: staffCost i startCash iz pravila", () => {
        expect(hotel.staffCost).toBe(hotel.rooms.length * (STAFF_COST_PER_ROOM_BY_STARS[hotel.stars] ?? NaN));
        expect(hotel.startCash).toBe(START_CASH);
      });

      it("sobe: 12-20, jedinstveni brojevi, 2+ kata, sve vrste, ispravna polja", () => {
        expect(hotel.rooms.length).toBeGreaterThanOrEqual(12);
        expect(hotel.rooms.length).toBeLessThanOrEqual(20);
        expect(new Set(hotel.rooms.map((r) => r.number)).size).toBe(hotel.rooms.length);
        expect(new Set(hotel.rooms.map((r) => r.floor)).size).toBeGreaterThanOrEqual(2);
        for (const t of ROOM_TYPES) expect(hotel.rooms.some((r) => r.type === t)).toBe(true);
        for (const r of hotel.rooms) {
          expect(VIEWS).toContain(r.view);
          expect(STATUSES).toContain(r.status);
          expect(r.beds).toBeGreaterThan(0);
          expect(r.basePrice).toBeGreaterThan(0);
          if (r.status === "cleaning" || r.status === "broken") expect(r.note).toBeTruthy();
        }
        expect(hotel.rooms.some((r) => r.status === "cleaning" || r.status === "broken")).toBe(true);
      });

      it("osoblje: 6-10 ljudi, svih 5 odjela, jedinstvena imena", () => {
        expect(hotel.staff.length).toBeGreaterThanOrEqual(6);
        expect(hotel.staff.length).toBeLessThanOrEqual(10);
        for (const d of DEPARTMENTS) expect(hotel.staff.some((s) => s.department === d)).toBe(true);
        expect(new Set(hotel.staff.map((s) => s.name)).size).toBe(hotel.staff.length);
        for (const s of hotel.staff) expect(s.role.length).toBeGreaterThan(0);
      });
    });
  }

  it("getHotel vraca hotel i baca za nepoznat id", () => {
    expect(getHotel(HOTELS[0].id)).toBe(HOTELS[0]);
    expect(() => getHotel("nepostoji")).toThrow();
  });
});

describe("situacije", () => {
  it("id-jevi situacija su jedinstveni", () => {
    expect(new Set(SITUATIONS.map((s) => s.id)).size).toBe(SITUATIONS.length);
  });

  for (const s of SITUATIONS) {
    describe(s.id, () => {
      it("rubrika ima tocno 5 kriterija s jedinstvenim id-jevima", () => {
        expect(s.rubric).toHaveLength(5);
        expect(new Set(s.rubric.map((c) => c.id)).size).toBe(5);
      });

      it("3-4 opcije, kriteriji opcija postoje u rubrici, najbolja ima najvise 4", () => {
        expect(s.options.length).toBeGreaterThanOrEqual(3);
        expect(s.options.length).toBeLessThanOrEqual(4);
        const ids = new Set(s.rubric.map((c) => c.id));
        for (const o of s.options) for (const c of o.criteria) expect(ids.has(c)).toBe(true);
        expect(Math.max(...s.options.map((o) => o.criteria.length))).toBeLessThanOrEqual(4);
      });

      it("effects ima barem jedan kljuc", () => {
        expect(Object.keys(s.effects).length).toBeGreaterThan(0);
      });
    });
  }

  it("getSituation baca za nepoznat id", () => {
    expect(() => getSituation("nepostoji")).toThrow();
    for (const s of SITUATIONS) expect(getSituation(s.id)).toBe(s);
  });
});

describe("gradske tvrtke i ugovori", () => {
  it("6 tvrtki s jedinstvenim id-jevima, imenom i opisom", () => {
    expect(CITY).toHaveLength(6);
    expect(new Set(CITY.map((b) => b.id)).size).toBe(CITY.length);
    for (const b of CITY) {
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.description.length).toBeGreaterThan(0);
    }
  });

  it("8 ugovora s jedinstvenim id-jevima", () => {
    expect(CONTRACTS).toHaveLength(8);
    expect(new Set(CONTRACTS.map((c) => c.id)).size).toBe(CONTRACTS.length);
  });

  for (const c of CONTRACTS) {
    describe(c.id, () => {
      const business = CITY.find((b) => b.id === c.businessId);

      it("businessId postoji, title i text popunjeni", () => {
        expect(business).toBeDefined();
        expect(c.title.length).toBeGreaterThan(0);
        expect(c.text.length).toBeGreaterThan(0);
      });

      it("trajanje 1-3 kruga, monthlyCost >= 0, effects cijeli brojevi", () => {
        expect([1, 2, 3]).toContain(c.durationRounds);
        expect(c.monthlyCost).toBeGreaterThanOrEqual(0);
        for (const v of Object.values(c.effects)) expect(Number.isInteger(v)).toBe(true);
      });

      it("agencijski imaju nocenja i cijenu, ostali nule", () => {
        if (business?.kind === "agency") {
          expect(c.nights).toBeGreaterThan(0);
          expect(c.pricePerNight).toBeGreaterThan(0);
        } else {
          expect(c.nights).toBe(0);
          expect(c.pricePerNight).toBe(0);
        }
      });
    });
  }

  it("getBusiness i getContract vracaju stavku i bacaju za nepoznat id", () => {
    expect(getBusiness(CITY[0].id)).toBe(CITY[0]);
    expect(getContract(CONTRACTS[0].id)).toBe(CONTRACTS[0]);
    expect(() => getBusiness("nepostoji")).toThrow();
    expect(() => getContract("nepostoji")).toThrow();
  });
});
