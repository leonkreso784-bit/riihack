"use client";

import { useState } from "react";
import { STAFF_DEPARTMENT_LABELS } from "@/lib/rules";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BIZ_META, bonitet, fmtDec, growth, inBlockade, monthName, profit, rank, reviewsCount, score, word, type PublicProfile } from "@/lib/karta";

const TABS = ["Pregled", "Financije", "Registar"] as const;
const TONE = { up: "bg-up", warn: "bg-warn", down: "bg-down", none: "bg-muted-foreground" } as const;

// Mala oznaka uz vrijednost koja nije stvarna (API još ne daje javni profil tuđih hotela).
function Primjer() {
  return <span title="Uzorak: stvarni podatak još nije u API-ju" className="ml-1.5 rounded-full bg-sand px-1.5 py-px align-middle text-[10px] font-bold text-foreground">primjer</span>;
}

export function CompanyCard({ profile: p, all, district, onClose }: { profile: PublicProfile; all: PublicProfile[]; district: string; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const blocked = inBlockade(p.cash);
  return (
    <div
      role="dialog"
      aria-label={`Kartica tvrtke ${p.name}`}
      className="absolute inset-x-0 bottom-0 z-[1000] flex max-h-[62%] flex-col overflow-hidden rounded-t-[var(--radius)] bg-card shadow-lift md:inset-x-auto md:bottom-3 md:left-3 md:top-14 md:max-h-none md:w-[390px] md:rounded-[var(--radius)]"
    >
      <button onClick={onClose} aria-label="Zatvori karticu" className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-muted text-sm font-bold hover:bg-border">
        ✕
      </button>
      <div className="px-5 pb-2 pt-4 pr-12">
        <h3 className="text-xl font-extrabold leading-tight">
          {p.name}
          {p.isYou && <span className="ml-2 rounded-full bg-sand px-2 py-0.5 align-middle text-[11px] font-bold">Tvoj hotel</span>}
        </h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {"★".repeat(p.stars)} · Hotel · {district} · {p.student}{" "}
          <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold", blocked ? "bg-down-soft text-down" : "bg-mint text-up")}>{blocked ? "U blokadi" : "Aktivan"}</span>
        </p>
      </div>
      <div role="tablist" className="flex border-b px-2">
        {TABS.map((t, i) => (
          <button key={t} role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={cn("flex-1 border-b-[3px] py-2.5 text-[13px] font-semibold", tab === i ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
            {t}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-3.5 text-[13px]">
        {tab === 0 && <Pregled p={p} />}
        {tab === 1 && <Financije p={p} all={all} />}
        {tab === 2 && <Registar p={p} district={district} />}
        {!p.isYou && <p className="mt-4 rounded-lg bg-sand/60 px-3 py-2 text-[11px]">Skica: za tuđe hotele su ocjene, cijena i financije uzorak (oznaka &bdquo;primjer&ldquo;). Novac na računu, mjesto, igrač i ugovori su stvarni.</p>}
      </div>
    </div>
  );
}

function Pregled({ p }: { p: PublicProfile }) {
  const s = score(p.metrics.reviews);
  const nights = p.months.reduce((a, m) => a + m.nights, 0);
  const subs: [string, number][] = [["Gosti", p.metrics.guests], ["Recenzije", p.metrics.reviews], ["Osoblje", p.metrics.staff], ["Rad hotela", p.metrics.operations]];
  const maxO = Math.max(1, ...p.months.map((m) => m.occupancyPct));
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="rounded-[10px_10px_10px_0] bg-night px-2.5 py-2 text-xl font-extrabold text-white">{fmtDec(s)}</div>
        <div>
          <b className="text-base">{word(s)}{p.sample.ratings && <Primjer />}</b>
          <div className="text-xs text-muted-foreground">{nights > 0 ? `${reviewsCount(nights)} recenzija gostiju` : "Još nema recenzija"}</div>
        </div>
        <div className="ml-auto shrink-0 text-right">
          <b className="whitespace-nowrap">od {p.price} €</b>
          {p.sample.price && <Primjer />}
          <div className="text-xs text-muted-foreground">po noći</div>
        </div>
      </div>
      <div className="my-3.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
        {subs.map(([l, v]) => (
          <div key={l} className="text-xs">
            {l} <b className="float-right">{fmtDec(v / 10)}</b>
            <div className="mt-1 h-1.5 rounded-full bg-muted"><i className="block h-full rounded-full bg-night" style={{ width: `${v}%` }} /></div>
          </div>
        ))}
      </div>
      <H>Popunjenost po mjesecima</H>
      {p.months.length ? (
        <>
          <div className="mt-2 flex h-[70px] items-end gap-2">
            {p.months.map((m) => (
              <div key={m.round} title={`${m.occupancyPct} %`} className={cn("flex-1 rounded-t-md", m.round === p.months.at(-1)?.round ? "bg-primary" : "bg-secondary")} style={{ height: `${(m.occupancyPct / maxO) * 100}%` }} />
            ))}
          </div>
          <div className="mt-1 flex gap-2 text-[11px] text-muted-foreground">
            {p.months.map((m) => <span key={m.round} className="flex-1 text-center">{monthName(m.round).slice(0, 3)} · {m.occupancyPct} %</span>)}
          </div>
        </>
      ) : <Note>Još nema zatvorenog mjeseca.</Note>}
      <H>Partneri</H>
      {p.partners.length ? p.partners.map((b) => (
        <div key={b.name} className="flex items-center gap-2.5 border-b py-2">
          <i className="grid size-6 place-items-center rounded-full bg-up text-[11px] font-extrabold not-italic text-white">{BIZ_META[b.kind].letter}</i>
          <div><b>{b.name}</b><br /><span className="text-muted-foreground">{BIZ_META[b.kind].label} · aktivan ugovor</span></div>
        </div>
      )) : <Note>Nema aktivnih ugovora.</Note>}
    </>
  );
}

function Financije({ p, all }: { p: PublicProfile; all: PublicProfile[] }) {
  const last = p.months.at(-1);
  const bon = bonitet(p.cash, p.startCash, last ? profit(last) : null);
  const g = growth(p.months);
  const shown = p.months.slice(-3);
  const blocked = inBlockade(p.cash);
  const F = p.sample.finance ? <Primjer /> : null;
  const depts = Object.entries(p.staffByDept).map(([d, n]) => `${STAFF_DEPARTMENT_LABELS[d as keyof typeof STAFF_DEPARTMENT_LABELS]} ${n}`).join(" · ");
  return (
    <>
      <div className="flex items-center gap-3 rounded-xl bg-secondary/60 px-3 py-2.5">
        <div className={cn("rounded-[10px] px-3 py-1 text-2xl font-extrabold text-white", TONE[bon.tone])}>{bon.grade}</div>
        <div><b>Bonitetna ocjena</b>{F}<br /><span className="text-xs text-muted-foreground">{bon.text}</span></div>
      </div>
      <div className="my-2.5 grid grid-cols-2 gap-1.5">
        <Cell l="Račun"><b className={blocked ? "text-down" : "text-up"}>{blocked ? "U blokadi" : "Nije u blokadi"}</b></Cell>
        <Cell l="Novac na računu"><b>{eur(p.cash)}</b></Cell>
        <Cell l="Rang po prihodu"><b>{last ? `${rank(p.id, all)}. od ${all.length}` : "–"}</b>{F}</Cell>
        <Cell l="Tržišni udio"><b>{p.months.length ? `${p.share} %` : "–"}</b>{F}</Cell>
      </div>
      <H>Financijski sažetak</H>
      {shown.length ? (
        <table className="w-full border-collapse text-[13px]">
          <thead><tr><th className="py-1.5 text-left" />{shown.map((m) => <th key={m.round} className="py-1.5 text-right text-xs font-semibold text-muted-foreground">{monthName(m.round)}</th>)}</tr></thead>
          <tbody className="[&_td]:border-t [&_td]:py-1.5 [&_td]:text-right [&_td:first-child]:text-left tabular-nums">
            <tr><td>Ukupni prihodi{F}</td>{shown.map((m) => <td key={m.round}>{eur(m.revenue)}</td>)}</tr>
            <tr><td>Ukupni rashodi</td>{shown.map((m) => <td key={m.round}>{eur(m.costs)}</td>)}</tr>
            <tr><td><b>Dobit/gubitak</b></td>{shown.map((m) => <td key={m.round} className={profit(m) >= 0 ? "text-up" : "text-down"}><b>{eur(profit(m))}</b></td>)}</tr>
            <tr><td>Rast/pad prihoda</td><td colSpan={shown.length} className={g === null ? "" : g >= 0 ? "text-up" : "text-down"}>{g === null ? "još nema usporedbe" : `${g >= 0 ? "▲ +" : "▼ "}${g} %`}</td></tr>
            <tr><td>Broj zaposlenih</td>{shown.map((m) => <td key={m.round}>{p.staff}</td>)}</tr>
          </tbody>
        </table>
      ) : <Note>Financije se objavljuju nakon zatvaranja prvog mjeseca.</Note>}
      {depts && <p className="mt-1.5 text-[11px] text-muted-foreground">Zaposleni: {depts}</p>}
      <Note>Objavljeno nakon zatvaranja mjeseca, kao što FINA objavljuje godišnje izvještaje. Izvor: jezgra igre.</Note>
    </>
  );
}

function Registar({ p, district }: { p: PublicProfile; district: string }) {
  const rows: [string, React.ReactNode][] = [
    ["Tvrtka", `${p.name} d.o.o.`],
    ["Matični broj u igri", p.simId],
    ["Status", inBlockade(p.cash) ? "Aktivan, račun u blokadi" : "Aktivan"],
    ["Sjedište", district],
    ["Pravni oblik", "društvo s ograničenom odgovornošću"],
    ["Djelatnost (NKD)", "55.10 Hoteli i sličan smještaj"],
    ["Osnivač i direktor", p.student],
    ["Osnovano", "lipanj (ulazak u igru)"],
    ["Temeljni kapital", eur(p.startCash)],
    ["Veličina", <>mikro poduzetnik · {p.rooms} soba{p.sample.profile && <Primjer />}</>],
  ];
  return (
    <>
      {rows.map(([l, v]) => (
        <div key={l} className="flex justify-between gap-3 border-b py-2"><span className="text-muted-foreground">{l}</span><b className="text-right">{v}</b></div>
      ))}
      <H>Pravni odnosi</H>
      {p.partners.length ? p.partners.map((b) => <div key={b.name} className="flex justify-between border-b py-2"><span className="text-muted-foreground">Ugovor</span><b>{b.name}</b></div>) : <Note>Nema upisanih ugovora.</Note>}
      <Note>Podaci u igri, ne pravi registar. Matični broj je izmišljen i nikad nije pravi OIB.</Note>
    </>
  );
}

const H = ({ children }: { children: React.ReactNode }) => <h4 className="mb-1 mt-4 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">{children}</h4>;
const Note = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[11px] text-muted-foreground">{children}</p>;
const Cell = ({ l, children }: { l: string; children: React.ReactNode }) => <div className="rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs">{l}<div className="text-[13px]">{children}</div></div>;
