import type { BusinessKind, CityBusiness, CityView, LeaderboardRow } from "@/lib/types";

const H = 490;
const BACK_GROUND = 175; // baseline of city businesses (back row)
const FRONT_GROUND = 402; // baseline of hotels (front row)
const MIN_W = 640;
const SLOT = 120;

const KIND_LABEL: Record<BusinessKind, string> = {
  agency: "agencija",
  laundry: "praonica",
  bakery: "pekara",
  security: "zaštita",
  supplier: "dobavljač",
};
const KIND_LETTER: Record<BusinessKind, string> = { agency: "A", laundry: "P", bakery: "B", security: "Z", supplier: "D" };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// Two lines of at most `max` characters; the rest is cut with "…" (full name stays in the tooltip).
function wrap2(name: string, max: number): string[] {
  if (name.length <= max) return [name];
  const words = name.split(" ");
  let first = "";
  while (words.length && (first + " " + words[0]).trim().length <= max) first = (first + " " + words.shift()).trim();
  if (!first) return [name.slice(0, max - 1) + "…"];
  const rest = words.join(" ");
  return [first, rest.length <= max ? rest : rest.slice(0, max - 1) + "…"];
}

// Hotel colour: night blue towards the brand blue with progress, warning red when it falls below zero.
const hotelFill = (p: number) =>
  p < 0
    ? "color-mix(in srgb, var(--down) 45%, var(--night))"
    : `color-mix(in srgb, var(--primary) ${Math.round(22 + clamp(p / 8, 0, 1) * 70)}%, var(--night))`;
const hotelHeight = (p: number) => Math.round(72 + clamp((p + 2) / 10, 0, 1) * 82);

const BIZ = "color-mix(in srgb, var(--up) 55%, var(--night))";
const WINDOW = "var(--sand)";
const INK = "var(--card)";

export function CityMap({ city, round, highlightCompanyId }: { city: CityView; round: number; highlightCompanyId?: string }) {
  const hotels = city.hotels;
  const biz = city.businesses;
  const W = Math.max(MIN_W, hotels.length * SLOT, biz.length * SLOT);
  const hx = (i: number) => ((i + 0.5) * W) / Math.max(hotels.length, 1);
  const bx = (i: number) => ((i + 0.5) * W) / Math.max(biz.length, 1);
  const hotelMax = Math.floor((W / Math.max(hotels.length, 1) - 12) / 8.4);
  const bizMax = Math.floor((W / Math.max(biz.length, 1) - 12) / 8.4);
  const hotelIndex = new Map(hotels.map((h, i) => [h.companyId, i]));
  const bizIndex = new Map(biz.map((b, i) => [b.id, i]));
  const summary = `Karta grada: ${hotels.length} hotela i ${biz.length} gradskih tvrtki, ${city.links.length} aktivnih ugovora.`;

  return (
    <div>
      <div className="overflow-x-auto rounded-[var(--radius)]">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="block h-auto w-full" style={{ minWidth: MIN_W }}>
          <style>{`
            @media (prefers-reduced-motion: no-preference) { .cm-link { animation: cm-dash 1.6s linear infinite; } .cm-glow { animation: cm-pulse 2.8s ease-in-out infinite; } }
            @keyframes cm-dash { to { stroke-dashoffset: -28; } }
            @keyframes cm-pulse { 50% { opacity: 0.55; } }
          `}</style>
          <defs>
            <linearGradient id="cm-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--night)" />
              <stop offset="1" stopColor="color-mix(in srgb, var(--primary) 35%, var(--night))" />
            </linearGradient>
            <filter id="cm-blur" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
          </defs>
          <rect width={W} height={H} fill="url(#cm-sky)" />
          <circle cx={W - 56} cy={46} r={20} fill="var(--sand)" opacity={0.9} />
          {/* back street and promenade, then the sea under the hotels */}
          <rect x={0} y={BACK_GROUND} width={W} height={10} fill="color-mix(in srgb, var(--night) 70%, var(--card))" opacity={0.55} />
          <rect x={0} y={FRONT_GROUND} width={W} height={H - FRONT_GROUND} fill="color-mix(in srgb, var(--primary) 30%, var(--night))" />
          <rect x={0} y={FRONT_GROUND} width={W} height={7} fill="color-mix(in srgb, var(--sand) 45%, var(--night))" />

          {/* contracts: hotel roof to business base */}
          {city.links.map((l) => {
            const hi = hotelIndex.get(l.companyId);
            const bi = bizIndex.get(l.businessId);
            if (hi === undefined || bi === undefined) return null;
            const top = FRONT_GROUND - hotelHeight(hotels[hi].progress);
            const x1 = hx(hi), x2 = bx(bi), y1 = top - 4, y2 = BACK_GROUND + 12;
            const my = (y1 + y2) / 2;
            return (
              <path
                key={`${l.companyId}-${l.businessId}`}
                className="cm-link"
                d={`M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`}
                fill="none"
                stroke="color-mix(in srgb, var(--primary) 55%, white)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="10 18"
              >
                <title>Ugovor: {hotels[hi].hotelName} i {biz[bi].name}</title>
              </path>
            );
          })}

          {biz.map((b, i) => (
            <Business key={b.id} b={b} x={bx(i)} max={bizMax} />
          ))}
          {hotels.map((h, i) => (
            <Hotel key={h.companyId} h={h} x={hx(i)} max={hotelMax} lit={h.closedRound === round} you={h.companyId === highlightCompanyId} />
          ))}
        </svg>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-muted-foreground">
        <li>Visina i boja hotela: napredak</li>
        <li>Svijetli hotel: krug zatvoren</li>
        <li>Linija: aktivan ugovor</li>
      </ul>
    </div>
  );
}

function Hotel({ h, x, max, lit, you }: { h: LeaderboardRow; x: number; max: number; lit: boolean; you: boolean }) {
  const w = 76;
  const bh = hotelHeight(h.progress);
  const top = FRONT_GROUND - bh;
  const left = x - w / 2;
  const rows = Math.floor((bh - 44) / 24);
  const seed = hash(h.companyId);
  const name = wrap2(h.hotelName, max);
  return (
    <g>
      <title>{`${h.hotelName}, ${h.place}: napredak ${h.progress}${lit ? ", krug zatvoren" : ""}`}</title>
      {lit && <rect className="cm-glow" x={left - 8} y={top - 8} width={w + 16} height={bh + 16} rx={14} fill="var(--primary)" opacity={0.85} filter="url(#cm-blur)" />}
      <rect x={left} y={top} width={w} height={bh} rx={5} fill={hotelFill(h.progress)} stroke={you ? "var(--sand)" : "none"} strokeWidth={you ? 3 : 0} />
      <rect x={left - 4} y={top - 6} width={w + 8} height={8} rx={3} fill="color-mix(in srgb, var(--card) 28%, var(--night))" />
      {Array.from({ length: rows * 3 }, (_, k) => {
        const on = lit || (seed + k * 7) % 3 !== 0;
        return (
          <rect key={k} x={left + 10 + (k % 3) * 22} y={top + 18 + Math.floor(k / 3) * 24} width={14} height={14} rx={2} fill={WINDOW} opacity={on ? (lit ? 1 : 0.7) : 0.14} />
        );
      })}
      <rect x={x - 11} y={FRONT_GROUND - 28} width={22} height={28} rx={3} fill="var(--foreground)" />
      {you && (
        <g>
          <rect x={x - 17} y={top - 34} width={34} height={20} rx={10} fill="var(--sand)" />
          <text x={x} y={top - 20} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--foreground)">ti</text>
        </g>
      )}
      {name.map((line, i) => (
        <text key={i} x={x} y={FRONT_GROUND + 28 + i * 17} textAnchor="middle" fontSize={15} fontWeight={800} fill={INK}>{line}</text>
      ))}
      <text x={x} y={FRONT_GROUND + 28 + name.length * 17 + 4} textAnchor="middle" fontSize={15} fontWeight={800} fill="var(--mint)" className="tabular-nums">napredak {h.progress}</text>
    </g>
  );
}

function Business({ b, x, max }: { b: CityBusiness; x: number; max: number }) {
  const g = BACK_GROUND;
  const name = wrap2(b.name, max);
  let shape: React.ReactNode;
  let top: number;
  switch (b.kind) {
    case "agency": // wide low building with a sign band
      top = g - 56;
      shape = (
        <>
          <rect x={x - 38} y={top} width={76} height={56} rx={4} fill={BIZ} />
          <rect x={x - 42} y={top + 6} width={84} height={12} rx={3} fill="var(--sand)" />
        </>
      );
      break;
    case "laundry": // box with a round porthole
      top = g - 50;
      shape = (
        <>
          <rect x={x - 30} y={top} width={60} height={50} rx={6} fill={BIZ} />
          <circle cx={x} cy={top + 18} r={11} fill="var(--mint)" opacity={0.35} stroke="var(--mint)" strokeWidth={3} />
        </>
      );
      break;
    case "bakery": // gable roof
      top = g - 62;
      shape = (
        <>
          <rect x={x - 30} y={top + 20} width={60} height={42} fill={BIZ} />
          <polygon points={`${x - 38},${top + 22} ${x},${top} ${x + 38},${top + 22}`} fill="var(--warn)" />
        </>
      );
      break;
    case "security": // tower with battlements
      top = g - 78;
      shape = (
        <>
          <rect x={x - 22} y={top + 8} width={44} height={70} fill={BIZ} />
          {[-22, -7, 8].map((dx) => (
            <rect key={dx} x={x + dx} y={top} width={14} height={12} fill={BIZ} />
          ))}
        </>
      );
      break;
    default: // supplier: warehouse with arched roof
      top = g - 56;
      shape = (
        <>
          <path d={`M${x - 36} ${g} V${top + 22} Q${x} ${top - 10} ${x + 36} ${top + 22} V${g} Z`} fill={BIZ} />
          <rect x={x - 12} y={g - 26} width={24} height={26} rx={2} fill="var(--foreground)" opacity={0.7} />
        </>
      );
  }
  return (
    <g>
      <title>{`${b.name} (${KIND_LABEL[b.kind]})`}</title>
      {shape}
      <circle cx={x} cy={g - 12} r={9} fill="var(--sand)" />
      <text x={x} y={g - 7} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--foreground)">{KIND_LETTER[b.kind]}</text>
      {name.map((line, i) => (
        <text key={i} x={x} y={top - 10 - (name.length - 1 - i) * 17} textAnchor="middle" fontSize={14} fontWeight={700} fill={INK}>{line}</text>
      ))}
    </g>
  );
}
