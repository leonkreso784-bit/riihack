import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { t } from "@/lib/strings";
import { Wordmark } from "@/components/site-header";

// Temporary landing page until R1 (ulaz kao Kahoot) replaces it.
export default function Home() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 pt-10 text-center md:pt-20">
      <Wordmark size="lg" />
      <p className="text-lg text-balance text-muted-foreground md:text-xl">{t.tagline}</p>
      <Link
        href="/igra"
        className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-card transition hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Pogledaj igru (primjer) <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
