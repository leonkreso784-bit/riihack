import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo";

// Simpolis wordmark: the S mark + name with the accent on "polis". `tile` sets the mark on a white glossy tile
// (game shell), `tagline` adds a small line under the name.
export function Wordmark({ size = "md", tile = false, tagline }: { size?: "md" | "lg" | "xl"; tile?: boolean; tagline?: string }) {
  const mark = (
    <LogoMark
      className={cn(
        size === "md" && (tile ? "size-7" : "size-9"),
        size === "lg" && "size-14",
        size === "xl" && "size-24",
      )}
    />
  );
  return (
    <span className={cn("flex items-center", size === "md" ? "gap-2.5" : "gap-4")}>
      {tile ? (
        <span className="surface grid size-11 shrink-0 place-items-center rounded-2xl">{mark}</span>
      ) : (
        mark
      )}
      <span className="leading-tight">
        <span
          className={cn(
            "block font-extrabold tracking-tight",
            size === "md" && "text-xl",
            size === "lg" && "text-3xl",
            size === "xl" && "text-5xl md:text-6xl",
          )}
        >
          Sim<span className="bg-gradient-to-br from-[#2a6ffd] to-[#173fb0] bg-clip-text text-transparent">polis</span>
        </span>
        {tagline && <span className="block text-xs font-medium text-muted-foreground">{tagline}</span>}
      </span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-30 border-b border-white/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4">
        <Link href="/" className="flex min-h-11 items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <Wordmark />
        </Link>
      </div>
    </header>
  );
}
