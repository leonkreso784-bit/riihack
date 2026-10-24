import { describe, expect, it } from "vitest";
import type { WorldRow } from "@/db/schema";
import { HttpError } from "@/lib/http";
import { PRICE_MAX, PRICE_MIN } from "@/lib/rules";
import {
  BOT_MARKETING,
  BOT_NAMES,
  addBot,
  botAcceptsContract,
  botOptionIndex,
  botLevelOf,
  botPlayerName,
  botPlan,
  fillBots,
  isBotName,
  pickBotName,
  removeBot,
  settlePool,
} from "./bots";

const world = (status: string) => ({ id: "00000000-0000-4000-8000-000000000000", status, maxPlayers: 10 }) as WorldRow;
const statusOf = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e instanceof HttpError ? e.status : "other";
  }
  return "ok";
};

describe("botPlan", () => {
  it("cijena je referentna × 0,95 / 1,00 / 1,05 po indeksu bota, marketing 1.000, bez ulaganja", () => {
    expect(botPlan(0, 100)).toEqual({ price: 95, marketing: BOT_MARKETING });
    expect(botPlan(1, 100).price).toBe(100);
    expect(botPlan(2, 100).price).toBe(105);
    expect(botPlan(3, 100).price).toBe(95);
    expect(botPlan(0, 100).investments).toBeUndefined();
    // ADR-044: popunjenost prošlog mjeseca malo pomakne cijenu
    expect(botPlan(1, 100, 90).price).toBe(105);
    expect(botPlan(1, 100, 40).price).toBe(95);
    expect(botPlan(1, 100, 70).price).toBe(100);
    // težina: teško na referentnoj cijeni s više marketinga, lako preskupo i s malo marketinga
    expect(botPlan(2, 100, 70, "tesko")).toEqual({ price: 100, marketing: 1500 });
    expect(botPlan(0, 100, 90, "lako")).toEqual({ price: 110, marketing: 300 });
  });
  it("cijena ostaje u dozvoljenom rasponu", () => {
    expect(botPlan(0, 1).price).toBe(PRICE_MIN);
    expect(botPlan(2, 100000).price).toBe(PRICE_MAX);
  });
});

describe("botLevelOf", () => {
  it("čita težinu iz imena igrača bota", () => {
    expect(botLevelOf(botPlayerName("tesko"))).toBe("tesko");
    expect(botLevelOf(botPlayerName("lako"))).toBe("lako");
    expect(botLevelOf("Računalo")).toBe("srednje");
  });
});

describe("botOptionIndex", () => {
  it("težina bira opciju: teško najbolju, srednje drugu, lako treću", () => {
    const crit = [1, 3, 0, 2]; // najbolja je opcija 1, druga opcija 3, treća opcija 0
    for (const b of [0, 1, 2, 5]) {
      expect(botOptionIndex(b, "s", crit, "tesko")).toBe(1);
      expect(botOptionIndex(b, "s", crit)).toBe(3);
      expect(botOptionIndex(b, "s", crit, "lako")).toBe(0);
    }
  });
  it("isti ulaz daje isti izbor i radi s malo opcija", () => {
    expect(botOptionIndex(2, "x", [2, 2, 2])).toBe(botOptionIndex(2, "x", [2, 2, 2]));
    expect(botOptionIndex(1, "x", [4])).toBe(0);
    expect(botOptionIndex(1, "x", [])).toBe(0);
  });
});

describe("botAcceptsContract", () => {
  it("prihvaća samo uz pozitivnu dobit", () => {
    expect(botAcceptsContract({ pricePerNight: 80, nights: 10, monthlyCost: 500 })).toBe(true);
    expect(botAcceptsContract({ pricePerNight: 50, nights: 10, monthlyCost: 500 })).toBe(false); // točno nula
    expect(botAcceptsContract({ pricePerNight: 40, nights: 10, monthlyCost: 500 })).toBe(false);
    expect(botAcceptsContract({ pricePerNight: 0, nights: 0, monthlyCost: 300 })).toBe(false);
  });
});

describe("imena botova", () => {
  it("pickBotName: sufiks (bot), bez ponavljanja", () => {
    const a = pickBotName([]);
    expect(isBotName(a)).toBe(true);
    const b = pickBotName([a]);
    expect(b).not.toBe(a);
  });
  it("kad se popis potroši, ime s brojem", () => {
    const taken = BOT_NAMES.map((n) => `${n} (bot)`);
    const next = pickBotName(taken);
    expect(taken).not.toContain(next);
    expect(isBotName(next)).toBe(true);
  });
  it("studentsko ime bez sufiksa nije bot", () => expect(isBotName("Hotel Bonavia")).toBe(false));
});

describe("zaštite dodavanja i uklanjanja (bez baze)", () => {
  it("addBot, fillBots i removeBot nakon početka igre → 409", async () => {
    for (const status of ["running", "finished"]) {
      expect(await statusOf(addBot(world(status)))).toBe(409);
      expect(await statusOf(fillBots(world(status)))).toBe(409);
      expect(await statusOf(removeBot(world(status), "00000000-0000-4000-8000-000000000001"))).toBe(409);
    }
  });
  it("removeBot s neispravnim id-em u čekaonici → 404", async () => {
    expect(await statusOf(removeBot(world("lobby"), "nije-uuid"))).toBe(404);
  });
});

describe("settlePool (paralelno igranje botova)", () => {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const items = Array.from({ length: 11 }, (_, i) => i);

  it("radi istodobno, a ne jedno po jedno", async () => {
    const t0 = Date.now();
    await settlePool(items, 5, async () => sleep(40));
    // 11 zadataka po 40 ms: slijedno ~440 ms, sa 5 radnika 3 vala ~120 ms
    expect(Date.now() - t0).toBeLessThan(300);
  });

  it("nikad ne prelazi granicu istodobnosti", async () => {
    let running = 0;
    let peak = 0;
    await settlePool(items, 4, async () => {
      peak = Math.max(peak, ++running);
      await sleep(10);
      running--;
    });
    expect(peak).toBe(4);
  });

  it("rezultat je isti kao slijedni, neovisno o redoslijedu završetka", async () => {
    const work = async (n: number, i: number) => {
      await sleep((10 - (n % 10)) * 3); // kasniji završe prije
      return `${i}:${botPlan(i, 100, undefined, "srednje").price}:${botOptionIndex(i, `s${n}`, [1, 3, 2], "tesko")}`;
    };
    const parallel = await settlePool(items, 5, work);
    const sequential = [];
    for (const [i, n] of items.entries()) sequential.push({ status: "fulfilled", value: await work(n, i) });
    expect(parallel).toEqual(sequential);
  });

  it("pad jednog zadatka ne zaustavlja ostale", async () => {
    const done: number[] = [];
    const res = await settlePool(items, 3, async (n) => {
      if (n === 4) throw new Error("bum");
      done.push(n);
    });
    expect(res[4].status).toBe("rejected");
    expect(res.filter((r) => r.status === "fulfilled")).toHaveLength(10);
    expect(done).toHaveLength(10);
  });

  it("prazan popis i granica veća od popisa rade", async () => {
    expect(await settlePool([], 5, async () => 1)).toEqual([]);
    expect(await settlePool([1, 2], 9, async (n) => n)).toHaveLength(2);
  });
});
