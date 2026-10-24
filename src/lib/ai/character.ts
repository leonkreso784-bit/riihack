// S3: the character. Plays the guest or colleague as a plain text stream; on any failure streams the fixed fallback.
import { streamText, type LanguageModel } from "ai";
import { MAX_STUDENT_MESSAGES } from "@/lib/rules";
import { renderSituationText } from "@/lib/engine/text";
import type { CharacterInput } from "@/lib/types";
import { AI_TIMEOUT_MS, aiEnabled, modelFor } from "./client";
import { CHARACTER_FALLBACK } from "./fallbacks";
import { CHARACTER_SYSTEM } from "./prompts";

/** Neutralise angle brackets so student or character text cannot close or open our prompt tags. */
const clean = (text: string) => text.replace(/</g, "‹").replace(/>/g, "›");

/** Everything about this one conversation, in the system prompt (the student text goes only in `<student>` tags). */
export function characterSystem(input: CharacterInput): string {
  const { template, hotelName, roomNumber } = input;
  const maxMessages = input.maxMessages ?? MAX_STUDENT_MESSAGES;
  const messageNo = Math.min(Math.max(input.messageNo ?? input.transcript.filter((t) => t.role === "student").length + 1, 1), maxMessages);
  const { character } = template;
  const lines = [
    CHARACTER_SYSTEM,
    "",
    `Ti si ${clean(character.name)}, ${clean(character.role)}.`,
    `Osobnost: ${clean(character.personality)}`,
    `Što želiš: ${clean(character.goal)}`,
    `Hotel: ${clean(hotelName)}${roomNumber ? `, soba ${clean(roomNumber)}` : ""}.`,
    `Situacija: ${clean(renderSituationText(template.text, { soba: roomNumber, hotel: hotelName }))}`,
    "",
    `Ovo je studentova poruka ${messageNo} od najviše ${maxMessages}.`,
  ];
  if (messageNo >= maxMessages) lines.push("Ovo je zadnja poruka: zaključi razgovor jednom rečenicom, bez novog pitanja.");
  else if (messageNo === maxMessages - 1) lines.push("Ovo je predzadnja poruka: počni voditi razgovor prema kraju, prirodno i u ulozi.");
  if (input.pasted) {
    lines.push("Student je zalijepio gotov tekst. U ulozi primijeti da zvuči kao brošura ili naučena fraza i zamoli ga da to kaže svojim riječima.");
  }
  return lines.join("\n");
}

function transcriptPrompt(input: CharacterInput): string {
  const turns = [...input.transcript, { role: "student" as const, text: input.message }]
    .map((t) => (t.role === "student" ? `<student>${clean(t.text)}</student>` : `<lik>${clean(t.text)}</lik>`))
    .join("\n");
  return `<razgovor>\n${turns}\n</razgovor>\n\nNapiši sljedeću repliku lika, samo tekst replike.`;
}

const headers = { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" };

/**
 * The character's next line as a plain text stream. Never throws and never errors the stream: if the model fails, is
 * slower than 20 s or says nothing before failing, the client gets `CHARACTER_FALLBACK`.
 * `onDone` gets the full text that was sent (real or fallback) before the stream closes; use it to save the transcript.
 */
export function streamCharacterReply(
  input: CharacterInput,
  model?: LanguageModel,
  onDone?: (text: string) => void | Promise<void>,
): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sent = "";
      const send = (raw: string) => {
        const text = sent ? raw : raw.trimStart(); // no leading blank space before the first word
        if (!text) return;
        sent += text;
        controller.enqueue(encoder.encode(text));
      };
      try {
        if (!model && !aiEnabled()) throw new Error("no ANTHROPIC_API_KEY");
        const result = streamText({
          model: modelFor("character", model),
          system: characterSystem(input),
          prompt: transcriptPrompt(input),
          maxOutputTokens: 300,
          // Haiku 5.5 thinks by default and the thinking ate the whole budget, so 5 of 8 replies came back empty and
          // the student saw the fallback line (audit 24.10. 23:50). A short line in character needs no reasoning.
          providerOptions: { anthropic: { thinking: { type: "disabled" } } },
          abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
          onError: ({ error }) => console.error("[ai]", error instanceof Error ? error.message : error),
        });
        for await (const delta of result.textStream) send(delta);
        if (!sent.trim()) throw new Error("empty character reply");
      } catch (error) {
        console.error("[ai]", error instanceof Error ? error.message : error);
        // Text already sent stays; a half sentence plus nothing is better than a mixed-in fallback.
        if (!sent.trim()) send(CHARACTER_FALLBACK);
      }
      try {
        await onDone?.(sent.trim());
      } catch (error) {
        console.error("[ai] transcript save failed", error);
      }
      controller.close();
    },
  });
  return new Response(body, { headers });
}
