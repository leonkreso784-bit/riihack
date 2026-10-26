import { getTableName, is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import * as authSchema from "@/db/auth-schema";
import * as schema from "@/db/schema";
import { erasurePlan, matchesDeleteConfirmation } from "./erase-plan";

// Strani ključevi iz prave Drizzle sheme: ime tablice -> imena tablica na koje upire.
const parentsOf = new Map<string, string[]>();
for (const value of [...Object.values(authSchema), ...Object.values(schema)]) {
  if (!is(value, PgTable)) continue;
  const cfg = getTableConfig(value);
  parentsOf.set(
    cfg.name,
    cfg.foreignKeys.map((fk) => getTableName(fk.reference().foreignTable)),
  );
}

/** Korijen i sve tablice koje na njega upiru, izravno ili preko drugih tablica (djeca, unuci...). */
function descendantsOf(root: string): Set<string> {
  const found = new Set([root]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const [table, parents] of parentsOf) {
      if (!found.has(table) && parents.some((p) => found.has(p))) {
        found.add(table);
        grew = true;
      }
    }
  }
  return found;
}

const tablesOf = (scope: "game" | "student", action: "delete" | "prune" = "delete") =>
  erasurePlan(scope)
    .filter((s) => s.action === action)
    .map((s): string => s.table);

describe("erasurePlan: redoslijed brisanja", () => {
  it("igra: djeca prije roditelja, na kraju tvrtke pa igra", () => {
    expect(tablesOf("game")).toEqual([
      "mail",
      "answers",
      "situations",
      "round_reports",
      "events",
      "contracts",
      "finances",
      "plans",
      "rooms",
      "players",
      "custom_situations",
      "dispatches",
      "companies",
      "worlds",
    ]);
  });

  it("student: samo ono što upire na tvrtku, zatim se čiste događaji i ciljana slanja koja ga spominju u JSON-u", () => {
    expect(tablesOf("student")).toEqual([
      "mail",
      "answers",
      "situations",
      "round_reports",
      "events",
      "contracts",
      "finances",
      "plans",
      "rooms",
      "players",
      "companies",
    ]);
    expect(tablesOf("student", "prune")).toEqual(["events", "dispatches"]);
  });

  it("student nikad ne briše razinu igre", () => {
    const deleted = tablesOf("student");
    for (const t of ["worlds", "custom_situations", "dispatches"]) expect(deleted).not.toContain(t);
  });

  it("vraća kopiju: izmjena rezultata ne mijenja plan", () => {
    erasurePlan("game").pop();
    expect(erasurePlan("game")).toHaveLength(14);
  });
});

describe("erasurePlan: usklađen s Drizzle shemom (novu tablicu s ključem na igru ili tvrtku treba dodati u plan)", () => {
  it("igra briše točno tablice koje upiru na worlds (izravno ili preko drugih)", () => {
    expect(new Set(tablesOf("game"))).toEqual(descendantsOf("worlds"));
  });

  it("student briše točno tablice koje upiru na companies (izravno ili preko drugih)", () => {
    expect(new Set(tablesOf("student"))).toEqual(descendantsOf("companies"));
  });

  it("nitko nije obrisan prije tablice koja na njega upire (strani ključ bez cascade)", () => {
    for (const scope of ["game", "student"] as const) {
      const order = tablesOf(scope);
      for (const [child, parents] of parentsOf) {
        for (const parent of parents) {
          const c = order.indexOf(child);
          const p = order.indexOf(parent);
          if (c >= 0 && p >= 0) expect(c, `${scope}: ${child} prije ${parent}`).toBeLessThan(p);
        }
      }
    }
  });

  it("računi profesora (user, session, account, knjižnica) nisu u planu", () => {
    const all = new Set([...tablesOf("game"), ...tablesOf("student")]);
    for (const t of ["user", "session", "account", "verification", "library_situations"]) expect(all.has(t)).toBe(false);
  });
});

describe("matchesDeleteConfirmation", () => {
  const world = { name: "Hotelijerstvo 3B", joinCode: "KVRNDM" };

  it("prihvaća točan naziv, bez obzira na velika slova i razmake na rubovima", () => {
    expect(matchesDeleteConfirmation(world, "Hotelijerstvo 3B")).toBe(true);
    expect(matchesDeleteConfirmation(world, "  hotelijerstvo 3b ")).toBe(true);
  });

  it("prihvaća kod igre, i malim slovima, s razmakom ili crticom", () => {
    expect(matchesDeleteConfirmation(world, "KVRNDM")).toBe(true);
    expect(matchesDeleteConfirmation(world, "kvrndm")).toBe(true);
    expect(matchesDeleteConfirmation(world, "KVR-NDM")).toBe(true);
  });

  it("odbija prazno, djelomično, tuđe i neispravne tipove", () => {
    for (const typed of ["", "   ", "Hotelijerstvo", "Hotelijerstvo 3B zima", "KVRND", "ABCDEF", undefined, null, 42, {}, ["KVRNDM"]]) {
      expect(matchesDeleteConfirmation(world, typed), String(typed)).toBe(false);
    }
  });

  it("hrvatska slova: Č i č su isto slovo", () => {
    expect(matchesDeleteConfirmation({ name: "ČAKOVEC", joinCode: "AAAAAA" }, "čakovec")).toBe(true);
  });
});
