import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// client.ts decides mock or real API when it is loaded, so each test loads a fresh copy with the real API switched on.
async function realClient() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "0");
  return import("./client");
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("send: no connection (#266, 3)", () => {
  it("fetch TypeError ('Failed to fetch') becomes a readable Croatian message", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));
    const { api } = await realClient();
    await expect(api.me()).rejects.toThrow("Nema veze s internetom. Pokušaj ponovno.");
  });

  it("other errors pass through unchanged", async () => {
    const abort = new DOMException("aborted", "AbortError");
    vi.mocked(fetch).mockRejectedValue(abort);
    const { api } = await realClient();
    await expect(api.me()).rejects.toBe(abort);
  });

  it("an HTTP error keeps its status and the server message", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: "Uđi u igru kodom" }, { status: 401 }));
    const { api, isUnauthorized } = await realClient();
    const err = await api.me().catch((e: unknown) => e);
    expect((err as Error).message).toBe("Uđi u igru kodom");
    expect(isUnauthorized(err)).toBe(true);
  });
});

describe("blocksPage (#266, 3)", () => {
  it("a failed poll with data on screen does not replace the page", async () => {
    const { blocksPage } = await realClient();
    expect(blocksPage(new Error("Nema veze s internetom. Pokušaj ponovno."), { company: {} })).toBe(false);
  });

  it("a failed first load has nothing to show, so the error replaces the page", async () => {
    const { blocksPage } = await realClient();
    expect(blocksPage(new Error("x"), undefined)).toBe(true);
  });

  it("an expired session (401) cannot recover by polling, so it still blocks", async () => {
    const { blocksPage } = await realClient();
    const err = Object.assign(new Error("Uđi u igru kodom"), { status: 401 });
    expect(blocksPage(err, { company: {} })).toBe(true);
  });

  it("no error never blocks", async () => {
    const { blocksPage } = await realClient();
    expect(blocksPage(undefined, undefined)).toBe(false);
    expect(blocksPage(undefined, { company: {} })).toBe(false);
  });
});

describe("closeRound sends the month on the screen (#266, 1)", () => {
  const report = { round: 1, metricsBefore: {}, metricsAfter: {} };

  it("with a round: body { round }", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(report));
    const { api } = await realClient();
    await api.closeRound(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/me/close-round");
    expect(JSON.parse(init!.body as string)).toEqual({ round: 1 });
  });

  it("without a round: empty object, as before", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(report));
    const { api } = await realClient();
    await api.closeRound();
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)).toEqual({});
  });

  it("a 409 for a stale click reaches the caller with its status and message", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: "Mjesec se u međuvremenu promijenio. Osvježi stranicu." }, { status: 409 }));
    const { api } = await realClient();
    const err = (await api.closeRound(1).catch((e: unknown) => e)) as Error & { status?: number };
    expect(err.status).toBe(409);
    expect(err.message).toBe("Mjesec se u međuvremenu promijenio. Osvježi stranicu.");
  });
});
