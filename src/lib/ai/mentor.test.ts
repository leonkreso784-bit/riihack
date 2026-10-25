import { describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { debriefProblem, factsBlock, firstQuestion, mentorDebrief, mentorQuestion, repairDebrief, splitSentences } from "./mentor";
import { fallbackDebrief, fallbackMentorQuestion } from "./fallbacks";
import { MENTOR_DEBRIEF_SYSTEM, MENTOR_QUESTION_SYSTEM } from "./prompts";
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

describe("firstQuestion", () => {
  it("keeps a thousands separator inside the question", () => {
    expect(firstQuestion("Zašto je dobit pala na 2.300 € u srpnju?")).toBe("Zašto je dobit pala na 2.300 € u srpnju?");
    expect(firstQuestion("Što je dobit od 15.500 € rekla o popustu agenciji?")).toBe("Što je dobit od 15.500 € rekla o popustu agenciji?");
  });

  it("keeps 'npr.' and a numbered round inside the question", () => {
    const q = "Što bi se, npr. kod agencije, promijenilo u 3. kvartalu da je popust manji?";
    expect(firstQuestion(q)).toBe(q);
  });

  it("skips a preamble sentence before the question, also one with a thousands separator", () => {
    expect(firstQuestion("Najslabija je odluka o agenciji. Zašto je dobit pala na 2.300 € u srpnju?")).toBe("Zašto je dobit pala na 2.300 € u srpnju?");
    expect(firstQuestion("Dobit je 8.400 €.\nKoja bi ti bila prva rečenica gostu?")).toBe("Koja bi ti bila prva rečenica gostu?");
  });

  it("strips leading quotes and dashes, and a closing quote", () => {
    expect(firstQuestion("„Što te navelo na ovu odluku?“")).toBe("Što te navelo na ovu odluku?");
    expect(firstQuestion("- Što te navelo na ovu odluku?")).toBe("Što te navelo na ovu odluku?");
  });

  it("returns null when there is no question", () => {
    expect(firstQuestion("Razmisli o odluci. Hvala.")).toBeNull();
    expect(firstQuestion("")).toBeNull();
  });
});

describe("mentorQuestion with numbers and short output", () => {
  it("ships the whole question when it contains a thousands separator", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply("Zašto je dobit pala na 2.300 € u srpnju?") });
    await expect(mentorQuestion(input, model)).resolves.toBe("Zašto je dobit pala na 2.300 € u srpnju?");
    expect(model.doGenerateCalls).toHaveLength(1);
  });

  it("accepts 'npr.' inside the question", async () => {
    const q = "Što bi se, npr. kod agencije, promijenilo da je popust manji?";
    const model = new MockLanguageModelV4({ doGenerate: reply(q) });
    await expect(mentorQuestion(input, model)).resolves.toBe(q);
  });

  it("takes the question after a preamble sentence", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply("Odluka o agenciji je najslabija. Zašto je dobit pala na 2.300 € u srpnju?") });
    await expect(mentorQuestion(input, model)).resolves.toBe("Zašto je dobit pala na 2.300 € u srpnju?");
  });

  it("rejects a bare '300 €?' and falls back after the retry", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply("300 €?") });
    await expect(mentorQuestion(input, model)).resolves.toBe(fallbackMentorQuestion(input));
    expect(model.doGenerateCalls).toHaveLength(2);
  });

  it("requires at least 4 words", async () => {
    const model = new MockLanguageModelV4({ doGenerate: [reply("Zašto je tako?"), reply("Zašto si to odabrao u sobi?")] });
    await expect(mentorQuestion(input, model)).resolves.toBe("Zašto si to odabrao u sobi?");
    expect(model.doGenerateCalls).toHaveLength(2);
  });
});

describe("mentor prompts", () => {
  it("both forbid the masculine past participle toward the student", () => {
    for (const prompt of [MENTOR_QUESTION_SYSTEM, MENTOR_DEBRIEF_SYSTEM]) {
      expect(prompt).toContain("Ne koristi glagolski pridjev radni u obraćanju studentu");
      expect(prompt).toContain("uočio si");
    }
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

describe("Cyrillic letters in mentor text (SVJEZEOCI-03)", () => {
  const full = { ...input, question: "Što bi gostu još trebalo?", reflection: "Trebao sam ponuditi nešto više od isprike." };
  const mixedScript = "mog\u043b\u043e"; // "mog" + Cyrillic "lo", as seen once in a stored mentor text

  it("rejects a question with Cyrillic letters and retries", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: [reply(`Što je ${mixedScript} drukčije u odluci o sobi 204?`), reply("Što je moglo biti drukčije u odluci o sobi 204?")],
    });
    await expect(mentorQuestion(input, model)).resolves.toBe("Što je moglo biti drukčije u odluci o sobi 204?");
    expect(model.doGenerateCalls).toHaveLength(2);
  });

  it("falls back when both question attempts contain Cyrillic letters", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply(`Što je ${mixedScript} drukčije u odluci o sobi 204?`) });
    await expect(mentorQuestion(input, model)).resolves.toBe(fallbackMentorQuestion(input));
    expect(model.doGenerateCalls).toHaveLength(2);
  });

  it("names Cyrillic as the reason a debrief is rejected", () => {
    expect(debriefProblem(`Gost je ${mixedScript} dobiti više. Isprika nije dovoljna. Nastavi tako.`)).toBe("cyrillic");
    expect(debriefProblem("Gost je mogao dobiti više. Isprika nije dovoljna. Nastavi tako.")).toBeNull();
  });

  it("retries a debrief with Cyrillic letters, then accepts the clean one", async () => {
    const dirty = `Gost je ${mixedScript} dobiti više. Isprika nije dovoljna. Naknada bi pomogla. Što bi ponudio?`;
    const good = "Gost je mogao dobiti više. Isprika nije dovoljna. Naknada bi pomogla. Što bi ponudio?";
    const model = new MockLanguageModelV4({ doGenerate: [reply(dirty), reply(good)] });
    await expect(mentorDebrief(full, model)).resolves.toBe(good);
    expect(model.doGenerateCalls).toHaveLength(2);
  });
});
