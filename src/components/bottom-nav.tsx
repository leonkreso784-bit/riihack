"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedDouble, Building2, Map, SlidersHorizontal, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/strings";

// Plan, Financije and Grad are Simon's pages (S5, S6); until they land the links 404.
const ITEMS = [
  { href: "/igra", label: t.nav.hotel, icon: Building2 },
  { href: "/igra/sobe", label: t.nav.rooms, icon: BedDouble },
  { href: "/igra/plan", label: t.nav.plan, icon: SlidersHorizontal },
  { href: "/igra/financije", label: t.nav.finances, icon: Wallet },
  { href: "/igra/grad", label: t.nav.city, icon: Map },
];

function isActive(pathname: string, href: string) {
  return href === "/igra" ? pathname === href : pathname.startsWith(href);
}

// Game navigation: bottom bar on phones, sidebar from 768 px.
export function GameNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={t.nav.label}
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-card md:sticky md:top-6 md:h-fit md:w-52 md:shrink-0 md:rounded-[var(--radius)] md:border"
    >
      <ul className="grid grid-cols-5 md:grid-cols-1 md:gap-1 md:p-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-muted-foreground md:min-h-11 md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-3 md:text-sm",
                  active && "text-primary md:bg-secondary",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
