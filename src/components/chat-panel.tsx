"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { api } from "@/lib/client";
import { MAX_STUDENT_MESSAGES } from "@/lib/rules";
import { messagesLeft } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatTurn } from "@/lib/types";
import { FormError } from "./form";
import { Dots } from "./loading";

const MAX_MESSAGE_CHARS = 1000; // same limit as the chat route (S3)

export function Initials({ name, className }: { name: string; className?: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <span aria-hidden className={cn("gloss grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold", className)}>
      {initials}
    </span>
  );
}

// R5: talk to the character before answering. The reply streams in word by word; the server keeps the transcript,
// so the judge sees the whole conversation when the student answers in their own words.
export function ChatPanel({
  situationId,
  character,
  turns,
  setTurns,
  disabled,
}: {
  situationId: string;
  character: { name: string; role: string };
  turns: ChatTurn[];
  setTurns: React.Dispatch<React.SetStateAction<ChatTurn[]>>;
  disabled: boolean;
}) {
  const [message, setMessage] = useState("");
  const [pastedChars, setPastedChars] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false); // a double click sends one message
  const list = useRef<HTMLOListElement>(null);

  const left = MAX_STUDENT_MESSAGES - turns.filter((t) => t.role === "student").length;
  const closed = disabled || left <= 0;

  // BUG-038: scroll only the conversation box to its last message; scrollIntoView also moved the page on phones.
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (!text || closed || busy.current) return;
    busy.current = true;
    setStreaming(true);
    setError(null);
    const before = turns;
    setTurns([...turns, { role: "student", text }, { role: "character", text: "" }]);
    setMessage("");
    try {
      const reader = (await api.chat(situationId, { message: text, pastedChars: Math.min(pastedChars, text.length) })).getReader();
      setPastedChars(0);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setTurns((ts) => [...ts.slice(0, -1), { role: "character", text: ts.at(-1)!.text + value }]);
      }
    } catch (err) {
      setTurns(before);
      setMessage(text);
      setError((err as Error).message);
    } finally {
      busy.current = false;
      setStreaming(false);
    }
  }

  return (
    <div className="space-y-4">
      <ol ref={list} className="max-h-[28rem] space-y-3 overflow-y-auto" aria-live="polite">
        {turns.map((t, i) =>
          t.role === "character" ? (
            <li key={i} className="flex items-end gap-2">
              <Initials name={character.name} className="size-8 text-xs" />
              <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-2.5">
                {t.text || <span className="inline-flex items-center gap-2 text-muted-foreground"><Dots className="text-secondary-foreground" /> {character.name.split(" ")[0]} piše</span>}
              </p>
            </li>
          ) : (
            <li key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">{t.text}</p>
            </li>
          ),
        )}
      </ol>

      {error && <FormError key={error}>{error}</FormError>}

      {closed ? (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          {disabled ? "Razgovor je zatvoren." : "Razgovor je gotov. Sad odgovori svojim riječima."}
        </p>
      ) : (
        <form onSubmit={send} className="space-y-2">
          <div className="flex gap-2">
            <label htmlFor="chat-message" className="sr-only">Tvoja poruka ({character.name})</label>
            <input
              id="chat-message"
              value={message}
              maxLength={MAX_MESSAGE_CHARS}
              onChange={(e) => setMessage(e.target.value)}
              onPaste={(e) => setPastedChars((n) => n + e.clipboardData.getData("text").length)}
              placeholder="Tvoja poruka…"
              autoComplete="off"
              className="h-12 min-w-0 flex-1 rounded-xl border bg-card px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button
              type="submit"
              disabled={streaming || !message.trim()}
              aria-label="Pošalji poruku"
              className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-[#1f5fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              <Send className="size-5" aria-hidden />
            </button>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">{messagesLeft(left)}</p>
        </form>
      )}
    </div>
  );
}
