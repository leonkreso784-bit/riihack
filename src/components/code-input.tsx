"use client";

import { useState } from "react";
import { CODE_ALPHABET } from "@/lib/rules";
import { cn } from "@/lib/utils";

// ponytail: one wide input instead of 6 boxes; paste and phone keyboards just work.
export function CodeInput({
  length,
  onComplete,
  label = "Kod igre",
  className,
}: {
  length: number;
  onComplete: (code: string) => void;
  label?: string;
  className?: string;
}) {
  const [value, setValue] = useState("");

  function change(raw: string) {
    const next = [...raw.toUpperCase()].filter((c) => CODE_ALPHABET.includes(c)).join("").slice(0, length);
    setValue(next);
    if (next.length === length && next !== value) onComplete(next);
  }

  return (
    <input
      aria-label={label}
      value={value}
      onChange={(e) => change(e.target.value)}
      placeholder={"•".repeat(length)}
      inputMode="text"
      autoCapitalize="characters"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      className={cn(
        "h-16 w-full rounded-[var(--radius)] border-2 bg-card text-center font-mono text-3xl font-bold tracking-[0.4em] uppercase outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/30 md:h-20 md:text-4xl",
        className,
      )}
    />
  );
}
