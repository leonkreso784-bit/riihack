// Samo za razvoj u mock načinu (NEXT_PUBLIC_USE_MOCK=1): ?n=12 dopunjuje grad izmišljenim hotelima da se vidi kako se karta
// prilagođava veličini. U pravom načinu rada se nikad ne poziva.
import type { LeaderboardRow, MeResponse } from "@/lib/types";

const PLACES = ["Rijeka", "Opatija", "Crikvenica", "Mali Lošinj", "Rab", "Omišalj", "Krk"];
const NAMES = ["Hotel Bura", "Villa Maestral", "Kuća Jadran", "Hotel Palma Marina", "Pansion Galeb", "Hotel Zlatni Zalazak Kvarner", "Villa Sunce", "Hotel Učka", "Rooms Mare", "Hotel Tramontana", "Villa Lanterna", "Pansion Škoj"];

export function padHotels(me: MeResponse, n: number): MeResponse {
  const have = [...me.city.hotels.filter((h) => h.companyId === me.company.id), ...me.city.hotels.filter((h) => h.companyId !== me.company.id)];
  if (n <= have.length) return { ...me, city: { ...me.city, hotels: have.slice(0, Math.max(1, n)) } };
  const extra: LeaderboardRow[] = Array.from({ length: n - have.length }, (_, i) => ({
    companyId: `dev-${String(i).padStart(2, "0")}`,
    hotelName: `${NAMES[i % NAMES.length]}${i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : ""}`,
    playerName: `Igrač ${i + 1}`,
    place: PLACES[i % PLACES.length],
    progress: ((i * 7) % 15) - 2,
    closedRound: 1,
    cash: 20000 + i * 300,
    roundGain: (i % 5) - 1,
    ...(i % 4 === 3 ? { isBot: true } : {}),
  }));
  return { ...me, city: { ...me.city, hotels: [...have, ...extra] } };
}
