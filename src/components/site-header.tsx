import Link from "next/link";
import { t } from "@/lib/strings";

export function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span aria-hidden className="grid size-8 place-items-center rounded-xl bg-primary text-sm text-primary-foreground">
            S
          </span>
          {t.appName}
        </Link>
      </div>
    </header>
  );
}
