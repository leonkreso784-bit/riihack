"use client";

import { useEffect, useRef, useState } from "react";
import { num } from "@/lib/format";

// Counts from the previous value to `value` in ~0.8 s (from 0 on first show). Instant under reduced motion.
export function CountUp({ value, signed = false }: { value: number; signed?: boolean }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(id);
    }
    const t0 = performance.now();
    let id = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 800);
      const eased = 1 - (1 - k) ** 3;
      setShown(Math.round(start + (value - start) * eased));
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value]);

  return <>{signed && shown > 0 ? `+${num(shown)}` : num(shown)}</>;
}
