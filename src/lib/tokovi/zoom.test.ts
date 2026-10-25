import { describe, expect, it } from "vitest";
import {
  ZOOM_DEFAULT,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  WHEEL_THRESHOLD,
  anchoredScroll,
  canStep,
  clampZoom,
  fitZoom,
  parseStoredZoom,
  stepZoom,
  wheelStep,
  zoomLabel,
} from "@/lib/tokovi/zoom";

describe("clampZoom", () => {
  it("drži zoom u rasponu 50 do 150", () => {
    expect(clampZoom(10)).toBe(ZOOM_MIN);
    expect(clampZoom(49.4)).toBe(ZOOM_MIN);
    expect(clampZoom(500)).toBe(ZOOM_MAX);
    expect(clampZoom(-20)).toBe(ZOOM_MIN);
  });

  it("zaokružuje na cijeli postotak", () => {
    expect(clampZoom(87.4)).toBe(87);
    expect(clampZoom(87.6)).toBe(88);
  });

  it("nevaljan broj vraća zadanih 100", () => {
    expect(clampZoom(NaN)).toBe(ZOOM_DEFAULT);
    expect(clampZoom(Infinity)).toBe(ZOOM_DEFAULT);
    expect(clampZoom(-Infinity)).toBe(ZOOM_DEFAULT);
  });
});

describe("stepZoom", () => {
  it("korak je 10 %", () => {
    expect(stepZoom(100, 1)).toBe(100 + ZOOM_STEP);
    expect(stepZoom(100, -1)).toBe(100 - ZOOM_STEP);
  });

  it("s rubova ne izlazi iz raspona", () => {
    expect(stepZoom(ZOOM_MAX, 1)).toBe(ZOOM_MAX);
    expect(stepZoom(ZOOM_MIN, -1)).toBe(ZOOM_MIN);
    expect(stepZoom(145, 1)).toBe(ZOOM_MAX);
    expect(stepZoom(55, -1)).toBe(ZOOM_MIN);
  });

  it("nakon Cijelog toka (npr. 61 %) skače na mrežu desetica", () => {
    expect(stepZoom(61, 1)).toBe(70);
    expect(stepZoom(61, -1)).toBe(60);
    expect(stepZoom(87, 1)).toBe(90);
    expect(stepZoom(87, -1)).toBe(80);
  });

  it("od 50 do 150 treba točno deset koraka u svaki smjer", () => {
    let z: number = ZOOM_MIN;
    let n = 0;
    while (z < ZOOM_MAX) {
      z = stepZoom(z, 1);
      n++;
    }
    expect(n).toBe(10);
    expect(z).toBe(ZOOM_MAX);
    while (z > ZOOM_MIN) {
      z = stepZoom(z, -1);
      n--;
    }
    expect(n).toBe(0);
  });
});

describe("canStep", () => {
  it("javlja kad je zoom na rubu", () => {
    expect(canStep(ZOOM_MAX, 1)).toBe(false);
    expect(canStep(ZOOM_MAX, -1)).toBe(true);
    expect(canStep(ZOOM_MIN, -1)).toBe(false);
    expect(canStep(ZOOM_MIN, 1)).toBe(true);
    expect(canStep(100, 1)).toBe(true);
    expect(canStep(100, -1)).toBe(true);
  });
});

describe("fitZoom", () => {
  it("cijelo platno stane u prozor: zaokružuje prema dolje", () => {
    expect(fitZoom(960, 1560)).toBe(61); // 61,5 %
    expect(fitZoom(1560, 1560)).toBe(100);
    expect((1560 * fitZoom(960, 1560)) / 100).toBeLessThanOrEqual(960);
  });

  it("široki prozor smije povećati do 150 %", () => {
    expect(fitZoom(1700, 1560)).toBe(108);
    expect(fitZoom(5000, 1560)).toBe(ZOOM_MAX);
  });

  it("uzak prozor staje na 50 %", () => {
    expect(fitZoom(300, 1560)).toBe(ZOOM_MIN);
  });

  it("bez izmjerene širine ostaje 100 %", () => {
    expect(fitZoom(0, 1560)).toBe(ZOOM_DEFAULT);
    expect(fitZoom(960, 0)).toBe(ZOOM_DEFAULT);
    expect(fitZoom(NaN, 1560)).toBe(ZOOM_DEFAULT);
    expect(fitZoom(-5, 1560)).toBe(ZOOM_DEFAULT);
  });
});

describe("wheelStep", () => {
  it("jedan zarez miša (100 px) je jedan korak", () => {
    expect(wheelStep(0, -100)).toEqual({ direction: 1, pending: 0 });
    expect(wheelStep(0, 100)).toEqual({ direction: -1, pending: 0 });
  });

  it("sitni pomaci touchpada se zbrajaju do praga", () => {
    let pending = 0;
    let steps = 0;
    for (let i = 0; i < 20; i++) {
      const r = wheelStep(pending, -5);
      pending = r.pending;
      steps += r.direction;
    }
    // 20 puta po 5 px = 100 px, prag je 40, pa su dva koraka, a ostatak čeka
    expect(steps).toBe(2);
    expect(Math.abs(pending)).toBeLessThan(WHEEL_THRESHOLD);
  });

  it("ispod praga nema koraka, ali se pomak pamti", () => {
    expect(wheelStep(0, -10)).toEqual({ direction: 0, pending: -10 });
    expect(wheelStep(-10, -10)).toEqual({ direction: 0, pending: -20 });
  });

  it("promjena smjera briše stari zbroj", () => {
    expect(wheelStep(-30, 10)).toEqual({ direction: 0, pending: 10 });
  });

  it("retci i stranice (Firefox) se pretvaraju u piksele", () => {
    expect(wheelStep(0, -3, 1).direction).toBe(1); // 3 retka = 48 px
    expect(wheelStep(0, 1, 2).direction).toBe(-1); // 1 stranica = 100 px
  });

  it("nula i nevaljan pomak ne rade ništa", () => {
    expect(wheelStep(-12, 0)).toEqual({ direction: 0, pending: -12 });
    expect(wheelStep(0, NaN)).toEqual({ direction: 0, pending: 0 });
  });
});

describe("anchoredScroll", () => {
  it("točka ispod sidra ostaje na istom mjestu", () => {
    // scroll 200, sidro 300 px od lijevog ruba: točka platna je (200 + 300) / 1,0 = 500 px
    const next = anchoredScroll(200, 300, 100, 150);
    expect(next + 300).toBe(750); // 500 * 1,5
  });

  it("smanjivanje blizu početka ne ide u minus", () => {
    expect(anchoredScroll(0, 100, 100, 50)).toBe(0);
    expect(anchoredScroll(10, 400, 150, 50)).toBe(0);
  });

  it("isti zoom ne mijenja scroll", () => {
    expect(anchoredScroll(240, 500, 100, 100)).toBe(240);
  });

  it("nevaljan zoom ne ruši", () => {
    expect(anchoredScroll(50, 10, 0, 100)).toBe(50);
    expect(anchoredScroll(-5, 10, 100, 0)).toBe(0);
  });
});

describe("parseStoredZoom", () => {
  it("čita spremljenu vrijednost", () => {
    expect(parseStoredZoom("80")).toBe(80);
    expect(parseStoredZoom("150")).toBe(150);
  });

  it("vrijednost izvan raspona se ograniči", () => {
    expect(parseStoredZoom("500")).toBe(ZOOM_MAX);
    expect(parseStoredZoom("5")).toBe(ZOOM_MIN);
  });

  it("prazno ili pokvareno daje null", () => {
    expect(parseStoredZoom(null)).toBeNull();
    expect(parseStoredZoom(undefined)).toBeNull();
    expect(parseStoredZoom("")).toBeNull();
    expect(parseStoredZoom("  ")).toBeNull();
    expect(parseStoredZoom("abc")).toBeNull();
    expect(parseStoredZoom("NaN")).toBeNull();
  });
});

describe("zoomLabel", () => {
  it("piše postotak s razmakom", () => {
    expect(zoomLabel(100)).toBe("100 %");
    expect(zoomLabel(61)).toBe("61 %");
    expect(zoomLabel(999)).toBe("150 %");
  });
});
