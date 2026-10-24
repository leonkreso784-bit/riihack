"use client";

import { Calculator, Gavel, Gauge, MessageSquareText, Sparkles, Building2, type LucideIcon } from "lucide-react";
import { StepFlow } from "@/components/tokovi/flow-ui";
import { AI_NOTE, buildAnswerFlow, type AnswerFlowInput, type AnswerStepId } from "@/lib/tokovi/answer-flow";

const ICONS: Record<AnswerStepId, LucideIcon> = {
  odgovor: MessageSquareText,
  sudac: Gavel,
  kvaliteta: Gauge,
  ucinak: Calculator,
  odjeli: Building2,
};

export function AnswerFlow({ input }: { input: AnswerFlowInput }) {
  const steps = buildAnswerFlow(input);
  return (
    <div className="space-y-5">
      <p className="flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-base font-semibold text-secondary-foreground">
        <Sparkles className="mt-0.5 size-5 shrink-0" aria-hidden /> {AI_NOTE}
      </p>
      <StepFlow steps={steps} icons={ICONS} />
    </div>
  );
}
