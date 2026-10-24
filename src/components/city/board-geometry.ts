// Izometrijska geometrija i statični sloj karte (teren, more, ukrasi) kao SVG nizovi. Čisti kod bez Reacta.
import { DISTRICTS, GRID, HOTEL_H_MAX, HOTEL_HALF, terrainCell, type CityTier, type Slot } from "@/lib/karta";

export const HW = 34;
export const HH = 17;
export const OY = 150;
export const CX = GRID * HW + 40;
export const DEP = 34;

// Zaslonska točka iz koordinata polja (x, y) i visine z.
export const P = (x: number, y: number, z = 0): [number, number] => [CX + (x - y) * HW, OY + (x + y) * HH - z];
export const pt = (a: number[][]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
export const lerp = (a: number[], b: number[], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const rnd = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// Cijela ploča u koordinatama pogleda.
export const VIEW = { x: 14, y: 20, w: CX + GRID * HW + 40 - 14, h: OY + 2 * GRID * HH + DEP + 96 - 20 };

// ---- kamera koja se prilagođava gradu ----
// Pogled se računa iz parcela koje su stvarno zauzete (hoteli, tvrtke, natpisi okruga) pa se mali grad prikazuje
// zumirano, a veliki cijeli. Parcele se pritom ne miču, mijenja se samo viewBox. Čista funkcija, memoizira se po ključu parcela.
export type ViewBox = { x: number; y: number; w: number; h: number };
const CHIP_ROOM = 150; // prostor iznad najvišeg hotela za natpis
const MIN_W = 640;
const MIN_H = 430;
export function fitView(hotels: Slot[], bizs: Slot[], labels: string[], aspect: number): ViewBox {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (p: number[]) => {
    x0 = Math.min(x0, p[0]);
    x1 = Math.max(x1, p[0]);
    y0 = Math.min(y0, p[1]);
    y1 = Math.max(y1, p[1]);
  };
  for (const [ax, ay] of hotels) {
    const s = HOTEL_HALF;
    const c = P(ax, ay, 0);
    add([c[0] - 150, c[1] - HOTEL_H_MAX - 22 - CHIP_ROOM]);
    add([c[0] + 150, c[1]]);
    add(P(ax - s, ay + s, 0));
    add(P(ax + s, ay - s, 0));
    add([c[0], P(ax + s, ay + s, 0)[1] + 24]);
  }
  for (const [ax, ay] of bizs) {
    const c = P(ax, ay, 0);
    add([c[0] - 40, c[1] - 90]);
    add([c[0] + 40, c[1] + 28]);
  }
  for (const id of labels) {
    const l = DISTRICT_LABELS[id];
    if (!l) continue;
    const p = P(l[0], l[1], 0);
    add([p[0] + l[3] - 100, p[1] - l[2] - 50]);
    add([p[0] + l[3] + 100, p[1] + 14]);
  }
  if (!isFinite(x0)) return { ...VIEW };
  y1 += 60; // mjesto za legendu i "Klikni hotel" pri dnu kadra
  const pad = 36;
  let w = Math.max(x1 - x0 + 2 * pad, MIN_W);
  let h = Math.max(y1 - y0 + 2 * pad, MIN_H);
  if (w / h < aspect) w = h * aspect;
  else h = w / aspect;
  return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
}

const ELEV: Record<string, number> = { ".": 0, s: 7, g: 14, h: 30, H: 46, p: 5 };
export const elevAt = (x: number, y: number) => ELEV[terrainCell(x, y)] ?? 0;
export const isLand = (x: number, y: number) => terrainCell(x, y) !== ".";

// Najviša i najniža visina terena ispod zgrade (zgrada stoji na najvišoj, zidovi se spuštaju do najniže).
export function groundRange(ax: number, ay: number, half: number): { z: number; zb: number } {
  let z = 0;
  let zb = 99;
  for (let x = Math.floor(ax - half); x <= Math.floor(ax + half); x++)
    for (let y = Math.floor(ay - half); y <= Math.floor(ay + half); y++) {
      const e = elevAt(x, y);
      z = Math.max(z, e);
      zb = Math.min(zb, e);
    }
  return { z, zb };
}

const COL: Record<string, [string, string, string]> = {
  s: ["#f4e8d5", "#dcc79f", "#c9b387"],
  g: ["#c4e6d0", "#8cc4a3", "#78b392"],
  h: ["#a9d9bd", "#7db996", "#68a784"],
  H: ["#97cfae", "#6fb08d", "#5c9d7b"],
  p: ["#e6c99b", "#c6a56f", "#ad8c58"],
};
const poly = (a: number[][], f: string, x = "") => `<polygon points="${pt(a)}" fill="${f}" ${x}/>`;
const near = (x: number, y: number, f: (c: string) => boolean) => {
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (f(terrainCell(x + i, y + j))) return true;
  return false;
};

export type Drawable = { k: number; s: string };

const tree = (x: number, y: number, pine: boolean): Drawable => {
  const [bx, by] = P(x, y, elevAt(Math.floor(x), Math.floor(y)));
  let s = `<ellipse cx="${bx}" cy="${by}" rx="7" ry="3.2" fill="#1b2440" opacity=".12"/>`;
  if (pine) s += `<rect x="${bx - 1.5}" y="${by - 7}" width="3" height="7" fill="#7a5c3e"/>` + poly([[bx - 9, by - 6], [bx + 9, by - 6], [bx, by - 24]], "#3f9c7b") + poly([[bx - 7, by - 15], [bx + 7, by - 15], [bx, by - 31]], "#52b08d") + poly([[bx, by - 6], [bx + 9, by - 6], [bx, by - 24]], "#368a6c", 'opacity=".5"');
  else s += `<rect x="${bx - 1.5}" y="${by - 9}" width="3" height="9" fill="#8a6a4a"/><circle cx="${bx}" cy="${by - 15}" r="8" fill="#52ad8b"/><circle cx="${bx - 2.5}" cy="${by - 17.5}" r="4.6" fill="#74c4a5"/>`;
  return { k: Math.floor(x) + Math.floor(y) + 1.4, s };
};
const palm = (x: number, y: number): Drawable => {
  const [bx, by] = P(x, y, elevAt(Math.floor(x), Math.floor(y)));
  let s = `<ellipse cx="${bx}" cy="${by}" rx="7" ry="3" fill="#1b2440" opacity=".12"/><path d="M${bx} ${by} q4 -14 -1 -26" stroke="#9b7a52" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  for (const [dx, dy] of [[-14, -4], [-9, -11], [0, -14], [10, -11], [14, -3]]) s += `<path d="M${bx - 1} ${by - 26} q${dx * 0.6} ${dy - 8} ${dx} ${dy + 4}" stroke="#3f9c7b" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
  return { k: Math.floor(x) + Math.floor(y) + 1.4, s };
};
const umbrella = (x: number, y: number, c: string): Drawable => {
  const [bx, by] = P(x, y, elevAt(Math.floor(x), Math.floor(y)));
  return { k: Math.floor(x) + Math.floor(y) + 1.4, s: `<ellipse cx="${bx}" cy="${by}" rx="8" ry="3.5" fill="#1b2440" opacity=".1"/><line x1="${bx}" y1="${by}" x2="${bx}" y2="${by - 16}" stroke="#8a6a4a" stroke-width="2"/><path d="M${bx - 11} ${by - 15} q11 -14 22 0z" fill="${c}"/><path d="M${bx - 3} ${by - 15} q3 -11 6 0z" fill="#fff" opacity=".55"/>` };
};
const lighthouse = (): Drawable => {
  const [bx, by] = P(16.3, 15.6, elevAt(16, 15));
  return { k: 16.3 + 15.6 + 1.3, s: poly([[bx - 7, by], [bx + 7, by], [bx + 5, by - 30], [bx - 5, by - 30]], "#fff") + poly([[bx - 6, by - 12], [bx + 6, by - 12], [bx + 5.5, by - 19], [bx - 5.5, by - 19]], "#c42626") + poly([[bx - 6, by - 30], [bx + 6, by - 30], [bx, by - 38]], "#1b2440") + `<circle class="cb-lamp" cx="${bx}" cy="${by - 33}" r="2.4" fill="#ffd54a"/>` };
};

// Teren: pločice, pjena uz obalu, ukrasi. `occ` su polja koja zauzimaju zgrade (tamo nema drveća).
// `tier` određuje gustoću ukrasa: u malom gradu više drveća i palmi (kamera je blizu), u velikom rjeđe.
const TREE_CUT: Record<CityTier, number> = { small: 0.7, medium: 0.82, large: 0.88 };
export function terrainDrawables(occ: Set<string>, tier: CityTier = "medium"): Drawable[] {
  const D: Drawable[] = [];
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++) {
      const c = terrainCell(x, y);
      if (c === ".") continue;
      const e = ELEV[c];
      const col = COL[c];
      let top = col[0];
      if (c === "g" && (x + y) % 2) top = "#bce0c9";
      let s = "";
      const eL = elevAt(x, y + 1);
      const eR = elevAt(x + 1, y);
      if (eL < e) s += poly([P(x, y + 1, e), P(x + 1, y + 1, e), P(x + 1, y + 1, eL), P(x, y + 1, eL)], col[1]);
      if (eR < e) s += poly([P(x + 1, y + 1, e), P(x + 1, y, e), P(x + 1, y, eR), P(x + 1, y + 1, eR)], col[2]);
      s += poly([P(x, y, e), P(x + 1, y, e), P(x + 1, y + 1, e), P(x, y + 1, e)], top);
      if (c === "p") {
        const a = P(x + 0.15, y + 0.5, e);
        const b = P(x + 0.85, y + 0.5, e);
        s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#ad8c58" stroke-width="1.5"/>`;
      }
      if (c !== "p") {
        const f = (a: number[], b: number[]) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".85"/>`;
        if (terrainCell(x, y + 1) === ".") s += f(P(x, y + 1, 0), P(x + 1, y + 1, 0));
        if (terrainCell(x + 1, y) === ".") s += f(P(x + 1, y + 1, 0), P(x + 1, y, 0));
      }
      D.push({ k: x + y + 1, s: `<g class="cb-tile" style="--d:${((x + y) * 22).toFixed(0)}ms">${s}</g>` });
    }
  const ornaments: Drawable[] = [];
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++) {
      const c = terrainCell(x, y);
      if (occ.has(`${x},${y}`)) continue;
      const r = rnd(x * 13.7 + y * 7.3);
      if ((c === "h" || c === "H") && r > 0.55) ornaments.push(tree(x + 0.3 + rnd(x + y) * 0.4, y + 0.3 + rnd(x * 3 + y) * 0.4, true));
      else if (c === "g" && r > TREE_CUT[tier]) ornaments.push(tree(x + 0.5, y + 0.5, false));
      else if (c === "s" && ((x >= 12 && y <= 6) || x >= 18 || y >= 19) && r > (tier === "small" ? 0.5 : 0.6) && (x + y) % 2 === 0) ornaments.push(palm(x + 0.5, y + 0.5));
    }
  ornaments.push(umbrella(13.3, 4.2, "#246bfd"), umbrella(12.7, 5.5, "#fff"), umbrella(13.5, 6.2, "#f08a5d"), umbrella(12.4, 3.4, "#f5c14b"), palm(1.5, 6.2), palm(1.5, 8.6), lighthouse());
  const delay = (d: Drawable, i: number) => ({ k: d.k, s: `<g class="cb-pop" style="--d:${420 + i * 12}ms">${d.s}</g>` });
  return [...D, ...ornaments.map(delay)];
}

// Polja pod zgradama (da ih drveće ne zaklanja).
export function occupied(slots: Slot[], extra: Slot[]): Set<string> {
  const occ = new Set<string>();
  const mark = (ax: number, ay: number, r: number) => {
    for (let x = Math.floor(ax - r); x <= Math.ceil(ax + r) - 1; x++) for (let y = Math.floor(ay - r); y <= Math.ceil(ay + r) - 1; y++) occ.add(`${x},${y}`);
  };
  slots.forEach(([x, y]) => mark(x, y, HOTEL_HALF + 0.6));
  extra.forEach(([x, y]) => mark(x, y, 0.9));
  return occ;
}

// Podloga: sjena, ploča, more, valovi i brodice (sve se crta prije svijeta).
export function baseLayer(tier: CityTier = "medium"): string {
  const Tp = P(0, 0), Rp = P(GRID, 0), Bp = P(GRID, GRID), Lp = P(0, GRID);
  const topPoly = pt([Tp, Rp, Bp, Lp]);
  const slab = (c: string) => `<polygon points="${pt([Lp, Bp, Rp, [Rp[0], Rp[1] + DEP], [Bp[0], Bp[1] + DEP], [Lp[0], Lp[1] + DEP]])}" fill="${c}" stroke="${c}" stroke-width="40" stroke-linejoin="round"/>`;
  let s = `<ellipse cx="${CX}" cy="${P(GRID / 2, GRID / 2)[1] + DEP + 52}" rx="${GRID * HW * 0.78}" ry="52" fill="#1b2440" opacity=".22" filter="url(#cb-bl)"/>`;
  s += `<g clip-path="url(#cb-cl)">${slab("#27366a")}</g><g clip-path="url(#cb-cr)">${slab("#1b2440")}</g>`;
  s += `<polygon points="${topPoly}" fill="#fff" stroke="#fff" stroke-width="42" stroke-linejoin="round"/><polygon points="${topPoly}" fill="#a0c8ee" stroke="#a0c8ee" stroke-width="35" stroke-linejoin="round"/>`;
  let sea = "";
  const waves: [number, number][] = [];
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++) {
      if (terrainCell(x, y) !== ".") continue;
      const shore = near(x, y, (q) => q !== ".");
      const base = shore ? "#c9e2fa" : (x + y) % 2 ? "#a9cff2" : "#a0c8ee";
      sea += poly([P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)], base, 'stroke="#fff" stroke-opacity=".35" stroke-width="1.2"');
      if (!shore && rnd(x * 17 + y * 5) > 0.72) waves.push([x + 0.5, y + 0.5]);
    }
  s += `<g class="cb-sea">${sea}</g>`;
  waves.forEach(([x, y], i) => {
    const [a, b] = P(x, y);
    s += `<path class="cb-wave" style="animation-delay:${((i * 0.37) % 4).toFixed(2)}s" d="M${a - 9} ${b} q4.5 -4 9 0 t9 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/>`;
  });
  const boat = (x: number, y: number, c: string, i: number) => {
    const [a, b] = P(x, y);
    return `<g class="cb-boat" style="animation-delay:-${i * 0.9}s"><ellipse cx="${a}" cy="${b + 4}" rx="16" ry="5" fill="#1b2440" opacity=".12"/><path d="M${a - 14} ${b - 2} h28 l-5 8 h-18z" fill="#fff"/><path d="M${a - 14} ${b - 2} h28" stroke="${c}" stroke-width="3"/><line x1="${a}" y1="${b - 2}" x2="${a}" y2="${b - 26}" stroke="#5d6679" stroke-width="1.6"/><path d="M${a} ${b - 26} v21 h12z" fill="${c}"/></g>`;
  };
  // Brodice po veličini grada: najprije one uz središnji otok, pa uz proširene četvrti.
  const boats: [number, number, string][] = [[15.5, 6.5, "#f08a5d"], [9.6, 14.1, "#246bfd"], [5.5, 11.5, "#2f8f6b"], [15.4, 11.4, "#f08a5d"], [0.9, 2.4, "#2f8f6b"], [11.8, 0.9, "#246bfd"], [8.6, 17, "#2f8f6b"], [16.6, 9, "#246bfd"], [11, 18.2, "#f08a5d"]];
  boats.slice(0, tier === "small" ? 4 : tier === "medium" ? 7 : boats.length).forEach(([x, y, c], i) => (s += boat(x, y, c, i)));
  return s;
}

export const DEFS = `<defs>
<filter id="cb-sh" x="-20%" y="-30%" width="140%" height="190%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#1b2440" flood-opacity=".28"/></filter>
<filter id="cb-bl"><feGaussianBlur stdDeviation="16"/></filter><filter id="cb-bl2"><feGaussianBlur stdDeviation="6"/></filter>
<clipPath id="cb-cl"><rect x="0" y="0" width="${CX}" height="1200"/></clipPath><clipPath id="cb-cr"><rect x="${CX}" y="0" width="${CX}" height="1200"/></clipPath></defs>`;

// Natpisi okruga: [okrug, x, y, visina stalka, pomak]
export const DISTRICT_LABELS: Record<string, [number, number, number, number]> = {
  luka: [8.4, 11.6, 0, -78],
  setnica: [2.3, 9.8, 0, 0],
  plaza: [14.5, 7.4, 10, 0],
  brdo: [7, 1.4, 70, 0],
  ana: [4.5, 16.5, 28, 0],
  otok: [13.5, 16.5, 28, 0],
  marina: [20.5, 3.2, 0, 0],
  juzna: [8.5, 24, 0, 0],
};
export const districtName = (id: string) => DISTRICTS.find((d) => d.id === id)?.name ?? id;
