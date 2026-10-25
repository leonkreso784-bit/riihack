// Review 25.10. (GAP1-01/IGRA-B-01/UI-STUDENT-10/GAP3-04, IGRA-B-02, GAP4-04/IGRA-B-09, IGRA-C-01 UI half): the Plan page offer list.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ContractView } from "@/lib/types";
import { ContractOffers } from "./contract-offers";

const base = {
  id: "c1", templateId: "praonica-standard", businessName: "Praonica Kvarner", businessKind: "laundry", title: "Pranje rublja", text: "t",
  monthlyCost: 1500, nights: 0, pricePerNight: 0, durationRounds: 2, roundOffered: 1, status: "accepted", activeUntilRound: 2,
} as ContractView;
const html = (contracts: ContractView[], round: number) =>
  renderToStaticMarkup(createElement(ContractOffers, { contracts, round } as Parameters<typeof ContractOffers>[0])).replace(/<[^>]+>/g, " ");

describe("ContractOffers", () => {
  it("month 3: a contract that ran in months 1 and 2 is not listed as active", () => {
    expect(html([base], 3)).not.toContain("Aktivni ugovori");
  });
  it("month 2: the same contract is still active", () => {
    expect(html([base], 2)).toContain("Aktivni ugovori");
  });
  it("a countered offer shows the agency's counter, which is what Prihvati signs", () => {
    const countered = { ...base, status: "offered", activeUntilRound: undefined, roundOffered: 2, negotiated: true, counterMonthlyCost: 1300 } as ContractView;
    expect(html([countered], 2)).toContain("1.300");
  });
  it("an offer in the last month does not promise two months", () => {
    const last = { ...base, status: "offered", activeUntilRound: undefined, roundOffered: 4 } as ContractView;
    expect(html([last], 4)).not.toContain("2 mjeseca");
  });
  it("an offer of an earlier month (cannot be decided any more) is not shown", () => {
    const stale = { ...base, status: "offered", activeUntilRound: undefined, roundOffered: 1 } as ContractView;
    expect(html([stale], 2)).not.toContain("Prihvati");
  });
});
