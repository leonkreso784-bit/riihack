import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo";

// Simpolis wordmark: isometric-city mark + name with the accent on "polis"; same in every header.
export function Wordmark({ size = "md" }: { size?: "md" | "lg" | "xl" }) {
  return (
    <span className={cn("flex items-center", size === "md" ? "gap-2.5" : "gap-4")}>
      <LogoMark
        className={cn(
          "drop-shadow-[0_6px_14px_rgb(36_107_253_/_0.35)]",
          size === "md" && "size-9",
          size === "lg" && "size-14",
          size === "xl" && "size-24",
        )}
      />
      <span
        className={cn(
          "font-extrabold tracking-tight",
          size === "md" && "text-xl",
          size === "lg" && "text-3xl",
          size === "xl" && "text-5xl md:text-6xl",
        )}
      >
        Sim<span className="bg-gradient-to-br from-[#2a6ffd] to-[#173fb0] bg-clip-text text-transparent">polis</span>
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
