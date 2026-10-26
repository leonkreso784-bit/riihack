// Simulacija sezone s botovima (ADR-059, #198): provjerava da je ekonomija vjerodostojna prema stvarnim kvarnerskim
// hotelima i da nijedna jednostavna strategija ne pobjeđuje igru. Brojke za ispis: npx tsx scripts/sim-sezona.ts
import { describe, expect, it } from "vitest";
import { HOTELS } from "@/content";
import { MARKETING_MAX } from "@/lib/rules";
import { isInsolvent } from "@/lib/ranking";
import { BOT_LEVELS, type BotLevel } from "./bots";
import { avg, seasonMarginPct, simulateSeason, type SimHotel, type SimOverride } from "./season-sim";

const city = (level: (i: number) => BotLevel, overrides: Record<number, SimOverride> = {}): SimHotel[] =>
  HOTELS.map((template, i) => ({ template, level: level(i), override: overrides[i] }));
const monthAvg = (r: ReturnType<typeof simulateSeason>, k: number, key: "occupancyPct" | "marginPct") => avg(r.hotels.map((h) => h.months[k][key]));
const ALL_INVEST = { reception: 3000, housekeeping: 3000, kitchen: 3000, maintenance: 3000, management: 3000 };

describe("simulacija sezone", () => {
  it("je određena: isto sjeme, isti ishod", () => {
    expect(simulateSeason(city(() => "srednje"))).toEqual(simulateSeason(city(() => "srednje")));
  });

  it("marža sezone je u rasponu stvarnih hotela (GOP 11 do 31 %) za srednje i teške botove, i za mješoviti grad", () => {
    for (const r of [simulateSeason(city(() => "srednje")), simulateSeason(city(() => "tesko")), simulateSeason(city((i) => BOT_LEVELS[i % 3]))]) {
      const margin = seasonMarginPct(r.hotels);
      expect(margin).toBeGreaterThanOrEqual(11);
      expect(margin).toBeLessThanOrEqual(31);
    }
  });

  it("vrh sezone je isplativ (marža kolovoza 11 do 31 %), a lipanj i rujan su znatno slabiji", () => {
    for (const level of ["srednje", "tesko"] as const) {
      const r = simulateSeason(city(() => level));
      expect(monthAvg(r, 2, "marginPct"), `${level} kolovoz`).toBeLessThanOrEqual(31);
      expect(monthAvg(r, 2, "marginPct"), `${level} kolovoz`).toBeGreaterThanOrEqual(11);
      expect(monthAvg(r, 0, "marginPct"), `${level} lipanj`).toBeLessThan(monthAvg(r, 2, "marginPct") - 10);
      expect(monthAvg(r, 3, "marginPct"), `${level} rujan`).toBeLessThan(monthAvg(r, 2, "marginPct") - 10);
    }
  });

  it("popunjenost prati sezonu: kolovoz najviši, lipanj i rujan niži, ljeto 80 do 100 %", () => {
    const r = simulateSeason(city(() => "srednje"));
    const occ = [0, 1, 2, 3].map((k) => monthAvg(r, k, "occupancyPct"));
    expect(occ[2]).toBeGreaterThanOrEqual(80);
    expect(occ[2]).toBeLessThanOrEqual(100);
    expect(occ[1]).toBeGreaterThanOrEqual(75);
    expect(occ[0]).toBeGreaterThanOrEqual(45);
    expect(occ[0]).toBeLessThanOrEqual(75);
    expect(occ[3]).toBeGreaterThanOrEqual(45);
    expect(occ[2]).toBeGreaterThan(occ[1]);
    expect(occ[1]).toBeGreaterThan(occ[0]);
    expect(occ[0]).toBeGreaterThan(occ[3]);
  });

  it("nijedan hotel srednjih i teških botova nema sezonu s maržom iznad 45 % (prije kalibracije 60 do 85 %)", () => {
    for (const level of ["srednje", "tesko"] as const) {
      for (const h of simulateSeason(city(() => level)).hotels) {
        expect(seasonMarginPct([h]), `${level} ${h.hotelName}`).toBeLessThan(45);
      }
    }
  });

  it("težine botova se razlikuju: lako < srednje < teško po napretku", () => {
    const r = simulateSeason(city((i) => BOT_LEVELS[i % 3]));
    const by = (l: BotLevel) => avg(r.hotels.filter((h) => h.level === l).map((h) => h.progress));
    expect(by("lako")).toBeLessThan(by("srednje"));
    expect(by("srednje")).toBeLessThan(by("tesko"));
  });

  it("ljestvica nikad nema insolventan hotel iznad solventnog", () => {
    const bankrupt: SimOverride = { priceFactor: 0.01, marketing: MARKETING_MAX, investments: ALL_INVEST };
    for (const r of [simulateSeason(city(() => "srednje", { 0: bankrupt, 2: { investments: ALL_INVEST } })), simulateSeason(city((i) => BOT_LEVELS[i % 3]))]) {
      const first = r.ranking.findIndex((h) => isInsolvent(h));
      if (first >= 0) expect(r.ranking.slice(first).every((h) => isInsolvent(h))).toBe(true);
    }
  });

  describe("strategije jednog igrača (Rijeka) u gradu srednjih botova", () => {
    const control = simulateSeason(city(() => "srednje")).hotels[0];
    const play = (o: SimOverride) => simulateSeason(city(() => "srednje", { 0: o }));

    it("ulaganje u svih 5 odjela svaki mjesec više nije dominantno (#198 st. 1): ne nadmašuje kontrolu i troši račun", () => {
      const r = play({ investments: ALL_INVEST });
      expect(r.hotels[0].progress).toBeLessThanOrEqual(control.progress);
      expect(r.hotels[0].cash).toBeLessThan(control.cash - 30000);
      expect(r.ranking[0].companyId).not.toBe(r.hotels[0].companyId);
    });

    it("najveći marketing ne daje bitnu prednost (#198 st. 3): račun najviše nekoliko tisuća € iznad kontrole, napredak isti", () => {
      const r = play({ marketing: MARKETING_MAX });
      expect(r.hotels[0].cash - control.cash).toBeLessThan(5000);
      expect(r.hotels[0].progress).toBeLessThanOrEqual(control.progress + 1);
    });

    it("najviša cijena i dampinška cijena ne pobjeđuju", () => {
      expect(play({ priceFactor: 100 }).hotels[0].progress).toBeLessThan(control.progress);
      const dump = play({ priceFactor: 0.01, marketing: MARKETING_MAX, investments: ALL_INVEST });
      expect(dump.hotels[0].insolvent).toBe(true);
      expect(dump.ranking.at(-1)!.companyId).toBe(dump.hotels[0].companyId);
    });

    it("stečaj uz dobre odgovore: napredak je najveći, ali ljestvica ga stavlja iza solventnih (#198, ADR-059)", () => {
      const r = play({ writtenQuality: 5, priceFactor: 0.01, marketing: MARKETING_MAX, investments: ALL_INVEST });
      const me = r.hotels[0];
      expect(me.insolvent).toBe(true);
      expect(r.naiveRanking[0].companyId).toBe(me.companyId); // bez pravila bi vodio
      const solvent = r.hotels.filter((h) => !h.insolvent).length;
      expect(r.ranking.findIndex((h) => h.companyId === me.companyId)).toBeGreaterThanOrEqual(solvent); // s pravilom je iza svih solventnih
      expect(r.ranking.slice(0, solvent).every((h) => !h.insolvent)).toBe(true);
    });

    it("propuštene situacije se kažnjavaju, napisani dobri odgovori nagrađuju (#198 st. 2: klik ne daje 4)", () => {
      const skip = play({ skipAnswers: true }).hotels[0];
      const write4 = play({ writtenQuality: 4 }).hotels[0];
      const write5 = play({ writtenQuality: 5 }).hotels[0];
      expect(skip.progress).toBeLessThan(0);
      expect(write4.progress).toBeGreaterThan(control.progress + 20);
      expect(write5.progress).toBeGreaterThan(write4.progress);
      // i teški bot (najbolja ponuđena opcija, strop 3) je iza igrača koji piše odgovore
      const hard = simulateSeason(city(() => "tesko")).hotels[0];
      expect(write4.progress).toBeGreaterThan(hard.progress);
    });
  });

  it("svi hoteli dižu cijenu: popunjenost grada pada (elastičnost), ali umjereno", () => {
    const occ = (f: number) =>
      avg(simulateSeason(city(() => "srednje", Object.fromEntries(HOTELS.map((_, i) => [i, { priceFactor: f }])))).hotels.flatMap((h) => h.months.map((m) => m.occupancyPct)));
    const o1 = occ(1);
    const o13 = occ(1.3);
    const o2 = occ(2);
    expect(o13).toBeLessThan(o1);
    expect(o2).toBeLessThan(o13);
    expect(o2).toBeGreaterThan(o1 * 0.7);
  });
});
