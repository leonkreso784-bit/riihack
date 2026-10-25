"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SiteHeader } from "./site-header";

// Waiting room and the professor's game page show "Odjava"; the student game has it in its own nav.
const IN_GAME = /^\/(cekaonica|profesor\/(?!(?:novi|igre|prijava|registracija)$)[^/]+)$/; // L16: ekrani računa nisu u igri
// BUG-021: a game's board and the pages under it link back to "Moje igre" and "Knjižnica".
const PROF_GAME = /^\/profesor\/(?!(?:novi|igre|prijava|registracija|knjiznica)(?:\/|$))[^/]+(?:\/|$)/;
// Projector: the professor's game page itself (lobby, live board) gets a wider column on xl; every other page keeps max-w-6xl.
const PROF_BOARD = /^\/profesor\/(?!(?:novi|igre|prijava|registracija|knjiznica)$)[^/]+$/;

// Public pages get the top header and a centred column; the game (/igra) brings its own shell with sidebar.
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/igra")) return children;
  return (
    <>
      <SiteHeader logout={IN_GAME.test(pathname)} profNav={PROF_GAME.test(pathname)} />
      <main className={cn("mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10", PROF_BOARD.test(pathname) && "xl:max-w-[1600px]")}>{children}</main>
    </>
  );
}
