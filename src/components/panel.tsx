import { cn } from "@/lib/utils";

const TONES = { plain: "bg-card", accent: "bg-secondary", mint: "bg-mint", sand: "bg-sand" } as const;
const PADS = { md: "p-5", sm: "p-4", list: "px-5 py-2", none: "" } as const;

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
    <section className={cn("rounded-[var(--radius)] border shadow-card", TONES[tone], PADS[pad], className)}>
      {title && (
        <div className={cn("mb-3 flex items-center justify-between gap-3", pad === "list" && "mt-2")}>
          <h2 className="text-base font-bold tracking-tight">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
