"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

// Leaves the game: asks the server to drop the cookie, then back to the join screen either way.
export function LogoutButton({ variant = "row", className }: { variant?: "row" | "icon"; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await api.logout().catch(() => {}); // leave even if the request fails; the cookie expires on its own
    router.replace("/");
  }
  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      aria-label={variant === "icon" ? "Odjava" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary disabled:opacity-60",
        variant === "row" ? "min-h-11 w-full px-3 text-sm" : "size-11 justify-center",
        className,
      )}
    >
      <LogOut className="size-5" aria-hidden />
      {variant === "row" && "Odjava"}
    </button>
  );
}
