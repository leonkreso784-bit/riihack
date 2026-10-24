"use client";

// Karta grada kao izometrijska društvena igra (smjer D). Čisti React + SVG + CSS, bez ovisnosti.
// Teren je statičan (board-geometry.ts), zgrade, natpisi, ugovori i animacije su React.
import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CityView, LeaderboardRow } from "@/lib/types";
import { BIZ_META, DISTRICTS, HOTEL_HALF, businessLots, cityTier, districtById, growth, hotelHeight, fmtDec, visibleBusinesses, type Lot, type PublicProfile } from "@/lib/karta";
import { cn } from "@/lib/utils";
import { DEFS, DISTRICT_LABELS, HH, HW, P, VIEW, baseLayer, fitView, groundRange, lerp, occupied, pt, rnd, terrainDrawables, type ViewBox } from "./board-geometry";

const LAYERS = [["h", "Hoteli"], ["b", "Partneri"], ["c", "Ugovori"]] as const;
const WALL = {
  h: ["#4d8fff", "#1f5be0", "#17409e"],
  me: ["#2f62e6", "#173fae", "#122f7e"],
  blk: ["#ec7e7b", "#c24a4a", "#8e2d2d"],
  bot: ["#a9b1c0", "#7d8698", "#596172"], // ADR-044: hotel koji vodi računalo
  b: ["#44ac86", "#2a7d5c", "#1f6a4c"],
} as const;
const ROOF = 22;
const S_H = HOTEL_HALF;
const S_B = 0.44;
const BIZ_H = 28;
const ZOOM = { w: 620, h: 700 }; // mobitel
const ZOOM_WIDE = { w: 1000, h: 860 }; // stolno računalo: uži stupac uz karticu, a ploča ostaje čitljiva

const poly = (a: number[][], fill: string, extra?: React.SVGProps<SVGPolygonElement>) => <polygon points={pt(a)} fill={fill} {...extra} />;

// ---------- animacija visine ----------
function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.04;

// Visine zgrada kližu prema ciljnim vrijednostima: pri prvom prikazu rastu iz tla s pomakom, kasnije glatko prate promjenu.
function useTweened(targets: Record<string, number>, order: string[], reduced: boolean) {
  const [cur, setCur] = useState<Record<string, number>>({});
  const st = useRef<Record<string, { from: number; to: number; t0: number; dur: number }>>({});
  const live = useRef<Record<string, number>>({});
  const raf = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    if (reduced) return;
    const now = performance.now();
    order.forEach((id, i) => {
      const to = targets[id];
      const s = st.current[id];
      if (s && s.to === to) return;
      const from = live.current[id] ?? 0;
      st.current[id] = { from, to, t0: now + (first.current ? 250 + i * 70 : 0), dur: first.current ? 950 : 1200 };
    });
    first.current = false;
    cancelAnimationFrame(raf.current);
    const tick = (t: number) => {
      let busy = false;
      const next: Record<string, number> = {};
      for (const [id, s] of Object.entries(st.current)) {
        const p = Math.min(1, Math.max(0, (t - s.t0) / s.dur));
        next[id] = s.from + (s.to - s.from) * easeOut(p);
        if (p < 1) busy = true;
      }
      live.current = next;
      setCur(next);
      if (busy) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [targets, order, reduced]);

  return reduced ? targets : cur;
}

// ---------- zgrade ----------
type HotelProps = {
  id: string;
  name: string;
  ax: number;
  ay: number;
  ht: number;
  rows: number;
  tone: "h" | "me" | "blk" | "bot";
  litPct: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | undefined) => void;
};

const Hotel = memo(function Hotel({ id, name, ax, ay, ht, rows, tone, litPct, selected, onSelect, onHover }: HotelProps) {
  const s = S_H;
  const { z, zb } = groundRange(ax, ay, s);
  const ext = z - zb;
  const cls = WALL[tone];
  const H = ht + ext;
  const W = P(ax - s, ay + s, zb), Sp = P(ax + s, ay + s, zb), E = P(ax + s, ay - s, zb);
  const up = (p: number[]): [number, number] => [p[0], p[1] - H];
  const Wt = up(W), St = up(Sp), Et = up(E);
  const M1 = P(ax - s, ay, z + ht + ROOF), M2 = P(ax + s, ay, z + ht + ROOF);
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0) * 9.1;
  const dead = tone === "blk";
  const showWin = ht > 36;
  const rh = (ht - 24) / rows;
  const wins = (A: number[], B: number[], face: number) => {
    const out: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < 3; c++) {
        const p0 = lerp(A, B, (c + 0.2) / 3), p1 = lerp(A, B, (c + 0.8) / 3);
        const v0 = ext + 18 + r * rh, v1 = v0 + Math.min(10, rh * 0.62);
        const lit = !dead && rnd(seed + r * 7.1 + c * 3.3 + face * 11) < (litPct / 100) * 1.1 + 0.12;
        out.push(<polygon key={`${face}${r}${c}`} points={pt([[p0[0], p0[1] - v0], [p1[0], p1[1] - v0], [p1[0], p1[1] - v1], [p0[0], p0[1] - v1]])} fill={lit ? "#f4e8d5" : "#1b2440"} opacity={lit ? 1 : 0.3} />);
      }
    return out;
  };
  const dx = Math.min(ht * 0.5, 46), dy = ht * 0.14;
  const q = [P(ax - s, ay - s, z), P(ax + s, ay - s, z), P(ax + s, ay + s, z), P(ax - s, ay + s, z)];
  const q2 = q.map((p) => [p[0] + dx, p[1] + dy]);
  const gc = P(ax, ay, z);
  const dr = lerp(W, Sp, 0.4), dr2 = lerp(W, Sp, 0.6);
  const door = (a: number[], b: number[], h: number) => [a, b, [b[0], b[1] - h], [a[0], a[1] - h]];
  const dA = [dr[0], dr[1] - ext], dB = [dr2[0], dr2[1] - ext];
  const fx = M1[0] + HW * 0.5, fy = M1[1] - HH * 0.25;
  const label = `Hotel ${name}, otvori karticu`;
  const act = () => onSelect(id);
  return (
    <g
      className="cb-bld cb-hotel"
      data-sel={selected ? 1 : 0}
      data-own={tone === "me" ? 1 : 0}
      tabIndex={0}
      role="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={(e) => {
        e.stopPropagation();
        act();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          act();
        }
      }}
      onPointerEnter={() => onHover(id)}
      onPointerLeave={() => onHover(undefined)}
      onFocus={() => onHover(id)}
      onBlur={() => onHover(undefined)}
    >
      <title>{name}</title>
      <g pointerEvents="none" fill="#1b2440" opacity=".14">
        {poly(q, "#1b2440")}{poly(q2, "#1b2440")}{poly([q[1], q[2], q2[2], q2[1]], "#1b2440")}{poly([q[2], q[3], q2[3], q2[2]], "#1b2440")}
      </g>
      <ellipse className="cb-ring-own" cx={gc[0]} cy={gc[1] + 2} rx={HW * 2 * (s + 0.55) * 0.9} ry={HH * 2 * (s + 0.55) * 0.9} />
      <ellipse className="cb-ring-focus" cx={gc[0]} cy={gc[1] + 2} rx={HW * 2 * (s + 0.4) * 0.9} ry={HH * 2 * (s + 0.4) * 0.9} />
      <g className="cb-lift">
        {poly([W, Sp, St, Wt], cls[0])}
        {showWin && wins(W, Sp, 0)}
        {ht > 30 && poly(door(dA, dB, 13), "#f4e8d5")}
        {poly([Sp, E, Et, St], cls[1])}
        {showWin && wins(Sp, E, 1)}
        {poly([Wt, St, M2, M1], cls[2])}
        {poly([St, Et, M2], cls[1], { stroke: cls[1], strokeWidth: 1 })}
        {poly([Wt, St, M2, M1], "none", { stroke: "#fff", strokeOpacity: 0.35, strokeWidth: 1.5, strokeLinejoin: "round" })}
        <line x1={Wt[0]} y1={Wt[1]} x2={St[0]} y2={St[1]} stroke="#fff" strokeOpacity=".5" strokeWidth="2.5" strokeLinecap="round" />
        {tone === "me" && (
          <g>
            <line x1={fx} y1={fy} x2={fx} y2={fy - 30} stroke="#fff" strokeWidth="2" />
            <polygon className="cb-flag" points={`${fx},${fy - 30} ${fx + 20},${fy - 24} ${fx},${fy - 17}`} fill="#ffd54a" />
          </g>
        )}
      </g>
    </g>
  );
});

type BizProps = { id: string; name: string; letter: string; kindLabel: string; nkd: string; ax: number; ay: number; ht: number; chimney: boolean };
const Biz = memo(function Biz({ name, letter, kindLabel, nkd, ax, ay, ht, chimney }: BizProps) {
  const s = S_B;
  const { z, zb } = groundRange(ax, ay, s);
  const ext = z - zb;
  const H = ht + ext;
  const c = WALL.b;
  const W = P(ax - s, ay + s, zb), Sp = P(ax + s, ay + s, zb), E = P(ax + s, ay - s, zb);
  const up = (p: number[]): [number, number] => [p[0], p[1] - H];
  const Wt = up(W), St = up(Sp), Et = up(E);
  const dx = Math.min(ht * 0.4, 36), dy = ht * 0.11;
  const q = [P(ax - s, ay - s, z), P(ax + s, ay - s, z), P(ax + s, ay + s, z), P(ax - s, ay + s, z)];
  const q2 = q.map((p) => [p[0] + dx, p[1] + dy]);
  const tp = P(ax, ay, z + ht);
  const by = tp[1] - (chimney ? 42 : 30);
  const aw = ext + ht * 0.52;
  const door = [lerp(W, Sp, 0.38), lerp(W, Sp, 0.62)];
  return (
    <g className="cb-bld cb-biz" role="img" aria-label={`${name}, ${kindLabel}, NKD ${nkd}`}>
      <title>{`${name} · ${kindLabel} · NKD ${nkd}`}</title>
      <g pointerEvents="none" fill="#1b2440" opacity=".14">
        {poly(q, "#1b2440")}{poly(q2, "#1b2440")}{poly([q[1], q[2], q2[2], q2[1]], "#1b2440")}{poly([q[2], q[3], q2[3], q2[2]], "#1b2440")}
      </g>
      <g className="cb-lift">
        {poly([W, Sp, St, Wt], c[0])}
        {poly([Sp, E, Et, St], c[1])}
        {ht > 14 &&
          [0, 1, 2, 3].map((i) => {
            const a = lerp(W, Sp, i / 4), b = lerp(W, Sp, (i + 1) / 4);
            return <polygon key={i} points={pt([[a[0], a[1] - aw], [b[0], b[1] - aw], [b[0], b[1] - aw - 9], [a[0], a[1] - aw - 9]])} fill={i % 2 ? "#fff" : "#f4e8d5"} />;
          })}
        {ht > 14 && poly([[door[0][0], door[0][1] - ext], [door[1][0], door[1][1] - ext], [door[1][0], door[1][1] - ext - ht * 0.45], [door[0][0], door[0][1] - ext - ht * 0.45]], "#1f6a4c")}
        {ht > 14 &&
          [0, 1].map((i) => {
            const a = lerp(Sp, E, 0.2 + i * 0.4), b = lerp(Sp, E, 0.5 + i * 0.4);
            return <polygon key={i} points={pt([[a[0], a[1] - ext - ht * 0.45], [b[0], b[1] - ext - ht * 0.45], [b[0], b[1] - ext - ht * 0.8], [a[0], a[1] - ext - ht * 0.8]])} fill="#f4e8d5" />;
          })}
        {poly([P(ax, ay - s, z + ht), P(ax + s, ay, z + ht), P(ax, ay + s, z + ht), P(ax - s, ay, z + ht)], "#67c2a0")}
        {poly([P(ax, ay - s * 0.62, z + ht), P(ax + s * 0.62, ay, z + ht), P(ax, ay + s * 0.62, z + ht), P(ax - s * 0.62, ay, z + ht)], "#55b08e")}
        {chimney && (() => {
          const k = P(ax - 0.1, ay - 0.1, z + ht);
          return (
            <g>
              {poly([[k[0] - 4, k[1]], [k[0] + 4, k[1]], [k[0] + 4, k[1] - 14], [k[0] - 4, k[1] - 14]], "#2a7d5c")}
              <ellipse cx={k[0]} cy={k[1] - 14} rx="4" ry="2" fill="#1f6a4c" />
              <circle className="cb-smoke" cx={k[0] + 4} cy={k[1] - 24} r="3.5" fill="#fff" opacity=".7" />
            </g>
          );
        })()}
        <line x1={tp[0]} y1={by + 11} x2={tp[0]} y2={tp[1] - 2} stroke="#2a7d5c" strokeWidth="2" />
        <circle cx={tp[0]} cy={by} r="12" fill="#fff" stroke="#2f8f6b" strokeWidth="3.5" />
        <text x={tp[0]} y={by + 5.2} textAnchor="middle" fontSize="14" fontWeight="800" fill="#1f6a4c">{letter}</text>
      </g>
    </g>
  );
});

// ---------- natpisi ----------
// Širina i položaj se mjere nakon crtanja (bez pretpostavke o fontu).
function Chip({ x, y, name, pct, own, hot, shown, stem, onSelect, id }: { x: number; y: number; name: string; pct: number | null; own: boolean; hot: boolean; shown: boolean; stem: number; onSelect: (id: string) => void; id: string }) {
  const rect = useRef<SVGRectElement>(null);
  const inner = useRef<SVGGElement>(null);
  const measure = (el: SVGTextElement | null) => {
    if (!el || !rect.current || !inner.current) return;
    const w = el.getBBox().width + 28;
    rect.current.setAttribute("width", String(w));
    inner.current.setAttribute("transform", `translate(${-w / 2},0)`);
  };
  const pctStr = pct === null ? "" : `${pct >= 0 ? "+" : ""}${pct} %`;
  return (
    <g transform={`translate(${x},${y})`} className="cb-chip" data-shown={shown ? 1 : 0} data-hot={hot ? 1 : 0} onClick={(e) => { e.stopPropagation(); onSelect(id); }} style={{ cursor: "pointer" }}>
      {stem > 0 && <line x1="0" y1="30" x2="0" y2={stem} stroke="#1b2440" strokeOpacity=".45" strokeWidth="2" strokeDasharray="2 4" strokeLinecap="round" />}
      <g className="cb-chip-in"><g ref={inner} transform="translate(-60,0)">
        <rect ref={rect} className="cb-chip-bg" rx="17" ry="17" height="34" width="120" fill="#fff" filter="url(#cb-sh)" stroke={hot ? "#246bfd" : own ? "#ffd54a" : "none"} strokeWidth={hot ? 2.5 : 3} />
        <title>{name}</title>
        <text key={pctStr} className="cb-chip-text" ref={measure} x="14" y="23" fontSize="17" fontWeight="800" fill="#151b2b">
          {name.length > 22 ? `${name.slice(0, 21).trimEnd()}…` : name}
          {pctStr && <tspan fill={(pct ?? 0) >= 0 ? "#0f7a3c" : "#c42626"}> {pctStr}</tspan>}
        </text>
      </g></g>
    </g>
  );
}

function DistrictLabel({ id, name }: { id: string; name: string }) {
  const [gx, gy, z, dx] = DISTRICT_LABELS[id];
  const [x, y] = P(gx, gy, 0);
  const top = y - z, lx = x + dx;
  const w = name.length * 9.1 + 26;
  return (
    <g pointerEvents="none" className="cb-dl">
      <line x1={lx} y1={top + 11} x2={x} y2={y} stroke="#1b2440" strokeOpacity=".45" strokeWidth="2" strokeDasharray="2 4" strokeLinecap="round" />
      <circle cx={x} cy={y} r="3.5" fill="#f4e8d5" stroke="#1b2440" strokeWidth="1.5" />
      <g transform={`translate(${lx},${top - 12})`}>
        <rect x={-w / 2} rx="12" height="24" width={w} fill="#1b2440" opacity=".92" />
        <text y="16.2" textAnchor="middle" fontSize="12.5" fontWeight="800" letterSpacing=".9" fill="#f4e8d5">{name.toUpperCase()}</text>
      </g>
    </g>
  );
}

// ---------- stil i animacije ----------
const CSS = `
.cb{--cb-ease:cubic-bezier(.2,.8,.2,1)}
.cb svg{display:block;width:100%;height:100%;user-select:none;-webkit-user-select:none}
.cb text{font-family:var(--font-sans),system-ui,sans-serif}
.cb-bld{cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent}
.cb-bld:focus,.cb-bld:focus-visible{outline:none}
.cb-biz{cursor:default}
.cb-lift{transition:transform .22s var(--cb-ease),filter .22s ease}
.cb-hotel:hover .cb-lift{transform:translateY(-5px)}
.cb-hotel[data-sel="1"] .cb-lift{transform:translateY(-6px);filter:drop-shadow(0 0 7px rgba(36,107,253,.55)) drop-shadow(0 8px 6px rgba(27,36,64,.25))}
.cb-ring-own,.cb-ring-focus{fill:none;stroke:none;pointer-events:none}
.cb-hotel[data-own="1"] .cb-ring-own{stroke:#ffd54a;stroke-width:5;animation:cb-ring 2.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.cb-hotel:focus-visible .cb-ring-focus,.cb-hotel[data-sel="1"] .cb-ring-focus{stroke:#246bfd;stroke-width:2.5;stroke-opacity:.85}
.cb-hotel[data-sel="1"]:not(:focus-visible) .cb-ring-focus{stroke-opacity:.35}
@keyframes cb-ring{0%,100%{opacity:.95;transform:scale(1)}50%{opacity:.6;transform:scale(1.045)}}
.cb-flag{animation:cb-wave-flag 2.2s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:left center}
@keyframes cb-wave-flag{from{transform:skewY(0)}to{transform:skewY(-9deg)}}
.cb-tile{animation:cb-settle .7s var(--cb-ease) both;animation-delay:var(--d,0ms)}
.cb-pop{animation:cb-fade .5s ease both;animation-delay:var(--d,0ms)}
.cb-sea{animation:cb-fade .6s ease both}
@keyframes cb-settle{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:none}}
@keyframes cb-fade{from{opacity:0}to{opacity:1}}
.cb-wave{animation:cb-shimmer 4.2s ease-in-out infinite}
@keyframes cb-shimmer{0%,100%{opacity:.25}50%{opacity:.85}}
.cb-boat{animation:cb-bob 3.2s ease-in-out infinite alternate}
@keyframes cb-bob{from{transform:translateY(0)}to{transform:translateY(3px)}}
.cb-cloud{animation:cb-drift 42s ease-in-out infinite alternate}.cb-cloud.b{animation-duration:58s;animation-direction:alternate-reverse}
@keyframes cb-drift{from{transform:translateX(-34px)}to{transform:translateX(34px)}}
.cb-arc{fill:none;stroke:#2f8f6b;stroke-width:3.2;stroke-dasharray:3 9;stroke-linecap:round;animation:cb-flow 1.6s linear infinite}
@keyframes cb-flow{to{stroke-dashoffset:-24}}
.cb-lamp{animation:cb-blink 2.4s ease-in-out infinite}
@keyframes cb-blink{0%,100%{opacity:1}50%{opacity:.35}}
.cb-smoke{animation:cb-puff 3s ease-out infinite}
@keyframes cb-puff{from{transform:translateY(0);opacity:.7}to{transform:translateY(-12px);opacity:0}}
.cb-chip{transition:opacity .25s ease}
.cb-chip-in{animation:cb-fade .6s ease .9s both}
.cb-chip[data-shown="0"]{opacity:0;pointer-events:none}
.cb-chip-text{animation:cb-pulse .8s var(--cb-ease)}
@keyframes cb-pulse{0%{opacity:.2}40%{opacity:1;font-size:19px}100%{opacity:1}}
.cb-delta{animation:cb-rise 2.4s ease-out both;pointer-events:none}
@keyframes cb-rise{0%{opacity:0;transform:translateY(8px)}15%{opacity:1}100%{opacity:0;transform:translateY(-44px)}}
.cb-hide-h .cb-hotel,.cb-hide-h .cb-chip,.cb-hide-b .cb-biz,.cb-hide-c .cb-contract{display:none}
@media (prefers-reduced-motion: reduce){
.cb *,.cb *::before{animation:none !important;transition:none !important}
}
`;

type LegendItem = [string, string, boolean?];
const LEGEND: LegendItem[] = [["#1640aa", "Tvoj hotel", true], ["#246bfd", "Hotel u igri"], ["#7d8698", "Hotel računala"], ["#2f8f6b", "Gradski partner"]];
function Legend({ className, bots }: { className?: string; bots: boolean }) {
  return (
    <div className={cn("text-xs", className)}>
      {LEGEND.filter(([, t]) => bots || t !== "Hotel računala").map(([c, t, ring]) => (
        <div key={t} className="my-1 flex items-center gap-1.5">
          <i className="inline-block size-[11px] rounded-[3px]" style={{ background: c, outline: ring ? "2px solid #ffd54a" : undefined }} />
          {t}
        </div>
      ))}
      <div className="mt-1 font-medium text-muted-foreground">Viši hotel = veći napredak</div>
    </div>
  );
}

// ---------- karta ----------
// Procjena širine natpisa (stvarna se mjeri nakon crtanja); služi samo za izbjegavanje preklapanja.
const chipWidth = (name: string, pctStr: string) => Math.min(name.length, 22) * 10.4 + 28 + (pctStr ? (pctStr.length + 1) * 10.4 : 0);
const hit = (a: number[], b: number[]) => a[0] < b[2] + 8 && b[0] < a[2] + 8 && a[1] < b[3] + 6 && b[1] < a[3] + 6;
const vbStr = (v: ViewBox) => `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`;

// Kamera se glatko vozi do novog viewBoxa izravno na DOM-u (bez ponovnog crtanja cijele karte u svakom kadru).
function useViewBox(svg: React.RefObject<SVGSVGElement | null>, target: ViewBox, instant: boolean, dragging: React.RefObject<unknown>) {
  const { x, y, w, h } = target;
  const cur = useRef(target);
  const raf = useRef(0);
  const ready = useRef(false);
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    const from = cur.current;
    const t = { x, y, w, h };
    const set = (v: ViewBox) => {
      cur.current = v;
      el.setAttribute("viewBox", vbStr(v));
    };
    const now = ready.current && !instant && !dragging.current;
    ready.current = ready.current || !instant;
    if (!now) return set(t);
    const t0 = performance.now();
    const tick = (time: number) => {
      const p = Math.min(1, (time - t0) / 520);
      const e = 1 - Math.pow(1 - p, 3);
      set({ x: from.x + (t.x - from.x) * e, y: from.y + (t.y - from.y) * e, w: from.w + (t.w - from.w) * e, h: from.h + (t.h - from.h) * e });
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [svg, x, y, w, h, instant, dragging]);
}

export function CityBoard({ city, youId, profiles, lots, selectedId, onSelect }: { city: CityView; youId: string; profiles: Record<string, PublicProfile>; lots: Record<string, Lot>; selectedId?: string; onSelect: (id: string | undefined) => void }) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const svgEl = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const [on, setOn] = useState({ h: true, b: true, c: true });
  const [hoverId, setHoverId] = useState<string>();
  const [zoomed, setZoomed] = useState(true);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panFor, setPanFor] = useState(selectedId);
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });
  const select = useCallback((id: string) => {
    if (dragged.current) return;
    onSelectRef.current(id);
  }, []);
  const hover = useCallback((id: string | undefined) => setHoverId(id), []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const compact = width > 0 && width < 640;
  const ZOOM_NOW = useMedia("(min-width: 1024px)") ? ZOOM_WIDE : ZOOM;

  // Raspored: parcele hotela (stalne, dolaze izvana) i tvrtki. U malom gradu se crta samo dio tvrtki.
  const hotelsN = city.hotels.length;
  const tier = cityTier(hotelsN);
  const allBizLots = useMemo(() => businessLots(city.businesses), [city.businesses]);
  const businesses = useMemo(() => {
    const ids = new Set(city.hotels.map((h) => h.companyId));
    const linked = new Set(city.links.filter((l) => ids.has(l.companyId)).map((l) => l.businessId));
    return visibleBusinesses(city.businesses, linked, hotelsN);
  }, [city.businesses, city.links, city.hotels, hotelsN]);
  const bizLots = useMemo(() => Object.fromEntries(businesses.map((b) => [b.id, allBizLots[b.id]])), [businesses, allBizLots]);
  const maxProgress = Math.max(0, ...city.hotels.map((h) => h.progress));

  // Statični sloj ovisi samo o zauzetim parcelama.
  const slotKey = tier + "#" + city.hotels.map((h) => lots[h.companyId]?.slot.join()).join("|") + "#" + Object.values(bizLots).map((s) => s.join()).join("|");
  const statics = useMemo(() => {
    const occ = occupied(city.hotels.flatMap((h) => (lots[h.companyId] ? [lots[h.companyId].slot] : [])), Object.values(bizLots));
    return { base: baseLayer(tier), world: terrainDrawables(occ, tier) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey]);

  const hotelIds = city.hotels.map((h) => h.companyId);
  const targets = useMemo(() => {
    const t: Record<string, number> = {};
    city.hotels.forEach((h) => (t[h.companyId] = hotelHeight(h.progress, maxProgress)));
    businesses.forEach((b) => (t[`b:${b.id}`] = BIZ_H));
    return t;
  }, [city.hotels, businesses, maxProgress]);
  const order = useMemo(() => [...city.hotels.map((h) => h.companyId), ...businesses.map((b) => `b:${b.id}`)].sort(), [city.hotels, businesses]);
  const heights = useTweened(targets, order, reduced);
  const hOf = (key: string) => heights[key] ?? 0;

  // Plutajuće oznake promjene napretka: usporedba s prošlim podacima (prilagodba stanja tijekom crtanja).
  const sig = city.hotels.map((h) => `${h.companyId}:${h.progress}`).join("|");
  const [prev, setPrev] = useState<{ sig: string; cash: Record<string, number> }>({ sig, cash: Object.fromEntries(city.hotels.map((h) => [h.companyId, h.progress])) });
  const [tags, setTags] = useState<{ key: string; id: string; delta: number }[]>([]);
  if (sig !== prev.sig) {
    const fresh = city.hotels.filter((h) => prev.cash[h.companyId] !== undefined && prev.cash[h.companyId] !== h.progress).map((h) => ({ key: `${h.companyId}:${h.progress}`, id: h.companyId, delta: h.progress - prev.cash[h.companyId] }));
    setPrev({ sig, cash: Object.fromEntries(city.hotels.map((h) => [h.companyId, h.progress])) });
    if (fresh.length && !reduced) setTags(fresh);
  }
  useEffect(() => {
    if (!tags.length) return;
    const t = setTimeout(() => setTags([]), 2800);
    return () => clearTimeout(t);
  }, [tags]);

  // Poredak crtanja: od pozadine prema naprijed (dubina x + y).
  const items = useMemo(() => {
    type Item = { k: number; node: "s"; html: string; i: number } | { k: number; node: "h"; id: string; i: number } | { k: number; node: "b"; id: string; i: number };
    const list: Item[] = statics.world.map((d, i) => ({ k: d.k, node: "s", html: d.s, i }));
    city.hotels.forEach((h, i) => {
      if (!lots[h.companyId]) return;
      const [ax, ay] = lots[h.companyId].slot;
      list.push({ k: ax + ay + 2 * S_H + 1.6, node: "h", id: h.companyId, i: 1e5 + i });
    });
    businesses.forEach((b, i) => {
      const [ax, ay] = bizLots[b.id];
      list.push({ k: ax + ay + 2 * S_B + 1.6, node: "b", id: b.id, i: 2e5 + i });
    });
    return list.sort((a, b) => a.k - b.k || a.i - b.i);
  }, [statics, city.hotels, businesses, lots, bizLots]);

  const hotelById = new Map(city.hotels.map((h) => [h.companyId, h]));
  const bizById = new Map(businesses.map((b) => [b.id, b]));
  const topOf = (id: string): [number, number] => {
    const [ax, ay] = lots[id].slot;
    const { z } = groundRange(ax, ay, S_H);
    const p = P(ax, ay, z + hOf(id) + ROOF);
    return [p[0], p[1]];
  };
  const bizTop = (id: string): [number, number] => {
    const [ax, ay] = bizLots[id];
    const { z } = groundRange(ax, ay, S_B);
    return P(ax, ay, z + hOf(`b:${id}`));
  };

  const focusId = selectedId && lots[selectedId] ? selectedId : lots[youId] ? youId : hotelIds[0];
  const fp = focusId && lots[focusId] ? (() => { const [ax, ay] = lots[focusId].slot; const { z } = groundRange(ax, ay, S_H); return P(ax, ay, z + 40); })() : [VIEW.x + VIEW.w / 2, VIEW.y + VIEW.h / 2];

  // Kamera: viewBox se računa iz zauzetih parcela (memoizirano po skupu parcela i omjeru), pa se mali grad prikaže zumirano.
  // Na mobitelu se veliki grad može približiti na tvoj hotel s povlačenjem; mali grad stane u kadar pa tamo nema pomicanja.
  const aspect = compact ? ZOOM_NOW.w / ZOOM_NOW.h : 1274 / 860;
  const usedKey = city.hotels.map((h) => lots[h.companyId]?.index).join(",") + "|" + Object.keys(bizLots).join(",");
  const fit = useMemo(() => {
    const used = new Set(city.hotels.map((h) => lots[h.companyId]?.district));
    return fitView(city.hotels.flatMap((h) => (lots[h.companyId] ? [lots[h.companyId].slot] : [])), Object.values(bizLots), [...used].filter((d): d is NonNullable<typeof d> => Boolean(d)), aspect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedKey, aspect]);
  if (panFor !== selectedId) {
    setPanFor(selectedId);
    setPan({ x: 0, y: 0 });
  }
  const canClose = compact && fit.w > ZOOM_NOW.w * 1.08;
  const close = canClose && zoomed;
  let view: ViewBox = fit;
  if (close) {
    const wide = ZOOM_NOW === ZOOM_WIDE;
    const x0 = Math.min(Math.max((wide ? fit.x + fit.w / 2 : fp[0]) - ZOOM_NOW.w / 2 + pan.x, fit.x - 80), fit.x + fit.w - ZOOM_NOW.w + 80);
    const y0 = Math.min(Math.max((wide ? fit.y + fit.h / 2 : fp[1]) - ZOOM_NOW.h * (!wide && selectedId ? 0.3 : 0.5) + pan.y, fit.y - 60), fit.y + fit.h - ZOOM_NOW.h + 60);
    view = { x: x0, y: y0, w: ZOOM_NOW.w, h: ZOOM_NOW.h };
  }
  const [initialVb] = useState(() => vbStr(view));
  useViewBox(svgEl, view, reduced || width === 0, drag);

  // Natpisi okruga: samo za okruge u kadru ili s hotelom.
  const labelIds = DISTRICTS.filter((d) => {
    if (city.hotels.some((h) => lots[h.companyId]?.district === d.id)) return true;
    const l = DISTRICT_LABELS[d.id];
    const [x, y] = P(l[0], l[1], 0);
    return x > fit.x + 110 && x < fit.x + fit.w - 110 && y - l[2] > fit.y + 60 && y < fit.y + fit.h - 80;
  }).map((d) => d.id);
  const labelBoxes = labelIds.map((id) => {
    const [gx, gy, z, dx] = DISTRICT_LABELS[id];
    const [x, y] = P(gx, gy, 0);
    const w = districtById(id as never).name.length * 9.1 + 26;
    return [x + dx - w / 2, y - z - 12, x + dx + w / 2, y - z + 12];
  });

  // Natpisi hotela bez preklapanja. Prioritet: tvoj hotel, odabrani, pa najbolji po napretku (do ograničenja po veličini grada).
  // Svaki natpis proba osnovni položaj pa dva viša (s tankom crtom do zgrade); ako nigdje ne stane, skriva se i pokazuje na hover/fokus.
  const chipPlan = (() => {
    const cap = hotelsN <= 6 ? hotelsN : hotelsN <= 14 ? 6 : 4;
    const pctOf = (id: string) => growth(profiles[id]?.detail?.months ?? []);
    const prio = [...city.hotels].sort((a, b) => Number(b.companyId === youId) - Number(a.companyId === youId) || Number(b.companyId === selectedId) - Number(a.companyId === selectedId) || b.progress - a.progress || (a.companyId < b.companyId ? -1 : 1));
    const placed: number[][] = [...labelBoxes];
    const plan = new Map<string, number | null>();
    prio.forEach((h, i) => {
      const forced = h.companyId === youId || h.companyId === selectedId;
      if (!forced && i >= cap) return void plan.set(h.companyId, null);
      const [tx, ty] = topOf(h.companyId);
      const own = h.companyId === youId;
      const pct = pctOf(h.companyId);
      const w = chipWidth(h.hotelName, pct === null ? "" : `${pct >= 0 ? "+" : ""}${pct} %`);
      const y0 = ty - (own ? 72 : 36) - 17;
      for (const dy of [0, -40, -80]) {
        const box = [tx - w / 2, y0 + dy, tx + w / 2, y0 + dy + 34];
        if (!placed.some((q) => hit(box, q))) {
          placed.push(box);
          return void plan.set(h.companyId, dy);
        }
      }
      if (forced) plan.set(h.companyId, 0);
      else plan.set(h.companyId, null);
    });
    return plan;
  })();

  const down = (e: React.PointerEvent) => {
    if (!close) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
    dragged.current = false;
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !box.current) return;
    const k = ZOOM_NOW.w / box.current.clientWidth;
    const ddx = e.clientX - d.x, ddy = e.clientY - d.y;
    if (!d.moved && Math.hypot(ddx, ddy) < 6) return;
    d.moved = true;
    dragged.current = true;
    setPan({ x: d.px - ddx * k, y: d.py - ddy * k });
  };
  const up = () => {
    drag.current = null;
    setTimeout(() => (dragged.current = false), 0);
  };

  const rowsOf = (progress: number, maxP: number) => Math.max(2, Math.round((hotelHeight(progress, maxP) - 14) / 17));
  const chipOrder = [...city.hotels].sort((a, b) => Number(chipPlan.get(a.companyId) != null) - Number(chipPlan.get(b.companyId) != null) || Number(hoverId === a.companyId) - Number(hoverId === b.companyId));
  const hasBots = city.hotels.some((h) => h.isBot);

  const arcs = city.links.flatMap((l) => {
    if (!lots[l.companyId] || !bizLots[l.businessId]) return [];
    const t = topOf(l.companyId), c = bizTop(l.businessId);
    const a = [t[0], t[1] + 14], d = Math.hypot(a[0] - c[0], a[1] - c[1]);
    const m = [(a[0] + c[0]) / 2, Math.min(a[1], c[1]) - 18 - d * 0.28];
    return [{ key: `${l.companyId}-${l.businessId}`, d: `M${a[0]} ${a[1]} Q${m[0]} ${m[1]} ${c[0]} ${c[1]}`, a, c }];
  });

  return (
    <div className="space-y-2">
      <div
        ref={box}
        className={cn("cb relative isolate overflow-hidden rounded-[var(--radius)] border", compact ? "aspect-[620/700] lg:aspect-[1000/860]" : "aspect-[620/700] md:aspect-[1274/860] md:max-h-[82vh]", !on.h && "cb-hide-h", !on.b && "cb-hide-b", !on.c && "cb-hide-c")}
        style={{ background: "radial-gradient(ellipse at 55% 45%,#fff 0,#f5f8fd 55%,#e9f0fb 100%)", touchAction: close ? "none" : "auto" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <style>{CSS}</style>
        <div className="absolute inset-0">
          <svg ref={svgEl} viewBox={initialVb} preserveAspectRatio="xMidYMid meet" role="group" aria-label="Karta grada Simpolis" onClick={() => !dragged.current && onSelect(undefined)}>
            <g dangerouslySetInnerHTML={{ __html: DEFS }} />
            {[[0.1, 0.1, 80, ""], [0.9, 0.82, 90, "b"], [0.86, 0.06, 70, ""]].map(([fx, fy, rx, c], i) => (
              <g key={i} className={`cb-cloud ${c}`} opacity=".85" filter="url(#cb-bl2)">
                <ellipse cx={fit.x + fit.w * (fx as number)} cy={fit.y + fit.h * (fy as number)} rx={(rx as number) * Math.max(1, fit.w / 1200)} ry="18" fill="#fff" />
                <ellipse cx={fit.x + fit.w * (fx as number) + 40} cy={fit.y + fit.h * (fy as number) - 15} rx={(rx as number) * 0.6 * Math.max(1, fit.w / 1200)} ry="15" fill="#fff" />
              </g>
            ))}
            <g pointerEvents="none" dangerouslySetInnerHTML={{ __html: statics.base }} />
            <g>
              {items.map((it) => {
                if (it.node === "s") return <g key={`s${it.i}`} pointerEvents="none" dangerouslySetInnerHTML={{ __html: it.html }} />;
                if (it.node === "b") {
                  const b = bizById.get(it.id)!;
                  const meta = BIZ_META[b.kind];
                  const [ax, ay] = bizLots[b.id];
                  return <Biz key={`b-${b.id}`} id={b.id} name={b.name} letter={meta.letter} kindLabel={meta.label} nkd={meta.nkd} ax={ax} ay={ay} ht={hOf(`b:${b.id}`)} chimney={b.kind === "laundry" || b.kind === "bakery"} />;
                }
                const h: LeaderboardRow = hotelById.get(it.id)!;
                const [ax, ay] = lots[h.companyId].slot;
                const prof = profiles[h.companyId];
                const pct = prof?.detail?.occupancyPct ?? 55;
                return <Hotel key={`h-${h.companyId}`} id={h.companyId} name={h.hotelName} ax={ax} ay={ay} ht={hOf(h.companyId)} rows={rowsOf(h.progress, maxProgress)} tone={h.companyId === youId ? "me" : h.isBot ? "bot" : "h"} litPct={pct} selected={selectedId === h.companyId} onSelect={select} onHover={hover} />;
              })}
            </g>
            <g pointerEvents="none">
              {labelIds.map((id) => <DistrictLabel key={id} id={id} name={districtById(id as never).name} />)}
              {arcs.map((a) => (
                <g key={a.key} className="cb-contract">
                  <path className="cb-arc" d={a.d} />
                  <circle cx={a.a[0]} cy={a.a[1]} r="4.5" fill="#2f8f6b" stroke="#fff" strokeWidth="2" />
                  <circle cx={a.c[0]} cy={a.c[1]} r="4.5" fill="#2f8f6b" stroke="#fff" strokeWidth="2" />
                </g>
              ))}
            </g>
            <g>
              {chipOrder.map((h) => {
                const own = h.companyId === youId;
                const [tx, ty] = topOf(h.companyId);
                const g = growth(profiles[h.companyId]?.detail?.months ?? []);
                const planned = chipPlan.get(h.companyId);
                const dy = hoverId === h.companyId || planned == null ? 0 : planned;
                const base = own ? 89 : 53;
                return <Chip key={h.companyId} id={h.companyId} x={tx} y={ty - base + dy} name={h.hotelName} pct={g} own={own} hot={selectedId === h.companyId} shown={planned != null || hoverId === h.companyId} stem={dy < 0 ? base - 6 - dy : 0} onSelect={select} />;
              })}
            </g>
            <g pointerEvents="none">
              {tags.map((t) => {
                if (!lots[t.id]) return null;
                const [tx, ty] = topOf(t.id);
                return (
                  <g key={t.key} transform={`translate(${tx},${ty - 40})`}>
                    <g className="cb-delta">
                      <text textAnchor="middle" fontSize="20" fontWeight="800" stroke="#fff" strokeWidth="5" paintOrder="stroke" fill={t.delta >= 0 ? "#0f7a3c" : "#c42626"}>
                        {t.delta >= 0 ? "+" : "−"}{fmtDec(Math.abs(t.delta))}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <div className={cn("pointer-events-none absolute left-3 right-3 top-3 z-10 flex flex-wrap items-center gap-1.5", selectedId && "max-md:hidden")}>
          <div className="pointer-events-auto hidden rounded-full bg-card px-3.5 py-1.5 text-[13px] shadow-card md:block">
            <b>Simpolis</b> <span className="text-muted-foreground">· {hotelsN} {hotelsN === 1 ? "hotel" : "hotela"}</span>
          </div>
          {LAYERS.map(([k, label]) => (
            <button key={k} aria-pressed={on[k]} onClick={() => setOn((s) => ({ ...s, [k]: !s[k] }))} className={cn("pointer-events-auto rounded-full px-3 py-1.5 text-[13px] font-bold shadow-card", on[k] ? "bg-secondary text-primary" : "bg-card text-foreground")}>
              {label}
            </button>
          ))}
        </div>
        {canClose && (
          <button onClick={() => { setZoomed((z) => !z); setPan({ x: 0, y: 0 }); }} className="absolute bottom-3 right-3 z-10 rounded-full bg-card px-3.5 py-2 text-[13px] font-bold shadow-card">
            {zoomed ? "Cijeli grad" : "Približi"}
          </button>
        )}
        <Legend bots={hasBots} className={cn("absolute bottom-3 right-3 z-10 rounded-xl bg-card px-3 py-2 shadow-card", compact ? "hidden" : "hidden md:block")} />
        <div className={cn("pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-night px-4 py-2 text-[13px] font-semibold text-white shadow-lift", !compact && "lg:block")}>
          Klikni hotel za karticu
        </div>
      </div>
      <Legend bots={hasBots} className={cn("flex-wrap gap-x-4 px-1 [&>div]:my-0", compact ? "flex" : "flex md:hidden")} />
    </div>
  );
}
