"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { api, usePoll } from "@/lib/client";
import { unreadLabel } from "@/lib/format";
import type { ContractView, MailKind, MailMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { FormError } from "@/components/form";
import { OfferCard } from "@/components/offer-card";
import { BackLink } from "@/components/back-link";
import { Loading } from "@/components/loading";

const FILTERS: { key: MailKind | "all"; label: string }[] = [
  { key: "all", label: "Sve" },
  { key: "agency", label: "Agencije" },
  { key: "hotel", label: "Hoteli" },
  { key: "system", label: "Grad" },
];
const AVATAR: Record<MailKind, string> = { agency: "bg-primary text-primary-foreground", hotel: "bg-night text-white", system: "bg-muted text-muted-foreground" };
const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const when = (at: string) => {
  const d = new Date(at);
  return d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("hr-HR", { day: "numeric", month: "numeric" });
};
const unreadIn = (msgs: MailMessage[]) => msgs.filter((m) => !m.read && !m.mine);

// R13: the hotel's mail. Threads on the left, the open conversation on the right (on a phone one at a time). A thread
// tied to a contract offer shows the offer card: accept, decline or one counter-offer; the agency replies by mail.
export default function MailPage() {
  const { data, error, refresh } = usePoll(api.me);
  const [filter, setFilter] = useState<MailKind | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  if (error && !data) return <FormError>{error.message}</FormError>;
  if (!data) return <Loading />;

  const mail = data.mail ?? [];
  const threads = [...Map.groupBy(mail, (m) => m.threadId).values()]
    .map((msgs) => [...msgs].sort((a, b) => a.at.localeCompare(b.at)))
    .sort((a, b) => b.at(-1)!.at.localeCompare(a.at(-1)!.at));
  const shown = threads.filter((t) => filter === "all" || t[0].kind === filter);
  const open = threads.find((t) => t[0].threadId === openId);

  const select = (thread: MailMessage[]) => setOpenId(thread[0].threadId);

  const count = (k: MailKind) => threads.filter((t) => t[0].kind === k && unreadIn(t).length).length;

  return (
    <div className="space-y-5 pt-4 md:pt-0">
      <PageHeader title="Pošta" subtitle={data.unreadMail ? `${unreadLabel(data.unreadMail)} · ponude agencija, poruke hotela i obavijesti grada` : "Ponude agencija, poruke hotela i obavijesti grada"} />

      <div role="tablist" aria-label="Vrsta pošte" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = f.key === "all" ? 0 : count(f.key);
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn("min-h-11 rounded-xl px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary", filter === f.key ? "bg-secondary font-bold text-secondary-foreground" : "bg-muted hover:bg-secondary")}
            >
              {f.label}
              {n > 0 && ` ${n}`}
            </button>
          );
        })}
      </div>

      {threads.length === 0 ? (
        <p className="surface rounded-[var(--radius)] p-6 text-muted-foreground">Pošta je prazna. Ponude agencija stižu kad profesor otvori mjesec.</p>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-start">
          <ul aria-label="Poruke" className={cn("surface space-y-1 rounded-[var(--radius)] p-2", open && "hidden lg:block")}>
            {shown.map((t) => {
              const last = t.at(-1)!;
              const first = t[0];
              const contract = data.contracts.find((c) => c.id === t.find((m) => m.contractId)?.contractId);
              const unread = unreadIn(t).length > 0;
              const other = first.mine ? first.toName : first.fromName;
              return (
                <li key={first.threadId}>
                  <button
                    type="button"
                    onClick={() => select(t)}
                    aria-current={open === t ? "true" : undefined}
                    className={cn("flex w-full gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary", open === t && "bg-secondary")}
                  >
                    <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full text-sm font-extrabold", AVATAR[first.kind])}>{initials(other)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between gap-2">
                        <span className={cn("truncate text-sm", unread ? "font-extrabold" : "font-semibold")}>{other}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{when(last.at)}</span>
                      </span>
                      <span className={cn("block truncate text-sm", unread && "font-bold")}>{first.subject}</span>
                      <span className="block truncate text-xs text-muted-foreground">{last.mine ? "Ti: " : ""}{last.body}</span>
                      {contract?.status === "offered" && (
                        <span className="mt-1 inline-block rounded-full bg-sand px-2 py-0.5 text-xs font-bold">{contract.counterPricePerNight || contract.counterMonthlyCost ? "Protuponuda agencije" : "Ponuda · čeka odgovor"}</span>
                      )}
                      {contract?.status === "accepted" && <span className="mt-1 inline-block rounded-full bg-mint px-2 py-0.5 text-xs font-bold text-up">Ugovor potpisan</span>}
                    </span>
                    {unread && <span className="sr-only">nepročitano</span>}
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && <li className="p-4 text-sm text-muted-foreground">Ovdje još nema poruka.</li>}
          </ul>

          {open ? (
            <Thread thread={open} contractId={open.find((m) => m.contractId)?.contractId} contracts={data.contracts} onBack={() => setOpenId(null)} onChange={refresh} />
          ) : (
            <p className="surface hidden rounded-[var(--radius)] p-6 text-muted-foreground lg:block">Odaberi poruku s popisa.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Thread({ thread, contractId, contracts, onBack, onChange }: { thread: MailMessage[]; contractId?: string; contracts: ContractView[]; onBack: () => void; onChange: () => void }) {
  const contract = contracts.find((c) => c.id === contractId);
  // Whatever arrives in the open thread (the agency's reply too) counts as read.
  const unread = unreadIn(thread).map((m) => m.id).join(",");
  const markRead = useEffectEvent(() => {
    if (unread) Promise.all(unread.split(",").map((id) => api.markRead(id))).then(onChange, () => {});
  });
  useEffect(() => markRead(), [unread]);
  return (
    <article className="surface min-w-0 space-y-4 rounded-[var(--radius)] p-5 md:p-6" aria-label="Otvorena poruka">
      <BackLink onClick={onBack} label="Sva pošta" className="lg:hidden" />
      <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">{thread[0].subject}</h2>
      <ol className="space-y-3">
        {thread.map((m) => (
          <li key={m.id} className={cn("flex flex-col gap-1", m.mine && "items-end")}>
            <span className="text-xs font-bold text-muted-foreground">
              {m.mine ? "Ti" : m.fromName} · {when(m.at)}
            </span>
            <p className={cn("anim-rise max-w-[92%] rounded-2xl px-4 py-3 whitespace-pre-line", m.mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted")}>{m.body}</p>
          </li>
        ))}
      </ol>
      {contract && <OfferCard key={`${contract.id}-${contract.status}-${contract.negotiated}`} contract={contract} onChange={onChange} />}
    </article>
  );
}
