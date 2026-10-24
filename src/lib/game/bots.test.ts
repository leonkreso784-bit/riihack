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
  botPlan,
  fillBots,
  hash32,
  isBotName,
  pickBotName,
  removeBot,
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
  });
  it("cijena ostaje u dozvoljenom rasponu", () => {
    expect(botPlan(0, 1).price).toBe(PRICE_MIN);
    expect(botPlan(2, 100000).price).toBe(PRICE_MAX);
  });
});

describe("botOptionIndex", () => {
  it("determinirano i unutar raspona", () => {
    for (let b = 0; b < 6; b++) {
      const i = botOptionIndex(b, "sit-" + b, 4);
      expect(i).toBe(botOptionIndex(b, "sit-" + b, 4));
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(4);
    }
    expect(botOptionIndex(0, "x", 1)).toBe(0);
    expect(botOptionIndex(0, "x", 0)).toBe(0);
  });
  it("različiti botovi ne biraju svi isto", () => {
    const picks = new Set(Array.from({ length: 8 }, (_, b) => botOptionIndex(b, "ista-situacija", 4)));
    expect(picks.size).toBeGreaterThan(1);
  });
  it("hash32 je stabilan", () => expect(hash32("a")).toBe(hash32("a")));
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
