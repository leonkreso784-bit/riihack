import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

// One failed poll (weak Wi-Fi) must not replace the page: it keeps the last good data and shows this small notice.
// usePoll keeps polling, so the notice disappears by itself with the next successful answer.
export function PollNotice({ error, className }: { error?: Error; className?: string }) {
  if (!error) return null;
  return (
    <p role="status" className={cn("flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-left text-sm font-medium text-muted-foreground", className)}>
      <WifiOff className="size-4 shrink-0" aria-hidden />
      Osvježavanje nije uspjelo. Prikazujem zadnje podatke i pokušavam ponovno.
    </p>
  );
}
