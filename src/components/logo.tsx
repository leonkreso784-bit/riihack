import { cn } from "@/lib/utils";

// Simpolis mark (V1): two ribbons, blue and navy, folding into one S. Same drawing as public/brand/logo.svg.
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={8.5}
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <g transform="translate(32 32) skewY(-14) translate(-32 -29)">
        <path d="M45 13H21V22L32 29" stroke="#246BFD" />
        <path d="M32 29L43 36V45H19" stroke="#151B2B" />
      </g>
    </svg>
  );
}
