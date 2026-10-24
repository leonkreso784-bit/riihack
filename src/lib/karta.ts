// Skica "Karta Kvarnera": čiste pomoćne funkcije i javni profil hotela.
// PublicProfile je PRIJEDLOG za Leonov ugovor (nije u types.ts): kad ruta GET /api/world/companies/[id]
// postoji, profilesFromMe se zamjenjuje pravim podacima. Do tada su podaci tuđih hotela UZORAK (polje `sample`).
import { HOTELS } from "@/content";
import type { BusinessKind, HotelTemplate, StaffDepartment, CityBusiness, LeaderboardRow, MeResponse, Metrics } from "./types";

export type ProfileMonth = { round: number; revenue: number; costs: number; nights: number; occupancyPct: number };
export type PublicProfile = {
  id: string;
  name: string;
  student: string;
  place: string;
  stars: number;
  rooms: number;
  staff: number; // pravi broj zaposlenih iz predloška hotela
  staffByDept: Partial<Record<StaffDepartment, number>>;
  metrics: Metrics;
  price: number; // cijena po noći iz plana tekućeg mjeseca
  cash: number;
  startCash: number;
  share: number; // tržišni udio %, zadnji zatvoreni mjesec
  months: ProfileMonth[]; // samo zatvoreni mjeseci
  partners: { name: string; kind: BusinessKind }[];
  simId: string;
  isYou: boolean;
  // true = vrijednost nije stvarna nego uzorak (API još ne daje javni profil tuđih hotela)
  sample: { profile: boolean; ratings: boolean; price: boolean; finance: boolean };
};

export type LatLng = [number, number];

export const MONTHS = ["lipanj", "srpanj", "kolovoz", "rujan", "listopad", "studeni"];
export const monthName = (round: number) => MONTHS[(round - 1) % MONTHS.length];

export const PLACES: Record<string, LatLng> = {
  Rijeka: [45.3271, 14.4422],
  Opatija: [45.3376, 14.3052],
  Omišalj: [45.211, 14.553],
  "Mali Lošinj": [44.531, 14.468],
  Crikvenica: [45.1765, 14.6925],
  Rab: [44.757, 14.76],
};

export function placeLatLng(place: string): LatLng {
  const key = Object.keys(PLACES).find((k) => place === k || place.startsWith(k));
  return PLACES[key ?? "Rijeka"];
}

// Hoteli u istom mjestu raspoređeni su u mali krug (~0,006°) po indeksu.
export function hotelPositions(hotels: { companyId: string; place: string }[]): Record<string, LatLng> {
  const byPlace = new Map<string, string[]>();
  for (const h of hotels) byPlace.set(placeLatLng(h.place).join(), [...(byPlace.get(placeLatLng(h.place).join()) ?? []), h.companyId]);
  const out: Record<string, LatLng> = {};
  for (const h of hotels) {
    const [lat, lng] = placeLatLng(h.place);
    const group = byPlace.get(`${lat},${lng}`) ?? [];
    const n = group.length;
    if (n < 2) {
      out[h.companyId] = [lat, lng];
      continue;
    }
    const a = (2 * Math.PI * group.indexOf(h.companyId)) / n;
    out[h.companyId] = [lat + 0.006 * Math.sin(a), lng + 0.009 * Math.cos(a)];
  }
  return out;
}

// Gradske tvrtke: ključ je dio id-a (pravi sadržaj: agencija-adria; mock: b-adria).
const BIZ_COORDS: [string, LatLng][] = [
  ["adria", [45.329, 14.437]],
  ["ucka", [45.288, 14.204]],
  ["praonica", [45.342, 14.4]],
  ["pekara", [45.333, 14.457]],
  ["zastita", [45.32, 14.465]],
  ["vinarija", [45.075, 14.674]],
];
export function businessLatLng(b: Pick<CityBusiness, "id" | "name">, index = 0): LatLng {
  const id = `${b.id} ${b.name}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const hit = BIZ_COORDS.find(([k]) => id.includes(k));
  if (hit) return hit[1];
  return [45.3271 + 0.01 * ((index % 3) - 1), 14.4422 + 0.012 * (Math.floor(index / 3) + 1)]; // nepoznata: blizu Rijeke
}

export const BIZ_META: Record<BusinessKind, { label: string; letter: string; nkd: string }> = {
  agency: { label: "turistička agencija", letter: "A", nkd: "79.12" },
  laundry: { label: "praonica rublja", letter: "P", nkd: "96.01" },
  bakery: { label: "pekara", letter: "B", nkd: "10.71" },
  security: { label: "zaštitarska tvrtka", letter: "Z", nkd: "80.10" },
  supplier: { label: "dobavljač", letter: "D", nkd: "11.02" },
};

// ---- formule (isto kao u odobrenoj skici) ----
const r1 = (n: number) => Math.round(n * 10) / 10;
export const score = (reviews: number) => r1(5 + reviews / 20); // ocjena gostiju /10
export const fmtDec = (n: number) => n.toFixed(1).replace(".", ",");
export const word = (s: number) => (s >= 9 ? "Izvanredno" : s >= 8 ? "Vrlo dobro" : s >= 7 ? "Dobro" : "Prihvatljivo");
export const reviewsCount = (nights: number) => Math.round(nights * 0.15);
export const profit = (m: { revenue: number; costs: number }) => m.revenue - m.costs;
export const inBlockade = (cash: number) => cash < 0;

// Rast prihoda zadnjeg mjeseca prema prošlom, u %; null kad nema dva zatvorena mjeseca.
export function growth(months: { revenue: number }[]): number | null {
  if (months.length < 2) return null;
  const [p, c] = months.slice(-2);
  return p.revenue > 0 ? Math.round(((c.revenue - p.revenue) / p.revenue) * 100) : null;
}

export type Bonitet = { grade: string; text: string; tone: "up" | "warn" | "down" | "none" };
export function bonitet(cash: number, startCash: number, lastProfit: number | null): Bonitet {
  if (inBlockade(cash)) return { grade: "D", text: "U blokadi: novac na računu ispod nule", tone: "down" };
  if (lastProfit === null) return { grade: "–", text: "Još nema zatvorenog mjeseca", tone: "none" };
  if (cash >= startCash * 1.2 && lastProfit > 0) return { grade: "A+", text: "Izvrsno: stabilan rast i rezerve", tone: "up" };
  if (cash >= startCash && lastProfit > 0) return { grade: "A", text: "Dobro: posluje s dobiti", tone: "up" };
  if (lastProfit > 0) return { grade: "B", text: "Srednje: dobit, ali niže rezerve", tone: "warn" };
  return { grade: "C", text: "Niže: posluje s gubitkom", tone: "down" };
}

// Rang po prihodu zadnjeg zatvorenog mjeseca (1 = najbolji); tvrtke bez mjeseca računaju se s 0.
export function rank(id: string, profiles: { id: string; months: { revenue: number }[] }[]): number {
  const rev = (p: { months: { revenue: number }[] }) => p.months.at(-1)?.revenue ?? 0;
  const sorted = [...profiles].sort((a, b) => rev(b) - rev(a));
  return sorted.findIndex((p) => p.id === id) + 1;
}

export const simId = (index: number) => `SIM-${String(index + 1).padStart(4, "0")}`;

// ---- profili ----
const hash = (s: string, salt = 0) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7 + salt * 131);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// Predložak hotela: po templateId, inače po mjestu (jedan predložak po mjestu).
function templateFor(templateId: string | undefined, place: string): HotelTemplate | undefined {
  return HOTELS.find((t) => t.id === templateId) ?? HOTELS.find((t) => t.place === place || t.place.startsWith(place) || place.startsWith(t.place));
}
const staffInfo = (t?: HotelTemplate, fallback = 0) => {
  const by: Partial<Record<StaffDepartment, number>> = {};
  for (const m of t?.staff ?? []) by[m.department] = (by[m.department] ?? 0) + 1;
  return { staff: t?.staff.length ?? fallback, staffByDept: by };
};

function sampleProfile(row: LeaderboardRow, index: number, startCash: number): PublicProfile {
  const h = (salt: number, mod: number) => hash(row.companyId, salt) % mod;
  const tpl = templateFor(undefined, row.place);
  const stars = tpl?.stars ?? 2 + h(1, 3);
  const rooms = tpl?.rooms.length ?? 10 + h(2, 9);
  const metric = (salt: number) => clamp(48 + h(salt, 26) + Math.round(row.progress * 1.5), 25, 95);
  const months: ProfileMonth[] = Array.from({ length: Math.max(row.closedRound, 0) }, (_, i) => {
    const occupancyPct = clamp(42 + h(3, 24) + i * 5 + Math.round(row.progress), 30, 92);
    const nights = Math.round((occupancyPct * rooms * 30) / 100);
    return { round: i + 1, revenue: 8000 + h(4, 5000) + stars * 1500 + i * 1800 + row.progress * 300, costs: 10000 + h(5, 3500) + stars * 700, nights, occupancyPct };
  });
  return {
    id: row.companyId,
    name: row.hotelName,
    student: row.playerName,
    place: row.place,
    stars,
    rooms,
    ...staffInfo(tpl, rooms),
    metrics: { guests: metric(6), reviews: metric(7), staff: metric(8), operations: metric(9), finance: metric(10) },
    price: 50 + stars * 14 + h(11, 20),
    cash: row.cash,
    startCash,
    share: 10 + h(12, 16),
    months,
    partners: [],
    simId: simId(index),
    isYou: false,
    sample: { profile: !tpl, ratings: true, price: true, finance: true },
  };
}

export function profilesFromMe(me: MeResponse): Record<string, PublicProfile> {
  const out: Record<string, PublicProfile> = {};
  const bizById = new Map(me.city.businesses.map((b) => [b.id, b]));
  const partnersOf = (id: string) =>
    me.city.links
      .filter((l) => l.companyId === id)
      .flatMap((l) => {
        const b = bizById.get(l.businessId);
        return b ? [{ name: b.name, kind: b.kind }] : [];
      });

  me.city.hotels.forEach((row, i) => {
    out[row.companyId] = row.companyId === me.company.id ? ownProfile(me, i, partnersOf(row.companyId)) : { ...sampleProfile(row, i, me.company.startCash), partners: partnersOf(row.companyId) };
  });
  if (!out[me.company.id]) out[me.company.id] = ownProfile(me, me.city.hotels.length, partnersOf(me.company.id));
  return out;
}

function ownProfile(me: MeResponse, index: number, linked: { name: string; kind: BusinessKind }[]): PublicProfile {
  const c = me.company;
  const partners = [...linked];
  for (const k of me.contracts) if (k.status === "accepted" && !partners.some((p) => p.name === k.businessName)) partners.push({ name: k.businessName, kind: k.businessKind });
  const share = me.finances.at(-1)?.marketSharePct ?? 0;
  return {
    id: c.id,
    name: c.hotelName,
    student: c.playerName,
    place: c.place,
    stars: c.stars,
    rooms: c.roomsCount,
    ...staffInfo(templateFor(c.templateId, c.place), c.roomsCount),
    metrics: c.metrics,
    price: me.plan.price,
    cash: c.cash,
    startCash: c.startCash,
    share,
    months: me.finances.map((f) => ({ round: f.round, revenue: f.revenue, costs: f.costs, nights: f.nights, occupancyPct: f.occupancyPct })),
    partners,
    simId: simId(index),
    isYou: true,
    sample: { profile: false, ratings: false, price: false, finance: false },
  };
}
