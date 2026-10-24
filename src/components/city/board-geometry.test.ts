import { describe, expect, it } from "vitest";
import { allocateLots } from "@/lib/karta";
import { P, VIEW, fitView } from "./board-geometry";

const hotels = (n: number) => Array.from({ length: n }, (_, i) => ({ companyId: `c-${String(i).padStart(2, "0")}`, place: "Rijeka" }));
const view = (n: number, aspect = 1274 / 860) => fitView(Object.values(allocateLots(hotels(n))).map((l) => l.slot), [], [], aspect);

describe("kamera karte", () => {
  it("pogled raste s brojem hotela (nikad se ne smanjuje, veliki grad je bitno veći od malog)", () => {
    let prev = 0;
    for (let n = 1; n <= 40; n++) {
      const v = view(n);
      expect(v.w).toBeGreaterThanOrEqual(prev - 1e-6);
      prev = v.w;
    }
    expect(view(40).w).toBeGreaterThan(view(2).w * 1.8);
    expect(VIEW.w / view(2).w).toBeGreaterThan(1.8); // mali grad je zumiran barem 1,8 puta u odnosu na cijelu ploču
  });
  it("omjer pogleda prati omjer kadra (stolno računalo i mobitel)", () => {
    for (const a of [1274 / 860, 620 / 700, 1000 / 860]) for (const n of [1, 5, 25, 40]) {
      const v = view(n, a);
      expect(v.w / v.h).toBeCloseTo(a, 5);
    }
  });
  it("svi zauzeti hoteli stanu u pogled", () => {
    for (const n of [3, 12, 25, 40]) {
      const v = view(n);
      for (const l of Object.values(allocateLots(hotels(n)))) {
        const [x, y] = P(l.slot[0], l.slot[1], 0);
        expect(x).toBeGreaterThan(v.x);
        expect(x).toBeLessThan(v.x + v.w);
        expect(y - 150).toBeGreaterThan(v.y);
        expect(y).toBeLessThan(v.y + v.h);
      }
    }
  });
  it("bez parcela vraća cijelu ploču", () => {
    expect(fitView([], [], [], 1.5)).toEqual(VIEW);
  });
});
