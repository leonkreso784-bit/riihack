"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./site-header";

// Public pages get the top header and a centred column; the game (/igra) brings its own shell with sidebar.
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/igra")) return children;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">{children}</main>
    </>
  );
}
