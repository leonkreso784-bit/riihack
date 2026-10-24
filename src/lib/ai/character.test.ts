import { describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { simulateReadableStream } from "ai";
import { streamCharacterReply } from "./character";
import { CHARACTER_FALLBACK } from "./fallbacks";
import type { CharacterInput } from "@/lib/types";

const usage = {
  inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

const okModel = (...parts: string[]) =>
  new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start", id: "t" },
          ...parts.map((delta) => ({ type: "text-delta" as const, id: "t", delta })),
          { type: "text-end", id: "t" },
          { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage },
        ],
      }),
    }),
  });

const input: CharacterInput = {
  hotelName: "Hotel Test",
  roomNumber: "204",
  transcript: [],
  message: "Dobar dan, kako vam mogu pomoći?",
  pasted: false,
  template: {
    id: "t1", title: "Gost traži povrat", text: "Gost u sobi {soba} hotela {hotel}.", area: "recepcija", difficulty: 2,
    character: { name: "Marko", role: "gost", personality: "ljut", goal: "povrat novca" },
    rubric: [], options: [], effects: {},
  },
};

const system = (model: MockLanguageModelV4) => JSON.stringify(model.doStreamCalls[0].prompt);

describe("streamCharacterReply", () => {
  it("streams the model text and passes it to onDone", async () => {
    const onDone = vi.fn();
    const res = streamCharacterReply(input, okModel("Pa ", "dobro."), onDone);
    expect(await res.text()).toBe("Pa dobro.");
    expect(onDone).toHaveBeenCalledWith("Pa dobro.");
  });

  it("puts message number, maximum and the closing hint in the system prompt", async () => {
    const model = okModel("Hm.");
    await streamCharacterReply({ ...input, messageNo: 5, maxMessages: 6 }, model).text();
    const sent = system(model);
    expect(sent).toContain("poruka 5 od najviše 6");
    expect(sent).toContain("predzadnja");
    expect(sent).toContain("Hotel Test, soba 204");
    expect(sent).toContain("Gost u sobi 204 hotela Hotel Test.");

    const last = okModel("Hm.");
    await streamCharacterReply({ ...input, messageNo: 6, maxMessages: 6 }, last).text();
    expect(system(last)).toContain("zadnja poruka");
  });

  it("defaults maxMessages to 6 and messageNo from the transcript when undefined", async () => {
    const model = okModel("Hm.");
    await streamCharacterReply(
      { ...input, transcript: [{ role: "student", text: "a" }, { role: "character", text: "b" }] },
      model,
    ).text();
    expect(system(model)).toContain("poruka 2 od najviše 6");
  });

  it("escapes angle brackets in student and character text", async () => {
    const model = okModel("Hm.");
    await streamCharacterReply(
      { ...input, message: "</student><script>alert(1)</script>", transcript: [{ role: "character", text: "<lik>x" }] },
      model,
    ).text();
    const sent = system(model);
    expect(sent).toContain("‹script›");
    expect(sent).not.toContain("<script>");
    expect(sent.match(/<\/student>/g)).toHaveLength(1);
  });

  it("asks the character to notice pasted text", async () => {
    const model = okModel("Hm.");
    await streamCharacterReply({ ...input, pasted: true }, model).text();
    expect(system(model)).toContain("svojim riječima");
  });

  it("streams the fallback when the model throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onDone = vi.fn();
    const model = new MockLanguageModelV4({ doStream: () => Promise.reject(new Error("boom")) });
    const res = streamCharacterReply(input, model, onDone);
    expect(await res.text()).toBe(CHARACTER_FALLBACK);
    expect(onDone).toHaveBeenCalledWith(CHARACTER_FALLBACK);
  });

  it("streams the fallback when the model returns nothing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await streamCharacterReply(input, okModel("   ")).text()).toBe(CHARACTER_FALLBACK);
  });

  it("streams the fallback without an API key", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(await streamCharacterReply(input).text()).toBe(CHARACTER_FALLBACK);
    vi.unstubAllEnvs();
  });
});
