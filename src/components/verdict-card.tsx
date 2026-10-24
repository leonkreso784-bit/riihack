import { CheckCircle2, MousePointerClick, PenLine } from "lucide-react";
import { CLICK_QUALITY_CAP } from "@/lib/rules";
import type { AnswerView } from "@/lib/types";
import { Panel } from "./panel";
import { Pill } from "./pill";
import { Initials } from "./chat-panel";

// R5: the result after answering. Quality comes from the engine; the verdict (met criteria, reasoning) from the judge.
// ponytail: criteria are shown as a count, SituationView has no rubric labels; show names once the contract carries them.
export function VerdictCard({
  answer,
  options,
  character,
}: {
  answer: AnswerView;
  options: { id: string; text: string }[];
  character: { name: string; role: string };
}) {
  const option = options.find((o) => o.id === answer.optionId);
  const met = answer.verdict?.criteriaMet.length;
  const tone = answer.quality >= 4 ? "up" : answer.quality === 3 ? "warn" : "down";

  return (
    <Panel className="anim-pop space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          {answer.mode === "own" ? <PenLine className="size-4" aria-hidden /> : <MousePointerClick className="size-4" aria-hidden />}
          {answer.mode === "own" ? "Tvoj odgovor" : answer.copied ? "Prepisani ponuđeni odgovor" : "Ponuđeni odgovor"}
        </p>
        <Pill tone={tone} className="px-3 py-1 text-base">
          {answer.quality} / 5
        </Pill>
      </div>

      {(answer.text ?? option?.text) && <blockquote className="rounded-xl bg-muted px-4 py-3">{answer.text ?? option?.text}</blockquote>}

      {answer.verdict && (
        <div className="space-y-2">
          {met !== undefined && (
            <p className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="size-5 text-up" aria-hidden /> Ispunjeno kriterija: {met}
            </p>
          )}
          <p className="text-muted-foreground">{answer.verdict.reasoning}</p>
        </div>
      )}

      {answer.mode === "click" && !answer.copied && (
        <p className="text-sm text-muted-foreground">Ponuđeni odgovor vrijedi najviše {CLICK_QUALITY_CAP} od 5. Svojim riječima možeš dobiti 5.</p>
      )}

      {answer.copied && (
        <div className="flex items-start gap-3 rounded-xl bg-sand px-4 py-3">
          <Initials name={character.name} className="size-8 text-xs" />
          <p>
            <span className="block text-xs font-bold text-muted-foreground">{character.name}</span>
            „Zvučite kao brošura.“ <span className="text-muted-foreground">Ovo vrijedi kao ponuđeni odgovor.</span>
          </p>
        </div>
      )}
    </Panel>
  );
}
