import { describe, expect, it, vi } from "vitest";
import { HttpError, route } from "./http";

const req = new Request("http://localhost/api/x");

describe("route", () => {
  it("vraća JSON sa statusom 200", async () => {
    const res = await route(async () => ({ ok: true }))(req, {});
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("HttpError postaje { error } sa statusom", async () => {
    const res = await route(async () => {
      throw new HttpError(409, "Igra je puna");
    })(req, {});
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Igra je puna" });
  });

  it("nepoznata greška postaje 500 s hrvatskom porukom", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await route(async () => {
      throw new Error("boom");
    })(req, {});
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/pošlo po zlu/);
    expect(body.error).not.toMatch(/boom/);
  });
});
