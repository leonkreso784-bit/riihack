import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/http";
import {
  assertNotDemoGame,
  DEMO_GAME_PROTECTED_MESSAGE,
  demoJoinCode,
  demoProfEmail,
  isDemoGame,
  isProtectedDemoGame,
} from "./demo-guard";

// Isto pravilo kao scripts/cleanup-test-data.ts (protectedSet): kod DEMO_JOIN_CODE (zadano KVRNDM) i igre računa DEMO_PROF_EMAIL.
const OWN = { joinCode: "HTLK7B", ownerId: null };
const OWNED = { joinCode: "HTLK7B", ownerId: "user-1" };

beforeEach(() => {
  vi.stubEnv("DEMO_JOIN_CODE", "");
  vi.stubEnv("DEMO_PROF_EMAIL", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("demoJoinCode i demoProfEmail", () => {
  it("bez varijable ili s praznom: KVRNDM i nema demo e-pošte (kao skripta)", () => {
    expect(demoJoinCode({})).toBe("KVRNDM");
    expect(demoJoinCode({ DEMO_JOIN_CODE: "" })).toBe("KVRNDM");
    expect(demoProfEmail({})).toBeNull();
    expect(demoProfEmail({ DEMO_PROF_EMAIL: "   " })).toBeNull();
  });

  it("zadani kod i e-pošta se obrežu, kod u velika, e-pošta u mala slova", () => {
    expect(demoJoinCode({ DEMO_JOIN_CODE: " ab3cde " })).toBe("AB3CDE");
    expect(demoProfEmail({ DEMO_PROF_EMAIL: " Demo@Skola.HR " })).toBe("demo@skola.hr");
  });
});

describe("isDemoGame", () => {
  it("igra s demo kodom je zaštićena, i bez vlasnika i bez e-pošte", () => {
    expect(isDemoGame({ joinCode: "KVRNDM", ownerId: null }, null, {})).toBe(true);
    expect(isDemoGame({ joinCode: "kvrndm ", ownerId: null }, null, {})).toBe(true);
  });

  it("DEMO_JOIN_CODE zamjenjuje zadani kod: KVRNDM tada više nije demo", () => {
    const env = { DEMO_JOIN_CODE: "DEMO77" };
    expect(isDemoGame({ joinCode: "DEMO77", ownerId: null }, null, env)).toBe(true);
    expect(isDemoGame({ joinCode: "KVRNDM", ownerId: null }, null, env)).toBe(false);
  });

  it("obična igra nije zaštićena, ni uz vlasnika, dok DEMO_PROF_EMAIL nije postavljen", () => {
    expect(isDemoGame(OWN, null, {})).toBe(false);
    expect(isDemoGame(OWNED, "demo@skola.hr", {})).toBe(false);
  });

  it("igra vlasnika s e-poštom DEMO_PROF_EMAIL je zaštićena, bez obzira na velika slova i razmake", () => {
    const env = { DEMO_PROF_EMAIL: "Demo@Skola.hr" };
    expect(isDemoGame(OWNED, "demo@skola.hr", env)).toBe(true);
    expect(isDemoGame(OWNED, "  DEMO@SKOLA.HR ", env)).toBe(true);
  });

  it("igra drugog vlasnika, ili e-pošta koja samo sadrži demo adresu, nije zaštićena", () => {
    const env = { DEMO_PROF_EMAIL: "demo@skola.hr" };
    expect(isDemoGame(OWNED, "prof@skola.hr", env)).toBe(false);
    expect(isDemoGame(OWNED, "xdemo@skola.hr", env)).toBe(false);
    expect(isDemoGame(OWNED, "demo@skola.hr.evil.test", env)).toBe(false);
    expect(isDemoGame(OWNED, null, env)).toBe(false);
  });
});

describe("isProtectedDemoGame", () => {
  it("demo kod odlučuje bez upita bazi", async () => {
    const lookup = vi.fn();
    expect(await isProtectedDemoGame({ joinCode: "KVRNDM", ownerId: "user-1" }, lookup, { DEMO_PROF_EMAIL: "demo@skola.hr" })).toBe(true);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("bez DEMO_PROF_EMAIL ili bez vlasnika baza se ne pita", async () => {
    const lookup = vi.fn();
    expect(await isProtectedDemoGame(OWNED, lookup, {})).toBe(false);
    expect(await isProtectedDemoGame(OWN, lookup, { DEMO_PROF_EMAIL: "demo@skola.hr" })).toBe(false);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("igra s vlasnikom: e-pošta vlasnika iz baze odlučuje", async () => {
    const env = { DEMO_PROF_EMAIL: "demo@skola.hr" };
    expect(await isProtectedDemoGame(OWNED, async () => "demo@skola.hr", env)).toBe(true);
    expect(await isProtectedDemoGame(OWNED, async () => "prof@skola.hr", env)).toBe(false);
    expect(await isProtectedDemoGame(OWNED, async () => null, env)).toBe(false);
  });

  it("upit bazi traži baš vlasnika te igre", async () => {
    const lookup = vi.fn().mockResolvedValue("prof@skola.hr");
    await isProtectedDemoGame(OWNED, lookup, { DEMO_PROF_EMAIL: "demo@skola.hr" });
    expect(lookup).toHaveBeenCalledWith("user-1");
  });

  it("pad baze se ne guta: greška ide dalje, pa se ništa ne briše", async () => {
    const lookup = vi.fn().mockRejectedValue(new Error("baza nedostupna"));
    await expect(isProtectedDemoGame(OWNED, lookup, { DEMO_PROF_EMAIL: "demo@skola.hr" })).rejects.toThrow("baza nedostupna");
  });
});

describe("assertNotDemoGame", () => {
  it("demo igra: 409 s kratkom hrvatskom porukom", async () => {
    const err = await assertNotDemoGame({ joinCode: "KVRNDM", ownerId: null }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(409);
    expect((err as HttpError).message).toBe(DEMO_GAME_PROTECTED_MESSAGE);
    expect(DEMO_GAME_PROTECTED_MESSAGE).toBe("Demo igra je zaštićena od brisanja.");
  });

  it("čita okolinu pri svakom pozivu (DEMO_JOIN_CODE iz procesa)", async () => {
    vi.stubEnv("DEMO_JOIN_CODE", "DEMO77");
    await expect(assertNotDemoGame({ joinCode: "DEMO77", ownerId: null })).rejects.toMatchObject({ status: 409 });
    await expect(assertNotDemoGame({ joinCode: "KVRNDM", ownerId: null })).resolves.toBeUndefined();
  });

  it("obična igra bez vlasnika prolazi", async () => {
    await expect(assertNotDemoGame(OWN)).resolves.toBeUndefined();
  });
});
