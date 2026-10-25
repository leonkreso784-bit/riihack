// Review 25.10. (JEZIK-07): the empty lane text said "situaciju koja dira operativa" (nominative after "dira").
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DepartmentsFlow } from "./departments-flow";

const METRICS = { guests: 50, reviews: 50, staff: 50, operations: 50, finance: 50 };
const board = () =>
  renderToStaticMarkup(createElement(DepartmentsFlow, { input: { metrics: METRICS, plan: {}, staff: [], rooms: [], situations: [], round: 1 } })).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("Odjeli Tok, empty situation card", () => {
  it("uses the accusative after 'dira' for every department", () => {
    const text = board();
    for (const phrase of ["dira zadovoljstvo gostiju", "dira recenzije", "dira operativu", "dira zaposlenike"]) expect(text).toContain(phrase);
    expect(text).not.toContain("dira operativa");
    expect(text).not.toContain("dira zaposlenici");
  });
});
