"use client";

import { Moon, Sun, Sunset } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { STAFF_DEPARTMENT_LABELS, STAFF_SHIFT_LABELS } from "@/lib/rules";
import type { StaffDepartment, StaffShift } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Pill, type Tone } from "@/components/pill";
import { FormError } from "@/components/form";

const DEPARTMENTS = Object.keys(STAFF_DEPARTMENT_LABELS) as StaffDepartment[];
const SHIFT: Record<StaffShift, { icon: typeof Sun; tone: Tone }> = {
  morning: { icon: Sun, tone: "warn" },
  afternoon: { icon: Sunset, tone: "accent" },
  night: { icon: Moon, tone: "neutral" },
};

// Hotel staff by department: name, job, shift and a note when there is one. Staff never changes during a game.
export default function StaffPage() {
  const { data: staff, error } = usePoll(api.staff, 60_000);
  if (error && !staff) return <FormError>{error.message}</FormError>;
  if (!staff) return <p className="pt-6 text-muted-foreground">Učitavam…</p>;

  return (
    <div className="space-y-6 pt-4 md:pt-0">
      <PageHeader title="Osoblje" subtitle={`${staff.length} ljudi u ${DEPARTMENTS.length} odjela`} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2">
        {DEPARTMENTS.map((d) => {
          const people = staff.filter((s) => s.department === d);
          if (!people.length) return null;
          return (
            <Panel key={d} title={STAFF_DEPARTMENT_LABELS[d]} action={<Pill>{people.length}</Pill>}>
              <ul className="divide-y">
                {people.map((p) => {
                  const { icon: Icon, tone } = SHIFT[p.shift];
                  return (
                    <li key={p.name} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="font-bold">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.role}</p>
                        {p.note && <p className="mt-1 text-sm">{p.note}</p>}
                      </div>
                      <Pill tone={tone} className="shrink-0">
                        <Icon className="size-3.5" aria-hidden /> {STAFF_SHIFT_LABELS[p.shift]}
                      </Pill>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
