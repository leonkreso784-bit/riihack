import { describe, expect, it } from "vitest";
import { HttpError } from "@/lib/http";
import type { SituationDraft, SituationTemplate } from "@/lib/types";
import { buildPlaybook, parsePlaybook, rowToDraft, splitNewDrafts } from "./playbook";

const DRAFT: SituationDraft = {
  title: "Kvar klime",
  text: "Klima u sobi {soba} ne radi, a gost je ljut.",
  area: "Smještaj",
  difficulty: 2,
  character: { name: "Ana", role: "gost", personality: "nestrpljiva", goal: "hladna soba" },
  rubric: [
    { id: "c1", text: "Ispričao se", skill: "empathy" },
    { id: "c2", text: "Ponudio drugu sobu", skill: "problemSolving" },
    { id: "c3", text: "Javio održavanju", skill: "communication" },
  ],
  options: [],
  effects: { guests: 3 },
};

function message(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(HttpError);
    expect((e as HttpError).status).toBe(400);
    return (e as HttpError).message;
  }
  throw new Error("očekivana HttpError");
}

const body = (over: Record<string, unknown> = {}) => ({
  version: 1,
  name: "Moja igra",
  settings: { autoDraw: false },
  situations: [DRAFT],
  ...over,
});

describe("rowToDraft i buildPlaybook", () => {
  it("izbacuje id iz predloška", () => {
    const template: SituationTemplate = { id: "custom-abc", ...DRAFT };
    expect(rowToDraft({ template })).toEqual(DRAFT);
    expect("id" in rowToDraft({ template })).toBe(false);
  });

  it("playbook nosi ime, postavke i situacije redom", () => {
    const rows = [{ template: { id: "custom-1", ...DRAFT } }, { template: { id: "custom-2", ...DRAFT, title: "Druga" } }];
    const p = buildPlaybook("Igra", false, rows);
    expect(p.version).toBe(1);
    expect(p.name).toBe("Igra");
    expect(p.settings).toEqual({ autoDraw: false });
    expect(p.situations.map((s) => s.title)).toEqual(["Kvar klime", "Druga"]);
  });
});

describe("parsePlaybook", () => {
  it("prihvaća ispravan playbook, i bez situacija", () => {
    expect(parsePlaybook(body()).situations).toHaveLength(1);
    expect(parsePlaybook(body({ situations: [] })).situations).toEqual([]);
  });

  it("odbija krivu inačicu, ime, postavke i popis", () => {
    expect(message(() => parsePlaybook(body({ version: 2 })))).toMatch(/inačica/);
    expect(message(() => parsePlaybook(body({ name: 5 })))).toMatch(/ime/);
    expect(message(() => parsePlaybook(body({ settings: { autoDraw: "da" } })))).toMatch(/autoDraw/);
    expect(message(() => parsePlaybook(body({ settings: null })))).toMatch(/autoDraw/);
    expect(message(() => parsePlaybook(body({ situations: "x" })))).toMatch(/0 do 30/);
    expect(message(() => parsePlaybook(body({ situations: Array(31).fill(DRAFT) })))).toMatch(/0 do 30/);
  });

  it("neispravna situacija daje 'Situacija N: poruka'", () => {
    const bad = { ...DRAFT, title: "x" };
    expect(message(() => parsePlaybook(body({ situations: [DRAFT, bad] })))).toBe(
      "Situacija 2: Naslov mora imati od 3 do 80 znakova",
    );
  });
});

describe("splitNewDrafts", () => {
  const other = { ...DRAFT, title: "Pokvaren lift" };

  it("preskače situacije čiji naslov već postoji u igri (bez razlike u velikim slovima)", () => {
    const r = splitNewDrafts(["kvar  klime"], [DRAFT, other]);
    expect(r.fresh).toEqual([other]);
    expect(r.skipped).toBe(1);
  });

  it("ponovni uvoz istog playbooka ne dodaje ništa", () => {
    const r = splitNewDrafts([DRAFT.title, other.title], [DRAFT, other]);
    expect(r.fresh).toEqual([]);
    expect(r.skipped).toBe(2);
  });

  it("duplikat unutar istog playbooka uvozi samo jednom", () => {
    const r = splitNewDrafts([], [DRAFT, DRAFT]);
    expect(r.fresh).toHaveLength(1);
    expect(r.skipped).toBe(1);
  });
});
