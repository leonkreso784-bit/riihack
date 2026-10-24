import { COPY_OVERLAP, PASTE_SHARE } from "@/lib/rules";
import type { SituationOption } from "@/lib/types";

// Jedinstveni tokeni malim slovima, bez kvačica i interpunkcije, duljine >= 3.
function words(text: string): Set<string> {
  const plain = text
    .toLowerCase()
    .replaceAll("đ", "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ");
  return new Set(plain.split(" ").filter((w) => w.length >= 3));
}

export type OwnAnswerKind = { kind: "copiedOption"; optionId: string } | { kind: "pasted" } | { kind: "own" };

export function classifyOwnAnswer(text: string, pastedChars: number, options: SituationOption[]): OwnAnswerKind {
  const mine = words(text);
  if (mine.size >= 3) {
    let best: { id: string; overlap: number } | null = null;
    for (const o of options) {
      const theirs = words(o.text);
      let hit = 0;
      for (const w of mine) if (theirs.has(w)) hit++;
      const overlap = hit / mine.size;
      if (overlap >= COPY_OVERLAP && (!best || overlap > best.overlap)) best = { id: o.id, overlap };
    }
    if (best) return { kind: "copiedOption", optionId: best.id };
  }
  if (text.length > 0 && pastedChars / text.length > PASTE_SHARE) return { kind: "pasted" };
  return { kind: "own" };
}
