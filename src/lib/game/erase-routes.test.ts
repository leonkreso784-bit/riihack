import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/http";

// Provjera pristupa, zaštite demo igre i potvrde na DELETE rutama: ništa se ne briše prije requireProf, ni u demo igri,
// ni bez ispravne potvrde. Sesija, baza i brisanje su lažni; stvarni requireProf provjerava kolačić profesora ili vlasnika igre (session.ts).
// Baza služi samo za e-poštu vlasnika igre (zaštita igara računa DEMO_PROF_EMAIL, demo-guard.ts).
const requireProf = vi.fn();
const deleteGame = vi.fn();
const removeStudent = vi.fn();
const ownerRows = vi.fn();

vi.mock("@/lib/session", () => ({
  requireProf: (worldId: string) => requireProf(worldId),
  readJson: async (req: Request) => (await req.json()) as Record<string, unknown>,
}));
vi.mock("@/lib/game/erase", () => ({
  deleteGame: (world: unknown) => deleteGame(world),
  removeStudent: (world: unknown, id: string) => removeStudent(world, id),
}));
vi.mock("@/db", () => ({
  db: { select: () => ({ from: () => ({ where: () => ({ limit: () => ownerRows() }) }) }) },
}));
vi.mock("@/lib/game/world", () => ({ expireRoundIfDue: vi.fn(), loadProfState: vi.fn(), loadCompanyDetail: vi.fn() }));

const { DELETE: deleteGameRoute } = await import("../../app/api/prof/[worldId]/route");
const { DELETE: removeStudentRoute } = await import("../../app/api/prof/[worldId]/companies/[id]/route");

const WORLD = { id: "11111111-1111-4111-8111-111111111111", name: "Hotelijerstvo 3B", joinCode: "HTLK7B", ownerId: null };
const DEMO_WORLD = { ...WORLD, name: "Demo igra", joinCode: "KVRNDM" };
const DEMO_PROF_WORLD = { ...WORLD, name: "Igra demo profesora", ownerId: "user-demo" };
const COMPANY = "22222222-2222-4222-8222-222222222222";

const deleteReq = (body?: unknown) =>
  new Request("http://localhost/api/prof/x", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const gameCtx = { params: Promise.resolve({ worldId: WORLD.id }) };
const studentCtx = { params: Promise.resolve({ worldId: WORLD.id, id: COMPANY }) };

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("DEMO_JOIN_CODE", "");
  vi.stubEnv("DEMO_PROF_EMAIL", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("DELETE /api/prof/[worldId] (brisanje igre)", () => {
  it("nije profesor igre: 403 i ništa se ne briše, čak ni uz točnu potvrdu", async () => {
    requireProf.mockRejectedValue(new HttpError(403, "Samo profesor ove igre"));
    const res = await deleteGameRoute(deleteReq({ confirm: WORLD.name }), gameCtx);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Samo profesor ove igre" });
    expect(deleteGame).not.toHaveBeenCalled();
  });

  it("provjera profesora ide s ID-jem igre iz adrese", async () => {
    requireProf.mockResolvedValue(WORLD);
    await deleteGameRoute(deleteReq({ confirm: WORLD.name }), gameCtx);
    expect(requireProf).toHaveBeenCalledWith(WORLD.id);
  });

  it("bez potvrde, s krivom ili tuđom potvrdom: 400 i ništa se ne briše", async () => {
    requireProf.mockResolvedValue(WORLD);
    for (const body of [{}, { confirm: "" }, { confirm: "Neka druga igra" }, { confirm: 123 }, { confirm: "HTLK7" }]) {
      const res = await deleteGameRoute(deleteReq(body), gameCtx);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
    expect(deleteGame).not.toHaveBeenCalled();
  });

  it("točan naziv ili kod igre: briše igru koju je vratio requireProf", async () => {
    requireProf.mockResolvedValue(WORLD);
    for (const confirm of [WORLD.name, "hotelijerstvo 3b", WORLD.joinCode, "htlk7b"]) {
      const res = await deleteGameRoute(deleteReq({ confirm }), gameCtx);
      expect(res.status, confirm).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    }
    expect(deleteGame).toHaveBeenCalledTimes(4);
    expect(deleteGame).toHaveBeenCalledWith(WORLD);
  });

  it("greška pri brisanju postaje 500 s općenitom porukom (ne otkriva SQL)", async () => {
    requireProf.mockResolvedValue(WORLD);
    deleteGame.mockRejectedValue(new Error('update or delete on table "companies" violates foreign key constraint'));
    const res = await deleteGameRoute(deleteReq({ confirm: WORLD.name }), gameCtx);
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toMatch(/constraint|companies/);
  });
});

describe("DELETE /api/prof/[worldId] (zaštita demo igre)", () => {
  it("igra s demo kodom: 409 s porukom, čak i uz točnu potvrdu, i ništa se ne briše", async () => {
    requireProf.mockResolvedValue(DEMO_WORLD);
    for (const confirm of [DEMO_WORLD.name, DEMO_WORLD.joinCode, "kvrndm"]) {
      const res = await deleteGameRoute(deleteReq({ confirm }), gameCtx);
      expect(res.status, confirm).toBe(409);
      expect(await res.json()).toEqual({ error: "Demo igra je zaštićena od brisanja." });
    }
    expect(deleteGame).not.toHaveBeenCalled();
  });

  it("demo igra bez potvrde ili s krivom: i dalje 409 (zaštita ide prije provjere potvrde)", async () => {
    requireProf.mockResolvedValue(DEMO_WORLD);
    for (const body of [{}, { confirm: "nešto drugo" }]) {
      expect((await deleteGameRoute(deleteReq(body), gameCtx)).status).toBe(409);
    }
    expect(deleteGame).not.toHaveBeenCalled();
  });

  it("DEMO_JOIN_CODE iz okoline mijenja koja je igra demo", async () => {
    vi.stubEnv("DEMO_JOIN_CODE", "DEMO77");
    requireProf.mockResolvedValue({ ...WORLD, joinCode: "DEMO77" });
    expect((await deleteGameRoute(deleteReq({ confirm: "DEMO77" }), gameCtx)).status).toBe(409);
    requireProf.mockResolvedValue(DEMO_WORLD); // KVRNDM više nije demo kod
    expect((await deleteGameRoute(deleteReq({ confirm: DEMO_WORLD.name }), gameCtx)).status).toBe(200);
    expect(deleteGame).toHaveBeenCalledTimes(1);
  });

  it("igra računa DEMO_PROF_EMAIL: 409 i ništa se ne briše", async () => {
    vi.stubEnv("DEMO_PROF_EMAIL", "Demo@Skola.hr");
    requireProf.mockResolvedValue(DEMO_PROF_WORLD);
    ownerRows.mockResolvedValue([{ email: "demo@skola.hr" }]);
    const res = await deleteGameRoute(deleteReq({ confirm: DEMO_PROF_WORLD.name }), gameCtx);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Demo igra je zaštićena od brisanja." });
    expect(deleteGame).not.toHaveBeenCalled();
  });

  it("igra drugog profesora, uz postavljen DEMO_PROF_EMAIL, briše se kao i prije", async () => {
    vi.stubEnv("DEMO_PROF_EMAIL", "demo@skola.hr");
    requireProf.mockResolvedValue(DEMO_PROF_WORLD);
    ownerRows.mockResolvedValue([{ email: "prof@skola.hr" }]);
    const res = await deleteGameRoute(deleteReq({ confirm: DEMO_PROF_WORLD.name }), gameCtx);
    expect(res.status).toBe(200);
    expect(deleteGame).toHaveBeenCalledWith(DEMO_PROF_WORLD);
  });

  it("bez DEMO_PROF_EMAIL igra s vlasnikom se briše bez upita bazi", async () => {
    requireProf.mockResolvedValue(DEMO_PROF_WORLD);
    const res = await deleteGameRoute(deleteReq({ confirm: DEMO_PROF_WORLD.name }), gameCtx);
    expect(res.status).toBe(200);
    expect(ownerRows).not.toHaveBeenCalled();
  });

  it("pad baze pri provjeri vlasnika: 500 i ništa se ne briše", async () => {
    vi.stubEnv("DEMO_PROF_EMAIL", "demo@skola.hr");
    requireProf.mockResolvedValue(DEMO_PROF_WORLD);
    ownerRows.mockRejectedValue(new Error("connection refused"));
    const res = await deleteGameRoute(deleteReq({ confirm: DEMO_PROF_WORLD.name }), gameCtx);
    expect(res.status).toBe(500);
    expect(deleteGame).not.toHaveBeenCalled();
  });

  it("tko nije profesor demo igre dobiva 403, ne 409 (ne otkriva da je igra demo)", async () => {
    requireProf.mockRejectedValue(new HttpError(403, "Samo profesor ove igre"));
    const res = await deleteGameRoute(deleteReq({ confirm: DEMO_WORLD.name }), gameCtx);
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/prof/[worldId]/companies/[id] (uklanjanje studenta)", () => {
  it("nije profesor igre: 403 i student ostaje", async () => {
    requireProf.mockRejectedValue(new HttpError(403, "Samo profesor ove igre"));
    const res = await removeStudentRoute(deleteReq(), studentCtx);
    expect(res.status).toBe(403);
    expect(removeStudent).not.toHaveBeenCalled();
  });

  it("profesor igre: briše tvrtku iz adrese u igri koju je vratio requireProf", async () => {
    requireProf.mockResolvedValue(WORLD);
    const res = await removeStudentRoute(deleteReq(), studentCtx);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(requireProf).toHaveBeenCalledWith(WORLD.id);
    expect(removeStudent).toHaveBeenCalledWith(WORLD, COMPANY);
  });

  it("tvrtka iz druge igre ili nepostojeća: 404 iz removeStudent", async () => {
    requireProf.mockResolvedValue(WORLD);
    removeStudent.mockRejectedValue(new HttpError(404, "Ta tvrtka nije u ovoj igri"));
    const res = await removeStudentRoute(deleteReq(), studentCtx);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Ta tvrtka nije u ovoj igri" });
  });
});

describe("DELETE /api/prof/[worldId]/companies/[id] (zaštita demo igre)", () => {
  it("igra s demo kodom: 409 s porukom i student ostaje", async () => {
    requireProf.mockResolvedValue(DEMO_WORLD);
    const res = await removeStudentRoute(deleteReq(), studentCtx);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Demo igra je zaštićena od brisanja." });
    expect(removeStudent).not.toHaveBeenCalled();
  });

  it("igra računa DEMO_PROF_EMAIL: 409 i student ostaje", async () => {
    vi.stubEnv("DEMO_PROF_EMAIL", "demo@skola.hr");
    requireProf.mockResolvedValue(DEMO_PROF_WORLD);
    ownerRows.mockResolvedValue([{ email: "demo@skola.hr" }]);
    expect((await removeStudentRoute(deleteReq(), studentCtx)).status).toBe(409);
    expect(removeStudent).not.toHaveBeenCalled();
  });

  it("igra drugog profesora, uz postavljen DEMO_PROF_EMAIL: student se uklanja kao i prije", async () => {
    vi.stubEnv("DEMO_PROF_EMAIL", "demo@skola.hr");
    requireProf.mockResolvedValue(DEMO_PROF_WORLD);
    ownerRows.mockResolvedValue([{ email: "prof@skola.hr" }]);
    expect((await removeStudentRoute(deleteReq(), studentCtx)).status).toBe(200);
    expect(removeStudent).toHaveBeenCalledWith(DEMO_PROF_WORLD, COMPANY);
  });

  it("tko nije profesor demo igre dobiva 403, ne 409", async () => {
    requireProf.mockRejectedValue(new HttpError(403, "Samo profesor ove igre"));
    expect((await removeStudentRoute(deleteReq(), studentCtx)).status).toBe(403);
  });
});
