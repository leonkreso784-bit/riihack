import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { WorldRow } from "@/db/schema";
import { HttpError } from "@/lib/http";
import { removeStudent, eraseStatements } from "./erase";
import { erasurePlan } from "./erase-plan";

// Lažna veza: naredbe se samo grade i ispisuju (toSQL), ništa se ne šalje i ne treba DATABASE_URL.
const client = drizzle(neon("postgres://korisnik:lozinka@baza.invalid/test"), { schema });
const WORLD = "11111111-1111-4111-8111-111111111111";
const COMPANY = "22222222-2222-4222-8222-222222222222";

const sqlOf = (items: ReturnType<typeof eraseStatements>) =>
  items.map((i) => (i as unknown as { toSQL(): { sql: string; params: unknown[] } }).toSQL());

describe("eraseStatements", () => {
  it("igra: jedna naredba po koraku plana, istim redom, svaka s uvjetom i ID-jem igre", () => {
    const stmts = sqlOf(eraseStatements("game", WORLD, "", client));
    expect(stmts).toHaveLength(erasurePlan("game").length);
    const tables = stmts.map((s) => /^delete from "(\w+)"/.exec(s.sql)?.[1]);
    expect(tables).toEqual(erasurePlan("game").map((s) => s.table));
    for (const s of stmts) {
      expect(s.sql).toContain(" where ");
      expect(s.params).toContain(WORLD);
    }
  });

  it("student: svaka naredba je ograničena na igru, a sve osim brisanja praznih slanja i na tvrtku", () => {
    const stmts = sqlOf(eraseStatements("student", WORLD, COMPANY, client));
    // 11 brisanja + čišćenje događaja (1 izmjena) + čišćenje ciljanih slanja (izmjena + brisanje praznih)
    expect(stmts).toHaveLength(14);
    for (const s of stmts) {
      expect(s.sql).toContain(" where ");
      expect(s.params).toContain(WORLD);
    }
    const emptyDispatches = stmts.filter((s) => s.sql.startsWith('delete from "dispatches"'));
    expect(emptyDispatches).toHaveLength(1);
    expect(emptyDispatches[0].sql).toContain(`'[]'::jsonb`);
    for (const s of stmts.filter((x) => x !== emptyDispatches[0])) expect(s.params).toContain(COMPANY);
  });

  it("student: nijedna naredba ne dira tablicu razine igre osim ciljanih slanja", () => {
    const sql = sqlOf(eraseStatements("student", WORLD, COMPANY, client)).map((s) => s.sql);
    expect(sql.some((s) => s.startsWith('delete from "worlds"'))).toBe(false);
    expect(sql.some((s) => s.startsWith('delete from "custom_situations"'))).toBe(false);
    expect(sql.filter((s) => s.includes('"dispatches"'))).toHaveLength(2);
    // događaji se ne brišu (pripadaju igri), samo se iz najboljeg hotela briše ime
    expect(sql.filter((s) => s.startsWith('delete from "events"'))).toHaveLength(1);
    const scrub = sql.find((s) => s.startsWith('update "events"'))!;
    expect(scrub).toContain("topHotelName");
  });

  it("student: tvrtka se briše samo zajedno s uvjetom da je u toj igri", () => {
    const stmts = sqlOf(eraseStatements("student", WORLD, COMPANY, client));
    const last = stmts.find((s) => s.sql.startsWith('delete from "companies"'))!;
    expect(last.sql).toContain('"companies"."id" = $1');
    expect(last.sql).toContain('"companies"."world_id" = $2');
    expect(last.params).toEqual([COMPANY, WORLD]);
  });
});

describe("removeStudent", () => {
  it("id koji nije uuid je 404 prije bilo kakvog upita u bazu", async () => {
    const world = { id: WORLD } as WorldRow;
    await expect(removeStudent(world, "nije-uuid")).rejects.toMatchObject({ status: 404 });
    await expect(removeStudent(world, "nije-uuid")).rejects.toBeInstanceOf(HttpError);
  });
});
