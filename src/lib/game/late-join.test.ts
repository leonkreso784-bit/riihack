import { describe, expect, it } from "vitest";
import { lateJoinTemplateIds } from "./round";

describe("lateJoinTemplateIds (BUG-027)", () => {
  it("samo situacije koje ima svaka tvrtka, bez ciljanih slanja jednom studentu", () => {
    const rows = [
      { companyId: "a", templateId: "klima" },
      { companyId: "a", templateId: "povisica" },
      { companyId: "a", templateId: "samo-ana" },
      { companyId: "b", templateId: "povisica" },
      { companyId: "b", templateId: "klima" },
    ];
    expect(lateJoinTemplateIds(rows)).toEqual(["klima", "povisica"]);
  });

  it("prazan mjesec: nema situacija", () => {
    expect(lateJoinTemplateIds([])).toEqual([]);
  });
});
