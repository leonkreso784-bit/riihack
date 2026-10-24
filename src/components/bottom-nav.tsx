"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedDouble, Building2, Map, SlidersHorizontal, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/strings";
import { Wordmark } from "./site-header";
import { Pill } from "./pill";
import { USE_MOCK as MOCK } from "@/lib/client";
import { LogoutButton } from "./logout-button";

// Plan, Financije and Grad are Simon's pages (S5, S6); until they land the links 404.
const ITEMS = [
  { href: "/igra", label: t.nav.hotel, icon: Building2 },
  { href: "/igra/sobe", label: t.nav.rooms, icon: BedDouble },
  { href: "/igra/osoblje", label: t.nav.staff, icon: Users },
  { href: "/igra/plan", label: t.nav.plan, icon: SlidersHorizontal },
  { href: "/igra/financije", label: t.nav.finances, icon: Wallet },
  { href: "/igra/grad", label: t.nav.city, icon: Map },
];


function isActive(pathname: string, href: string) {
  return href === "/igra" ? pathname === href : pathname.startsWith(href);
}

const focus = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";

// Game navigation: fixed sidebar with wordmark from 768 px; top bar + bottom tabs on phones.
export function GameNav() {
  const pathname = usePathname();
  return (
    <>
      <header className="glass sticky top-0 z-20 -mb-2 flex h-16 items-center justify-between border-b border-white/60 px-4 md:hidden">
        <Link href="/igra" className={cn("flex min-h-11 items-center rounded-xl", focus)}>
          <Wordmark />
        </Link>
        <span className="flex items-center gap-1">
          {MOCK && <Pill tone="warn">primjer</Pill>}
          <LogoutButton variant="icon" />
        </span>
      </header>

      <aside className="glass fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-white/70 px-3 py-5 shadow-[1px_0_0_rgb(226_232_243)] md:flex">
        <Link href="/igra" className={cn("mb-8 flex min-h-11 items-center rounded-xl px-2", focus)}>
          <Wordmark />
        </Link>
        <nav aria-label={t.nav.label}>
          <NavList pathname={pathname} variant="side" />
        </nav>
        <div className="mt-auto space-y-2">
          <LogoutButton />
          {MOCK && (
            <p className="rounded-xl bg-sand px-3 py-2 text-xs leading-snug">
              <strong className="font-bold">Primjer.</strong> Prikazani su lažni podaci dok backend ne proradi.
            </p>
          )}
        </div>
      </aside>

      <nav
        aria-label={t.nav.label}
        className="glass fixed inset-x-0 bottom-0 z-20 border-t border-white/70 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgb(21_27_43_/_0.25)] md:hidden"
      >
        <NavList pathname={pathname} variant="bottom" />
      </nav>
    </>
  );
}

function NavList({ pathname, variant }: { pathname: string; variant: "side" | "bottom" }) {
  const side = variant === "side";
  return (
    <ul className={side ? "space-y-1" : "mx-auto grid max-w-md grid-cols-6"}>
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex font-semibold transition-colors",
                focus,
                side
                  ? "min-h-11 items-center gap-3 rounded-xl px-3 text-sm"
                  : "min-h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem]",
                active
                  ? side
                    ? "gloss"
                    : "text-secondary-foreground"
                  : side
                    ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "text-muted-foreground",
              )}
            >
              <span className={cn(!side && "grid h-7 w-12 place-items-center rounded-full", !side && active && "gloss")}>
                <Icon className={side ? "size-5" : "size-[1.15rem]"} strokeWidth={active ? 2.4 : 2} aria-hidden />
              </span>
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
