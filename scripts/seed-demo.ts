// Demo igra za obilazak žirija. Pokretanje: npm run seed:demo (traži DATABASE_URL u .env.local).
// Briše SAMO prijašnju demo igru (po kodu igre) i složi novu: 5 hotela, odigran mjesec, otvoren krug 2.
// Koristi funkcije igre izravno (bez HTTP-a). Ponovno pokretanje je bezopasno.
import { config } from "dotenv";
config({ path: ".env.local" });
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import {
  answers, companies, contracts, customSituations, dispatches, events, finances, plans, players, rooms,
  roundReports, situations, worlds,
} from "../src/db/schema";
import { getWorld, listCompanies, listFinanceRows, listRooms, listSituationsWithAnswers, saveMentorQuestion } from "../src/db/queries";
import { MENTOR_FALLBACK_QUESTION } from "../src/lib/ai/fallbacks";
import { hashCode, normalizeCode } from "../src/lib/engine/codes";
import { refPrice } from "../src/lib/engine/economy";
import { CODE_ALPHABET, JOIN_CODE_LENGTH, PROF_CODE_LENGTH } from "../src/lib/rules";
import { getBusiness, getContract } from "../src/content";
import { joinWorld } from "../src/lib/game/join";
import { closeCompanyRound } from "../src/lib/game/round";
import { decideContract, savePlan } from "../src/lib/game/city";
import { submitAnswer } from "../src/lib/game/answer";
import { createCustomSituation, dispatchSituation, getTemplate } from "../src/lib/game/situations";
import { renderTemplate } from "../src/lib/game/views";
import { createWorld, openNextRound, startWorld } from "../src/lib/game/world";
import type { SituationDraft } from "../src/lib/types";

type Ctx = Parameters<typeof savePlan>[0];

function code(envName: string, fallback: string, length: number): string {
  const value = normalizeCode(process.env[envName] || fallback);
  if (value.length !== length || [...value].some((c) => !CODE_ALPHABET.includes(c))) {
    throw new Error(`${envName} mora imati ${length} znakova iz abecede ${CODE_ALPHABET}`);
  }
  return value;
}

const DEMO_JOIN_CODE = code("DEMO_JOIN_CODE", "KVRNDM", JOIN_CODE_LENGTH);
const DEMO_PROF_CODE = code("DEMO_PROF_CODE", "SMPDEMK26PRF", PROF_CODE_LENGTH);

// price = množitelj referentne cijene hotela (rezultat se drži u rasponu 55–140 €).
const STUDENTS = [
  { name: "Ana Horvat", hotel: "Vila Ana", price: 1.05, marketing: 1500 },
  { name: "Marko Kovačević", hotel: "Hotel Kvarner Plaza", price: 1.25, marketing: 3000 },
  { name: "Ivana Babić", hotel: "Pansion Bura", price: 0.9, marketing: 0 },
  { name: "Petar Jurić", hotel: "Hotel Rijeka Centar", price: 1.1, marketing: 800 },
  { name: "Maja Novak", hotel: "Villa Lungomare", price: 1.4, marketing: 2200 },
];

const OWN_ANSWERS = [
  "Ispričavam se gostu i odmah preuzimam problem na sebe. Objasnit ću mu što radimo i do kada će biti riješeno, te ponuditi primjerenu nadoknadu. Nakon toga ću nazvati gosta i provjeriti je li zadovoljan.",
  "Prvo ću mirno saslušati gosta i potvrditi da razumijem njegov problem. Zatim ću predložiti konkretno rješenje u roku od sat vremena i zabilježiti što se dogodilo da se ne ponovi.",
  "Zahvalit ću na strpljenju i iskreno se ispričati. Ponudit ću zamjensku sobu ili popust, a kolegama ću prenijeti što treba popraviti. Na kraju ću se osobno javiti gostu prije odlaska.",
];

const PROF_DRAFT: SituationDraft = {
  title: "Inspekcija dolazi sutra",
  text: "Turistička inspekcija najavila je dolazak u {hotel} sutra ujutro. Recepcija je zatrpana, kuhinja ima hrpu neoznačene robe, a dvije sobe nisu spremne. Voditelj smjene traži od tebe plan što napraviti do večeras.",
  area: "upravljanje",
  difficulty: 3,
  character: {
    name: "Davor Šimić",
    role: "voditelj smjene",
    personality: "Nervozan, ali pošten; želi konkretan plan, a ne opće obećanje.",
    goal: "Dobiti jasan raspored zadataka do večeras.",
  },
  rubric: [
    { id: "prioriteti", text: "Određuje prioritete: prvo ono što inspekcija sigurno provjerava.", skill: "problemSolving" },
    { id: "ljudi", text: "Raspoređuje zadatke na osoblje i jasno komunicira rokove.", skill: "communication" },
    { id: "iskrenost", text: "Ne skriva nedostatke, nego ih ispravlja ili otvoreno priznaje.", skill: "ethics" },
  ],
  options: [
    { id: "a", text: "Podijelim zadatke osoblju s rokovima, prvo označim robu i spremim sobe, a nedostatke koje ne stignem ispraviti zabilježim.", criteria: ["prioriteti", "ljudi", "iskrenost"] },
    { id: "b", text: "Pokušam sve riješiti sam preko noći i nikome ništa ne govorim.", criteria: [] },
    { id: "c", text: "Sakrijem neoznačenu robu u skladište da je inspekcija ne vidi.", criteria: ["prioriteti"] },
  ],
  effects: { operations: 4, staff: 2 },
};

const pad = (s: string, n: number) => s.padEnd(n);

/** Briše samo igru s demo kodom i sve njezine retke, redom zbog stranih ključeva, u jednom batchu. */
async function wipeDemo(): Promise<void> {
  const [old] = await db.select({ id: worlds.id }).from(worlds).where(eq(worlds.joinCode, DEMO_JOIN_CODE));
  if (!old) return;
  const cIds = db.select({ id: companies.id }).from(companies).where(eq(companies.worldId, old.id));
  const sIds = db.select({ id: situations.id }).from(situations).where(inArray(situations.companyId, cIds));
  await db.batch([
    db.delete(answers).where(inArray(answers.situationId, sIds)),
    db.delete(situations).where(inArray(situations.companyId, cIds)),
    db.delete(rooms).where(inArray(rooms.companyId, cIds)),
    db.delete(players).where(inArray(players.companyId, cIds)),
    db.delete(roundReports).where(inArray(roundReports.companyId, cIds)),
    db.delete(plans).where(inArray(plans.companyId, cIds)),
    db.delete(finances).where(inArray(finances.companyId, cIds)),
    db.delete(contracts).where(eq(contracts.worldId, old.id)),
    db.delete(dispatches).where(eq(dispatches.worldId, old.id)),
    db.delete(customSituations).where(eq(customSituations.worldId, old.id)),
    db.delete(events).where(eq(events.worldId, old.id)),
    db.delete(companies).where(eq(companies.worldId, old.id)),
    db.delete(worlds).where(eq(worlds.id, old.id)),
  ]);
  console.log("Obrisana prijašnja demo igra.");
}

/** Kao requirePlayer: igrač, tvrtka i svježe stanje igre iz baze. */
async function playerCtx(companyId: string): Promise<Ctx> {
  const [row] = await db
    .select({ player: players, company: companies, world: worlds })
    .from(players)
    .innerJoin(companies, eq(players.companyId, companies.id))
    .innerJoin(worlds, eq(companies.worldId, worlds.id))
    .where(eq(players.companyId, companyId));
  if (!row) throw new Error(`nema igrača za tvrtku ${companyId}`);
  return row;
}

type Kind = "good" | "weak" | "own" | "copy";
// Po studentu, po situaciji: klik na dobru opciju, klik na slabiju, vlastiti odgovor, prepisan tekst opcije.
const KINDS: Kind[][] = [["good", "good"], ["good", "own"], ["weak", "own"], ["copy", "good"], ["own", "weak"]];

async function main() {
  await wipeDemo();

  const created = await createWorld({ name: "Demo Simpolis", maxPlayers: 6 });
  const worldId = created.worldId;
  await db
    .update(worlds)
    .set({ joinCode: DEMO_JOIN_CODE, profCodeHash: await hashCode(DEMO_PROF_CODE) })
    .where(eq(worlds.id, worldId));

  for (const s of STUDENTS) await joinWorld({ joinCode: DEMO_JOIN_CODE, name: s.name, hotelName: s.hotel });
  await startWorld(worldId);
  const companyOf = Object.fromEntries((await listCompanies(worldId)).map((c) => [c.player.displayName, c.company.id]));

  // Krug 1: odgovori na obje situacije.
  for (const [i, s] of STUDENTS.entries()) {
    const ctx = await playerCtx(companyOf[s.name]);
    const rows = await listSituationsWithAnswers(ctx.company.id, 1);
    for (const [j, { situation }] of rows.entries()) {
      const t = renderTemplate(await getTemplate(worldId, situation.templateId), {
        soba: situation.roomNumber ?? undefined,
        hotel: ctx.company.name,
      });
      const ranked = [...t.options].sort((a, b) => b.criteria.length - a.criteria.length);
      const best = ranked[0], worst = ranked[ranked.length - 1];
      const kind = KINDS[i][j] ?? "good";
      if (kind === "good") await submitAnswer(ctx, situation.id, { optionId: best.id });
      else if (kind === "weak") await submitAnswer(ctx, situation.id, { optionId: worst.id });
      else if (kind === "copy") await submitAnswer(ctx, situation.id, { text: best.text, pastedChars: best.text.length });
      else await submitAnswer(ctx, situation.id, { text: OWN_ANSWERS[(i + j) % OWN_ANSWERS.length], pastedChars: 0 });
    }
  }

  // Planovi: cijena prema hotelu (55–140 €), marketing 0–3000 €.
  for (const s of STUDENTS) {
    const ctx = await playerCtx(companyOf[s.name]);
    const ref = refPrice(await listRooms(ctx.company.id));
    await savePlan(ctx, { price: Math.min(140, Math.max(55, Math.round(ref * s.price))), marketing: s.marketing });
  }

  // Dva prihvaćena ugovora: najprije agencijske ponude, a ako ih nema dovoljno, bilo koje.
  const offers = (await db.select().from(contracts).where(eq(contracts.worldId, worldId))).map((c) => ({
    ...c,
    agency: getBusiness(getContract(c.templateId).businessId).kind === "agency",
  }));
  const picked = [...offers.filter((o) => o.agency), ...offers.filter((o) => !o.agency)].slice(0, 2);
  for (const o of picked) await decideContract(await playerCtx(o.companyId), o.id, true);

  // Zatvaranje krugova + rezervno pitanje mentora (bez AI-ja).
  for (const s of STUDENTS) {
    await closeCompanyRound(companyOf[s.name], 1);
    await saveMentorQuestion(companyOf[s.name], 1, MENTOR_FALLBACK_QUESTION);
  }

  // Profesorova situacija, zakazana za krug 2 svima.
  const custom = await createCustomSituation((await getWorld(worldId))!, PROF_DRAFT);
  await dispatchSituation((await getWorld(worldId))!, { templateId: custom.id, round: 2 });

  // Obračun mjeseca i otvaranje kruga 2.
  const world = await openNextRound((await getWorld(worldId))!, {});

  console.log("\nDemo igra je spremna.");
  console.log(`Kod igre:        ${DEMO_JOIN_CODE}`);
  console.log(`Profesorski kod: ${DEMO_PROF_CODE}`);
  console.log(`worldId:         ${worldId}`);
  console.log(`Krug:            ${world.round} (${world.status}), ugovora prihvaćeno: ${picked.length}\n`);
  console.log(`${pad("Hotel", 22)}${pad("Student", 18)}${pad("Noćenja", 9)}${pad("Dobit", 10)}Novac`);
  for (const s of STUDENTS) {
    const f = (await listFinanceRows(companyOf[s.name])).find((x) => x.round === 1);
    const [c] = await db.select({ cash: companies.cash }).from(companies).where(eq(companies.id, companyOf[s.name]));
    console.log(
      `${pad(s.hotel, 22)}${pad(s.name, 18)}${pad(String(f?.nights ?? "-"), 9)}${pad(f ? `${f.profit} €` : "-", 10)}${c.cash} €`,
    );
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error("✗ seed-demo nije uspio:", e);
    process.exit(1);
  },
);
