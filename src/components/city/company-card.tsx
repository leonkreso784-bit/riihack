"use client";

import { useState } from "react";
import { STAFF_DEPARTMENT_LABELS } from "@/lib/rules";
import { eur } from "@/lib/format";
import { Delta } from "@/components/metric-bar";
import { cn } from "@/lib/utils";
import { BIZ_META, bonitet, publicBonitet, fmtDec, growth, inBlockade, monthName, profit, reviewsCount, score, word, type PublicProfile, type ProfileDetail } from "@/lib/karta";

const TABS = ["Pregled", "Financije", "Registar"] as const;
const TONE = { up: "bg-up", warn: "bg-warn", down: "bg-down", none: "bg-muted-foreground" } as const;

export function CompanyCard({ profile: p, district, onClose }: { profile: PublicProfile; district: string; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const blocked = p.cash !== null && inBlockade(p.cash);
  return (
    <div
      role="dialog"
      aria-label={`Kartica tvrtke ${p.name}`}
      className="absolute inset-x-0 bottom-0 z-[1000] flex max-h-[62%] flex-col overflow-hidden rounded-t-[var(--radius)] border bg-card shadow-lift lg:inset-0 lg:max-h-none lg:rounded-[var(--radius)] lg:shadow-card"
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
          {p.stars ? `${"★".repeat(p.stars)} · ` : ""}Hotel · {district} · {p.student}{" "}
          <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold", blocked ? "bg-down-soft text-down" : "bg-mint text-up")}>{blocked ? "U blokadi" : "Aktivan"}</span>
        </p>
        {p.isBot && <p className="mt-1 text-[13px] font-semibold text-muted-foreground">Hotel vodi računalo</p>}
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
        {tab === 1 && <Financije p={p} />}
        {tab === 2 && <Registar p={p} district={district} />}
      </div>
    </div>
  );
}

const Partners = ({ p }: { p: PublicProfile }) =>
  p.partners.length ? (
    <>
      {p.partners.map((b) => (
        <div key={b.name} className="flex items-center gap-2.5 border-b py-2">
          <i className="grid size-6 place-items-center rounded-full bg-up text-[11px] font-extrabold not-italic text-white">{BIZ_META[b.kind].letter}</i>
          <div><b>{b.name}</b><br /><span className="text-muted-foreground">{BIZ_META[b.kind].label} · aktivan ugovor</span></div>
        </div>
      ))}
    </>
  ) : <Note>Nema aktivnih ugovora.</Note>;

const deptText = (p: PublicProfile) => Object.entries(p.staffByDept).map(([d, n]) => `${STAFF_DEPARTMENT_LABELS[d as keyof typeof STAFF_DEPARTMENT_LABELS]} ${n}`).join(" · ");

function Pregled({ p }: { p: PublicProfile }) {
  const facts: [string, React.ReactNode][] = [
    ["Zvjezdice", p.stars ? "★".repeat(p.stars) : "–"],
    ["Sobe", p.rooms ?? "–"],
    ["Zaposleni", p.staff ?? "–"],
    ["Mjesto", p.place],
  ];
  const depts = deptText(p);
  return (
    <>
      {p.detail ? <Ocjene d={p.detail} /> : <Note>Cijena i ocjene gostiju vidjet će se kad stigne javni profil hotela.</Note>}
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {facts.map(([l, v]) => <Cell key={l} l={l}><b>{v}</b></Cell>)}
      </div>
      {depts && <p className="mt-1.5 text-[11px] text-muted-foreground">Osoblje po odjelima: {depts}</p>}
      <H>Partneri</H>
      <Partners p={p} />
    </>
  );
}

function Ocjene({ d }: { d: ProfileDetail }) {
  const s = score(d.reviews);
  const months = d.months ?? [];
  const nights = months.reduce((a, m) => a + m.nights, 0);
  const subs: [string, number][] = d.metrics ? [["Gosti", d.metrics.guests], ["Recenzije", d.metrics.reviews], ["Osoblje", d.metrics.staff], ["Rad hotela", d.metrics.operations]] : [["Gosti", d.guests], ["Recenzije", d.reviews]];
  const maxO = Math.max(1, ...months.map((m) => m.occupancyPct));
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="rounded-[10px_10px_10px_0] bg-night px-2.5 py-2 text-xl font-extrabold text-white">{fmtDec(s)}</div>
        <div>
          <b className="text-base">{word(s)}</b>
          {d.months && <div className="text-xs text-muted-foreground">{nights > 0 ? `${reviewsCount(nights)} recenzija gostiju` : "Još nema recenzija"}</div>}
        </div>
        <div className="ml-auto shrink-0 text-right">
          <b className="whitespace-nowrap">od {d.price} €</b>
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
      <H>Popunjenost</H>
      {d.months ? (
        months.length ? (
          <>
            <div className="mt-2 flex h-[70px] items-end gap-2">
              {months.map((m) => (
                <div key={m.round} title={`${m.occupancyPct} %`} className={cn("flex-1 rounded-t-md", m.round === months.at(-1)?.round ? "bg-primary" : "bg-secondary")} style={{ height: `${(m.occupancyPct / maxO) * 100}%` }} />
              ))}
            </div>
            <div className="mt-1 flex gap-2 text-[11px] text-muted-foreground">
              {months.map((m) => <span key={m.round} className="flex-1 text-center">{monthName(m.round).slice(0, 3)} · {m.occupancyPct} %</span>)}
            </div>
          </>
        ) : <Note>Još nema zatvorenog mjeseca.</Note>
      ) : d.occupancyPct !== null ? <p className="mt-1"><b>{d.occupancyPct} %</b> <span className="text-muted-foreground">u zadnjem obračunatom mjesecu</span></p> : <Note>Još nema zatvorenog mjeseca.</Note>}
    </>
  );
}

function Financije({ p }: { p: PublicProfile }) {
  const d = p.detail;
  const months = d?.months ?? null;
  const pub = d?.publicFinances ?? null;
  const ownCash = p.isYou && p.cash !== null ? p.cash : null;
  const blocked = ownCash !== null && inBlockade(ownCash);
  const last = months?.at(-1);
  const bon = ownCash !== null && p.startCash !== null && months ? bonitet(ownCash, p.startCash, last ? profit(last) : null) : pub ? publicBonitet(pub) : null;
  const g = months ? growth(months) : pub ? growth(pub) : null;
  const shown = months?.slice(-3) ?? [];
  const pubShown = pub?.slice(-3) ?? [];
  const pubLast = pub?.at(-1);
  return (
    <>
      {bon && (
        <div className="flex items-center gap-3 rounded-xl bg-secondary/60 px-3 py-2.5">
          <div className={cn("rounded-[10px] px-3 py-1 text-2xl font-extrabold text-white", TONE[bon.tone])}>{bon.grade}</div>
          <div><b>Bonitetna ocjena</b><br /><span className="text-xs text-muted-foreground">{bon.text}</span></div>
        </div>
      )}
      <div className="my-2.5 grid grid-cols-2 gap-1.5">
        {ownCash !== null && <Cell l="Status računa"><b className={blocked ? "text-down" : "text-up"}>{blocked ? "U blokadi" : "Nije u blokadi"}</b></Cell>}
        {ownCash !== null && <Cell l="Novac na računu"><b>{eur(ownCash)}</b></Cell>}
        {!p.isYou && <Cell l="Prihod (zadnji mjesec)"><b>{pubLast ? eur(pubLast.revenue) : "–"}</b></Cell>}
        {!p.isYou && <Cell l="Dobit (zadnji mjesec)"><b className={pubLast ? (pubLast.profit >= 0 ? "text-up" : "text-down") : ""}>{pubLast ? eur(pubLast.profit) : "–"}</b></Cell>}
        <Cell l="Napredak"><Delta value={p.progress} /></Cell>
        <Cell l="Rang po napretku"><b>{p.rank ? `${p.rank}.` : "–"}</b></Cell>
        {!p.isYou && <Cell l="Zadnji krug"><Delta value={p.roundGain} /></Cell>}
        {d?.share != null && <Cell l="Tržišni udio"><b>{months?.length ? `${d.share} %` : "–"}</b></Cell>}
      </div>
      {!months && !pub && <Note>Prihod i dobit vidjet će se kad stigne javni profil hotela.</Note>}
      {months && (
        <>
          <H>Financijski sažetak</H>
          {shown.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead><tr><th className="py-1.5 text-left" />{shown.map((m) => <th key={m.round} className="py-1.5 text-right text-xs font-semibold text-muted-foreground">{monthName(m.round)}</th>)}</tr></thead>
              <tbody className="[&_td]:border-t [&_td]:py-1.5 [&_td]:text-right [&_td:first-child]:text-left tabular-nums">
                <tr><td>Ukupni prihodi</td>{shown.map((m) => <td key={m.round}>{eur(m.revenue)}</td>)}</tr>
                <tr><td>Ukupni rashodi</td>{shown.map((m) => <td key={m.round}>{eur(m.costs)}</td>)}</tr>
                <tr><td><b>Dobit/gubitak</b></td>{shown.map((m) => <td key={m.round} className={profit(m) >= 0 ? "text-up" : "text-down"}><b>{eur(profit(m))}</b></td>)}</tr>
                <tr><td>Rast/pad prihoda</td><td colSpan={shown.length} className={g === null ? "" : g >= 0 ? "text-up" : "text-down"}>{g === null ? "još nema usporedbe" : `${g >= 0 ? "▲ +" : "▼ "}${g} %`}</td></tr>
                {p.staff !== null && <tr><td>Broj zaposlenih</td>{shown.map((m) => <td key={m.round}>{p.staff}</td>)}</tr>}
              </tbody>
            </table>
          ) : <Note>Financije se objavljuju nakon zatvaranja prvog mjeseca.</Note>}
          <Note>Objavljeno nakon zatvaranja mjeseca, kao što FINA objavljuje godišnje izvještaje. Izvor: jezgra igre.</Note>
        </>
      )}
      {!months && pub && (
        <>
          <H>Javni financijski podaci</H>
          {pubShown.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead><tr><th className="py-1.5 text-left" />{pubShown.map((m) => <th key={m.round} className="py-1.5 text-right text-xs font-semibold text-muted-foreground">{monthName(m.round)}</th>)}</tr></thead>
              <tbody className="[&_td]:border-t [&_td]:py-1.5 [&_td]:text-right [&_td:first-child]:text-left tabular-nums">
                <tr><td>Ukupni prihodi</td>{pubShown.map((m) => <td key={m.round}>{eur(m.revenue)}</td>)}</tr>
                <tr><td><b>Dobit/gubitak</b></td>{pubShown.map((m) => <td key={m.round} className={m.profit >= 0 ? "text-up" : "text-down"}><b>{eur(m.profit)}</b></td>)}</tr>
                <tr><td>Rast/pad prihoda</td><td colSpan={pubShown.length} className={g === null ? "" : g >= 0 ? "text-up" : "text-down"}>{g === null ? "još nema usporedbe" : `${g >= 0 ? "▲ +" : "▼ "}${g} %`}</td></tr>
              </tbody>
            </table>
          ) : <Note>Financije se objavljuju nakon zatvaranja prvog mjeseca.</Note>}
          <Note>Javno su samo prihod i dobit zatvorenih mjeseci, kao što FINA objavljuje godišnje izvještaje. Stanje računa i troškovi nisu javni.</Note>
        </>
      )}
    </>
  );
}

function Registar({ p, district }: { p: PublicProfile; district: string }) {
  const rows: [string, React.ReactNode][] = [
    ["Tvrtka", `${p.name} d.o.o.`],
    ["Matični broj u igri", p.simId],
    ["Status", p.isYou && p.cash !== null && inBlockade(p.cash) ? "Aktivan, račun u blokadi" : "Aktivan"],
    ["Sjedište", <>{district}<span className="block text-[11px] font-normal text-muted-foreground">{p.place}</span></>],
    ["Pravni oblik", "društvo s ograničenom odgovornošću"],
    ["Djelatnost (NKD)", "55.10 Hoteli i sličan smještaj"],
    ["Osnivač i direktor", p.student],
    ["Osnovano", "lipanj (ulazak u igru)"],
    ["Temeljni kapital", p.startCash !== null ? eur(p.startCash) : "–"],
    ["Veličina", p.rooms !== null ? `mikro poduzetnik · ${p.rooms} soba` : "mikro poduzetnik"],
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
