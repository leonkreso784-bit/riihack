import { describe, expect, it } from "vitest";
import { HttpError } from "@/lib/http";
import type { SituationDraft } from "@/lib/types";
import { hasSituationTitle, libraryItemId, librarySource, prepareLibraryEntry, toLibraryItem } from "./library";

const DRAFT: SituationDraft = {
  title: "Kvar klime",
  text: "Klima u sobi ne radi, a gost je ljut i traži drugu sobu.",
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

describe("libraryItemId", () => {
  it("prefiks lib- i 12 znakova bez crtica", () => {
    expect(libraryItemId("12345678-9abc-def0-1234-56789abcdef0")).toBe("lib-123456789abc");
  });
  it("bez argumenta slučajan i različit", () => {
    const a = libraryItemId();
    expect(a).toMatch(/^lib-[0-9a-f]{12}$/);
    expect(libraryItemId()).not.toBe(a);
  });
});

describe("librarySource", () => {
  it("ai ostaje ai, sve ostalo custom", () => {
    expect(librarySource("ai")).toBe("ai");
    expect(librarySource("custom")).toBe("custom");
    expect(librarySource("bank")).toBe("custom");
  });
});

describe("prepareLibraryEntry", () => {
  it("ispravan nacrt → predložak s lib- id-om", () => {
    const { id, source, template } = prepareLibraryEntry(DRAFT, "ai", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(id).toBe("lib-aaaaaaaabbbb");
    expect(source).toBe("ai");
    expect(template.id).toBe(id);
    expect(template.title).toBe("Kvar klime");
  });
  it("neispravan nacrt → 400 s porukom iz validateDraft", () => {
    try {
      prepareLibraryEntry({ ...DRAFT, title: "x" }, "custom");
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).status).toBe(400);
      expect((e as HttpError).message).toBe("Naslov mora imati od 3 do 80 znakova");
      return;
    }
    throw new Error("očekivana HttpError");
  });
});

describe("toLibraryItem", () => {
  it("redak → LibraryItem, id iz retka, datum ISO", () => {
    const createdAt = new Date("2026-10-25T01:02:03.000Z");
    const { template } = prepareLibraryEntry(DRAFT, "custom");
    expect(toLibraryItem({ id: "lib-x", source: "ai", template: { ...template, id: "krivo" }, createdAt })).toEqual({
      id: "lib-x",
      title: "Kvar klime",
      area: "Smještaj",
      difficulty: 2,
      source: "ai",
      createdAt: "2026-10-25T01:02:03.000Z",
    });
  });
});

describe("hasSituationTitle", () => {
  it("isti naslov, bez obzira na slova i razmake", () => {
    expect(hasSituationTitle(["Buka s gradilišta"], "  buka  s Gradilišta ")).toBe(true);
  });
  it("drugi naslov ili prazan popis nije duplikat", () => {
    expect(hasSituationTitle(["Kvar klime"], "Buka s gradilišta")).toBe(false);
    expect(hasSituationTitle([], "Kvar klime")).toBe(false);
  });
});
