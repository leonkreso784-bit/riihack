"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BedDouble, ListChecks, MessageCircle, PenLine } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { CLICK_QUALITY_CAP } from "@/lib/rules";
import { cn } from "@/lib/utils";
import type { AnswerView, ChatTurn, SituationView } from "@/lib/types";
import { Panel } from "@/components/panel";
import { Pill } from "@/components/pill";
import { FormError } from "@/components/form";
import { ChatPanel, Initials } from "@/components/chat-panel";
import { OptionsForm, OwnAnswerForm } from "@/components/answer-form";
import { VerdictCard } from "@/components/verdict-card";

const back = (
  <Link href="/igra" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-secondary-foreground hover:underline">
    <ArrowLeft className="size-4" aria-hidden /> Moja tvrtka
  </Link>
);

// R5: one situation. Talk to the character, then answer in your own words or pick an offered answer.
export default function SituationPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = usePoll(api.me);
  if (error && !data) return <FormError>{error.message}</FormError>;
  if (!data) return <p className="pt-6 text-muted-foreground">Učitavam…</p>;

  const s = data.situations.find((x) => x.id === id);
  if (!s)
    return (
      <div className="space-y-4 pt-4 md:pt-0">
        {back}
        <p className="text-muted-foreground">Ova situacija nije tvoja ili više ne postoji.</p>
      </div>
    );
  // Keyed so the chat and the answer live in local state; the poll refreshing `me` does not reset them.
  return <Situation key={s.id} s={s} />;
}

type Mode = "chat" | "own" | "options";

function Situation({ s }: { s: SituationView }) {
  const [turns, setTurns] = useState<ChatTurn[]>(s.transcript);
  const [answer, setAnswer] = useState<AnswerView | undefined>(s.answer);
  const [mode, setMode] = useState<Mode>("chat");
  const firstName = s.character.name.split(" ")[0];
  const open = s.state === "open" && !answer;

  const modes: { key: Mode; icon: typeof PenLine; title: string; text: string }[] = [
    { key: "chat", icon: MessageCircle, title: "Razgovaraj s likom", text: "Saznaj što točno treba" },
    { key: "own", icon: PenLine, title: "Odgovori svojim riječima", text: "Vrijedi do 5 od 5" },
    ...(s.options.length ? [{ key: "options" as const, icon: ListChecks, title: "Odaberi ponuđeni odgovor", text: `Vrijedi najviše ${CLICK_QUALITY_CAP} od 5` }] : []),
  ];

  return (
    <div className="space-y-5 pt-4 md:pt-0">
      {back}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="accent">{s.area}</Pill>
          {s.source && s.source !== "bank" && <Pill tone="warn">od profesora</Pill>}
          <Pill>Težina {s.difficulty} / 5</Pill>
          {s.roomNumber && (
            <Link href={`/igra/sobe/${s.roomNumber}`} className="rounded-full focus-visible:outline-2 focus-visible:outline-primary">
              <Pill className="hover:underline">
                <BedDouble className="size-3.5" aria-hidden /> Soba {s.roomNumber}
              </Pill>
            </Link>
          )}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-balance md:text-4xl">{s.title}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{s.text}</p>
        <div className="flex items-center gap-3">
          <Initials name={s.character.name} />
          <p>
            <span className="block font-bold">{s.character.name}</span>
            <span className="block text-sm text-muted-foreground">{s.character.role}</span>
          </p>
        </div>
      </div>

      {answer ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <VerdictCard answer={answer} options={s.options} character={s.character} expired={s.state === "expired"} />
            {answer.mode !== "none" && (
              <Link href={`/igra/situacija/${s.id}/tok`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-secondary-foreground hover:underline">
                Kako je tvoj odgovor prošao kroz hotel →
              </Link>
            )}
          </div>
          {turns.length > 0 && (
            <Panel title="Razgovor">
              <ChatPanel situationId={s.id} character={s.character} turns={turns} setTurns={setTurns} disabled />
            </Panel>
          )}
        </div>
      ) : !open ? (
        <Panel>
          <p className="font-bold">Ovaj krug je završio.</p>
          <p className="text-muted-foreground">Na ovu situaciju nisi odgovorio, pa vrijedi najmanju ocjenu.</p>
        </Panel>
      ) : (
        <>
          <div role="tablist" aria-label="Kako odgovaraš" className={cn("grid gap-3", modes.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            {modes.map(({ key, icon: Icon, title, text }) => (
              <button
                key={key}
                role="tab"
                aria-selected={mode === key}
                onClick={() => setMode(key)}
                className={cn(
                  "surface lift flex min-h-16 items-center gap-3 rounded-[var(--radius)] p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  mode === key && "outline-2 outline-primary",
                )}
              >
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", mode === key ? "gloss" : "bg-muted")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-bold">{title}</span>
                  <span className="block text-xs text-muted-foreground">{text}</span>
                </span>
              </button>
            ))}
          </div>

          <Panel>
            {mode === "chat" && (
              <div className="space-y-4">
                <ChatPanel situationId={s.id} character={s.character} turns={turns} setTurns={setTurns} disabled={false} />
                <button
                  onClick={() => setMode("own")}
                  className="min-h-11 text-sm font-semibold text-secondary-foreground hover:underline"
                >
                  Spreman si? Odgovori svojim riječima →
                </button>
              </div>
            )}
            {mode === "own" && <OwnAnswerForm situationId={s.id} firstName={firstName} onAnswered={setAnswer} />}
            {mode === "options" && <OptionsForm situationId={s.id} firstName={firstName} options={s.options} onAnswered={setAnswer} />}
          </Panel>
        </>
      )}
    </div>
  );
}
