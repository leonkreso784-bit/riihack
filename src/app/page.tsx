import { t } from "@/lib/strings";

// Temporary landing page until R1 (ulaz kao Kahoot) replaces it.
export default function Home() {
  return (
    <section className="space-y-4 pt-10 text-center md:pt-20">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t.appName}</h1>
      <p className="mx-auto max-w-xl text-lg text-muted-foreground">{t.tagline}</p>
    </section>
  );
}
