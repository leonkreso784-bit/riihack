// Karta grada: čiste pomoćne funkcije i javni profil hotela.
// Za tuđe hotele prikazujemo samo ono što API stvarno daje (ljestvica, grad, predložak hotela).
// Cijena, ocjene, popunjenost i financije tuđih hotela dolaze tek kad stigne Leonov javni profil (L14): `detail`.
import { HOTELS } from "@/content";
import type {
  CompanyPublicView, BusinessKind, HotelTemplate, StaffDepartment, CityBusiness, LeaderboardRow, MeResponse, Metrics } from "./types";

export type ProfileMonth = { round: number; revenue: number; costs: number; nights: number; occupancyPct: number };

// Javni profil tuđeg hotela (L14, CompanyPublicView iz types.ts): GET /api/world/[worldId]/companies.

// Detalji (cijena, ocjene, popunjenost): za tvoj hotel puni (s financijama), za tuđe samo iz javnog profila.
export type ProfileDetail = {
  price: number;
  reviews: number;
  guests: number;
  occupancyPct: number | null; // zadnji obračunati mjesec
  metrics: Metrics | null; // samo tvoj hotel
  share: number | null; // samo tvoj hotel
  months: ProfileMonth[] | null; // samo tvoj hotel (financije zatvorenih mjeseci)
  publicFinances: PublicMonth[] | null; // prihod i dobit zatvorenih mjeseci, najstariji prvi (javno, ADR-040)
};
export type PublicMonth = { round: number; revenue: number; profit: number };

export type PublicProfile = {
  id: string;
  name: string;
  student: string;
  place: string;
  stars: number | null; // null = nepoznat predložak
  rooms: number | null;
  staff: number | null;
  staffByDept: Partial<Record<StaffDepartment, number>>;
  cash: number | null; // samo tvoj hotel (ADR-040): tuđi novac se ne prikazuje
  startCash: number | null; // samo tvoj hotel
  progress: number;
  roundGain: number;
  closedRound: number;
  rank: number; // rang po napretku na ljestvici (1 = najbolji)
  partners: { name: string; kind: BusinessKind }[];
  simId: string;
  isYou: boolean;
  detail: ProfileDetail | null;
};

export const MONTHS = ["lipanj", "srpanj", "kolovoz", "rujan", "listopad", "studeni"];
export const monthName = (round: number) => MONTHS[(round - 1) % MONTHS.length];

// ---- izometrijska karta (smjer D, "društvena igra") ----
// Teren je mreža GRID x GRID polja: . more, s pijesak, g trava, h/H brdo (terase), p mol.
export const GRID = 18;
export const TERRAIN_ROWS = [
  "..................",
  ".....ssss.........",
  "...sgghhhhggss....",
  "..sgghHHHhgggss...",
  "..sggghHHhggsss...",
  ".sgggghhhgggsss...",
  ".sggggggggggsss...",
  ".sggggggggggss....",
  ".ssggggggggs......",
  "..ssggggp..gss....",
  "...sggggp..ss.....",
  "........p.........",
  "..sgggs...sggss...",
  ".sggggss..sgggss..",
  ".sgggggss.sgggggs.",
  "..sggggss..sgggss.",
  "...sssss...ssss...",
  "..................",
];
export const terrainCell = (x: number, y: number) => (x < 0 || y < 0 || x >= GRID || y >= GRID ? "." : (TERRAIN_ROWS[y]?.[x] ?? "."));

export type DistrictId = "luka" | "setnica" | "plaza" | "brdo" | "ana" | "otok";
export type Slot = [number, number]; // središte hotela u koordinatama polja (zgrada zauzima +-HOTEL_HALF)
export const HOTEL_HALF = 0.66;
export const DISTRICTS: { id: DistrictId; name: string; anchor: Slot; slots: Slot[] }[] = [
  { id: "luka", name: "Stara luka", anchor: [8, 8], slots: [[8, 8], [8, 6.5], [9.5, 8], [6.5, 7], [9.5, 6.5], [6, 10]] },
  { id: "setnica", name: "Šetnica", anchor: [3.5, 7.5], slots: [[3.5, 7.5], [2, 7.5], [3.5, 9], [4, 6], [5.5, 5.5], [4, 4.5]] },
  { id: "plaza", name: "Plaža Zlatna", anchor: [12.5, 5], slots: [[12.5, 5], [11, 5], [12.5, 6.5], [14, 5], [12, 3.5], [11, 6.5], [12, 10]] },
  { id: "brdo", name: "Brdo", anchor: [8, 3.5], slots: [[8, 3.5], [6.5, 3.5], [8, 2], [8, 5], [9.5, 4], [6.5, 2], [5, 3]] },
  { id: "ana", name: "Otok Sveta Ana", anchor: [4.5, 14], slots: [[4.5, 14], [3, 14], [6, 14]] },
  { id: "otok", name: "Mali otok", anchor: [13, 14], slots: [[13, 14], [11.5, 14], [14.5, 15]] },
];
export const districtById = (id: DistrictId) => DISTRICTS.find((d) => d.id === id)!;
export const SLOT_CAPACITY = DISTRICTS.reduce((n, d) => n + d.slots.length, 0);

const PLACE_DISTRICT: [string, DistrictId][] = [["Rijeka", "luka"], ["Opatija", "setnica"], ["Crikvenica", "plaza"], ["Mali Lošinj", "ana"], ["Rab", "otok"], ["Omišalj", "brdo"], ["Krk", "brdo"]];
export function districtOfPlace(place: string): DistrictId {
  return PLACE_DISTRICT.find(([k]) => place === k || place.startsWith(k))?.[1] ?? "luka";
}

export type Lot = { slot: Slot; district: DistrictId };
const dist = (a: Slot, b: Slot) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Hotelima se parcele dodjeljuju stabilno (po companyId, ne po poretku ljestvice): svaki ide u okrug svog mjesta,
// a kad je okrug pun, u najbliži okrug sa slobodnim mjestom. Preko kapaciteta parcele se ponavljaju s pomakom.
export function allocateLots(hotels: { companyId: string; place: string }[]): Record<string, Lot> {
  const used = new Map<DistrictId, number>(DISTRICTS.map((d) => [d.id, 0]));
  const out: Record<string, Lot> = {};
  const sorted = [...hotels].sort((a, b) => (a.companyId < b.companyId ? -1 : a.companyId > b.companyId ? 1 : 0));
  sorted.forEach((h, i) => {
    const want = districtById(districtOfPlace(h.place));
    const free = DISTRICTS.filter((d) => (used.get(d.id) ?? 0) < d.slots.length).sort((a, b) => dist(a.anchor, want.anchor) - dist(b.anchor, want.anchor));
    const d = free.includes(want) ? want : free[0];
    if (!d) {
      const wrap = DISTRICTS[i % DISTRICTS.length];
      const base = wrap.slots[Math.floor(i / DISTRICTS.length) % wrap.slots.length];
      out[h.companyId] = { slot: [base[0] + 0.35, base[1] + 0.35], district: wrap.id };
      return;
    }
    const n = used.get(d.id) ?? 0;
    used.set(d.id, n + 1);
    out[h.companyId] = { slot: d.slots[n], district: d.id };
  });
  return out;
}

// Gradske tvrtke imaju fiksne parcele po ključnoj riječi iz id-a/imena (pravi sadržaj: agencija-adria; mock: b-adria).
export const BIZ_LOTS: [string, Slot][] = [
  ["adria", [7.5, 9.5]],
  ["ucka", [2.5, 5.5]],
  ["praonica", [5.5, 8.5]],
  ["pekara", [9.5, 2.5]],
  ["zastita", [11.5, 8.5]],
  ["vinarija", [7.5, 14.5]],
];
export const BIZ_EXTRA_LOTS: Slot[] = [[13.5, 2.5], [3.5, 2.5], [13.5, 9.5], [15.5, 13.5]];
export function businessLots(bs: Pick<CityBusiness, "id" | "name">[]): Record<string, Slot> {
  const out: Record<string, Slot> = {};
  let extra = 0;
  for (const b of bs) {
    const id = `${b.id} ${b.name}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const hit = BIZ_LOTS.find(([k]) => id.includes(k));
    out[b.id] = hit ? hit[1] : BIZ_EXTRA_LOTS[extra++ % BIZ_EXTRA_LOTS.length];
  }
  return out;
}

// Visina zgrade iz javnog napretka, u odnosu na najnapredniji hotel grada (ADR-040: bez novca).
export const HOTEL_H_MIN = 34;
export const HOTEL_H_MAX = 90;
export function hotelHeight(progress: number, maxProgress: number): number {
  if (progress <= 0 || maxProgress <= 0) return HOTEL_H_MIN;
  return Math.round(HOTEL_H_MIN + (HOTEL_H_MAX - HOTEL_H_MIN) * Math.min(1, progress / maxProgress));
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

// Bonitet tuđeg hotela samo iz javnih podataka (prihod i dobit zatvorenih mjeseci).
export function publicBonitet(months: PublicMonth[]): Bonitet {
  const last = months.at(-1);
  if (!last) return { grade: "–", text: "Još nema zatvorenog mjeseca", tone: "none" };
  const prev = months.length > 1 ? months.at(-2)! : null;
  if (last.profit > 0 && (!prev || last.profit >= prev.profit)) return { grade: "A", text: "Dobro: posluje s dobiti, dobit raste", tone: "up" };
  if (last.profit > 0) return { grade: "B", text: "Srednje: dobit, ali manja nego prošli mjesec", tone: "warn" };
  return { grade: "C", text: "Niže: posluje s gubitkom", tone: "down" };
}

// Rang po napretku na ljestvici (1 = najbolji); isti napredak razrješava naziv hotela.
export function rank(id: string, rows: { id: string; progress: number; hotelName: string }[]): number {
  const sorted = [...rows].sort((a, b) => b.progress - a.progress || a.hotelName.localeCompare(b.hotelName, "hr"));
  return sorted.findIndex((p) => p.id === id) + 1;
}

export const simId = (index: number) => `SIM-${String(index + 1).padStart(4, "0")}`;

// ---- profili ----
// Predložak hotela: po templateId, inače po mjestu (jedan predložak po mjestu).
function templateFor(templateId: string | undefined, place: string): HotelTemplate | undefined {
  return HOTELS.find((t) => t.id === templateId) ?? HOTELS.find((t) => t.place === place || t.place.startsWith(place) || place.startsWith(t.place));
}
const staffInfo = (t?: HotelTemplate) => {
  const by: Partial<Record<StaffDepartment, number>> = {};
  for (const m of t?.staff ?? []) by[m.department] = (by[m.department] ?? 0) + 1;
  return { staff: t ? t.staff.length : null, staffByDept: by };
};

export function profilesFromMe(me: MeResponse, publicViews: Record<string, CompanyPublicView> = {}): Record<string, PublicProfile> {
  const out: Record<string, PublicProfile> = {};
  const bizById = new Map(me.city.businesses.map((b) => [b.id, b]));
  const partnersOf = (id: string) =>
    me.city.links
      .filter((l) => l.companyId === id)
      .flatMap((l) => {
        const b = bizById.get(l.businessId);
        return b ? [{ name: b.name, kind: b.kind }] : [];
      });
  const rows = me.city.hotels.map((h) => ({ id: h.companyId, progress: h.progress, hotelName: h.hotelName }));
  const rankOf = (id: string) => rank(id, rows);

  me.city.hotels.forEach((row, i) => {
    out[row.companyId] = row.companyId === me.company.id ? ownProfile(me, i, partnersOf(row.companyId), rankOf(row.companyId)) : otherProfile(row, i, partnersOf(row.companyId), rankOf(row.companyId), publicViews[row.companyId]);
  });
  if (!out[me.company.id]) out[me.company.id] = ownProfile(me, me.city.hotels.length, partnersOf(me.company.id), 0);
  return out;
}

function otherProfile(row: LeaderboardRow, index: number, partners: PublicProfile["partners"], rankNo: number, pub?: CompanyPublicView): PublicProfile {
  const tpl = templateFor(undefined, row.place);
  const staff = pub ? { staff: Object.values(pub.staffByDepartment).reduce((a, n) => a + n, 0), staffByDept: Object.fromEntries(Object.entries(pub.staffByDepartment).filter(([, n]) => n > 0)) as PublicProfile["staffByDept"] } : staffInfo(tpl);
  return {
    id: row.companyId,
    name: row.hotelName,
    student: row.playerName,
    place: row.place,
    stars: pub?.stars ?? tpl?.stars ?? null,
    rooms: pub?.roomsCount ?? tpl?.rooms.length ?? null,
    ...staff,
    cash: null,
    startCash: null,
    progress: row.progress,
    roundGain: row.roundGain,
    closedRound: row.closedRound,
    rank: rankNo,
    partners,
    simId: simId(index),
    isYou: false,
    detail: pub ? { price: pub.price, reviews: pub.reviews, guests: pub.guests, occupancyPct: pub.occupancyPct ?? null, metrics: null, share: null, months: null, publicFinances: pub.finances ?? [] } : null,
  };
}

function ownProfile(me: MeResponse, index: number, linked: PublicProfile["partners"], rankNo: number): PublicProfile {
  const c = me.company;
  const partners = [...linked];
  for (const k of me.contracts) if (k.status === "accepted" && !partners.some((p) => p.name === k.businessName)) partners.push({ name: k.businessName, kind: k.businessKind });
  const mine = me.city.hotels.find((h) => h.companyId === c.id) ?? me.leaderboard.find((h) => h.companyId === c.id);
  return {
    id: c.id,
    name: c.hotelName,
    student: c.playerName,
    place: c.place,
    stars: c.stars,
    rooms: c.roomsCount,
    ...staffInfo(templateFor(c.templateId, c.place)),
    cash: c.cash,
    startCash: c.startCash,
    progress: mine?.progress ?? 0,
    roundGain: mine?.roundGain ?? 0,
    closedRound: mine?.closedRound ?? 0,
    rank: rankNo,
    partners,
    simId: simId(index),
    isYou: true,
    detail: {
      price: me.plan.price,
      reviews: c.metrics.reviews,
      guests: c.metrics.guests,
      occupancyPct: me.finances.at(-1)?.occupancyPct ?? null,
      metrics: c.metrics,
      share: me.finances.at(-1)?.marketSharePct ?? 0,
      months: me.finances.map((f) => ({ round: f.round, revenue: f.revenue, costs: f.costs, nights: f.nights, occupancyPct: f.occupancyPct })),
      publicFinances: null,
    },
  };
}
