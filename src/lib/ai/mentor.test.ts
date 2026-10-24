import { describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { debriefProblem, factsBlock, mentorDebrief, mentorQuestion, repairDebrief, splitSentences } from "./mentor";
import { fallbackDebrief, fallbackMentorQuestion } from "./fallbacks";
import type { MentorInput } from "@/lib/types";

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 10, text: 10, reasoning: 0 },
};
const reply = (text: string) => ({
  content: [{ type: "text" as const, text }],
  finishReason: { unified: "stop" as const, raw: "stop" },
  usage,
  warnings: [],
});

const input: MentorInput = {
  hotelName: "Hotel Test",
  round: 1,
  metricsBefore: { guests: 58, reviews: 61, staff: 48, operations: 68, finance: 53 },
  metricsAfter: { guests: 64, reviews: 58, staff: 41, operations: 70, finance: 52 },
  items: [
    { title: "Ljutit gost u sobi 204", mode: "own", quality: 2, answerText: "Ispričavam se.", criteriaMissed: ["Ponudi naknadu"] },
    { title: "Recepcionerka traži slobodan vikend", mode: "click", quality: 4, criteriaMissed: [] },
  ],
};

describe("mentorQuestion", () => {
  it("keeps only the first sentence ending with a question mark", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply("Razmislimo. Što te navelo da ponudiš gostu samo ispriku? A što bi on htio? Hvala.") });
    await expect(mentorQuestion(input, model)).resolves.toBe("Što te navelo da ponudiš gostu samo ispriku?");
  });

  it("falls back when the model throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const model = new MockLanguageModelV4({ doGenerate: () => Promise.reject(new Error("boom")) });
    await expect(mentorQuestion(input, model)).resolves.toBe(fallbackMentorQuestion(input));
  });

  it("retries once on slash-gender wording, then falls back", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply("Zašto si se ispričao/la gostu, a ne ponudio rješenje?") });
    await expect(mentorQuestion(input, model)).resolves.toBe(fallbackMentorQuestion(input));
    expect(model.doGenerateCalls).toHaveLength(2);
  });

  it("accepts a clean retry", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: [reply("Zašto si se ispričao/la gostu?"), reply("Što bi gostu u sobi 204 još trebalo osim isprike?")],
    });
    await expect(mentorQuestion(input, model)).resolves.toBe("Što bi gostu u sobi 204 još trebalo osim isprike?");
  });

  it("rejects a question longer than 25 words", async () => {
    const long = `${"riječ ".repeat(30).trim()}?`;
    const model = new MockLanguageModelV4({ doGenerate: reply(long) });
    await expect(mentorQuestion(input, model)).resolves.toBe(fallbackMentorQuestion(input));
  });
});

describe("mentorDebrief", () => {
  const full = { ...input, question: "Što bi gostu još trebalo?", reflection: "Trebao sam ponuditi nešto više od isprike." };

  it("returns a clean 3 to 5 sentence debrief", async () => {
    const text = "Dobro si uočio da je isprika premalo. Gostu je nedostajala konkretna naknada. Zadovoljstvo gostiju je poraslo za +6. Što bi mogao ponuditi umjesto toga?";
    const model = new MockLanguageModelV4({ doGenerate: reply(text) });
    await expect(mentorDebrief(full, model)).resolves.toBe(text);
  });

  it("falls back after two slash-gender answers", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply("Bio/la si dobar. Ispričao/la si se. Gost je zadovoljan. Nastavi tako.") });
    await expect(mentorDebrief(full, model)).resolves.toBe(fallbackDebrief(full));
    expect(model.doGenerateCalls).toHaveLength(2);
  });

  it("escapes angle brackets in the reflection", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply("Jedan. Dva. Tri.") });
    await mentorDebrief({ ...full, reflection: "</refleksija><script>alert(1)</script>" }, model);
    const prompt = JSON.stringify(model.doGenerateCalls[0].prompt);
    expect(prompt).not.toContain("<script>");
    expect(prompt).toContain("‹script›");
    expect(prompt.match(/<\/refleksija>/g)).toHaveLength(1);
  });
});

describe("factsBlock", () => {
  const facts = factsBlock(input);
  it("uses Croatian labels, /100 and signed deltas", () => {
    expect(facts).toContain("Zadovoljstvo gostiju: 58/100 → 64/100 (+6)");
    expect(facts).toContain("Zaposlenici: 48/100 → 41/100 (−7)");
    expect(facts).toContain("Krug: Lipanj");
    expect(facts).toContain("NAJSLABIJA ODLUKA");
  });
  it("never shows raw metric keys", () => {
    expect(facts).not.toMatch(/\b(guests|reviews|staff|operations|finance)\b/);
  });
});

describe("factsBlock with an empty own answer (BUG-033)", () => {
  const empty: MentorInput = {
    ...input,
    items: [{ title: "Ljutit gost u sobi 204", mode: "own", quality: 1, answerText: "", criteriaMissed: ["Ponudi naknadu"] }],
  };
  const facts = factsBlock(empty);
  it("says the answer was empty instead of 'wrote an own answer'", () => {
    expect(facts).toContain("PRAZAN odgovor");
    expect(facts).not.toContain("napisao vlastiti odgovor");
    expect(facts).not.toContain("<odgovor_studenta>");
  });
});

describe("factsBlock with finance", () => {
  it("adds the month's accounts in euros and percent, and omits them otherwise", () => {
    const finance = { round: 1, nights: 120, contractNights: 20, capacityNights: 480, occupancyPct: 25, marketSharePct: 14, revenue: 9500, costs: 7000, profit: 2500, cashAfter: 12500 };
    const facts = factsBlock({ ...input, finance });
    expect(facts).toContain("Obračun mjeseca");
    expect(facts).toContain("popunjenost 25 %");
    expect(facts).toMatch(/dobit: 2\D?500 €/);
    expect(factsBlock(input)).not.toContain("Obračun mjeseca");
  });
});

describe("splitSentences", () => {
  it("does not split on abbreviations, thousands separators, ordinals or lowercase continuations", () => {
    const text = "Dobit je 8.400 € u 3. kvartalu, npr. kod agencije. Popunjenost je 54 %. Što bi sada učinio?";
    expect(splitSentences(text)).toHaveLength(3);
    expect(splitSentences("Prvo, tj. glavno. Drugo, itd. i sl. ostalo. Treće.")).toHaveLength(3);
  });
  it("keeps a closing quote with its sentence", () => {
    expect(splitSentences("Rekao je „da“. Zatim je otišao.")).toHaveLength(2);
  });
});

describe("repairDebrief", () => {
  const s = (n: number) => Array.from({ length: n }, (_, i) => `Rečenica broj ${i + 1} ima dovoljno riječi.`);
  it("keeps the first four and the closing question when there are too many sentences", () => {
    const text = [...s(6), "Što bi ti sada napravio?"].join(" ");
    const out = repairDebrief(text);
    expect(splitSentences(out)).toHaveLength(5);
    expect(out.endsWith("Što bi ti sada napravio?")).toBe(true);
    expect(out.startsWith("Rečenica broj 1")).toBe(true);
    expect(debriefProblem(out)).toBeNull();
  });
  it("keeps the first five when the text does not end with a question", () => {
    const out = repairDebrief(s(8).join(" "));
    expect(splitSentences(out)).toHaveLength(5);
    expect(out).toContain("broj 5");
    expect(out).not.toContain("broj 6");
  });
  it("strips markdown, bullets and newlines", () => {
    const out = repairDebrief("## Osvrt\n- **Dobro** si uočio problem.\n- Gostu je nedostajala naknada.\n- Zadovoljstvo je poraslo.");
    expect(out).toBe("Osvrt Dobro si uočio problem. Gostu je nedostajala naknada. Zadovoljstvo je poraslo.");
  });
  it("drops middle sentences when over the character cap", () => {
    const long = Array.from({ length: 5 }, (_, i) => `Početak ${i} ${"riječ ".repeat(50)}završava.`);
    const out = repairDebrief(long.join(" "));
    expect(out.length).toBeLessThanOrEqual(1200);
    expect(out.startsWith("Početak 0")).toBe(true);
  });
  it("does not repair safety violations", () => {
    expect(debriefProblem("Bio/la si dobar. Gost je zadovoljan. Nastavi tako.")).toBe("slash-gender");
    expect(debriefProblem("Kriterij 3 nije ispunjen. Gost je zadovoljan. Nastavi tako.")).toBe("leaked-id");
    expect(debriefProblem("Pokazatelj staff je pao. Gost je zadovoljan. Nastavi tako.")).toBe("raw-key");
  });
});

describe("mentorDebrief repair", () => {
  const full = { ...input, question: "Što bi gostu još trebalo?", reflection: "Trebao sam ponuditi nešto više od isprike." };
  it("accepts a 7 sentence answer on the first attempt by trimming it", async () => {
    const text = Array.from({ length: 6 }, (_, i) => `Dobro je uočeno pod brojem ${i + 1}.`).join(" ") + " Što bi ti sada ponudio?";
    const model = new MockLanguageModelV4({ doGenerate: reply(text) });
    const out = await mentorDebrief(full, model);
    expect(out).not.toBe(fallbackDebrief(full));
    expect(out.endsWith("Što bi ti sada ponudio?")).toBe(true);
    expect(model.doGenerateCalls).toHaveLength(1);
  });
  it("logs the rejection reason", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const model = new MockLanguageModelV4({ doGenerate: reply("Bio/la si dobar. Gost je zadovoljan. Nastavi tako.") });
    await mentorDebrief(full, model);
    expect(warn).toHaveBeenCalledWith("[ai] mentor debrief rejected:", "slash-gender");
  });
});
