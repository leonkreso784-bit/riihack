// Simulacija sezone s botovima (ADR-059, #198). Bez baze i bez mreže: pokreće čiste funkcije motora kao zatvaranje
// mjeseca u igri i ispisuje maržu, popunjenost i ljestvicu. Pokretanje: npx tsx scripts/sim-sezona.ts
// Cilj kalibracije: marža (dobit / prihod bez PDV-a) oko 11 do 31 % (GOP stvarnih kvarnerskih hotela), ljetna popunjenost
// u razumnom rasponu, a nijedna jednostavna strategija (ulaganje u sve, najveći marketing, najviša cijena, stečaj) ne pobjeđuje.
import { HOTELS } from "../src/content";
import { BOT_LEVELS, type BotLevel } from "../src/lib/game/bots";
import { avg, seasonMarginPct, simulateSeason, type SimHotel, type SimOverride, type SimResult } from "../src/lib/game/season-sim";
import { rankByProgress } from "../src/lib/ranking";
import { CLICK_QUALITY_CAP, DEMAND_ELASTICITY_PCT, INVEST_EFFECT_DIVISOR, MARKETING_MAX, ROUND_LABELS } from "../src/lib/rules";

const pad = (s: string | number, n: number) => String(s).padStart(n);
const left = (s: string | number, n: number) => String(s).padEnd(n);
const pct = (n: number) => `${n.toFixed(1)} %`;
const money = (n: number) => `${n < 0 ? "-" : ""}${Math.abs(n).toLocaleString("hr-HR")}`;

console.log(`Pravila: CLICK_QUALITY_CAP ${CLICK_QUALITY_CAP}, INVEST_EFFECT_DIVISOR ${INVEST_EFFECT_DIVISOR}, MARKETING_MAX ${MARKETING_MAX}, elastičnost ${DEMAND_ELASTICITY_PCT} %`);
console.log(`Mjeseci: ${ROUND_LABELS.join(", ")}. Marža = dobit / prihod bez PDV-a. Sjeme fiksno, pa je ispis svaki put isti.\n`);

function city(level: (i: number) => BotLevel, overrides: Record<number, SimOverride> = {}): SimHotel[] {
  return HOTELS.map((template, i) => ({ template, level: level(i), override: overrides[i] }));
}

function table(title: string, r: SimResult) {
  console.log(title);
  console.log(`${left("Hotel", 18)} ${left("Razina", 8)} ${ROUND_LABELS.map((m) => pad(`${m} pop/marža`, 20)).join("")} ${pad("Dobit sezone", 13)} ${pad("Račun", 9)} ${pad("Napredak", 9)}`);
  for (const h of r.hotels) {
    const cells = h.months.map((m) => pad(`${m.occupancyPct} % / ${m.marginPct.toFixed(0)} %`, 20)).join("");
    const profit = h.months.reduce((s, m) => s + m.profit, 0);
    console.log(`${left(`${h.hotelName} ${h.stars}*`, 18)} ${left(h.level, 8)} ${cells} ${pad(money(profit), 13)} ${pad(money(h.cash), 9)} ${pad(h.progress, 9)}`);
  }
  const perMonth = ROUND_LABELS.map((m, k) => {
    const ms = r.hotels.map((h) => h.months[k]);
    return `${m}: popunjenost ${avg(ms.map((x) => x.occupancyPct))} %, marža ${avg(ms.map((x) => x.marginPct))} % (od ${Math.min(...ms.map((x) => x.marginPct)).toFixed(0)} do ${Math.max(...ms.map((x) => x.marginPct)).toFixed(0)})`;
  });
  console.log(perMonth.map((l) => `  ${l}`).join("\n"));
  const totalProfit = r.hotels.flatMap((h) => h.months).reduce((s, m) => s + m.profit, 0);
  console.log(`  Sezona: marža ${pct(seasonMarginPct(r.hotels))}, prosječna dobit po hotelu ${money(Math.round(totalProfit / r.hotels.length))} €`);
  console.log(`  Ljestvica: ${r.ranking.map((h, i) => `${i + 1}. ${h.hotelName} (${h.progress})`).join(", ")}`);
  console.log("");
}

// 1) Tri težine, po jedan grad od 6 botova iste težine.
for (const level of BOT_LEVELS) table(`== Grad od 6 botova, težina: ${level} ==`, simulateSeason(city(() => level)));

// 2) Mješoviti grad: po 2 bota svake težine (težina po hotelu rotira, da hotel ne odlučuje).
const mixed = simulateSeason(city((i) => BOT_LEVELS[i % 3]));
table("== Mješoviti grad (lako, srednje, teško, lako, srednje, teško) ==", mixed);
const byLevel = BOT_LEVELS.map((l) => `${l} ${avg(mixed.hotels.filter((h) => h.level === l).map((h) => h.progress))}`);
console.log(`Prosječan napredak po težini: ${byLevel.join(", ")}\n`);

// 3) Jednostavne strategije igrača (hotel 0, Rijeka) u gradu srednjih botova: smije li išta od toga pobijediti?
const strategies: [string, SimOverride | undefined][] = [
  ["kao srednji bot (kontrola)", undefined],
  ["klik na najbolje + ulaganje u svih 5 odjela, svaki mjesec", { investments: { reception: 3000, housekeeping: 3000, kitchen: 3000, maintenance: 3000, management: 3000 } }],
  ["marketing na najviše svaki mjesec", { marketing: MARKETING_MAX }],
  ["najviša cijena (400 €)", { priceFactor: 100 }],
  ["stečaj: cijena 30 €, marketing i ulaganja na najviše", { priceFactor: 0.01, marketing: MARKETING_MAX, investments: { reception: 3000, housekeeping: 3000, kitchen: 3000, maintenance: 3000, management: 3000 } }],
  ["stečaj + dobri odgovori: kvaliteta 5, cijena 30 €, marketing i ulaganja na najviše", { writtenQuality: 5, priceFactor: 0.01, marketing: MARKETING_MAX, investments: { reception: 3000, housekeeping: 3000, kitchen: 3000, maintenance: 3000, management: 3000 } }],
  ["ne odgovara na situacije", { skipAnswers: true }],
  ["piše odgovore kvalitete 4", { writtenQuality: 4 }],
  ["piše odgovore kvalitete 5", { writtenQuality: 5 }],
];
// Isto za tri različita hotela: ulaganje u svih 5 odjela ne smije biti dominantno ni za hotel s velikom dobiti (Opatija 4*).
for (const idx of [0, 1, 4]) {
  const player = HOTELS[idx];
  console.log(`== Strategije igrača (${player.place} ${player.stars}*) u gradu od 5 srednjih botova ==`);
  console.log(`${left("Strategija", 62)} ${pad("Napredak", 9)} ${pad("Račun", 9)} ${pad("Rang bez", 9)} ${pad("Rang s", 8)}`);
  for (const [name, override] of strategies) {
    const r = simulateSeason(city(() => "srednje", override ? { [idx]: override } : {}));
    const me = r.hotels[idx];
    const rankOf = (rows: typeof r.hotels) => rows.findIndex((h) => h.companyId === me.companyId) + 1;
    console.log(`${left(name, 62)} ${pad(me.progress, 9)} ${pad(money(me.cash), 9)} ${pad(rankOf(r.naiveRanking), 9)} ${pad(rankOf(rankByProgress(r.hotels)), 8)}`);
  }
  console.log("");
}
console.log("(Rang bez = samo po napretku; Rang s = solventni prije insolventnih, ADR-059.)\n");

// 4) Svi hoteli istodobno dižu cijenu (gradski plan "skuplje je bolje"): ukupna potražnja smije malo pasti, ne ostati ista.
console.log("== Svi hoteli dižu cijenu na isti množitelj referentne cijene (6 srednjih botova) ==");
console.log(`${left("Množitelj", 10)} ${pad("Popunjenost", 12)} ${pad("Dobit po hotelu", 16)} ${pad("Marža sezone", 13)}`);
for (const f of [1, 1.3, 1.6, 2]) {
  const r = simulateSeason(city(() => "srednje", Object.fromEntries(HOTELS.map((_, i) => [i, { priceFactor: f }]))));
  const occ = avg(r.hotels.flatMap((h) => h.months.map((m) => m.occupancyPct)));
  const profit = Math.round(r.hotels.flatMap((h) => h.months).reduce((s, m) => s + m.profit, 0) / r.hotels.length);
  console.log(`${left(`${f}x`, 10)} ${pad(`${occ} %`, 12)} ${pad(`${money(profit)} €`, 16)} ${pad(pct(seasonMarginPct(r.hotels)), 13)}`);
}
