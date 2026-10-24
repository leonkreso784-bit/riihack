import Link from "next/link";
import { ChevronRight, Workflow } from "lucide-react";

// One look for every "Kako …" link to Simon's flow pages (Tokovi): a small card, not a bare text link.
export function FlowLink({ href, title, hint }: { href: string; title: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group surface flex w-full items-center gap-3 rounded-[var(--radius)] px-4 py-3 transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-fit sm:min-w-80"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
        <Workflow className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
