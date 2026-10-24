"use client";

// Skica: Leaflet s CDN-a. Pri pravoj implementaciji Rino/Leon dodaju leaflet + react-leaflet u package.json.
import { useEffect, useRef, useState } from "react";
import type { CityView } from "@/lib/types";
import { BIZ_META, businessLatLng, growth, hotelPositions, inBlockade, type PublicProfile } from "@/lib/karta";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Leaflet = any;
const LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist";

let loading: Promise<Leaflet> | undefined;
function loadLeaflet(): Promise<Leaflet> {
  const w = window as unknown as { L?: Leaflet };
  if (w.L) return Promise.resolve(w.L);
  loading ??= new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-css")) {
      const l = document.createElement("link");
      l.id = "leaflet-css";
      l.rel = "stylesheet";
      l.href = `${LEAFLET}/leaflet.css`;
      document.head.appendChild(l);
    }
    const s = document.createElement("script");
    s.src = `${LEAFLET}/leaflet.js`;
    s.onload = () => resolve((window as unknown as { L: Leaflet }).L);
    s.onerror = () => {
      loading = undefined;
      s.remove();
      reject(new Error("Leaflet se nije učitao"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const LAYERS = [["h", "Hoteli"], ["b", "Partneri"], ["c", "Ugovori"]] as const;

const CSS = `
.kk-pin{width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff;background:var(--primary)}
.kk-pin span{transform:rotate(45deg);color:#fff;font-weight:800;font-size:13px}
.kk-pin.me{background:var(--night);outline:3px solid #ffd54a}.kk-pin.blk{background:var(--down)}
.kk-pin.b{background:#2f8f6b;width:26px;height:26px}.kk-pin.b span{font-size:11px}
.kk-lbl{background:#fff!important;border:0!important;border-radius:8px!important;padding:2px 7px!important;font:700 11px var(--font-sans),system-ui,sans-serif!important;color:var(--foreground)!important;box-shadow:0 1px 4px rgba(0,0,0,.2)!important}
.kk-lbl:before{display:none!important}
.kk-up{color:var(--up)}.kk-dn{color:var(--down)}
`;

export function KvarnerMap({ city, youId, profiles, selectedId, onSelect }: { city: CityView; youId: string; profiles: Record<string, PublicProfile>; selectedId?: string; onSelect: (id: string | undefined) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet>(null);
  const groups = useRef<Record<string, Leaflet>>({});
  const fitted = useRef(false);
  const onSelectRef = useRef(onSelect);
  const [lib, setLib] = useState<Leaflet>(null);
  const [failed, setFailed] = useState(false);
  const [on, setOn] = useState({ h: true, b: true, c: true });

  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  // Karta se gradi jednom, u pregledniku.
  useEffect(() => {
    let dead = false;
    loadLeaflet().then(
      (L) => {
        if (dead || !box.current) return;
        const map = L.map(box.current, { zoomControl: false }).setView([44.98, 14.48], 9);
        L.control.zoom({ position: "topright" }).addTo(map);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }).addTo(map);
        map.on("click", () => onSelectRef.current(undefined));
        groups.current = { h: L.layerGroup().addTo(map), b: L.layerGroup().addTo(map), c: L.layerGroup().addTo(map) };
        mapRef.current = map;
        setLib(L);
      },
      () => !dead && setFailed(true),
    );
    return () => {
      dead = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Pribadače i linije se ponovno crtaju kad se podaci promijene.
  useEffect(() => {
    const L = lib, map = mapRef.current;
    if (!L || !map) return;
    const g = groups.current;
    Object.values(g).forEach((x) => x.clearLayers());
    const bounds: [number, number][] = [];
    const pos = hotelPositions(city.hotels);
    const bizPos = new Map(city.businesses.map((b, i) => [b.id, businessLatLng(b, i)]));
    city.hotels.forEach((h) => {
      const p = profiles[h.companyId];
      const ll = pos[h.companyId];
      if (!p || !ll) return;
      const gr = growth(p.months);
      const cls = inBlockade(p.cash) ? "blk" : h.companyId === youId ? "me" : "";
      const icon = L.divIcon({ className: "", iconSize: [34, 34], iconAnchor: [17, 34], html: `<div class="kk-pin ${cls}"><span>${p.stars}★</span></div>` });
      const m = L.marker(ll, { icon, keyboard: true, title: p.name }).addTo(g.h).on("click", (e: Leaflet) => { L.DomEvent.stopPropagation(e); onSelectRef.current(h.companyId); });
      const d = gr === null ? "" : ` · <span class="${gr >= 0 ? "kk-up" : "kk-dn"}">${gr >= 0 ? "+" : ""}${gr} %</span>`;
      m.bindTooltip(`${esc(p.name)}${d}`, { permanent: true, direction: "right", offset: [14, -18], className: "kk-lbl", opacity: 1 });
      bounds.push(ll);
    });
    city.businesses.forEach((b) => {
      const ll = bizPos.get(b.id)!;
      const meta = BIZ_META[b.kind];
      const icon = L.divIcon({ className: "", iconSize: [26, 26], iconAnchor: [13, 26], html: `<div class="kk-pin b"><span>${meta.letter}</span></div>` });
      L.marker(ll, { icon, title: b.name }).addTo(g.b).bindPopup(`<b>${esc(b.name)}</b><br>${meta.label}<br><span style="color:#5d6679">NKD ${meta.nkd}</span>`);
      bounds.push(ll);
    });
    city.links.forEach((l) => {
      const a = pos[l.companyId], b = bizPos.get(l.businessId);
      if (a && b) L.polyline([a, b], { color: "#2f8f6b", weight: 2, dashArray: "5 6", opacity: 0.8, interactive: false }).addTo(g.c);
    });
    if (!fitted.current && bounds.length) {
      map.fitBounds(bounds, { padding: [50, 50] });
      fitted.current = true;
    }
  }, [lib, city, profiles, youId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!lib || !map) return;
    for (const [k] of LAYERS) {
      const layer = groups.current[k];
      if (on[k] && !map.hasLayer(layer)) layer.addTo(map);
      if (!on[k] && map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [lib, on]);

  // Kad se kartica otvori, karta ostaje na mjestu; samo se pomakne na odabrani hotel ako je izvan vidokruga.
  useEffect(() => {
    const map = mapRef.current;
    const ll = selectedId ? hotelPositions(city.hotels)[selectedId] : undefined;
    if (map && ll && !map.getBounds().contains(ll)) map.panTo(ll);
  }, [selectedId, city.hotels, lib]);

  const hotelsN = city.hotels.length;
  return (
    <div className="relative isolate h-[55vh] min-h-[380px] overflow-hidden rounded-[var(--radius)] border bg-muted md:h-[60vh]">
      <style>{CSS}</style>
      <div ref={box} className="absolute inset-0" aria-label="Karta Kvarnera" />
      <div className="pointer-events-none absolute right-14 top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 md:left-3">
        <div className={cn("pointer-events-auto rounded-full bg-card px-3.5 py-1.5 text-[13px] shadow-card", selectedId && "hidden md:block md:invisible")}>
          <b>Karta Kvarnera</b> <span className="text-muted-foreground">· {hotelsN} {hotelsN === 1 ? "hotel" : "hotela"}</span>
        </div>
        {LAYERS.map(([k, label]) => (
          <button key={k} aria-pressed={on[k]} onClick={() => setOn((s) => ({ ...s, [k]: !s[k] }))} className={cn("pointer-events-auto rounded-full px-3 py-1.5 text-[13px] font-semibold shadow-card", on[k] ? "bg-secondary text-primary" : "bg-card text-foreground")}>
            {label}
          </button>
        ))}
      </div>
      <div className="absolute bottom-7 right-3 z-[1000] hidden rounded-xl bg-card px-3 py-2 text-xs shadow-card md:block">
        <Dot c="var(--night)" ring>Tvoj hotel</Dot>
        <Dot c="var(--primary)">Hotel u igri</Dot>
        <Dot c="var(--down)">U blokadi</Dot>
        <Dot c="#2f8f6b">Gradski partner</Dot>
      </div>
      <div className="pointer-events-none absolute bottom-7 left-1/2 z-[999] hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-night px-4 py-2 text-[13px] font-semibold text-white shadow-lift lg:block" style={{ left: "62%" }}>
        Skica · ocjene i financije tuđih hotela su primjer · klikni pribadaču
      </div>
      {failed && <p className="absolute inset-0 z-[1000] grid place-items-center bg-muted text-sm text-muted-foreground">Karta se nije mogla učitati (provjeri internet).</p>}
    </div>
  );
}

const Dot = ({ c, ring, children }: { c: string; ring?: boolean; children: React.ReactNode }) => (
  <div className="my-1 flex items-center gap-1.5"><i className="inline-block size-[11px] rounded-full" style={{ background: c, outline: ring ? "2px solid #ffd54a" : undefined }} />{children}</div>
);
