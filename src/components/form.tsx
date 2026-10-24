import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dots } from "./loading";

// Labelled text field used on every form (join, professor login, new game).
export function Field({ id, label, className, ...props }: React.ComponentProps<"input"> & { id: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <Input id={id} className={cn("h-12 rounded-xl bg-card px-4 text-base", className)} {...props} />
    </div>
  );
}

export function SubmitButton({ busy, busyText, disabled = false, children }: { busy: boolean; busyText: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="min-h-12 w-full rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground transition-colors hover:bg-[#1f5fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
    >
      {busy ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Dots />
          {busyText.replace(/…$/, "")}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="anim-shake rounded-xl bg-down-soft px-4 py-3 text-sm font-medium text-down">
      {children}
    </p>
  );
}
