import Link from "next/link";
import { ArrowRight, Building2, MessageCircle, Users } from "lucide-react";
import { t } from "@/lib/strings";
import { LogoMark } from "@/components/logo";

const POINTS = [
  { icon: Building2, title: "Pravi grad", text: "Svi hoteli dijele iste turiste. Tvoja odluka mijenja poslovanje drugih." },
  { icon: MessageCircle, title: "Ljudi, ne gotovi odgovori", text: "Razgovaraš s gostima i zaposlenicima. Vlastite riječi vrijede više od klika." },
  { icon: Users, title: "Razred kao Kahoot", text: "Profesor otvori grad, razred uđe kodom i igra mjesec po mjesec." },
];

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// Intro page. Students go on to the code entry (/ulaz), professors to /profesor.
export default function Home() {
  return (
    <div className="space-y-14 pb-10">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-7 pt-8 text-center md:pt-16">
        <LogoMark title="Simpolis" className="size-24 md:size-28" />
        <h1 className="text-5xl font-extrabold tracking-tight text-balance md:text-7xl">Simpolis</h1>
        <p className="max-w-xl text-lg text-balance text-muted-foreground md:text-xl">{t.tagline}</p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href="/ulaz" className={`gloss lift inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl px-7 text-base font-bold ${focus}`}>
            Uđi u igru <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link href="/profesor" className={`surface lift inline-flex min-h-13 items-center justify-center rounded-2xl px-7 text-base font-bold ${focus}`}>
            Ja sam profesor
          </Link>
        </div>
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
