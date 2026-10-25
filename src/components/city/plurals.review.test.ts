// Review 25.10. (LIB-INFRA-13, UI-STUDENT-14, TESTOVI-09, LIB-INFRA-10): the forms the patched strings now produce.
import { describe, expect, it } from "vitest";
import { plural } from "@/lib/format";

describe("plural forms used by company card, city board and the dispatch dialog", () => {
  it.each([
    [1, "recenzija", "1 recenzija"], [3, "recenzije", "3 recenzije"], [24, "recenzije", "24 recenzije"], [25, "recenzija", "25 recenzija"], [12, "recenzija", "12 recenzija"],
  ])("%i reviews", (n, form) => expect(plural(n, "recenzija", "recenzije", "recenzija")).toBe(form));
  it.each([[1, "hotel"], [2, "hotela"], [5, "hotela"], [21, "hotel"]])("%i hotels", (n, form) => expect(plural(n, "hotel", "hotela", "hotela")).toBe(form));
  it.each([[1, "studentu"], [3, "studentima"], [5, "studentima"]])("toast to %i students", (n, form) => expect(plural(n, "studentu", "studentima", "studentima")).toBe(form));
  it.each([[1, "student"], [3, "studenta"], [5, "studenata"]])("dispatch list, %i students", (n, form) => expect(plural(n, "student", "studenta", "studenata")).toBe(form));
});
