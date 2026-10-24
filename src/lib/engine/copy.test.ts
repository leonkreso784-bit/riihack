import { describe, expect, it } from "vitest";
import type { SituationOption } from "@/lib/types";
import { classifyOwnAnswer } from "./copy";

const options: SituationOption[] = [
  { id: "o1", text: "Ispričavam se i odmah nudim besplatan doručak kao znak pažnje.", criteria: [] },
  { id: "o2", text: "Žao mi je zbog neugodnosti, odmah ću vam ponuditi drugu sobu i povrat dijela cijene.", criteria: [] },
  { id: "o3", text: "Mogu samo reći da pravila hotela ne dopuštaju nikakve iznimke.", criteria: [] },
];
const own =
  "Razumijem vašu frustraciju pa ću zajedno s voditeljem smjene pronaći rješenje koje vam odgovara večeras";

describe("classifyOwnAnswer", () => {
  it("prepoznaje prepisanu opciju (kvačice i interpunkcija promijenjeni)", () => {
    const text = "ZAO mi je, zbog neugodnosti; odmah cu vam ponuditi drugu sobu i povrat dijela cijene!";
    expect(classifyOwnAnswer(text, 0, options)).toEqual({ kind: "copiedOption", optionId: "o2" });
  });
  it("vlastiti tekst od 12 riječi bez lijepljenja je own", () => {
    expect(own.split(" ")).toHaveLength(15);
    const twelve = own.split(" ").slice(0, 12).join(" ");
    expect(classifyOwnAnswer(twelve, 0, options)).toEqual({ kind: "own" });
  });
  it("isti tekst s 60% zalijepljenog je pasted", () => {
    const twelve = own.split(" ").slice(0, 12).join(" ");
    expect(classifyOwnAnswer(twelve, 0.6 * twelve.length, options)).toEqual({ kind: "pasted" });
  });
  it("Ne znam. je own", () => {
    expect(classifyOwnAnswer("Ne znam.", 0, options)).toEqual({ kind: "own" });
  });
  it("prazan tekst ne dijeli nulom", () => {
    expect(classifyOwnAnswer("", 0, options)).toEqual({ kind: "own" });
    expect(classifyOwnAnswer("", 5, options)).toEqual({ kind: "own" });
  });
});
