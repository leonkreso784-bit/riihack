import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// One look for every "back" on student and professor pages: a soft chip with an arrow, not bare blue text.
const BACK =
  "group inline-flex min-h-11 w-fit items-center gap-2 rounded-full border bg-card py-1 pr-4 pl-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function Inner({ label }: { label: string }) {
  return (
    <>
      <span className="grid size-8 place-items-center rounded-full bg-secondary text-secondary-foreground transition-transform group-hover:-translate-x-0.5">
        <ArrowLeft className="size-4" aria-hidden />
      </span>
      {label}
    </>
  );
}

export function BackLink({ label, href, onClick, className, disabled }: { label: string; href?: string; onClick?: () => void; className?: string; disabled?: boolean }) {
  const cls = className ? `${BACK} ${className}` : BACK;
  return href ? (
    <Link href={href} className={cls}>
      <Inner label={label} />
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={`${cls} disabled:opacity-60`}>
      <Inner label={label} />
    </button>
  );
}
