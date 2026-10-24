import Link from "next/link";
import { Gamepad2, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo";
import { LogoutButton } from "./logout-button";

// Simpolis wordmark: isometric-city mark + name with the accent on "polis"; same in every header.
export function Wordmark({ size = "md" }: { size?: "md" | "lg" | "xl" }) {
  return (
    <span className={cn("flex items-center", size === "md" ? "gap-2.5" : "gap-4")}>
      <LogoMark
        className={cn(
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

// Same look as the "Odjava" row button; on a phone only the icon shows.
const NAV_LINK =
  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";

export function SiteHeader({ logout = false, profNav = false }: { logout?: boolean; profNav?: boolean }) {
  return (
    <header className="glass sticky top-0 z-30 border-b border-white/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-1 px-4">
        <Link href="/" className="mr-auto flex min-h-11 items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <Wordmark />
        </Link>
        {profNav && (
          <nav aria-label="Profesor" className="flex items-center gap-1">
            <Link href="/profesor/igre" className={NAV_LINK} aria-label="Moje igre">
              <Gamepad2 className="size-5" aria-hidden /> <span className="hidden sm:inline">Moje igre</span>
            </Link>
            <Link href="/profesor/knjiznica" className={NAV_LINK} aria-label="Knjižnica">
              <Library className="size-5" aria-hidden /> <span className="hidden sm:inline">Knjižnica</span>
            </Link>
          </nav>
        )}
        {logout && <LogoutButton className="w-auto" />}
      </div>
    </header>
  );
}
