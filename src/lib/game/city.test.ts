import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { companies, roundReports } from "@/db/schema";
import type { ContractRow } from "@/db/schema";
import { CITY, CONTRACTS, getBusiness } from "@/content";
import { HttpError } from "@/lib/http";
import { MARKETING_MAX, PRICE_MAX, PRICE_MIN } from "@/lib/rules";
import type { LeaderboardRow } from "@/lib/types";
import {
  activeTemplates,
  buildNews,
  contractTerms,
  metricsPlus,
  parsePlan,
  sumEffects,
  toCityLinks,
  toCityView,
  toContractView,
  toPlan,
  type NewsEvent,
} from "./city";

const agency = CONTRACTS.find((c) => c.nights > 0)!;
const laundry = CONTRACTS.find((c) => c.businessId === "praonica-kvarner")!;

function contract(over: Partial<ContractRow>): ContractRow {
  return {
    id: "k1",
    worldId: "w",
    companyId: "ana",
    templateId: agency.id,
    roundOffered: 2,
    status: "offered",
    activeFrom: null,
    activeTo: null,
    counterPricePerNight: null,
    counterMonthlyCost: null,
    agreedPricePerNight: null,
    agreedMonthlyCost: null,
    negotiated: false,
    ...over,
  };
}

function planError(body: { price?: unknown; marketing?: unknown; investments?: unknown }): HttpError | undefined {
  try {
    parsePlan(body);
  } catch (err) {
    return err as HttpError;
  }
  return undefined;
}

describe("parsePlan", () => {
  it("prima cijele brojeve u rasponu, i rubove", () => {
    expect(parsePlan({ price: 60, marketing: 0 })).toEqual({ price: 60, marketing: 0 });
    expect(parsePlan({ price: PRICE_MIN, marketing: MARKETING_MAX })).toEqual({ price: PRICE_MIN, marketing: MARKETING_MAX });
    expect(parsePlan({ price: PRICE_MAX, marketing: 1000 })).toEqual({ price: PRICE_MAX, marketing: 1000 });
  });

  it("cijena izvan raspona, decimalna ili nije broj → 400 s porukom na hrvatskom", () => {
    for (const price of [PRICE_MIN - 1, PRICE_MAX + 1, 60.5, "60", undefined, null, Number.NaN]) {
      const err = planError({ price, marketing: 0 });
      expect(err).toBeInstanceOf(HttpError);
      expect(err?.status).toBe(400);
      expect(err?.message).toBe("Cijena noćenja mora biti cijeli broj od 30 € do 400 €");
    }
  });

  it("marketing izvan raspona ili decimalan → 400", () => {
    for (const marketing of [-1, MARKETING_MAX + 1, 1.5, "100", undefined]) {
      const err = planError({ price: 80, marketing });
      expect(err?.status).toBe(400);
      expect(err?.message).toBe("Marketing mora biti cijeli broj od 0 € do 5.000 €");
    }
  });

  it("ulaganja po odjelu: bez njih ništa, ispravna bez nula, neispravna → 400", () => {
    expect(parsePlan({ price: 80, marketing: 0 })).not.toHaveProperty("investments");
    expect(parsePlan({ price: 80, marketing: 0, investments: { maintenance: 2000, reception: 0 } })).toEqual({
      price: 80,
      marketing: 0,
      investments: { maintenance: 2000 },
    });
    for (const investments of [{ kitchen: 5000 }, { kitchen: 1.5 }, { spa: 100 }, null, "1000"]) {
      const err = planError({ price: 80, marketing: 0, investments });
      expect(err?.status).toBe(400);
      expect(err?.message).toBe("Ulaganje po odjelu mora biti cijeli broj od 0 do 3.000 €");
    }
  });
});

describe("toContractView", () => {
  it("ponuda: uvjeti iz predloška i ime tvrtke, bez roka", () => {
    const v = toContractView(contract({}));
    expect(v).toMatchObject({
      id: "k1",
      templateId: agency.id,
      businessName: getBusiness(agency.businessId).name,
      businessKind: "agency",
      title: agency.title,
      nights: agency.nights,
      pricePerNight: agency.pricePerNight,
      durationRounds: agency.durationRounds,
      roundOffered: 2,
      status: "offered",
    });
    expect(v.activeUntilRound).toBeUndefined();
  });

  it("prihvaćen ugovor ima activeUntilRound = activeTo", () => {
    const v = toContractView(contract({ status: "accepted", activeFrom: 2, activeTo: 3 }));
    expect(v.status).toBe("accepted");
    expect(v.activeUntilRound).toBe(3);
  });
});

describe("pregovaranje u pogledu i obračunu (L15)", () => {
  it("protuponuda agencije: vidljiva uz ponudu, cijena ostaje iz ponude", () => {
    const v = toContractView(contract({ negotiated: true, counterPricePerNight: 80, counterMonthlyCost: 0 }));
    expect(v).toMatchObject({ negotiated: true, counterPricePerNight: 80, counterMonthlyCost: 0, pricePerNight: agency.pricePerNight });
  });

  it("dogovorene vrijednosti zamjenjuju predložak u pogledu i u obračunu", () => {
    const row = contract({ status: "accepted", activeFrom: 2, activeTo: 3, negotiated: true, agreedPricePerNight: 80, agreedMonthlyCost: 0 });
    expect(toContractView(row).pricePerNight).toBe(80);
    expect(contractTerms(row)).toMatchObject({ id: agency.id, nights: agency.nights, pricePerNight: 80 });
    expect(activeTemplates([row], 2)[0].pricePerNight).toBe(80);
    const cheap = contract({ templateId: laundry.id, status: "accepted", activeFrom: 2, activeTo: 3, agreedMonthlyCost: 1300, agreedPricePerNight: 0 });
    expect(activeTemplates([cheap], 3)[0].monthlyCost).toBe(1300);
  });

  it("bez pregovaranja nema novih polja", () => {
    const v = toContractView(contract({}));
    expect(v.negotiated).toBeUndefined();
    expect(v.counterPricePerNight).toBeUndefined();
    expect(contractTerms(contract({}))).toEqual(agency);
  });
});

describe("toCityLinks i toCityView", () => {
  const rows = [
    contract({ id: "a", status: "accepted", activeFrom: 2, activeTo: 3 }),
    contract({ id: "b", status: "accepted", activeFrom: 2, activeTo: 2, templateId: laundry.id, companyId: "ivan" }),
    contract({ id: "c", status: "offered", templateId: laundry.id }),
    contract({ id: "d", status: "accepted", activeFrom: 3, activeTo: 3 }), // ista tvrtka i hotel kao "a"
  ];

  it("samo ugovori aktivni u krugu, bez ponavljanja linije", () => {
    expect(toCityLinks(rows, 2)).toEqual([
      { companyId: "ana", businessId: agency.businessId },
      { companyId: "ivan", businessId: "praonica-kvarner" },
    ]);
    expect(toCityLinks(rows, 3)).toEqual([{ companyId: "ana", businessId: agency.businessId }]);
    expect(toCityLinks(rows, 4)).toEqual([]);
  });

  it("karta: sve gradske tvrtke, hoteli s ljestvice, linije", () => {
    const hotels: LeaderboardRow[] = [
      { companyId: "ana", hotelName: "Vila Ana", playerName: "Ana", place: "Rijeka", progress: 5, closedRound: 1, cash: 20000, roundGain: 5 },
    ];
    const links = toCityLinks(rows, 2);
    expect(toCityView(hotels, links)).toEqual({ businesses: CITY, hotels, links });
    expect(toCityView(hotels).links).toEqual([]);
    expect(toCityView([]).businesses).toHaveLength(6);
  });
});

describe("buildNews", () => {
  const names = { ana: "Vila Ana", ivan: "Hotel Lungomare" };
  const at = (min: number) => new Date(Date.UTC(2026, 9, 24, 14, min));
  const ev = (type: string, round: number, min: number, companyId: string | null, payload: unknown): NewsEvent => ({
    type,
    round,
    companyId,
    payload,
    at: at(min),
  });

  it("tekstovi iz plana, najnovije prvo, nepoznati događaji preskočeni", () => {
    const news = buildNews(
      [
        ev("player.joined", 0, 1, "ana", { name: "Ana", hotelName: "Vila Ana", place: "Rijeka" }),
        ev("round.opened", 1, 5, null, {}),
        ev("contract.accepted", 1, 12, "ivan", { businessName: "Agencija Adria" }),
        ev("contract.rejected", 1, 13, "ana", { businessName: "Pekara Trsat" }),
        ev("answer.saved", 1, 14, "ana", {}),
        ev("round.settled", 3, 28, null, { topCompanyId: "ivan", topHotelName: "Stari naziv", occupancyPct: 94 }),
      ],
      names,
    );
    expect(news).toEqual([
      { at: at(28).toISOString(), text: "Kolovoz: najpopunjeniji je Hotel Lungomare (94 %)" },
      { at: at(12).toISOString(), text: "Novi ugovor: Hotel Lungomare i Agencija Adria" },
      { at: at(5).toISOString(), text: "Počinje lipanj" },
      { at: at(1).toISOString(), text: "Novi hotel u gradu: Vila Ana (Rijeka)" },
    ]);
  });

  it("bez imena u mapi koristi ime iz događaja; bez podataka preskače", () => {
    const news = buildNews(
      [
        ev("player.joined", 0, 1, "novi", { hotelName: "Hotel Novi", place: "Opatija" }),
        ev("round.settled", 1, 2, null, { topCompanyId: "nema", topHotelName: "Hotel Novi", occupancyPct: 60 }),
        ev("round.settled", 2, 3, null, { topCompanyId: null, topHotelName: null, occupancyPct: null }),
        ev("contract.accepted", 1, 4, "nema", {}),
      ],
      {},
    );
    expect(news.map((n) => n.text)).toEqual(["Lipanj: najpopunjeniji je Hotel Novi (60 %)", "Novi hotel u gradu: Hotel Novi (Opatija)"]);
  });

  it("najviše 10 vijesti", () => {
    const many = Array.from({ length: 15 }, (_, i) => ev("round.opened", 1 + (i % 4), i, null, {}));
    const news = buildNews(many, names);
    expect(news).toHaveLength(10);
    expect(news[0].at).toBe(at(14).toISOString());
  });
});

describe("sumEffects", () => {
  it("zbraja po ključu, izbacuje nule i nepoznate ključeve", () => {
    expect(sumEffects({ operations: 3, reviews: 1 }, { reviews: 1, finance: 0 }, { finance: -2 })).toEqual({
      operations: 3,
      reviews: 2,
      finance: -2,
    });
    expect(sumEffects({ guests: 2 }, { guests: -2 })).toEqual({});
    expect(sumEffects({ bogus: 5 } as never)).toEqual({});
  });
});

describe("toPlan", () => {
  it("spremljeni plan, inače referentna cijena soba i marketing 0", () => {
    const row = { id: "p", companyId: "ana", round: 2, price: 60, marketing: 500, investments: { kitchen: 1000 } };
    expect(toPlan(2, row, [])).toEqual({ round: 2, price: 60, marketing: 500, investments: { kitchen: 1000 } });
    expect(toPlan(2, null, [{ basePrice: 70 }, { basePrice: 90 }, { basePrice: 95 }])).toEqual({
      round: 2,
      price: 85,
      marketing: 0,
      investments: {},
    });
    expect(toPlan(1, null, [])).toEqual({ round: 1, price: PRICE_MIN, marketing: 0, investments: {} });
  });
});

describe("metricsPlus (#226: obračun ide i u tvrtku i u izvještaj mjeseca)", () => {
  const dialect = new PgDialect();

  it("piše delta u zadani jsonb stupac, rezano 0–100", () => {
    const q = dialect.sqlToQuery(metricsPlus(roundReports.metricsAfter, { finance: 5 }));
    expect(q.sql).toContain('"round_reports"."metrics_after"');
    expect(q.sql).not.toContain('"companies"');
    expect(q.sql).toContain("'{finance}'");
    expect(q.sql).toContain("least(100, greatest(0,");
    expect(q.sql).toContain("+ 5");
  });

  it("isti izraz za companies.metrics", () => {
    const q = dialect.sqlToQuery(metricsPlus(companies.metrics, { reviews: -3 }));
    expect(q.sql).toContain('"companies"."metrics"');
    expect(q.sql).toContain("+ -3");
  });

  it("preskače nule i nepoznate ključeve", () => {
    const q = dialect.sqlToQuery(metricsPlus(roundReports.metricsAfter, { finance: 0 }));
    expect(q.sql).not.toContain("jsonb_set");
  });
});
