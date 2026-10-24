import Link from "next/link";
import { t } from "@/lib/strings";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {t.appName}
        </Link>
      </div>
    </header>
  );
}
