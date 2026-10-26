"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { plural } from "@/lib/format";
import { matchesDeleteConfirmation } from "@/lib/game/erase-plan";
import { Field, FormError } from "@/components/form";
import { Dots } from "@/components/loading";
import { Panel } from "@/components/panel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DANGER =
  "flex min-h-11 items-center gap-2 rounded-xl border border-down/40 bg-card px-4 text-sm font-bold text-down transition-colors hover:bg-down-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-down";

// #297 (GDPR): potvrda trajnog brisanja. Dijele je "Obriši igru" i "Ukloni studenta"; canConfirm otključava crvenu tipku.
function EraseDialog({
  open,
  title,
  description,
  confirmLabel,
  busyLabel,
  canConfirm,
  busy,
  error,
  onClose,
  onConfirm,
  children,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  busyLabel: string;
  canConfirm: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] gap-5 overflow-y-auto p-5 sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canConfirm && !busy) onConfirm();
          }}
          className="space-y-5"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold tracking-tight">{title}</DialogTitle>
            <DialogDescription render={<div />} className="space-y-2 text-base text-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
          {children}
          {error && <FormError key={error}>{error}</FormError>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="min-h-12 rounded-xl border bg-card px-6 text-base font-bold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={!canConfirm || busy}
              className="min-h-12 rounded-xl bg-down px-6 text-base font-bold text-white transition-colors hover:bg-[#a51f1f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-down disabled:opacity-50"
            >
              {busy ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Dots /> {busyLabel}
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Na dnu ploče igre: što se čuva i tipka "Obriši igru". Brisanje traži upisan naziv ili kod igre (provjerava i poslužitelj).
export function DeleteGameSection({ world, hotels }: { world: { id: string; name: string; joinCode: string }; hotels: number }) {
  const router = useRouter();
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setTyped("");
    setError(null);
  };

  async function erase() {
    setBusy(true);
    setError(null);
    try {
      await api.deleteWorld(world.id, typed);
      toast.success(`Igra ${world.name} je obrisana`);
      router.replace("/profesor"); // ulaz sam prosljeđuje prijavljenog profesora na "Moje igre", a ostalima nudi prijavu
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <Panel title="Podaci i brisanje">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-prose text-sm text-muted-foreground">
            Hoteli, odgovori, razgovori s likovima, izvještaji i ocjene studenata čuvaju se u bazi dok ih ne obrišeš. Brisanje igre uklanja sve to trajno i ne može se poništiti.
          </p>
          <button type="button" onClick={() => setOpen(true)} className={`${DANGER} shrink-0 justify-center`}>
            <Trash2 className="size-4" aria-hidden /> Obriši igru
          </button>
        </div>
      </Panel>

      <EraseDialog
        open={open}
        title={`Obrisati igru ${world.name}?`}
        description={
          <>
            <p>
              {hotels > 0
                ? `Trajno se brišu igra i svi podaci studenata: ${hotels} ${plural(hotels, "hotel", "hotela", "hotela")} s odgovorima, razgovorima s likovima, izvještajima, ocjenama i poštom, te situacije koje si napisao u ovoj igri.`
                : "Trajno se brišu igra i situacije koje si napisao u njoj."}{" "}
              To se ne može poništiti.
            </p>
            <p>Studenti odmah gube pristup. Knjižnica situacija na tvom računu ostaje.</p>
          </>
        }
        confirmLabel="Obriši igru trajno"
        busyLabel="Brišem"
        canConfirm={matchesDeleteConfirmation(world, typed)}
        busy={busy}
        error={error}
        onClose={close}
        onConfirm={erase}
      >
        <Field
          id={`${uid}-confirm`}
          label={`Za potvrdu upiši naziv igre (${world.name}) ili kod igre (${world.joinCode})`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </EraseDialog>
    </>
  );
}

// Na stranici studenta: "Ukloni studenta" s potvrdom. Nakon uklanjanja natrag na ploču igre.
export function RemoveStudentButton({ worldId, companyId, hotelName, playerName }: { worldId: string; companyId: string; hotelName: string; playerName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setError(null);
  };

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api.removeStudent(worldId, companyId);
      toast.success(`Student ${playerName} je uklonjen`);
      router.replace(`/profesor/${worldId}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={DANGER}>
        <UserMinus className="size-4" aria-hidden /> Ukloni studenta
      </button>
      <EraseDialog
        open={open}
        title={`Ukloniti studenta ${playerName}?`}
        description={
          <>
            <p>
              Trajno se brišu hotel {hotelName} te njegovi odgovori, razgovori s likovima, izvještaji, ocjene i pošta. To se ne može poništiti.
            </p>
            <p>
              Poruke koje je hotel slao drugim hotelima ili primao od njih nestaju i kod njih. Dok sezona traje, student može ponovno ući kodom igre, ali dobije novi hotel i počinje ispočetka.
            </p>
          </>
        }
        confirmLabel="Ukloni studenta"
        busyLabel="Uklanjam"
        canConfirm
        busy={busy}
        error={error}
        onClose={close}
        onConfirm={remove}
      />
    </>
  );
}
