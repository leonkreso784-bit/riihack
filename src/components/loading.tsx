import { cn } from "@/lib/utils";
import { LogoMark } from "./logo";

// Three dots hopping in turn: "something is happening". Static under prefers-reduced-motion.
export function Dots({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ ["--i" as string]: i }} className="anim-dot size-1.5 rounded-full bg-current" />
      ))}
    </span>
  );
}

// A page or list that is still loading: the logo breathes, the label hops.
export function Loading({ label = "Učitavam", className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn("flex flex-col items-center gap-4 pt-16 pb-8 text-muted-foreground", className)}>
      <LogoMark className="anim-breathe size-14" />
      <span className="flex items-center gap-2 text-sm font-semibold">
        {label}
        <Dots />
      </span>
    </div>
  );
}

// Someone in the chat is writing (the mentor, a character): a bubble with typing dots, like a messenger.
export function Thinking({ who, text }: { who: string; text: string }) {
  return (
    <div role="status" className="flex flex-col gap-1">
      <span className="text-xs font-bold text-muted-foreground">{who}</span>
      <p className="anim-pop inline-flex w-fit items-center gap-3 rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-muted-foreground">
        <Dots className="text-secondary-foreground" />
        {text}
      </p>
    </div>
  );
}
