import Link from "next/link";
import { ArrowRight, Building2, MessageCircle, Users } from "lucide-react";
import { t } from "@/lib/strings";
import { LogoMark } from "@/components/logo";

const POINTS = [
  { icon: Building2, title: "Pravi grad", text: "Svi hoteli dijele iste turiste. Tvoja odluka mijenja poslovanje drugih." },
  { icon: MessageCircle, title: "Ljudi, ne gotovi odgovori", text: "Razgovaraš s gostima i zaposlenicima. Vlastite riječi vrijede više od klika." },
  { icon: Users, title: "Razred kao Kahoot", text: "Profesor otvori grad, razred uđe kodom i igra mjesec po mjesec." },
];

// Temporary landing page until R1 (ulaz kao Kahoot) replaces it.
export default function Home() {
  return (
    <div className="space-y-14 pb-10">
      <section className="relative mx-auto flex max-w-3xl flex-col items-center gap-7 pt-8 text-center md:pt-16">
        <div aria-hidden className="absolute top-0 left-1/2 -z-10 size-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <LogoMark title="Simpolis" className="size-24 drop-shadow-[0_18px_30px_rgb(36_107_253_/_0.45)] md:size-28" />
        <h1 className="text-5xl font-extrabold tracking-tight text-balance md:text-7xl">
          Sim<span className="bg-gradient-to-br from-[#2a6ffd] to-[#173fb0] bg-clip-text text-transparent">polis</span>
        </h1>
        <p className="max-w-xl text-lg text-balance text-muted-foreground md:text-xl">{t.tagline}</p>
        <Link
          href="/igra"
          className="gloss lift inline-flex min-h-13 items-center gap-2 rounded-2xl px-7 text-base font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Pogledaj igru (primjer) <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      <ul className="grid gap-4 md:grid-cols-3">
        {POINTS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="surface lift rounded-[var(--radius)] p-6">
            <span className="gloss grid size-11 place-items-center rounded-xl">
              <Icon className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
