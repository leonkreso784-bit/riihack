import Link from "next/link";
import { cn } from "@/lib/utils";

// Simpolis wordmark: blue tile + name with the accent on "polis"; same in every header.
export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <span className={cn("flex items-center", big ? "gap-3" : "gap-2.5")}>
      <span
        aria-hidden
        className={cn(
          "grid place-items-center bg-primary font-extrabold text-primary-foreground shadow-card",
          big ? "size-14 rounded-2xl text-2xl" : "size-9 rounded-xl text-base",
        )}
      >
        S
      </span>
      <span className={cn("font-extrabold tracking-tight", big ? "text-3xl" : "text-xl")}>
        Sim<span className="text-primary">polis</span>
      </span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4">
        <Link href="/" className="flex min-h-11 items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <Wordmark />
        </Link>
      </div>
    </header>
  );
}
