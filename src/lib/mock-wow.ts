// Fake data for the city map, news feed and skill radar (S5). Prefixed exports keep a later merge with other mock-wow.ts files trivial.
import type { CityBusiness, CityView, LeaderboardRow, NewsItem, Skill } from "./types";

type Hotel = LeaderboardRow & { roundGain: number };

const hotel = (id: string, hotelName: string, playerName: string, place: string, progress: number, cash: number, closedRound: number, roundGain: number): Hotel => ({
  companyId: id, hotelName, playerName, place, progress, closedRound, cash, roundGain,
});

export const MOCK_CITY_HOTELS: Hotel[] = [
  hotel("c-luka", "Vila Kvarner", "Luka", "Lovran", 6.1, 22400, 2, 2.3),
  hotel("c-ana", "Hotel Đurđica", "Ana", "Opatija", 4.2, 18450, 1, 1.1),
  hotel("c-petra", "Hostel Korzo", "Petra", "Rijeka", 3.8, 19900, 2, 0.4),
  hotel("c-dominik", "Hotel Bellevue Ičići", "Dominik", "Ičići", -1.4, 16100, 1, -0.9),
  hotel("c-ema", "Apartmani i sobe Kostrena uz more", "Ema", "Kostrena", 0, 20000, 0, 0),
];

export const MOCK_CITY_BUSINESSES: CityBusiness[] = [
  { id: "b-kvarner", name: "Agencija Kvarner Tours", kind: "agency", description: "Grupe turista iz regije." },
  { id: "b-bijela", name: "Praonica Bijela Vala", kind: "laundry", description: "Posteljina i ručnici." },
  { id: "b-kruscic", name: "Pekara Kruščić", kind: "bakery", description: "Svježe pecivo." },
  { id: "b-zastita", name: "Zaštita Rijeka", kind: "security", description: "Noćni čuvari." },
  { id: "b-trlaja", name: "Vinarija Trlaja", kind: "supplier", description: "Vino za restoran." },
];

export const MOCK_CITY_VIEW: CityView = {
  businesses: MOCK_CITY_BUSINESSES,
  hotels: MOCK_CITY_HOTELS,
  links: [
    { companyId: "c-petra", businessId: "b-kvarner" },
    { companyId: "c-ana", businessId: "b-kruscic" },
  ],
};

export const MOCK_NEWS: NewsItem[] = [
  { at: "2026-10-24T14:29:00.000Z", text: "Vila Kvarner spustila cijenu na 79 € i napunila 92 % soba." },
  { at: "2026-10-24T14:21:00.000Z", text: "Hostel Korzo potpisao ugovor s Agencijom Kvarner Tours." },
  { at: "2026-10-24T14:12:00.000Z", text: "Val vrućine: gosti traže klimu, kvarovi skuplji." },
  { at: "2026-10-24T14:03:00.000Z", text: "Hotel Bellevue Ičići ostao bez dvoje konobara." },
];

// Skill scores 0 to 100. Used by SkillRadar, which shows an "primjer" label while it gets exactly these objects.
export const MOCK_CLASS_SKILLS: Record<Skill, number> = { empathy: 62, communication: 58, finance: 45, problemSolving: 55, ethics: 70 };
export const MOCK_STUDENT_SKILLS: Record<Skill, number> = { empathy: 78, communication: 52, finance: 36, problemSolving: 66, ethics: 74 };
