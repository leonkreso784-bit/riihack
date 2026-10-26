// sendMail (L18, #303) bez baze: lažni `db` gradi prave upite (drizzle.mock), ali ih ne šalje; test čita SQL
// i poredak odgovora (400, 409, 404, 400 za bota, 429, 200). Bazu ne dira.
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  batch: vi.fn(),
  companies: [] as { company: { id: string; name: string; kind: string } }[],
  counts: { total: 0, recent: 0, toRecipient: 0 },
  wheres: [] as unknown[],
  limits: [] as number[],
  rows: [] as unknown[][], // odgovori za select-ove koji nisu brojači (listMailWindow)
}));

vi.mock("@/db", async () => {
  const { drizzle } = await import("drizzle-orm/neon-http");
  const schema = await import("@/db/schema");
  const real = drizzle.mock({ schema });
  const select = () => {
    const q: Record<string, unknown> = {};
    for (const m of ["from", "orderBy"]) q[m] = () => q;
    q.where = (w: unknown) => (h.wheres.push(w), q);
    q.limit = (n: number) => (h.limits.push(n), q);
    q.then = (ok: (v: unknown) => unknown) => Promise.resolve(h.rows.shift() ?? [h.counts]).then(ok);
    return q;
  };
  return { db: Object.assign(Object.create(real), { batch: h.batch, select }), schema };
});
vi.mock("@/db/queries", () => ({
  isUuid: (s: string) => /^[0-9a-f-]{36}$/.test(s),
  listCompanies: async () => h.companies,
}));

import { PgDialect } from "drizzle-orm/pg-core";
import { MAIL_PER_GAME, MAIL_PER_MINUTE, MAIL_PER_RECIPIENT, MAIL_WINDOW_SECONDS } from "@/lib/engine/mail-send";
import { MAIL_LIMIT, MAIL_OTHER_LIMIT, listMailWindow, sendMail } from "./mail";

const ME = "11111111-1111-4111-8111-111111111111";
const IVAN = "22222222-2222-4222-8222-222222222222";
const BOT = "33333333-3333-4333-8333-333333333333";
const ctx = { world: { id: "44444444-4444-4444-8444-444444444444", status: "running", round: 2 }, company: { id: ME } };
const ok = { toCompanyId: IVAN, subject: "Suradnja", body: "Imate li slobodnih soba?" };

const stored = (over: Record<string, unknown> = {}) => ({
  id: "m1", worldId: ctx.world.id, threadId: "t1", kind: "hotel", fromCompanyId: ME, toCompanyId: IVAN, businessId: null,
  subject: "Suradnja", body: "Imate li slobodnih soba?", contractId: null, referralId: null, readAt: null,
  createdAt: new Date("2026-10-26T10:00:00Z"), ...over,
});

beforeEach(() => {
  h.batch.mockReset();
  h.wheres = [];
  h.limits = [];
  h.rows = [];
  h.counts = { total: 0, recent: 0, toRecipient: 0 };
  h.companies = [
    { company: { id: ME, name: "Hotel Ana", kind: "hotel" } },
    { company: { id: IVAN, name: "Vila Ivan", kind: "hotel" } },
    { company: { id: BOT, name: "Hotel Robot (bot)", kind: "bot" } },
  ];
});

type Item = { toSQL?: () => { sql: string; params: unknown[] }; getQuery?: () => { sql: string; params: unknown[] } };
const queryOf = (item: Item) => (item.toSQL ?? item.getQuery)!.call(item);
const batchOf = (call = 0) => (h.batch.mock.calls[call][0] as Item[]).map(queryOf);
const inserts = (row: unknown) => h.batch.mockResolvedValue([{}, row === null ? [] : [row], {}]);
const fails = async (input: unknown, c = ctx) => sendMail(c, input).then(() => null, (e: unknown) => e as { status: number; message: string });

describe("sendMail: poredak odgovora", () => {
  it("400 za neispravan oblik, bez ikakvog upita", async () => {
    const err = await fails({ ...ok, subject: "  " });
    expect(err).toMatchObject({ status: 400, message: expect.stringMatching(/Naslov/) });
    expect(h.batch).not.toHaveBeenCalled();
  });

  it("409 kad igra nije u tijeku", async () => {
    expect(await fails(ok, { ...ctx, world: { ...ctx.world, status: "lobby" } })).toMatchObject({ status: 409 });
    expect(h.batch).not.toHaveBeenCalled();
  });

  it("404 za hotel koji nije u ovoj igri (i za izmišljen id), bez upisa", async () => {
    expect(await fails({ ...ok, toCompanyId: "55555555-5555-4555-8555-555555555555" })).toMatchObject({ status: 404, message: "Hotel nije pronađen" });
    expect(await fails({ ...ok, toCompanyId: "nije-uuid" })).toMatchObject({ status: 404 });
    expect(h.batch).not.toHaveBeenCalled();
  });

  it("400 za hotel koji vodi računalo, bez upisa", async () => {
    expect(await fails({ ...ok, toCompanyId: BOT })).toMatchObject({ status: 400, message: "Hotel vodi računalo i ne čita poruke" });
    expect(h.batch).not.toHaveBeenCalled();
  });

  it("400 (oblik) ima prednost pred 409, a 409 pred 404", async () => {
    const lobby = { ...ctx, world: { ...ctx.world, status: "lobby" } };
    expect(await fails({ ...ok, subject: "" }, lobby)).toMatchObject({ status: 400 });
    expect(await fails({ ...ok, toCompanyId: "55555555-5555-4555-8555-555555555555" }, lobby)).toMatchObject({ status: 409 });
  });
});

describe("sendMail: upis", () => {
  it("jedna transakcija: zaključavanje po pošiljatelju, poruka s granicama, događaj; vraća poruku s imenima", async () => {
    inserts(stored());
    const msg = await sendMail(ctx, { ...ok, fromCompanyId: "netko-drugi", worldId: "x" });
    expect(h.batch).toHaveBeenCalledOnce();
    const [lock, insert, event] = batchOf();
    expect(lock.sql).toBe("select pg_advisory_xact_lock(hashtext($1))");
    expect(lock.params).toEqual([`mail.send:${ME}`]);
    expect(insert.sql).toMatch(/^insert into "mail" .* from "companies" where /);
    expect(insert.params).toContain(IVAN);
    expect(insert.params).not.toContain("netko-drugi"); // pošiljatelj je uvijek hotel iz kolačića
    expect(event.sql).toMatch(/^insert into "events" .* 'mail\.sent' .* from "mail" where "mail"\."id" = \$2$/);
    expect(msg).toMatchObject({ kind: "hotel", mine: true, read: true, fromName: "Hotel Ana", toName: "Vila Ivan", subject: "Suradnja" });
  });

  it("granice su u samom upisu: igra, primatelj i minuta kao podupiti uz brojke iz pravila", async () => {
    inserts(stored());
    await sendMail(ctx, ok);
    const insert = batchOf()[1];
    expect(insert.sql.match(/\(select count\(\*\) from "mail"/g)).toHaveLength(3);
    expect(insert.sql).toContain(`"mail"."to_company_id" = $`);
    expect(insert.sql).toContain(`make_interval(secs => $`);
    expect(insert.params.filter((p) => typeof p === "number")).toEqual([MAIL_PER_GAME, MAIL_PER_RECIPIENT, MAIL_WINDOW_SECONDS, MAIL_PER_MINUTE]);
    // primatelj mora biti u istoj igri i ne smije biti bot, i to u istoj naredbi
    expect(insert.sql).toContain(`"companies"."world_id" = $`);
    expect(insert.sql).toContain(`"companies"."kind" <> $`);
    expect(insert.params).toEqual(expect.arrayContaining([ctx.world.id, "bot"]));
  });

  it("događaj mail.sent se upisuje samo uz upisanu poruku (SELECT iz mail po id-u te poruke)", async () => {
    inserts(stored());
    await sendMail(ctx, ok);
    const [, insert, event] = batchOf();
    const mailId = insert.params[0];
    expect(event.params).toEqual([ctx.world.round, mailId]);
  });
});

describe("sendMail: 429", () => {
  it("bez upisanog retka: poruka iz brojača (minuta)", async () => {
    inserts(null);
    h.counts = { total: 5, recent: MAIL_PER_MINUTE, toRecipient: 5 };
    expect(await fails(ok)).toMatchObject({ status: 429, message: expect.stringMatching(/zadnjoj minuti/) });
  });

  it("bez upisanog retka: poruka iz brojača (primatelj, pa igra)", async () => {
    inserts(null);
    h.counts = { total: 20, recent: 0, toRecipient: MAIL_PER_RECIPIENT };
    expect(await fails(ok)).toMatchObject({ status: 429, message: expect.stringMatching(/Ovom si hotelu/) });
    h.counts = { total: MAIL_PER_GAME, recent: 0, toRecipient: 0 };
    expect(await fails(ok)).toMatchObject({ status: 429, message: expect.stringMatching(/u ovoj igri/) });
  });

  it("bez upisanog retka, a brojači ispod granica (klizni prozor se u međuvremenu pomaknuo): općenita poruka, ne 500", async () => {
    inserts(null);
    expect(await fails(ok)).toMatchObject({ status: 429, message: "Poruka nije poslana. Pokušaj ponovno." });
  });
});

describe("listMailWindow (prozor pošte u GET /api/me)", () => {
  const mailRow = (id: string, kind: string, at: string) => stored({ id, kind, createdAt: new Date(at) });

  it("poruke hotela i ostala pošta traže se odvojeno, svaka sa svojom granicom", async () => {
    h.rows = [[], []];
    await listMailWindow(ME);
    expect([...h.limits].sort((a, b) => a - b)).toEqual([MAIL_LIMIT, MAIL_OTHER_LIMIT]);
    const dialect = new PgDialect();
    const conditions = h.wheres.map((w) => dialect.sqlToQuery(w as never));
    // jedan upit samo za kind = hotel, drugi za kind <> hotel; oba samo za poštu ovog hotela
    expect(conditions.map((c) => /"mail"."kind" (=|<>) \$/.exec(c.sql)?.[1]).sort()).toEqual(["<>", "="]);
    for (const c of conditions) expect(c.params).toEqual(expect.arrayContaining([ME, "hotel"]));
  });

  it("spojeno najnovije prvo: ponuda agencije ostaje i kad je poruka hotela puno", async () => {
    const hotel = Array.from({ length: MAIL_LIMIT }, (_, i) => mailRow(`h${i}`, "hotel", `2026-10-26T12:${String(59 - i).padStart(2, "0")}:00Z`));
    const offer = mailRow("ponuda", "agency", "2026-10-26T08:00:00Z");
    h.rows = [hotel, [offer]];
    const rows = await listMailWindow(ME);
    expect(rows).toHaveLength(MAIL_LIMIT + 1);
    expect(rows.at(-1)?.id).toBe("ponuda");
    expect(rows[0].id).toBe("h0");
  });
});
