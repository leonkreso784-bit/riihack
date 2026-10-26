"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { CheckCircle2, Reply, SquarePen } from "lucide-react";
import { api, usePoll } from "@/lib/client";
import { mergeSentMail, replySubject } from "@/lib/engine/mail-send";
import { unreadLabel } from "@/lib/format";
import type { ContractView, MailKind, MailMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { FormError } from "@/components/form";
import { MailComposer } from "@/components/mail-composer";
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
// #303: "Nova poruka" opens the composer in the right-hand place; a sent message is kept locally until the poll
// returns it, so it shows in the list and opens at once. A message from another hotel has "Odgovori", which opens the
// composer for that hotel with the subject "Re: ...". Hotels run by the computer (bots) are not offered: nobody reads
// their mail.
export default function MailPage() {
  const { data, error, refresh } = usePoll(api.me);
  const [filter, setFilter] = useState<MailKind | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState<{ to: string; subject: string } | undefined>(undefined); // set when replying
  const [sent, setSent] = useState<MailMessage[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false); // focus goes to the thread heading only after a send

  if (error && !data) return <FormError>{error.message}</FormError>;
  if (!data) return <Loading />;

  const stored = data.mail ?? [];
  const mail = mergeSentMail(stored, sent);
  const recipients = data.leaderboard.filter((h) => h.companyId !== data.company.id && !h.isBot).sort((a, b) => a.hotelName.localeCompare(b.hotelName, "hr"));
  const cannotSend = data.world.status !== "running" ? "Poruke se mogu slati dok je igra u tijeku." : recipients.length === 0 ? "Nema drugih hotela koje vode studenti, pa nema kome pisati." : null;
  const threads = [...Map.groupBy(mail, (m) => m.threadId).values()]
    .map((msgs) => [...msgs].sort((a, b) => a.at.localeCompare(b.at)))
    .sort((a, b) => b.at(-1)!.at.localeCompare(a.at(-1)!.at));
  const shown = threads.filter((t) => filter === "all" || t[0].kind === filter);
  const open = threads.find((t) => t[0].threadId === openId);

  const select = (thread: MailMessage[]) => {
    setOpenId(thread[0].threadId);
    setComposing(false);
    setNotice(null);
    setJustSent(false);
  };
  const compose = (reply?: { to: string; subject: string }) => {
    setOpenId(null);
    setDraft(reply);
    setComposing(true);
    setNotice(null);
    setJustSent(false);
  };
  const back = () => {
    setOpenId(null);
    setNotice(null);
    setJustSent(false);
  };
  const cancelCompose = () => {
    setComposing(false);
    setNotice(null);
  };
  // stillOpen = false: the player left the form while the request ran. The message still counts as sent (it is in
  // the list), but the page stays where they went.
  const onSent = (message: MailMessage, stillOpen: boolean) => {
    setSent((all) => [...all, message]);
    setNotice(`Poruka je poslana: ${message.toName}.`);
    refresh();
    if (!stillOpen) return;
    setFilter("all");
    setOpenId(message.threadId);
    setComposing(false);
    setJustSent(true);
  };
  // A reply goes to the hotel that wrote, found by name in the list of possible recipients.
  const replyFor = (thread: MailMessage[]) => {
    const first = thread[0];
    const to = first.kind === "hotel" && !first.mine && !cannotSend ? recipients.find((h) => h.hotelName === first.fromName)?.companyId : undefined;
    return to ? () => compose({ to, subject: replySubject(first.subject) }) : undefined;
  };

  const count = (k: MailKind) => threads.filter((t) => t[0].kind === k && unreadIn(t).length).length;

  return (
    <div className="space-y-5 pt-4 md:pt-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="Pošta" subtitle={data.unreadMail ? `${unreadLabel(data.unreadMail)} · ponude agencija, poruke hotela i obavijesti grada` : "Ponude agencija, poruke hotela i obavijesti grada"} />
        <button
          type="button"
          onClick={() => compose()}
          disabled={cannotSend !== null || composing}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground transition-colors hover:bg-[#1f5fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
        >
          <SquarePen className="size-4" aria-hidden /> Nova poruka
        </button>
      </div>
      {cannotSend && <p className="text-sm text-muted-foreground">{cannotSend}</p>}
      <div role="status" className="empty:hidden">
        {notice && (
          <p className="anim-rise flex items-start gap-2 rounded-xl bg-mint px-4 py-3 text-up">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>{notice}</span>
          </p>
        )}
      </div>

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

      {threads.length === 0 && !composing ? (
        <p className="surface rounded-[var(--radius)] p-6 text-muted-foreground">Pošta je prazna. Ponude agencija stižu kad profesor otvori mjesec.</p>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-start">
          <ul aria-label="Poruke" className={cn("surface space-y-1 rounded-[var(--radius)] p-2", (open || composing) && "hidden lg:block")}>
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

          {composing ? (
            <MailComposer meId={data.company.id} recipients={recipients} initial={draft} onSent={onSent} onCancel={cancelCompose} />
          ) : open ? (
            <Thread thread={open} contractId={open.find((m) => m.contractId)?.contractId} contracts={data.contracts} focusHeading={justSent} onReply={replyFor(open)} onBack={back} onChange={refresh} />
          ) : (
            <p className="surface hidden rounded-[var(--radius)] p-6 text-muted-foreground lg:block">Odaberi poruku s popisa.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Thread({
  thread,
  contractId,
  contracts,
  focusHeading,
  onReply,
  onBack,
  onChange,
}: {
  thread: MailMessage[];
  contractId?: string;
  contracts: ContractView[];
  focusHeading: boolean;
  onReply?: () => void;
  onBack: () => void;
  onChange: () => void;
}) {
  const contract = contracts.find((c) => c.id === contractId);
  const heading = useRef<HTMLHeadingElement>(null);
  const threadId = thread[0].threadId;
  // After a send the form is gone, so focus goes to the thread that was just opened instead of dropping to the page.
  useEffect(() => {
    if (focusHeading) heading.current?.focus();
  }, [focusHeading, threadId]);
  // Whatever arrives in the open thread (the agency's reply too) counts as read.
  const unread = unreadIn(thread).map((m) => m.id).join(",");
  const markRead = useEffectEvent(() => {
    if (unread) Promise.all(unread.split(",").map((id) => api.markRead(id))).then(onChange, () => {});
  });
  useEffect(() => markRead(), [unread]);
  return (
    <article className="surface min-w-0 space-y-4 rounded-[var(--radius)] p-5 md:p-6" aria-label="Otvorena poruka">
      <BackLink onClick={onBack} label="Sva pošta" className="lg:hidden" />
      <div className="space-y-1">
        <h2 ref={heading} tabIndex={-1} className="text-xl font-extrabold tracking-tight outline-none md:text-2xl">{thread[0].subject}</h2>
        <p className="text-sm text-muted-foreground">{thread[0].mine ? `Za: ${thread[0].toName}` : `Od: ${thread[0].fromName}`}</p>
      </div>
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
      {onReply && (
        <button
          type="button"
          onClick={onReply}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-bold text-primary-foreground transition-colors hover:bg-[#1f5fe0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto"
        >
          <Reply className="size-4" aria-hidden /> Odgovori
        </button>
      )}
    </article>
  );
}
