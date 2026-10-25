// Review 25.10. (GAP4-01, tracked as BUG-061): the bank has 8 situations for 4 months x 2, so every template lands in a
// random month of the season. Texts must not name a month.
import { describe, expect, it } from "vitest";
import { SITUATIONS } from "./index";

const MONTH = /\b(lipanj|lipnj\w*|srpanj|srpnj\w*|kolovoz\w*|rujan|rujn\w*)\b/i;

describe("bank situation texts", () => {
  it("name no month", () => {
    const hits = SITUATIONS.filter((s) => MONTH.test([s.title, s.text, ...s.options.map((o) => o.text), ...s.rubric.map((r) => r.text)].join(" "))).map((s) => s.id);
    expect(hits).toEqual([]);
  });
});
