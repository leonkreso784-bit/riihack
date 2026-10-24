import { cn } from "@/lib/utils";

// Simpolis mark (V1, upright): two ribbons, blue and navy, joining into one S. Same drawing as public/brand/logo.svg.
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={9}
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <path d="M45 14H26A9 9 0 0 0 26 32H32" stroke="#246BFD" />
      <path d="M32 32H38A9 9 0 0 1 38 50H19" stroke="#151B2B" />
    </svg>
  );
}
