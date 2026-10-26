"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

// #298: the professor downloads the grades of all students as a CSV (the server names the file and checks the game).
export function ExportGradesButton({ worldId, className }: { worldId: string; className?: string }) {
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      const { filename, blob } = await api.exportGrades(worldId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toast.error((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <button type="button" onClick={run} disabled={busy} className={cn("disabled:opacity-50", className)}>
      <Download className="size-4" aria-hidden /> {busy ? "Izvozim…" : "Izvezi ocjene (CSV)"}
    </button>
  );
}
