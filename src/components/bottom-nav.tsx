"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedDouble, Building2, Mail, Map, SlidersHorizontal, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/strings";
import { Wordmark } from "./site-header";
import { Pill } from "./pill";
import { api, usePoll, USE_MOCK as MOCK } from "@/lib/client";
import { unreadLabel } from "@/lib/format";
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
// Mail sits in the sidebar; on phones it is the envelope in the top bar, so the bottom bar keeps 6 tabs.
const MAIL = { href: "/igra/posta", label: t.nav.mail, icon: Mail };

// Unread mail for the badge; slower than the pages' own 3 s poll of /api/me.
function useUnread() {
  return usePoll(api.me, 5_000).data?.unreadMail ?? 0;
}


function isActive(pathname: string, href: string) {
  return href === "/igra" ? pathname === href : pathname.startsWith(href);
}

const focus = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";

// Game navigation: fixed sidebar with wordmark from 768 px; top bar + bottom tabs on phones.
export function GameNav() {
  const pathname = usePathname();
  const unread = useUnread();
  return (
    <>
      <header className="glass sticky top-0 z-20 -mb-2 flex h-16 items-center justify-between border-b border-white/60 px-4 md:hidden">
        <Link href="/igra" className={cn("flex min-h-11 items-center rounded-xl", focus)}>
          <Wordmark />
        </Link>
        <span className="flex items-center gap-1">
          {MOCK && <Pill tone="warn">primjer</Pill>}
          <Link
            href={MAIL.href}
            aria-label={unread ? `Pošta, ${unreadLabel(unread)}` : "Pošta"}
            className={cn("relative grid size-11 place-items-center rounded-xl", isActive(pathname, MAIL.href) ? "gloss" : "text-secondary-foreground hover:bg-muted", focus)}
          >
            <Mail className="size-5" aria-hidden />
            {unread > 0 && <Badge n={unread} className="absolute top-1 right-1" />}
          </Link>
          <LogoutButton variant="icon" />
        </span>
      </header>

      <aside className="glass fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-white/70 px-3 py-5 shadow-[1px_0_0_rgb(226_232_243)] md:flex">
        <Link href="/igra" className={cn("mb-8 flex min-h-11 items-center rounded-xl px-2", focus)}>
          <Wordmark />
        </Link>
        <nav aria-label={t.nav.label}>
          <NavList pathname={pathname} variant="side" unread={unread} />
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

function Badge({ n, className }: { n: number; className?: string }) {
  return (
    <span aria-hidden className={cn("grid h-[18px] min-w-[18px] place-items-center rounded-full bg-down px-1 text-[11px] leading-none font-extrabold text-white", className)}>
      {n > 9 ? "9+" : n}
    </span>
  );
}

function NavList({ pathname, variant, unread = 0 }: { pathname: string; variant: "side" | "bottom"; unread?: number }) {
  const side = variant === "side";
  const items = side ? [...ITEMS, MAIL] : ITEMS;
  return (
    <ul className={side ? "space-y-1" : "mx-auto grid max-w-md grid-cols-6"}>
      {items.map(({ href, label, icon: Icon }) => {
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
              {side && href === MAIL.href && unread > 0 && <Badge n={unread} className="ml-auto" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
