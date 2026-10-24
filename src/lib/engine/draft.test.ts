import { describe, expect, it } from "vitest";
import type { SituationDraft } from "@/lib/types";
import { validateDraft } from "./draft";

const valid = (): SituationDraft => ({
  title: "Gost traži kasnu odjavu",
  text: "Gost iz sobe {soba} traži odjavu u 16 h, a soba je već prodana za večeras.",
  area: "Recepcija",
  difficulty: 2,
  character: { name: "Marko Horvat", role: "gost", personality: "uljudan, ali uporan", goal: "ostati do 16 h" },
  rubric: [
    { id: "c1", text: "Saslušao je gosta do kraja", skill: "empathy" },
    { id: "c2", text: "Ponudio je zamjensko rješenje", skill: "problemSolving" },
    { id: "c3", text: "Jasno je objasnio pravila hotela", skill: "communication" },
  ],
  options: [
    { id: "o1", text: "Ponudim spremište za prtljagu i lounge do 16 h.", criteria: ["c1", "c2"] },
    { id: "o2", text: "Kažem da to nije moguće.", criteria: [] },
  ],
  effects: { guests: 3, reviews: 2 },
  room: { type: "double", problemStatus: "occupied" },
});

describe("validateDraft", () => {
  it("ispravan nacrt → null", () => {
    expect(validateDraft(valid())).toBeNull();
  });

  it("nacrt bez opcija i bez sobe je ispravan (samo vlastiti odgovor)", () => {
    const d = valid();
    d.options = [];
    delete d.room;
    expect(validateDraft(d)).toBeNull();
  });

  it("2 kriterija → poruka", () => {
    const d = valid();
    d.rubric = d.rubric.slice(0, 2);
    d.options = [];
    expect(validateDraft(d)).toBe("Rubrika mora imati od 3 do 5 kriterija");
  });

  it("6 kriterija → poruka", () => {
    const d = valid();
    d.rubric = [1, 2, 3, 4, 5, 6].map((n) => ({ id: `c${n}`, text: `Kriterij ${n}`, skill: "ethics" as const }));
    expect(validateDraft(d)).toBe("Rubrika mora imati od 3 do 5 kriterija");
  });

  it("opcija s nepoznatim kriterijem → poruka", () => {
    const d = valid();
    d.options[0].criteria = ["c1", "c9"];
    expect(validateDraft(d)).toBe("Opcija 1 ima kriterij koji nije u rubrici");
  });

  it("bez učinaka → poruka", () => {
    const d = valid();
    d.effects = {};
    expect(validateDraft(d)).toBe("Odaberi barem jedan učinak na pokazatelje");
  });

  it("učinak izvan 1–5 ili necijeli → poruka", () => {
    for (const bad of [0, 6, 2.5, -1]) {
      const d = valid();
      d.effects = { guests: bad };
      expect(validateDraft(d)).toBe("Učinak mora biti cijeli broj od 1 do 5");
    }
  });

  it("nepoznat pokazatelj u učincima → poruka", () => {
    const d = valid();
    d.effects = { happiness: 2 } as unknown as SituationDraft["effects"];
    expect(validateDraft(d)).toBe("Nepoznat pokazatelj u učincima");
  });

  it("prekratak naslov i prekratak tekst → poruka", () => {
    expect(validateDraft({ ...valid(), title: "Ab" })).toBe("Naslov mora imati od 3 do 80 znakova");
    expect(validateDraft({ ...valid(), text: "Prekratko." })).toBe("Tekst situacije mora imati od 20 do 1500 znakova");
  });

  it("lik bez cilja → poruka", () => {
    const d = valid();
    d.character.goal = "  ";
    expect(validateDraft(d)).toBe("Ispuni lika: ime, ulogu, osobnost i cilj");
  });

  it("ponovljen id kriterija ili nepoznata vještina → poruka", () => {
    const d = valid();
    d.rubric[2].id = "c1";
    expect(validateDraft(d)).toBe("Kriteriji rubrike moraju imati različite oznake");
    const e = valid();
    e.rubric[0].skill = "magic" as never;
    expect(validateDraft(e)).toBe("Svaki kriterij treba tekst i vještinu");
  });

  it("više od 4 opcije → poruka", () => {
    const d = valid();
    d.options = [1, 2, 3, 4, 5].map((n) => ({ id: `o${n}`, text: `Opcija ${n}`, criteria: [] }));
    expect(validateDraft(d)).toBe("Situacija smije imati najviše 4 ponuđena odgovora");
  });

  it("neispravna težina ili soba → poruka", () => {
    expect(validateDraft({ ...valid(), difficulty: 7 as never })).toBe("Težina mora biti cijeli broj od 1 do 5");
    expect(validateDraft({ ...valid(), room: { type: "penthouse" as never, problemStatus: "broken" } })).toBe(
      "Neispravna soba situacije",
    );
  });

  it("smeće umjesto nacrta → poruka, ne pad", () => {
    expect(validateDraft(null as unknown as SituationDraft)).toBe("Neispravan nacrt situacije");
    expect(validateDraft({ title: "Naslov" } as unknown as SituationDraft)).not.toBeNull();
  });
});
