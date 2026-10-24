"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

// Simpolis mark: an isometric city of three towers growing left → right (a tycoon city that rises as you learn),
// lit windows on the tallest one and a gold spark above it (the "aha"). Pure SVG, no image request.
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  // Unique gradient ids: a hidden copy (e.g. the phone header on desktop) must not own the gradient for the visible one.
  const id = useId();
  const tile = `${id}-tile`;
  const gloss = `${id}-gloss`;
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={tile} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4d86ff" />
          <stop offset="0.5" stopColor="#246bfd" />
          <stop offset="1" stopColor="#1640b8" />
        </linearGradient>
        <linearGradient id={gloss} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${tile})`} />
      {/* ground shadow */}
      <ellipse cx="32" cy="54.5" rx="22" ry="4" fill="#0b2a7a" opacity="0.35" />
      {/* left tower */}
      <polygon points="21,50 14,45.96 14,32.96 21,37" fill="#cfe0ff" />
      <polygon points="21,50 28,45.96 28,32.96 21,37" fill="#93b6ff" />
      <polygon points="21,37 14,32.96 21,28.92 28,32.96" fill="#ffffff" />
      {/* right tower */}
      <polygon points="43,50 36,45.96 36,27.96 43,32" fill="#cfe0ff" />
      <polygon points="43,50 50,45.96 50,27.96 43,32" fill="#93b6ff" />
      <polygon points="43,32 36,27.96 43,23.92 50,27.96" fill="#ffffff" />
      {/* tall front tower */}
      <polygon points="32,54 23,48.8 23,22.8 32,28" fill="#dbe7ff" />
      <polygon points="32,54 41,48.8 41,22.8 32,28" fill="#9dbdff" />
      <polygon points="32,28 23,22.8 32,17.6 41,22.8" fill="#ffffff" />
      <g fill="#ffd166">
        <polygon points="34.7,38.44 37.4,36.88 37.4,32.88 34.7,34.44" />
        <polygon points="34.7,46.44 37.4,44.88 37.4,40.88 34.7,42.44" />
        <polygon points="27.6,32.6 25.2,31.2 25.2,35.2 27.6,36.6" opacity="0.85" />
      </g>
      {/* spark */}
      <path d="M50 7.5 L51.5 11.8 L55.8 13.3 L51.5 14.8 L50 19.1 L48.5 14.8 L44.2 13.3 L48.5 11.8 Z" fill="#ffd166" />
      <rect width="64" height="34" rx="16" fill={`url(#${gloss})`} />
    </svg>
  );
}
