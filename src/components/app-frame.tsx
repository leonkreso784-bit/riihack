"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./site-header";

// Waiting room and the professor's game page show "Odjava"; the student game has it in its own nav.
const IN_GAME = /^\/(cekaonica|profesor\/(?!(?:novi|igre|prijava|registracija)$)[^/]+)$/; // L16: ekrani računa nisu u igri

// Public pages get the top header and a centred column; the game (/igra) brings its own shell with sidebar.
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/igra")) return children;
  return (
    <>
      <SiteHeader logout={IN_GAME.test(pathname)} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">{children}</main>
    </>
  );
}
