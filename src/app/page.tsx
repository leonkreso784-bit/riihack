import { t } from "@/lib/strings";

// Privremeno (L0): naziv i tagline. Ulaz kodom radi Rino u R1.
export default function Home() {
  return (
    <section className="space-y-5 pt-10 text-center md:pt-20">
      <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">{t.appName}</h1>
      <p className="mx-auto max-w-xl text-lg text-muted-foreground">{t.tagline}</p>
    </section>
  );
}
