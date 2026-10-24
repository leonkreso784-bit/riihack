// Fake data for the UI while API routes are not ready (default; NEXT_PUBLIC_USE_MOCK=0 turns it off). Shapes follow src/lib/types.ts.
import { HOTELS } from "@/content";
import { DEPARTMENT_METRIC, STAFF_DEPARTMENT_LABELS } from "./rules";
import type {
  DepartmentView,
  StaffDepartment,
  CityView,
  CompanyDetailResponse,
  CompanyView,
  ContractView,
  DispatchView,
  LeaderboardRow,
  MeResponse,
  Metrics,
  NewsItem,
  SituationDraft,
  ProfStateResponse,
  Room,
  RoomStatus,
  RoomType,
  RoundFinance,
  RoundReportView,
  SituationSummary,
  SituationView,
  WorldView,
} from "./types";

const START: Metrics = { guests: 55, reviews: 60, staff: 45, operations: 50, finance: 40 }; // = 250
const AFTER_JUNE: Metrics = { guests: 58, reviews: 62, staff: 43, operations: 52, finance: 45 };

// 16 rooms on 2 floors: 9 occupied, 4 free, 2 cleaning, 1 broken (204).
const ROOM_ROWS: [string, RoomType, number, Room["view"], number, RoomStatus, string?][] = [
  ["101", "single", 1, "ulica", 62, "occupied"],
  ["102", "single", 1, "ulica", 62, "free"],
  ["103", "double", 2, "park", 82, "occupied"],
  ["104", "double", 2, "park", 82, "occupied"],
  ["105", "double", 2, "more", 95, "cleaning"],
  ["106", "family", 4, "park", 120, "occupied"],
  ["107", "family", 4, "more", 135, "free"],
  ["108", "single", 1, "ulica", 62, "occupied"],
  ["201", "double", 2, "more", 95, "occupied"],
  ["202", "double", 2, "more", 95, "occupied"],
  ["203", "double", 2, "park", 82, "free"],
  ["204", "suite", 2, "more", 180, "broken", "Klima ne radi od jutros."],
  ["205", "suite", 2, "more", 180, "occupied"],
  ["206", "double", 2, "park", 82, "cleaning"],
  ["207", "family", 4, "park", 120, "occupied"],
  ["208", "single", 1, "ulica", 62, "free"],
];

export const MOCK_ROOMS: Room[] = ROOM_ROWS.map(([number, type, beds, view, basePrice, status, note]) => ({
  id: `room-${number}`,
  number,
  floor: Number(number[0]),
  type,
  beds,
  view,
  basePrice,
  status,
  ...(note && { note }),
}));

const WORLD: WorldView = {
  id: "w-demo",
  name: "Demo Simpolis",
  round: 2,
  maxRounds: 4,
  status: "running",
  roundDeadline: "2026-10-24T14:40:00.000Z",
  serverNow: "2026-10-24T14:30:00.000Z",
};

const COMPANY: CompanyView = {
  id: "c-ana",
  hotelName: "Vila Ana",
  playerName: "Ana Kovač",
  templateId: "rijeka-centar",
  place: "Rijeka",
  stars: 3,
  roomsCount: MOCK_ROOMS.length,
  startMetrics: START,
  metrics: AFTER_JUNE,
  progress: 10,
  closedRound: 1,
  cash: 38700,
  startCash: 20000,
};

const LEADERBOARD: LeaderboardRow[] = [
  { companyId: "c-marko", hotelName: "Hotel Lungomare", playerName: "Marko Babić", place: "Opatija", progress: 14, closedRound: 1, cash: 41200, roundGain: 5 },
  { companyId: "c-ana", hotelName: COMPANY.hotelName, playerName: COMPANY.playerName, place: COMPANY.place, progress: COMPANY.progress, closedRound: 1, cash: COMPANY.cash, roundGain: 4 },
  { companyId: "c-lucija", hotelName: "Kuća Lucija", playerName: "Lucija Perić", place: "Omišalj", progress: 6, closedRound: 1, cash: 29400, roundGain: 2 },
  { companyId: "c-ivan", hotelName: "Hotel Kvarner", playerName: "Ivan Jurić", place: "Crikvenica", progress: 2, closedRound: 1, cash: 24100, roundGain: -1 },
  { companyId: "c-petra", hotelName: "Villa Petra", playerName: "Petra Novak", place: "Mali Lošinj", progress: -3, closedRound: 0, cash: 17800, roundGain: -3 },
];

const SITUATIONS: SituationView[] = [
  {
    id: "s-klima",
    templateId: "kvar-klime",
    round: 2,
    title: "Klima ne radi u apartmanu",
    text: "Gost u sobi 204 zove recepciju treći put. Klima ne radi od jutros, vani je 34 °C, a sutra ima poslovni sastanak u hotelu.",
    area: "Smještaj",
    difficulty: 3,
    roomNumber: "204",
    character: { name: "Goran Šimić", role: "Gost, poslovni put" },
    options: [
      { id: "o1", text: "Ispričajte se i obećajte da će majstor doći sutra ujutro." },
      { id: "o2", text: "Odmah ponudite drugi apartman s pogledom na more i besplatan doručak." },
      { id: "o3", text: "Pošaljite ventilator u sobu i zabilježite pritužbu." },
    ],
    state: "open",
    transcript: [
      { role: "character", text: "Ovo je treći put da zovem. Sutra imam važan sastanak, a ovdje se ne može disati." },
    ],
  },
  {
    // No offered answers (the professor's kind): only talking and answering in your own words.
    id: "s-recenzija",
    templateId: "losa-recenzija",
    round: 2,
    title: "Loša recenzija na Bookingu",
    text: "Gošća je jutros napisala da je doručak bio hladan i da je osoblje bilo neljubazno. Recenzija je prva koju novi gosti vide.",
    area: "Ugled",
    difficulty: 2,
    character: { name: "Sanja Horvat", role: "Gošća, obiteljski odmor" },
    options: [],
    state: "open",
    transcript: [{ role: "character", text: "Došli smo na odmor, a ne da čekamo hladna jaja i namrgođeno lice." }],
  },
  {
    id: "s-povisica",
    templateId: "povisica",
    round: 2,
    title: "Kuharica traži povišicu",
    text: "Glavna kuharica kaže da je konkurencija u gradu zove s 20 % većom plaćom. Usred je sezone.",
    area: "Zaposlenici",
    difficulty: 4,
    character: { name: "Marija Vuković", role: "Glavna kuharica" },
    options: [
      { id: "o1", text: "Odbijte, plaće se ne mijenjaju usred sezone." },
      { id: "o2", text: "Ponudite bonus na kraju sezone i razgovor o plaći u listopadu." },
      { id: "o3", text: "Odmah joj podignite plaću za 20 %." },
    ],
    state: "answered",
    transcript: [],
    answer: {
      mode: "own",
      text: "Marija, vrijedite nam puno. Mogu vam odmah dati bonus za sezonu, a u listopadu sjednemo i dogovorimo novu plaću.",
      quality: 4,
      copied: false,
      verdict: {
        criteriaMet: ["c1", "c2", "c4", "c5"],
        reasoning: "Prepoznao si njezinu vrijednost i ponudio konkretan dogovor. Nisi provjerio koliko si bonus zapravo možeš priuštiti.",
      },
    },
  },
];

const REPORTS: RoundReportView[] = [
  {
    round: 1,
    metricsBefore: START,
    metricsAfter: AFTER_JUNE,
    mentorQuestion: "Zašto misliš da su zaposlenici pali u lipnju, iako su gosti bili zadovoljniji?",
  },
];

const CONTRACTS: ContractView[] = [
  {
    id: "k-adria",
    templateId: "adria-grupa",
    businessName: "Agencija Adria",
    businessKind: "agency",
    title: "Grupa iz Njemačke",
    text: "Agencija nudi 40 noćenja u srpnju po 70 € po noći. Sobe su vaše tek kad grupa dođe.",
    monthlyCost: 0,
    nights: 40,
    pricePerNight: 70,
    durationRounds: 1,
    roundOffered: 2,
    status: "offered",
  },
  {
    id: "k-pekara",
    templateId: "pekara-trsat",
    businessName: "Pekara Trsat",
    businessKind: "bakery",
    title: "Svježe pecivo za doručak",
    text: "Svako jutro svježe pecivo. Gosti to primijete.",
    monthlyCost: 900,
    nights: 0,
    pricePerNight: 0,
    durationRounds: 3,
    roundOffered: 1,
    status: "accepted",
    activeUntilRound: 3,
  },
];

// June: 16 rooms × 30 nights = 480; 340 market nights + 40 contract nights.
const FINANCES: RoundFinance[] = [
  {
    round: 1,
    nights: 340,
    contractNights: 40,
    capacityNights: 480,
    occupancyPct: 79,
    marketSharePct: 24,
    revenue: 31700,
    costs: 13000,
    profit: 18700,
    cashAfter: 38700,
  },
];

const CITY: CityView = {
  businesses: [
    { id: "b-adria", name: "Agencija Adria", kind: "agency", description: "Dovodi grupe turista iz Njemačke i Austrije." },
    { id: "b-ucka", name: "Agencija Učka Tours", kind: "agency", description: "Izleti i grupe iz regije." },
    { id: "b-praonica", name: "Praonica Kvarner", kind: "laundry", description: "Posteljina i ručnici za hotele." },
    { id: "b-pekara", name: "Pekara Trsat", kind: "bakery", description: "Svježe pecivo svako jutro." },
    { id: "b-zastita", name: "Zaštita Rijeka", kind: "security", description: "Noćni čuvari i video nadzor." },
    { id: "b-vinarija", name: "Vinarija Vrbnik", kind: "supplier", description: "Žlahtina za restoran i minibar." },
  ],
  hotels: LEADERBOARD,
  links: [
    { companyId: "c-ana", businessId: "b-pekara" },
    { companyId: "c-marko", businessId: "b-adria" },
  ],
};

const NEWS: NewsItem[] = [
  { at: "2026-10-24T14:29:00.000Z", text: "Počinje srpanj" },
  { at: "2026-10-24T14:28:00.000Z", text: "Lipanj: najpopunjeniji je Hotel Lungomare (86 %)" },
  { at: "2026-10-24T14:20:00.000Z", text: "Hotel Lungomare potpisao ugovor s Agencijom Adria" },
  { at: "2026-10-24T14:12:00.000Z", text: "Vila Ana potpisala ugovor s Pekarom Trsat" },
  { at: "2026-10-24T14:05:00.000Z", text: "Počinje lipanj" },
  { at: "2026-10-24T14:01:00.000Z", text: "Vila Ana otvara vrata u Rijeci" },
];

// Departments: metric from the department's key metric, people from the content hotel, a few warnings to show.
const ALERTS: Partial<Record<StaffDepartment, string[]>> = {
  housekeeping: ["Sobarica Ana je na bolovanju do kraja tjedna.", "Tri sobe čekaju čišćenje duže od dva sata."],
  maintenance: ["Klima u sobi 204 ne radi od jutros."],
  management: ["Zaposlenici su pali u lipnju: tim je umoran."],
};
const DEPARTMENTS: DepartmentView[] = (Object.keys(STAFF_DEPARTMENT_LABELS) as StaffDepartment[]).map((d) => ({
  department: d,
  label: STAFF_DEPARTMENT_LABELS[d],
  metric: DEPARTMENT_METRIC[d],
  metricValue: AFTER_JUNE[DEPARTMENT_METRIC[d]],
  staffCount: HOTELS[0].staff.filter((s) => s.department === d).length,
  alerts: ALERTS[d] ?? [],
  investment: d === "maintenance" ? 1000 : 0,
}));

export const MOCK_ME: MeResponse = {
  world: WORLD,
  company: COMPANY,
  situations: SITUATIONS,
  leaderboard: LEADERBOARD,
  reports: REPORTS,
  plan: { round: 2, price: 85, marketing: 1000, investments: { maintenance: 1000 } },
  contracts: CONTRACTS,
  finances: FINANCES,
  city: CITY,
  news: NEWS,
  departments: DEPARTMENTS,
};

// S8: professor's situation bank (mutable in memory so the mock createSituation / dispatch calls change the list).
const MOCK_BANK: SituationSummary[] = [
  { id: "overbooking", title: "Prekobukirana soba", area: "Gosti", difficulty: 3, source: "bank" },
  { id: "kvar-klime", title: "Klima ne radi usred srpnja", area: "Operativa", difficulty: 2, source: "bank" },
  { id: "custom-1", title: "Gost traži povrat novca za cijeli boravak", area: "Financije", difficulty: 4, source: "custom" },
];
const MOCK_DISPATCHES: DispatchView[] = [
  { id: "d-1", templateId: "custom-1", title: "Gost traži povrat novca za cijeli boravak", round: 3, companyIds: null, status: "scheduled" },
];

export const MOCK_PROF: ProfStateResponse = {
  world: { ...WORLD, joinCode: "KVRN26", maxPlayers: 24 },
  players: LEADERBOARD,
  city: CITY,
  news: NEWS,
  bank: MOCK_BANK,
  dispatches: MOCK_DISPATCHES,
  autoDraw: true,
};

export const MOCK_DETAIL: CompanyDetailResponse = { company: COMPANY, situations: SITUATIONS, reports: REPORTS };

// Staff of the first content hotel (same data the API serves for a real game).
export const MOCK_STAFF = HOTELS[0].staff;

// S8: sample draft for the mock AI suggestion and the mock playbook export.
export const MOCK_SAMPLE_DRAFT: SituationDraft = {
  title: "Gost se žali na buku iz bazena",
  text: "Gost iz sobe 312 zove recepciju u 23:30 jer se uz bazen još čuje glasna glazba i smijeh. Ima dijete koje ne može zaspati, a sutra rano putuje. Traži da se odmah nešto napravi.",
  area: "Gosti",
  difficulty: 3,
  character: { name: "Marko Horvat", role: "gost u sobi 312", personality: "umoran i nestrpljiv, ali pošten", goal: "dobiti mir za spavanje i priznanje problema" },
  rubric: [
    { id: "c1", text: "Ispriča se i pokaže razumijevanje za gosta", skill: "empathy" },
    { id: "c2", text: "Ponudi konkretno rješenje odmah (npr. opomena, druga soba)", skill: "problemSolving" },
    { id: "c3", text: "Jasno kaže što će se i kada dogoditi", skill: "communication" },
  ],
  options: [],
  effects: { guests: 3, reviews: 2 },
};
