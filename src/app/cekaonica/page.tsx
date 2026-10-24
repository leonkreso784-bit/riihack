"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BedDouble, MapPin } from "lucide-react";
import { api, usePoll } from "@/lib/client";

// R1: after joining, wait here until the professor starts the game, then go to /igra.
export default function WaitingRoom() {
  const router = useRouter();
  const { data, error } = usePoll(api.me);
  const started = data?.world.status !== undefined && data.world.status !== "lobby";

  useEffect(() => {
    if (started) router.replace("/igra");
  }, [started, router]);

  if (error)
    return (
      <div className="mx-auto max-w-md space-y-4 pt-12 text-center">
        <p role="alert" className="rounded-xl bg-down-soft px-4 py-3 text-down">{error.message}</p>
        <Link href="/" className="font-semibold text-secondary-foreground hover:underline">Natrag na ulaz</Link>
      </div>
    );
  if (!data) return <p className="pt-12 text-center text-muted-foreground">Učitavam…</p>;

  const c = data.company;
  return (
    <div className="mx-auto max-w-md pt-4 text-center md:pt-12">
      <p className="text-sm font-semibold text-muted-foreground">Dobio si hotel</p>
      <h1 className="anim-pop mt-1 text-4xl font-extrabold tracking-tight">{c.hotelName}</h1>

      <div className="surface anim-rise mt-8 grid [--i:3] grid-cols-2 divide-x rounded-[var(--radius)] py-5">
        <div className="px-4">
          <MapPin className="mx-auto size-5 text-secondary-foreground" aria-hidden />
          <p className="mt-2 font-bold">{c.place}</p>
          <p className="text-sm text-muted-foreground" aria-label={`${c.stars} zvjezdice`}>{"★".repeat(c.stars)}</p>
        </div>
        <div className="px-4">
          <BedDouble className="mx-auto size-5 text-secondary-foreground" aria-hidden />
          <p className="mt-2 font-bold">{c.roomsCount} soba</p>
          <p className="text-sm text-muted-foreground">spremne za goste</p>
        </div>
      </div>

      <p role="status" className="mt-10 flex items-center justify-center gap-3 text-lg font-semibold">
        <span className="relative flex size-3">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-3 rounded-full bg-primary" />
        </span>
        Čekamo da profesor pokrene igru…
      </p>
      <p className="mt-2 text-sm text-muted-foreground">Ne zatvaraj stranicu. Igra se otvara sama.</p>
    </div>
  );
}
