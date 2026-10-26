import { describe, expect, it } from "vitest";
import type { AnswerRow, SituationRow } from "@/db/schema";
import type { SituationTemplate } from "@/lib/types";
import { HttpError } from "@/lib/http";
import { ROUND_CHANGED, closeRoundBlocked, parseCloseRound, roomProblemUpdates, roundResults } from "./round";

const situation = (id: string, templateId: string) => ({ id, templateId }) as SituationRow;
const answer = (a: Partial<AnswerRow>) => ({ mode: "own", text: null, quality: 1, ...a }) as AnswerRow;
const templates = [{ id: "t1", effects: { guests: 3 } }] as unknown as SituationTemplate[];

describe("roundResults", () => {
  it("napisan svoj tekst nosi written, prazan, klik, propušten i zalijepljen ne (ADR-046)", () => {
    const out = roundResults(
      [
        { situation: situation("s1", "t1"), answer: answer({ text: "Ispričat ću se i ponuditi popust." }) },
        { situation: situation("s2", "t1"), answer: answer({ text: "" }) },
        { situation: situation("s3", "t1"), answer: answer({ mode: "click", text: null, quality: 2 }) },
        { situation: situation("s4", "t1"), answer: null },
        { situation: situation("s5", "t1"), answer: answer({ text: "Zalijepljeno.", copied: true }) },
      ],
      templates,
    );
    expect(out).toEqual([
      { quality: 1, effects: { guests: 3 }, written: true },
      { quality: 1, effects: { guests: 3 }, written: false },
      { quality: 2, effects: { guests: 3 }, written: false },
      { quality: 1, effects: { guests: 3 }, written: false },
      { quality: 1, effects: { guests: 3 }, written: false },
    ]);
  });

  it("nepoznat predložak → bez učinka", () => {
    expect(roundResults([{ situation: situation("s1", "nema"), answer: null }], templates)).toEqual([
      { quality: 1, effects: {}, written: false },
    ]);
  });
});

describe("closeRoundBlocked (#266, 1: zastarjeli Završi mjesec)", () => {
  const running = (round: number) => ({ status: "running", round });

  it("zastarjeli klik: student ima lipanj na ekranu, profesor je otvorio srpanj, pa se srpanj ne zatvara", () => {
    // Student nije zatvorio lipanj sam (profesor ga je zatvorio svima): bez zaštite bi se zatvorio srpanj.
    expect(closeRoundBlocked(running(2), { closedRound: 1 }, 1)).toBe(ROUND_CHANGED);
    expect(closeRoundBlocked(running(2), { closedRound: 0 }, 1)).toBe(ROUND_CHANGED);
  });

  it("klik za mjesec koji je tekući prolazi", () => {
    expect(closeRoundBlocked(running(2), { closedRound: 1 }, 2)).toBeNull();
    expect(closeRoundBlocked(running(1), { closedRound: 0 }, 1)).toBeNull();
  });

  it("klijent iz budućnosti (veći mjesec od tekućeg) se također odbija", () => {
    expect(closeRoundBlocked(running(1), { closedRound: 0 }, 2)).toBe(ROUND_CHANGED);
  });

  it("bez broja mjeseca vrijedi tekući mjesec kao prije (stariji klijent, smoke)", () => {
    expect(closeRoundBlocked(running(2), { closedRound: 1 })).toBeNull();
  });

  it("dvoklik: tekući mjesec je već zatvoren", () => {
    expect(closeRoundBlocked(running(2), { closedRound: 2 }, 2)).toBe("Ovaj krug si već zatvorio");
    expect(closeRoundBlocked(running(2), { closedRound: 2 })).toBe("Ovaj krug si već zatvorio");
  });

  it("zastarjeli klik ima prednost pred porukom da je mjesec već zatvoren", () => {
    expect(closeRoundBlocked(running(2), { closedRound: 2 }, 1)).toBe(ROUND_CHANGED);
  });

  it("čekaonica i kraj sezone", () => {
    expect(closeRoundBlocked({ status: "lobby", round: 0 }, { closedRound: 0 }, 1)).toBe("Igra još nije počela");
    expect(closeRoundBlocked({ status: "finished", round: 4 }, { closedRound: 4 }, 4)).toBe("Sezona je gotova");
  });
});

describe("parseCloseRound", () => {
  it("bez polja nema broja mjeseca", () => {
    expect(parseCloseRound(undefined)).toBeUndefined();
    expect(parseCloseRound(null)).toBeUndefined();
  });

  it("cijeli broj od 1", () => {
    expect(parseCloseRound(1)).toBe(1);
    expect(parseCloseRound(4)).toBe(4);
  });

  it("ostalo je 400", () => {
    for (const bad of [0, -1, 1.5, "2", NaN, Infinity, true, {}, []]) {
      expect(() => parseCloseRound(bad), String(bad)).toThrow(HttpError);
    }
    try {
      parseCloseRound("2");
    } catch (e) {
      expect((e as HttpError).status).toBe(400);
    }
  });
});

describe("roomProblemUpdates (#266, 4: kasni ulaz i stanje sobe)", () => {
  const klima = { room: { type: "double", problemStatus: "broken" } } as Pick<SituationTemplate, "room">;
  const recenzija = {} as Pick<SituationTemplate, "room">;
  const byId = new Map([["klima", klima], ["recenzija", recenzija]]);

  it("situacija sa sobom postavlja stanje problema na tu sobu te tvrtke", () => {
    expect(roomProblemUpdates([{ companyId: "c1", roomNumber: "105", templateId: "klima" }], byId)).toEqual([
      { companyId: "c1", number: "105", status: "broken" },
    ]);
  });

  it("situacija bez sobe, bez broja sobe ili nepoznata ne dira nijednu sobu", () => {
    expect(
      roomProblemUpdates(
        [
          { companyId: "c1", roomNumber: null, templateId: "klima" },
          { companyId: "c1", roomNumber: "105", templateId: "recenzija" },
          { companyId: "c1", roomNumber: "105", templateId: "nepoznata" },
        ],
        byId,
      ),
    ).toEqual([]);
  });

  it("jedan zapis po umetnutoj situaciji, za svaku tvrtku posebno", () => {
    const out = roomProblemUpdates(
      [
        { companyId: "c1", roomNumber: "105", templateId: "klima" },
        { companyId: "c2", roomNumber: "204", templateId: "klima" },
      ],
      byId,
    );
    expect(out.map((u) => [u.companyId, u.number])).toEqual([["c1", "105"], ["c2", "204"]]);
  });
});
