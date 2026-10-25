// Review 25.10. (STUDENT-07): one hotel name of 40 letters without spaces made /igra/grad wider than the phone screen.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { NewsItem } from "@/lib/types";
import { NewsFeed } from "./news-feed";

const long = "A".repeat(40);
const html = (items: NewsItem[]) => renderToStaticMarkup(createElement(NewsFeed, { items }));

describe("NewsFeed", () => {
  it("lets a long word without spaces break instead of widening the page", () => {
    const out = html([{ at: "2026-10-24T10:00:00.000Z", text: `${long} je snizio cijenu` } as NewsItem]);
    expect(out).toContain(long);
    expect(out).toMatch(/<p class="[^"]*\bwrap-anywhere\b[^"]*">/);
  });
  it("keeps the empty state", () => {
    expect(html([])).toContain("Grad je miran");
  });
});
