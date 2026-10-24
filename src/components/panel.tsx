import { cn } from "@/lib/utils";

const TONES = {
  plain: "surface",
  accent: "border bg-secondary",
  mint: "border border-mint bg-mint",
  sand: "border border-sand bg-gradient-to-b from-[#f8efe1] to-sand shadow-card",
} as const;
const PADS = { md: "p-5 md:p-6", sm: "p-4", list: "px-5 py-2 md:px-6", none: "" } as const;

// The one card surface of the app (HotelixSim Card): tone and padding by prop, className only for layout.
export function Panel({
  title,
  action,
  tone = "plain",
  pad = "md",
  className,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  tone?: keyof typeof TONES;
  pad?: keyof typeof PADS;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-[var(--radius)]", TONES[tone], PADS[pad], className)}>
      {title && (
        <div className={cn("mb-3 flex items-center justify-between gap-3", pad === "list" && "mt-3")}>
          <h2 className="text-[0.95rem] font-bold tracking-tight">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
