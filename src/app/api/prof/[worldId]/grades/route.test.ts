import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/http";

const requireProf = vi.fn();
const exportGrades = vi.fn();
const expireRoundIfDue = vi.fn();
vi.mock("@/lib/session", () => ({ requireProf }));
vi.mock("@/lib/game/grades", () => ({ exportGrades }));
vi.mock("@/lib/game/world", () => ({ expireRoundIfDue }));

const { GET } = await import("./route");

const call = (worldId: string) => GET(new Request(`http://localhost/api/prof/${worldId}/grades`), { params: Promise.resolve({ worldId }) });

beforeEach(() => {
  requireProf.mockReset();
  exportGrades.mockReset();
  expireRoundIfDue.mockReset();
  expireRoundIfDue.mockResolvedValue(false);
});

describe("GET /api/prof/[worldId]/grades", () => {
  it("vlasnik igre dobiva CSV kao privitak s nazivom datoteke i bez međuspremnika", async () => {
    const world = { id: "w1", name: "Igra" };
    requireProf.mockResolvedValue(world);
    exportGrades.mockResolvedValue({ filename: "ocjene-igra-2026-10-26.csv", csv: "\uFEFFNadimak;Hotel;Napredak\r\n" });

    const res = await call("w1");

    expect(requireProf).toHaveBeenCalledWith("w1");
    expect(exportGrades).toHaveBeenCalledWith(world);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="ocjene-igra-2026-10-26.csv"');
    expect(res.headers.get("cache-control")).toMatch(/no-store/);
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // BOM preživi do klijenta
  });

  it("rok kruga je prošao: krug se prvo zatvori, a izvoz dobiva svježu igru (neodgovoreni nisu u tijeku)", async () => {
    const stale = { id: "w1", name: "Igra", status: "running" };
    const fresh = { id: "w1", name: "Igra", status: "running", currentRound: 2 };
    requireProf.mockResolvedValueOnce(stale).mockResolvedValueOnce(fresh);
    expireRoundIfDue.mockResolvedValue(true);
    exportGrades.mockResolvedValue({ filename: "ocjene-igra-2026-10-26.csv", csv: "" });

    const res = await call("w1");

    expect(res.status).toBe(200);
    expect(expireRoundIfDue).toHaveBeenCalledWith("w1", stale);
    expect(requireProf).toHaveBeenCalledTimes(2);
    expect(exportGrades).toHaveBeenCalledWith(fresh);
  });

  it("rok nije prošao: igra se ne čita ponovno", async () => {
    const world = { id: "w1", name: "Igra", status: "running" };
    requireProf.mockResolvedValue(world);
    exportGrades.mockResolvedValue({ filename: "ocjene-igra-2026-10-26.csv", csv: "" });

    await call("w1");

    expect(requireProf).toHaveBeenCalledTimes(1);
    expect(exportGrades).toHaveBeenCalledWith(world);
  });

  it("tuđa igra (requireProf baci 403): nema podataka i izvoz se ne pokreće", async () => {
    requireProf.mockRejectedValue(new HttpError(403, "Samo profesor ove igre"));

    const res = await call("w2");

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Samo profesor ove igre" });
    expect(exportGrades).not.toHaveBeenCalled();
    expect(expireRoundIfDue).not.toHaveBeenCalled(); // tuđa igra se ne smije ni zatvoriti
  });

  it("bez prijave (401) vraća grešku, ne CSV", async () => {
    requireProf.mockRejectedValue(new HttpError(401, "Prijavi se kao profesor"));

    const res = await call("w1");

    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    expect(res.headers.get("content-disposition")).toBeNull();
    expect(exportGrades).not.toHaveBeenCalled();
  });
});
