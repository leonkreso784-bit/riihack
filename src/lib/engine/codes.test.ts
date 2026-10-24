import { describe, expect, it } from "vitest";
import { generateCode, hashCode, normalizeCode } from "./codes";

describe("codes", () => {
  it("generateCode daje tražen broj znakova bez dvosmislenih", () => {
    const six = generateCode(6);
    expect(six).toHaveLength(6);
    expect(six).not.toMatch(/[0O1IL]/);
    expect(generateCode(12)).toHaveLength(12);
  });

  it("generateCode koristi zadani izvor slučajnosti", () => {
    expect(generateCode(3, () => 0)).toBe("AAA");
  });

  it("normalizeCode briše razmake i crtice i podiže slova", () => {
    expect(normalizeCode(" kv-rn 26 ")).toBe("KVRN26");
  });

  it("hashCode je stabilan SHA-256 hex", async () => {
    const a = await hashCode("ABC");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashCode("ABC")).toBe(a);
    expect(await hashCode("ABD")).not.toBe(a);
  });
});
