// Demo igra za obilazak žirija. Pokretanje: npm run seed:demo (traži DATABASE_URL u .env.local).
// Briše SAMO prijašnju demo igru (po kodu igre) i složi novu: 5 hotela, odigran mjesec, otvoren krug 2.
// Koristi funkcije igre izravno (bez HTTP-a). Ponovno pokretanje je bezopasno.
// Val 3: ulaganja u odjele (dva hotela), pregovor s agencijom (ishod računa motor), dvije poruke među hotelima.
// Demo profesorski račun: DEMO_PROF_EMAIL i DEMO_PROF_PASSWORD u .env.local (bez njih igra radi samo s kodom).
import { config } from "dotenv";
config({ path: ".env.local" });
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import {
  answers, companies, contracts, customSituations, dispatches, events, finances, librarySituations, mail, plans, players, rooms,
  roundReports, situations, user, worlds,
} from "../src/db/schema";
import { getAuth } from "../src/lib/auth";
import { getWorld, listCompanies, listFinanceRows, listRooms, listSituationsWithAnswers, saveMentorQuestion } from "../src/db/queries";
import { MENTOR_FALLBACK_QUESTION } from "../src/lib/ai/fallbacks";
import { hashCode, normalizeCode } from "../src/lib/engine/codes";
import { refPrice } from "../src/lib/engine/economy";
import { CODE_ALPHABET, JOIN_CODE_LENGTH, NEGOTIATE_OK_PCT, PROF_CODE_LENGTH } from "../src/lib/rules";
import { getBusiness, getContract } from "../src/content";
import { joinWorld } from "../src/lib/game/join";
import { closeCompanyRound } from "../src/lib/game/round";
import { counterOffer, decideContract, savePlan } from "../src/lib/game/city";
import { sendMail } from "../src/lib/game/mail";
import { submitAnswer } from "../src/lib/game/answer";
import { saveToLibrary } from "../src/lib/game/library";
import { createCustomSituation, dispatchSituation, getTemplate } from "../src/lib/game/situations";
import { renderTemplate } from "../src/lib/game/views";
import { createWorld, openNextRound, startWorld } from "../src/lib/game/world";
import type { DepartmentInvestments, SituationDraft } from "../src/lib/types";

type Ctx = Parameters<typeof savePlan>[0];

// Profesorski kod je lozinka demo igre: nema zadane vrijednosti u (javnom) repou, mora biti u .env.local.
function code(envName: string, fallback: string | null, length: number): string {
  const raw = process.env[envName] || fallback;
  if (!raw) throw new Error(`Postavi ${envName} u .env.local (${length} znakova iz abecede ${CODE_ALPHABET})`);
  const value = normalizeCode(raw);
  if (value.length !== length || [...value].some((c) => !CODE_ALPHABET.includes(c))) {
    throw new Error(`${envName} mora imati ${length} znakova iz abecede ${CODE_ALPHABET}`);
  }
  return value;
}

const DEMO_JOIN_CODE = code("DEMO_JOIN_CODE", "KVRNDM", JOIN_CODE_LENGTH);
const DEMO_PROF_CODE = code("DEMO_PROF_CODE", null, PROF_CODE_LENGTH);

// price = množitelj referentne cijene hotela (rezultat se drži u rasponu 55–140 €).
// Hotel iz banke dobiva se redom ulaska (assignHotel): Rijeka, Opatija, Omišalj (Krk), Mali Lošinj, Crikvenica,
// pa ime hotela prati to mjesto. invest = ulaganje u odjele u planu mjeseca (val 3, trošak ide u obračun).
const STUDENTS: { name: string; hotel: string; price: number; marketing: number; invest?: DepartmentInvestments }[] = [
  { name: "Ana Horvat", hotel: "Hotel Rijeka Centar", price: 1.05, marketing: 1500 },
  { name: "Marko Kovačević", hotel: "Villa Lungomare Opatija", price: 1.25, marketing: 2000, invest: { housekeeping: 2000, reception: 1500 } },
  { name: "Ivana Babić", hotel: "Pansion Bura Omišalj", price: 0.9, marketing: 0 },
  { name: "Petar Jurić", hotel: "Vila Čikat Lošinj", price: 1.1, marketing: 800 },
  { name: "Maja Novak", hotel: "Hotel Plaža Crikvenica", price: 1.4, marketing: 2000, invest: { kitchen: 3000, maintenance: 1000 } },
];

// Dvije poruke među hotelima (val 3, L18): od koga, kome, naslov, tekst.
const HOTEL_MAIL = [
  {
    from: "Ana Horvat",
    to: "Marko Kovačević",
    subject: "Kongres u Rijeci: gosti viška",
    body: "Pozdrav iz Rijeke! Sljedeći mjesec imamo kongres i bit ćemo puni. Biste li u Opatiji primili goste koje ne stignemo smjestiti? Javite koliko soba otprilike imate slobodno.",
  },
  {
    from: "Marko Kovačević",
    to: "Ana Horvat",
    subject: "Slobodne sobe u Opatiji",
    body: "Pozdrav iz Opatije! Imamo nekoliko slobodnih soba sredinom mjeseca. Pošaljite nam datume pa se dogovorimo, rado pomažemo susjedima.",
  },
];

/**
 * Demo profesorski račun (Leonova odluka: žiri gleda igru s računa, e-mail i lozinka, bez potvrde e-maila).
 * Postoji → njegov id; ne postoji → registracija preko Better Auth API-ja. Bez env varijabli ili uz grešku
 * (npr. kratka lozinka) samo upozori: igra i dalje radi s profesorskim kodom.
 */
async function demoOwner(): Promise<string | null> {
  const email = process.env.DEMO_PROF_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_PROF_PASSWORD;
  if (!email || !password) {
    console.warn("⚠ DEMO_PROF_EMAIL ili DEMO_PROF_PASSWORD nije u .env.local: demo igra nema profesorski račun (radi s kodom).");
    return null;
  }
  try {
    const [found] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    if (found) {
      console.log(`Profesorski račun: ${email} (postoji, lozinka se ne mijenja)`);
      return found.id;
    }
    // Izravan poziv izvan zahtjeva: Better Auth traži host (BETTER_AUTH_URL ili lokalni); lozinka se hashira
    // bez tajne, pa račun napravljen lokalno radi i na produkciji.
    const appUrl = process.env.BETTER_AUTH_URL;
    const host = appUrl ? new URL(appUrl).host : "localhost:3000";
    const res = await getAuth().api.signUpEmail({
      body: { email, password, name: "Demo profesor" },
      headers: new Headers({ host }),
    });
    console.log(`Profesorski račun: ${email} (napravljen)`);
    return res.user.id;
  } catch (e) {
    console.warn(`⚠ Profesorski račun nije napravljen (${e instanceof Error ? e.message : String(e)}): igra radi s kodom.`);
    return null;
  }
}

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
// Profesorova knjižnica (L17) na demo računu: situacije koje profesor nosi iz igre u igru.
const LIBRARY_DRAFTS: SituationDraft[] = [
  {
    title: "Grupa stiže tri sata ranije",
    text: "Autobus s 40 umirovljenika iz Graza stigao je u 11 sati, a prijava je od 14. Sobe još nisu spremljene, domaćice imaju posla do 15 sati, a voditeljica grupe traži da se svi odmah smjeste jer su putovali cijelu noć. U predvorju je gužva i drugi gosti čekaju na recepciji.",
    area: "Recepcija i smještaj",
    difficulty: 3,
    character: {
      name: "Gerda Huber",
      role: "voditeljica grupe putničke agencije",
      personality: "Odlučna i umorna; govori brzo, ali cijeni kad joj netko da jasan plan.",
      goal: "Da se stariji gosti odmah negdje odmore i da zna točno kada dobivaju sobe.",
    },
    rubric: [
      { id: "smjestaj", text: "Odmah nudi privremeno rješenje: prostor za odmor, piće, spremište za prtljagu.", skill: "problemSolving" },
      { id: "plan", text: "Daje jasan redoslijed: koje sobe su spremne prve i u koliko sati.", skill: "communication" },
      { id: "ostali", text: "Ne zanemaruje ostale goste na recepciji dok rješava grupu.", skill: "empathy" },
      { id: "trosak", text: "Ne dijeli besplatne usluge bez mjere; gesta je razmjerna.", skill: "finance" },
    ],
    options: [
      { id: "a", text: "Grupu smjestim na terasu uz kavu i spremim im prtljagu, s voditeljicom dogovorim redoslijed soba do 13 sati, a jednog kolegu ostavim na recepciji za ostale goste.", criteria: ["smjestaj", "plan", "ostali", "trosak"] },
      { id: "b", text: "Kažem da je prijava u 14 sati i da moraju pričekati.", criteria: [] },
      { id: "c", text: "Svima dam besplatan ručak da budu zadovoljni, a sobe će biti kad budu.", criteria: ["smjestaj"] },
    ],
    effects: { guests: 3, operations: 3, reviews: 2 },
  },
  {
    title: "Kuhar želi otići usred sezone",
    text: "Glavni kuhar dolazi u vaš ured i kaže da mu je konkurentski hotel u susjedstvu ponudio 300 € više mjesečno. Ako ode, restoran ostaje bez vođe usred kolovoza. Kaže da bi radije ostao, ali da ima obitelj i kredit.",
    area: "Ljudski potencijali",
    difficulty: 4,
    character: {
      name: "Tomislav Babić",
      role: "glavni kuhar",
      personality: "Lojalan i ponosan na svoj rad; ne voli pregovarati, ali zna koliko vrijedi.",
      goal: "Osjećati se cijenjeno i dobiti pošten dogovor koji pokriva njegove troškove.",
    },
    rubric: [
      { id: "slusanje", text: "Sasluša razloge i prizna njegovu vrijednost za hotel.", skill: "empathy" },
      { id: "racun", text: "Procijeni koliko bi hotel stajao njegov odlazak u odnosu na povišicu.", skill: "finance" },
      { id: "ponuda", text: "Ponudi konkretan, ostvariv dogovor (iznos, rok, uvjeti).", skill: "problemSolving" },
    ],
    options: [
      { id: "a", text: "Zahvalim mu na iskrenosti, izračunam što bi nas stajao odlazak usred sezone i ponudim 200 € odmah plus bonus na kraju sezone ako ostane do rujna.", criteria: ["slusanje", "racun", "ponuda"] },
      { id: "b", text: "Kažem mu da je svatko zamjenjiv i neka ide ako želi.", criteria: [] },
      { id: "c", text: "Odmah mu dam 500 € više da sigurno ostane.", criteria: ["slusanje"] },
    ],
    effects: { staff: 4, finance: 3, operations: 2 },
  },
  {
    title: "Influencerica traži besplatan boravak",
    text: "Influencerica s 80.000 pratitelja javlja se e-mailom: nudi objavu o vašem hotelu u zamjenu za tri besplatna noćenja u kolovozu, kada ste ionako gotovo puni. Marketinški budžet ovaj mjesec je već potrošen, a direktor pita što mislite.",
    area: "Ugled i recenzije",
    difficulty: 2,
    character: {
      name: "Lana Perić",
      role: "influencerica za putovanja",
      personality: "Samouvjerena i ljubazna; očekuje brz odgovor i ne voli cjenkanje.",
      goal: "Dobiti besplatan boravak u najljepšem dijelu sezone.",
    },
    rubric: [
      { id: "provjera", text: "Provjeri vrijedi li ponuda: tko su pratitelji i dolaze li od njih gosti.", skill: "problemSolving" },
      { id: "vrijeme", text: "Uzme u obzir da je kolovoz pun, pa besplatna soba ima stvarnu cijenu.", skill: "finance" },
      { id: "odgovor", text: "Odgovori pristojno i jasno, s protuprijedlogom ili obrazloženim odbijanjem.", skill: "communication" },
    ],
    options: [
      { id: "a", text: "Zahvalim joj, zatražim podatke o pratiteljima i ponudim boravak u rujnu kada imamo slobodnih soba, uz jasne uvjete objave.", criteria: ["provjera", "vrijeme", "odgovor"] },
      { id: "b", text: "Odmah prihvatim, reklama je uvijek dobra.", criteria: [] },
      { id: "c", text: "Ne odgovorim na e-mail.", criteria: [] },
    ],
    effects: { reviews: 3, finance: 2, guests: 2 },
  },
  PROF_DRAFT,
];

async function wipeDemo(): Promise<void> {
  const [old] = await db.select({ id: worlds.id }).from(worlds).where(eq(worlds.joinCode, DEMO_JOIN_CODE));
  if (!old) return;
  const cIds = db.select({ id: companies.id }).from(companies).where(eq(companies.worldId, old.id));
  const sIds = db.select({ id: situations.id }).from(situations).where(inArray(situations.companyId, cIds));
  await db.batch([
    db.delete(mail).where(eq(mail.worldId, old.id)), // L15: prije ugovora i tvrtki (FK bez cascade)
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

  const ownerId = await demoOwner();
  if (ownerId) {
    // Knjižnica demo računa uvijek iste situacije: stare briše, nove sprema kroz validateDraft.
    await db.delete(librarySituations).where(eq(librarySituations.ownerId, ownerId));
    for (const draft of LIBRARY_DRAFTS) await saveToLibrary(ownerId, draft);
    console.log(`Knjižnica:       ${LIBRARY_DRAFTS.length} situacije na demo računu`);
  }
  const created = await createWorld({ name: "Demo Simpolis", maxPlayers: 6 }, ownerId);
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

  // Planovi: cijena prema hotelu (55–140 €), marketing 0–2000 € (MARKETING_MAX), ulaganje u odjele kod dva hotela.
  const planOf = async (s: (typeof STUDENTS)[number]) => {
    const ctx = await playerCtx(companyOf[s.name]);
    const ref = refPrice(await listRooms(ctx.company.id));
    const price = Math.min(140, Math.max(55, Math.round(ref * s.price)));
    await savePlan(ctx, { price, marketing: s.marketing, ...(s.invest && { investments: s.invest }) });
  };
  for (const s of STUDENTS) await planOf(s);

  // Pregovor (val 3): prva agencijska ponuda s noćenjima dobije protuponudu ~10 % višu cijenu noćenja (unutar
  // NEGOTIATE_OK_PCT); ishod i dogovorene brojke računa motor (counterOffer → negotiate), odgovor piše agencija.
  const offers = (await db.select().from(contracts).where(eq(contracts.worldId, worldId))).map((c) => ({
    ...c,
    terms: getContract(c.templateId),
    agency: getBusiness(getContract(c.templateId).businessId).kind === "agency",
  }));
  const haggle = offers.find((o) => o.agency && o.terms.nights > 0);
  let negotiation = "nema agencijske ponude s noćenjima u ovoj igri";
  if (haggle) {
    const p = haggle.terms.pricePerNight;
    const res = await counterOffer(await playerCtx(haggle.companyId), haggle.id, {
      pricePerNight: p + Math.floor((p * (NEGOTIATE_OK_PCT - 5)) / 100),
      message: "Poštovani, zahvaljujemo na ponudi. Naše sobe su obnovljene i tražene, pa predlažemo nešto višu cijenu noćenja.",
    });
    negotiation = `${res.contract.businessName}: ${res.outcome}, ${res.contract.pricePerNight} €/noćenje (ponuda ${p} €)`;
  }

  // Dva prihvaćena ugovora (bez pregovaranog): najprije agencijske ponude, a ako ih nema dovoljno, bilo koje.
  const rest = offers.filter((o) => o.id !== haggle?.id);
  const picked = [...rest.filter((o) => o.agency), ...rest.filter((o) => !o.agency)].slice(0, 2);
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

  // Krug 2: hoteli s ulaganjem zadrže ga i u planu novog mjeseca (stranica odjela), pa dvije poruke među hotelima.
  for (const s of STUDENTS.filter((x) => x.invest)) await planOf(s);
  for (const m of HOTEL_MAIL) {
    await sendMail(await playerCtx(companyOf[m.from]), { toCompanyId: companyOf[m.to], subject: m.subject, body: m.body });
  }

  console.log("\nDemo igra je spremna.");
  console.log(`Kod igre:        ${DEMO_JOIN_CODE}`);
  console.log("Profesorski kod: iz .env.local (DEMO_PROF_CODE)");
  console.log(`Račun profesora: ${ownerId ? "vlasnik igre (DEMO_PROF_EMAIL)" : "nema (samo kod)"}`);
  console.log(`worldId:         ${worldId}`);
  console.log(`Krug:            ${world.round} (${world.status}), ugovora prihvaćeno: ${picked.length}`);
  console.log(`Pregovor:        ${negotiation}`);
  console.log(`Poruke hotela:   ${HOTEL_MAIL.length}\n`);
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
