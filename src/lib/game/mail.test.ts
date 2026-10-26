import { describe, expect, it } from "vitest";
import type { MailRow } from "@/db/schema";
import { CONTRACTS, getBusiness } from "@/content";
import { MAIL_BODY_MAX, MAIL_SUBJECT_MAX } from "@/lib/rules";
import { agencyFallback, agencyText, counterBody, mergeMailRows, offerBody, offerSubject, replySubject, termsText, toMailMessage } from "./mail";

const agency = CONTRACTS.find((c) => c.id === "adria-izletnici")!;
const laundry = CONTRACTS.find((c) => c.id === "praonica-standard")!;
const adria = getBusiness(agency.businessId);

function row(over: Partial<MailRow>): MailRow {
  return {
    id: "m1",
    worldId: "w",
    threadId: "t1",
    kind: "agency",
    fromCompanyId: null,
    toCompanyId: "ana",
    businessId: agency.businessId,
    subject: "Ponuda",
    body: "Tekst",
    contractId: "k1",
    referralId: null,
    readAt: null,
    createdAt: new Date("2026-10-24T20:00:00Z"),
    ...over,
  };
}

describe("tekstovi pošte", () => {
  it("uvjeti: noćenja po cijeni ili naknada", () => {
    expect(termsText(agency)).toBe("60 noćenja mjesečno po 70 €");
    expect(termsText(laundry)).toBe("naknada 1.500 € mjesečno");
    expect(termsText({ nights: 40, pricePerNight: 80, monthlyCost: 900 })).toBe("40 noćenja mjesečno po 80 €, naknada 900 € mjesečno");
  });

  it("e-mail ponude: naslov, hotel, uvjeti, trajanje i potpis agencije", () => {
    expect(offerSubject(agency)).toBe(`Ponuda: ${agency.title}`);
    const body = offerBody(agency, adria, "Hotel Ana");
    expect(body).toContain("Hotel Ana");
    expect(body).toContain("60 noćenja mjesečno po 70 €");
    expect(body).toContain("2 mjeseca");
    expect(body).toContain(adria.name);
    expect(body.length).toBeLessThanOrEqual(MAIL_BODY_MAX);
  });

  it("odgovor: Re: jednom, rezano na najviše znakova", () => {
    expect(replySubject("Ponuda: X")).toBe("Re: Ponuda: X");
    expect(replySubject("Re: Ponuda: X")).toBe("Re: Ponuda: X");
    expect(replySubject("y".repeat(200)).length).toBe(MAIL_SUBJECT_MAX);
  });

  it("protuponuda: brojka uvijek u tekstu, s porukom ili bez", () => {
    const proposal = { nights: 60, pricePerNight: 80, monthlyCost: 0 };
    expect(counterBody(proposal, "Hotel Ana")).toContain("60 noćenja mjesečno po 80 €");
    const withNote = counterBody(proposal, "Hotel Ana", "  Vjerni smo partneri. ");
    expect(withNote.startsWith("Vjerni smo partneri.")).toBe(true);
    expect(withNote).toContain("po 80 €");
  });

  it("rezervni odgovor agencije po ishodu, samo s brojkama motora", async () => {
    const base = { business: adria, contract: agency };
    expect(agencyFallback({ ...base, outcome: "accepted", agreed: { pricePerNight: 80, monthlyCost: 0 } })).toContain("prihvaćamo");
    const countered = agencyFallback({ ...base, outcome: "countered", agreed: { pricePerNight: 80, monthlyCost: 0 } });
    expect(countered).toContain("po 80 €");
    expect(agencyFallback({ ...base, outcome: "rejected", agreed: { pricePerNight: 70, monthlyCost: 0 } })).toContain("odustajemo");
    expect(await agencyText({ ...base, outcome: "rejected", agreed: { pricePerNight: 70, monthlyCost: 0 } })).toContain(adria.name);
  });
});

describe("toMailMessage", () => {
  it("primljeno od agencije: ime agencije i hotela, nepročitano, poveznica na ugovor", () => {
    expect(toMailMessage(row({}), "ana", { ana: "Hotel Ana" })).toEqual({
      id: "m1",
      kind: "agency",
      threadId: "t1",
      fromName: adria.name,
      toName: "Hotel Ana",
      subject: "Ponuda",
      body: "Tekst",
      at: "2026-10-24T20:00:00.000Z",
      read: false,
      mine: false,
      contractId: "k1",
    });
  });

  it("pročitano kad postoji read_at; poslano je moje i uvijek pročitano", () => {
    expect(toMailMessage(row({ readAt: new Date() }), "ana", {}).read).toBe(true);
    const sent = toMailMessage(row({ fromCompanyId: "ana", toCompanyId: null }), "ana", { ana: "Hotel Ana" });
    expect(sent).toMatchObject({ mine: true, read: true, fromName: "Hotel Ana", toName: adria.name });
  });

  it("poruka među hotelima i suradnja (L18, L19)", () => {
    const m = toMailMessage(
      row({ kind: "hotel", fromCompanyId: "ivo", toCompanyId: "ana", businessId: null, contractId: null, referralId: "r1" }),
      "ana",
      { ana: "Hotel Ana", ivo: "Vila Ivo" },
    );
    expect(m).toMatchObject({ kind: "hotel", fromName: "Vila Ivo", toName: "Hotel Ana", referralId: "r1" });
    expect(m.contractId).toBeUndefined();
  });
});

describe("mergeMailRows (prozor pošte)", () => {
  const at = (iso: string, over: Partial<MailRow> = {}) => row({ createdAt: new Date(iso), ...over });

  it("spaja poruke hotela i ostalu poštu, najnovije prvo", () => {
    const hotel = [at("2026-10-24T20:05:00Z", { id: "h2", kind: "hotel" }), at("2026-10-24T20:01:00Z", { id: "h1", kind: "hotel" })];
    const other = [at("2026-10-24T20:03:00Z", { id: "a1" }), at("2026-10-24T19:00:00Z", { id: "a0" })];
    expect(mergeMailRows(hotel, other).map((r) => r.id)).toEqual(["h2", "a1", "h1", "a0"]);
  });

  it("ista sekunda: redoslijed po id-u silazno, kao ORDER BY created_at DESC, id DESC", () => {
    const rows = mergeMailRows([at("2026-10-24T20:00:00Z", { id: "b" })], [at("2026-10-24T20:00:00Z", { id: "c" }), at("2026-10-24T20:00:00Z", { id: "a" })]);
    expect(rows.map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("ponuda agencije ostaje u prozoru koliko god poruka hotela stiglo poslije nje", () => {
    const offer = at("2026-10-24T08:00:00Z", { id: "ponuda" });
    const flood = Array.from({ length: 30 }, (_, i) => at(`2026-10-24T12:${String(59 - i).padStart(2, "0")}:00Z`, { id: `h${i}`, kind: "hotel" }));
    const rows = mergeMailRows(flood, [offer]);
    expect(rows).toHaveLength(31);
    expect(rows.at(-1)?.id).toBe("ponuda");
  });

  it("prazne liste", () => {
    expect(mergeMailRows([], [])).toEqual([]);
  });
});
