// Smoke provjera toka igre preko HTTP-a. Pokretanje: npm run smoke (BASE_URL, zadano http://localhost:3000).
// SMOKE_CITY=1 uključuje korake 11–19 (grad: plan, obračun mjeseca, ugovori; val 3: ulaganje u odjele, protuponuda,
// poruke među hotelima, javni profil, profesorski račun). Izlazni kod 1 ako ijedan korak padne.
import type {
  AnswerView, ContractView, CreateWorldResponse, JoinResponse, MailMessage, MeResponse, NegotiationResult,
  ProfGameSummary, ProfStateResponse, RoundReportView, SituationView,
} from "../src/lib/types";
import { INVEST_EFFECT_DIVISOR, INVEST_MAX, NEGOTIATE_COUNTER_PCT, NEGOTIATE_OK_PCT } from "../src/lib/rules";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const CITY = process.env.SMOKE_CITY === "1";

// Odgovori API-ja se čitaju bez shema; tipovi ugovora stavljaju se na mjestu upotrebe.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = { status: number; data: any };

// Svaki "korisnik" ima svoju kutiju kolačića (Node fetch ih ne pamti).
class User {
  private jar = new Map<string, string>();
  constructor(readonly label: string) {}
  /** Zaboravi kolačić (npr. sp_prof, da se provjeri pristup samo sesijom računa). */
  forget(name: string) { this.jar.delete(name); }
  async call(method: string, path: string, body?: unknown): Promise<Res> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["content-type"] = "application/json";
    if (path.startsWith("/api/auth/")) headers.origin = BASE_URL; // Better Auth provjerava podrijetlo zahtjeva
    if (this.jar.size) headers.cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await fetch(BASE_URL + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      if (i > 0) this.jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
    const text = await res.text();
    let data: Res["data"] = text;
    try { data = JSON.parse(text); } catch { /* nije JSON */ }
    return { status: res.status, data };
  }
}

function expect(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}
function expectStatus(r: Res, status: number) {
  expect(r.status === status, `očekivano ${status}, dobiveno ${r.status} ${typeof r.data === "string" ? r.data.slice(0, 120) : JSON.stringify(r.data).slice(0, 160)}`);
}

/** Korak se ne može provjeriti na ovom serveru (npr. nema Better Auth tajne): preskočeno, ne palo. */
class Skip extends Error {}

let failed = 0;
const done = new Set<number>();
async function step(n: number, name: string, needs: number[], fn: () => Promise<void>) {
  const missing = needs.filter((d) => !done.has(d));
  if (missing.length) { console.log(`– ${n} ${name}: preskočeno (treba korak ${missing.join(", ")})`); return; }
  try { await fn(); done.add(n); console.log(`✓ ${n} ${name}`); }
  catch (e) {
    if (e instanceof Skip) { console.log(`– ${n} ${name}: preskočeno (${e.message})`); return; }
    failed++; console.log(`✗ ${n} ${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
function skipped(n: number, name: string) { console.log(`– ${n} ${name}: preskočeno (uključi SMOKE_CITY=1)`); }

async function main() {
  const prof = new User("profesor"), ivan = new User("Ivan"), treci = new User("Treći");
  let ana = new User("Ana");
  const worldName = `Smoke ${new Date().toISOString().slice(0, 19).replace("T", " ")}`;
  let world!: CreateWorldResponse;
  let anaJoin!: JoinResponse, ivanJoin!: JoinResponse;
  let anaSits: SituationView[] = [], ivanSits: SituationView[] = [];
  let anaBefore!: MeResponse;
  const joinBody = (code: string, name: string, hotelName: string) => ({ joinCode: code, name, hotelName });

  console.log(`Smoke na ${BASE_URL}`);

  await step(1, "stvori igru za 2", [], async () => {
    const r = await prof.call("POST", "/api/worlds", { name: worldName, maxPlayers: 2 });
    expectStatus(r, 200);
    world = r.data;
    expect(world.worldId && world.joinCode && world.profCode, "nedostaje worldId/joinCode/profCode");
  });

  await step(2, "dva ulaza, različiti hoteli", [1], async () => {
    const a = await ana.call("POST", "/api/join", joinBody(world.joinCode, "Ana", "Vila Ana"));
    expectStatus(a, 200);
    const i = await ivan.call("POST", "/api/join", joinBody(world.joinCode, "Ivan", "Hotel Ivan"));
    expectStatus(i, 200);
    anaJoin = a.data; ivanJoin = i.data;
    expect(anaJoin.companyId !== ivanJoin.companyId, "ista tvrtka za oba igrača");
    expect(anaJoin.place !== ivanJoin.place, `isti hotel (${anaJoin.place})`);
  });

  await step(3, "treći ulaz → 409 Igra je puna", [1], async () => {
    const r = await treci.call("POST", "/api/join", joinBody(world.joinCode, "Treći", "Hotel Treći"));
    expectStatus(r, 409);
    expect(/puna/i.test(r.data?.error ?? ""), `poruka: ${JSON.stringify(r.data)}`);
  });

  await step(4, "ponovni ulaz istim imenom i hotelom → isti companyId", [2], async () => {
    // Novi preglednik: ponovni ulaz izdaje novi token, pa Ana dalje radi s novom kutijom kolačića.
    const again = new User("Ana (novi preglednik)");
    const r = await again.call("POST", "/api/join", joinBody(world.joinCode, "Ana", "Vila Ana"));
    expectStatus(r, 200);
    ana = again;
    expect(r.data.companyId === anaJoin.companyId, `drugi companyId ${r.data.companyId}`);
  });

  await step(5, "pokreni → svaki student ima 2 situacije", [2], async () => {
    expectStatus(await prof.call("POST", `/api/prof/${world.worldId}/start`), 200);
    const a = await ana.call("GET", "/api/me"); expectStatus(a, 200);
    const i = await ivan.call("GET", "/api/me"); expectStatus(i, 200);
    anaBefore = a.data as MeResponse;
    anaSits = anaBefore.situations; ivanSits = (i.data as MeResponse).situations;
    expect(anaSits.length === 2, `Ana ima ${anaSits.length} situacija`);
    expect(ivanSits.length === 2, `Ivan ima ${ivanSits.length} situacija`);
    expect(anaSits.every((s) => s.round === 1), "situacije nisu iz kruga 1");
  });

  await step(6, "odgovor klikom → quality ≤ 4", [5], async () => {
    const opt = anaSits[0].options[0];
    expect(opt, "situacija nema opcije");
    const r = await ana.call("POST", `/api/situations/${anaSits[0].id}/answer`, { optionId: opt.id });
    expectStatus(r, 200);
    const ans = r.data as AnswerView;
    expect(ans.quality >= 1 && ans.quality <= 4, `quality ${ans.quality}`);
  });

  await step(7, "dupli odgovor na istu situaciju → 409", [6], async () => {
    const r = await ana.call("POST", `/api/situations/${anaSits[0].id}/answer`, { optionId: anaSits[0].options[0].id });
    expectStatus(r, 409);
  });

  await step(8, "predug vlastiti odgovor (2001 znak) → 400", [5], async () => {
    const r = await ana.call("POST", `/api/situations/${anaSits[1].id}/answer`, { text: "x".repeat(2001), pastedChars: 0 });
    expectStatus(r, 400);
  });

  await step(9, "zatvori krug → pokazatelji promijenjeni, izvještaj ima pitanje mentora", [6], async () => {
    const c = await ana.call("POST", "/api/me/close-round");
    expectStatus(c, 200);
    const rep = c.data as RoundReportView;
    expect(JSON.stringify(rep.metricsBefore) !== JSON.stringify(rep.metricsAfter), "pokazatelji isti prije i poslije");
    const me = await ana.call("GET", "/api/me"); expectStatus(me, 200);
    expect(JSON.stringify((me.data as MeResponse).company.metrics) !== JSON.stringify(anaBefore.company.metrics), "company.metrics nepromijenjen");
    const r = await ana.call("GET", "/api/me/report/1");
    expectStatus(r, 200);
    expect(((r.data as RoundReportView).mentorQuestion ?? "").trim().length > 0, "mentorQuestion je prazno");
  });

  await step(10, "krug 2, pa odgovor na situaciju kruga 1 → 409", [5], async () => {
    expectStatus(await prof.call("POST", `/api/prof/${world.worldId}/round`, {}), 200);
    const r = await ana.call("POST", `/api/situations/${anaSits[1].id}/answer`, { optionId: anaSits[1].options[0].id });
    expectStatus(r, 409);
  });

  // Grad: koraci 11–14 samo uz SMOKE_CITY=1.
  const cityStep = async (n: number, name: string, needs: number[], fn: () => Promise<void>) =>
    CITY ? step(n, name, needs, fn) : skipped(n, name);
  const finances = async (u: User) => ((await u.call("GET", "/api/me")).data as MeResponse).finances;

  await cityStep(11, "cijena 60 € daje Ani više noćenja nego Ivanu po 300 €; plan se prenosi (#227.1); mentor sam napiše osvrt", [10], async () => {
    expectStatus(await ana.call("POST", "/api/me/plan", { price: 60, marketing: 0 }), 200);
    expectStatus(await ivan.call("POST", "/api/me/plan", { price: 300, marketing: 0 }), 200);
    expectStatus(await prof.call("POST", `/api/prof/${world.worldId}/round`, {}), 200);
    const a = (await finances(ana)).find((f) => f.round === 2), i = (await finances(ivan)).find((f) => f.round === 2);
    expect(a && i, "nema finances za krug 2");
    expect(a.nights > i.nights, `Ana ${a.nights} noćenja, Ivan ${i.nights}`);
    // #227.1: plan mjeseca 2 je zadani plan mjeseca 3
    const plan = ((await ana.call("GET", "/api/me")).data as MeResponse).plan;
    expect(plan.round === 3 && plan.price === 60 && plan.marketing === 0, `plan mjeseca 3: ${JSON.stringify(plan)}`);
    // Mentor sam napiše osvrt kad profesor zatvori mjesec (bez AI-ja iz brojki), bez studentove refleksije.
    const rep = await ana.call("GET", "/api/me/report/2"); expectStatus(rep, 200);
    expect(((rep.data as RoundReportView).mentorText ?? "").trim().length > 0, "mentorText mjeseca 2 prazan nakon zatvaranja");
  });

  await cityStep(12, "cash = početni račun + dobit iz finances; izvještaj mjeseca vidi obračun (#226)", [11], async () => {
    const me = (await ana.call("GET", "/api/me")).data as MeResponse;
    const profit = me.finances.reduce((s, f) => s + f.profit, 0);
    expect(me.company.cash === me.company.startCash + profit, `cash ${me.company.cash} ≠ ${me.company.startCash} + ${profit}`);
    // krug 3 je tek otvoren, pa su pokazatelji tvrtke točno izvještaj mjeseca 2 s obračunom grada
    const r = await ana.call("GET", "/api/me/report/2"); expectStatus(r, 200);
    const after = JSON.stringify((r.data as RoundReportView).metricsAfter), now = JSON.stringify(me.company.metrics);
    expect(after === now, `izvještaj ${after} ≠ tvrtka ${now}`);
  });

  // Ponuda kruga je slučajna (iz sjemena igre), pa korak 13 ima svoju malu igru za jednog studenta: nova igra
  // dok ponuda kruga 1 nije agencijska (vjerojatnost 3/8 po igri), a Anina igra čuva krugove za korak 14.
  await cityStep(13, "prihvaćen ugovor agencije → contractNights > 0", [], async () => {
    for (let attempt = 1; attempt <= 20; attempt++) {
      const p = new User("profesor (ugovor)"), s = new User("Marta");
      const w = await p.call("POST", "/api/worlds", { name: `${worldName} ugovor`, maxPlayers: 1 });
      expectStatus(w, 200);
      expectStatus(await s.call("POST", "/api/join", joinBody(w.data.joinCode, "Marta", "Hotel Marta")), 200);
      expectStatus(await p.call("POST", `/api/prof/${w.data.worldId}/start`), 200);
      const me = (await s.call("GET", "/api/me")).data as MeResponse;
      const offer = me.contracts.find((c) => c.status === "offered" && c.businessKind === "agency");
      if (!offer) continue;
      const d = await s.call("POST", `/api/contracts/${offer.id}/decide`, { accept: true });
      expectStatus(d, 200);
      expect(d.data.status === "accepted", `status ${d.data.status}`);
      expectStatus(await s.call("POST", `/api/contracts/${offer.id}/decide`, { accept: true }), 409);
      expectStatus(await p.call("POST", `/api/prof/${w.data.worldId}/round`, {}), 200);
      const f = (await finances(s)).find((x) => x.round === 1);
      expect(f && f.contractNights > 0, `contractNights ${f?.contractNights}`);
      return;
    }
    throw new Error("ni u 20 igara nema agencijske ponude u krugu 1");
  });

  await cityStep(14, "dvostruki obračun: dva istovremena zatvaranja mjeseca", [11], async () => {
    const roundOf = async () => ((await prof.call("GET", `/api/prof/${world.worldId}`)).data as ProfStateResponse).world.round;
    const before = await roundOf();
    // Profesorova ploča šalje mjesec koji zatvara (fromRound), kao i dvoklik ili dvije funkcije na Vercelu.
    const close = () => prof.call("POST", `/api/prof/${world.worldId}/round`, { fromRound: before });
    const both = await Promise.all([close(), close()]);
    both.forEach((r) => expectStatus(r, 200));
    const after = await roundOf();
    expect(after === before + 1, `krug ${before} → ${after}`);
    expectStatus(await close(), 200); // zakašnjeli treći klik: stanje, bez novog prelaska
    expect((await roundOf()) === after, "zakašnjeli klik je preskočio mjesec");
    for (const u of [ana, ivan]) {
      const rounds = (await finances(u)).map((f) => f.round);
      expect(new Set(rounds).size === rounds.length, `${u.label}: dupli retci u finances: ${rounds.join(",")}`);
      expect(rounds.length === after - 1, `${u.label}: obračunati krugovi ${rounds.join(",")}, očekivano 1–${after - 1}`);
    }
  });

  // ---------- Val 3: koraci 15–19 (SMOKE_CITY=1) ----------

  /** Mala igra za korak: profesor, studenti po imenima (hotel „Hotel <ime>"), pokrenuta (krug 1). */
  const smallGame = async (label: string, names: string[]) => {
    const p = new User(`profesor (${label})`);
    const w = await p.call("POST", "/api/worlds", { name: `${worldName} ${label}`, maxPlayers: names.length });
    expectStatus(w, 200);
    const users: User[] = [];
    for (const name of names) {
      const u = new User(name);
      expectStatus(await u.call("POST", "/api/join", joinBody(w.data.joinCode, name, `Hotel ${name}`)), 200);
      users.push(u);
    }
    expectStatus(await p.call("POST", `/api/prof/${w.data.worldId}/start`), 200);
    return { prof: p, worldId: w.data.worldId as string, users };
  };

  await cityStep(15, "ulaganje u odjele: izvan raspona → 400, trošak u obračunu mjeseca", [], async () => {
    const g = await smallGame("odjeli", ["Lea"]);
    const [lea] = g.users;
    const me = (await lea.call("GET", "/api/me")).data as MeResponse;
    const base = { price: me.plan.price, marketing: 0 };
    expectStatus(await lea.call("POST", "/api/me/plan", { ...base, investments: { reception: INVEST_MAX + 1 } }), 400);
    expectStatus(await lea.call("POST", "/api/me/plan", { ...base, investments: { reception: -1 } }), 400);
    expectStatus(await lea.call("POST", "/api/me/plan", { ...base, investments: { bazen: INVEST_EFFECT_DIVISOR } }), 400);
    const investments = { reception: INVEST_EFFECT_DIVISOR, kitchen: 2 * INVEST_EFFECT_DIVISOR };
    const sum = investments.reception + investments.kitchen;
    const saved = await lea.call("POST", "/api/me/plan", { ...base, investments });
    expectStatus(saved, 200);
    const kept = saved.data.investments ?? {};
    expect(
      Object.keys(kept).length === 2 && kept.reception === investments.reception && kept.kitchen === investments.kitchen,
      `plan.investments ${JSON.stringify(kept)}`,
    );
    expectStatus(await g.prof.call("POST", `/api/prof/${g.worldId}/round`, { fromRound: 1 }), 200);
    const f = (await finances(lea)).find((x) => x.round === 1);
    expect(f, "nema finances za krug 1");
    expect(f.investments === sum, `finances.investments ${f.investments}, očekivano ${sum}`);
    const b = f.breakdown;
    expect(b, "nema raspodjele troškova (breakdown)");
    expect(b.costInvestments === sum, `breakdown.costInvestments ${b.costInvestments}, očekivano ${sum}`);
    const costs = b.costStaff + b.costRooms + b.costMarketing + b.costContracts + b.costInvestments;
    expect(f.costs === costs, `costs ${f.costs} ≠ zbroj stavki ${costs}`);
  });

  await cityStep(16, "protuponuda agenciji: prihvaćeno, protuponuda agencije, odbijeno; ista cijena → 400 (#227.3)", [], async () => {
    // Ponude su slučajne (sjeme igre), pa 8 hotela kroz najviše 4 mjeseca skuplja tri agencijske ponude s noćenjima.
    const g = await smallGame("pregovor", ["Ema", "Filip", "Gita", "Hrvoje", "Iva", "Jura", "Kata", "Lovro"]);
    const need: NegotiationResult["outcome"][] = ["accepted", "countered", "rejected"];
    let badChecked = false;
    const check = async (u: User, offer: ContractView, want: NegotiationResult["outcome"]) => {
      const p = offer.pricePerNight;
      // protuponuda u korist hotela: do OK % → prihvaćeno, sredina OK–COUNTER % → sredina, iznad COUNTER % → odbijeno
      const ask = {
        accepted: p + Math.floor((p * NEGOTIATE_OK_PCT) / 100),
        countered: p + Math.round((p * (NEGOTIATE_OK_PCT + NEGOTIATE_COUNTER_PCT)) / 200),
        rejected: p + Math.floor((p * NEGOTIATE_COUNTER_PCT) / 100) + 1,
      }[want];
      const path = `/api/contracts/${offer.id}/counter`;
      const r = await u.call("POST", path, { pricePerNight: ask, message: "Smoke: predlažemo drugu cijenu." });
      expectStatus(r, 200);
      const res = r.data as NegotiationResult;
      expect(res.outcome === want, `${u.label}: ponuda ${p} €, protuponuda ${ask} € → ${res.outcome}, očekivano ${want}`);
      expect(res.reply.kind === "agency" && !res.reply.mine && res.reply.contractId === offer.id, "odgovor agencije nije e-mail uz ponudu");
      const box = (await u.call("GET", "/api/me/mail")).data as MailMessage[];
      expect(box.some((m) => m.id === res.reply.id), "odgovor agencije nije u pošti hotela");
      if (want === "accepted") {
        expect(res.contract.status === "accepted" && res.contract.pricePerNight === ask, `ugovor ${res.contract.status} po ${res.contract.pricePerNight} €`);
      } else if (want === "countered") {
        const cp = res.contract.counterPricePerNight;
        expect(res.contract.status === "offered" && cp !== undefined && cp > p && cp < ask, `protuponuda agencije ${cp} (ponuda ${p}, traženo ${ask})`);
        expectStatus(await u.call("POST", path, { pricePerNight: ask }), 409); // jedno pregovaranje po ponudi
        const d = await u.call("POST", `/api/contracts/${offer.id}/decide`, { accept: true });
        expectStatus(d, 200);
        expect(d.data.status === "accepted" && d.data.pricePerNight === cp, `nakon prihvaćanja ${d.data.status} po ${d.data.pricePerNight} €, očekivano ${cp} €`);
      } else {
        expect(res.contract.status === "expired", `odbijena ponuda ima status ${res.contract.status}`);
        expectStatus(await u.call("POST", `/api/contracts/${offer.id}/decide`, { accept: true }), 409);
      }
    };
    for (let month = 1; need.length > 0; month++) {
      for (const u of g.users) {
        if (need.length === 0) break;
        const me = (await u.call("GET", "/api/me")).data as MeResponse;
        const offer = me.contracts.find(
          (c) => c.status === "offered" && c.businessKind === "agency" && c.nights > 0 && c.roundOffered === me.world.round && !c.negotiated,
        );
        if (!offer) continue;
        if (!badChecked) {
          // oba polja odjednom → 400, ponuda ostaje netaknuta
          expectStatus(await u.call("POST", `/api/contracts/${offer.id}/counter`, { pricePerNight: offer.pricePerNight, monthlyCost: 1 }), 400);
          // #227.3: ista cijena nije u korist hotela → 400, pregovor ostaje neiskorišten (check ga odmah koristi)
          expectStatus(await u.call("POST", `/api/contracts/${offer.id}/counter`, { pricePerNight: offer.pricePerNight }), 400);
          badChecked = true;
        }
        await check(u, offer, need.shift()!);
      }
      if (need.length === 0) break;
      const next = await g.prof.call("POST", `/api/prof/${g.worldId}/round`, { fromRound: month });
      if (next.status !== 200) throw new Error(`nema dovoljno agencijskih ponuda ni nakon ${month} mj. (fali: ${need.join(", ")})`);
    }
  });

  await cityStep(17, "poruka drugom hotelu: primatelj je vidi nepročitanu, profesor je vidi", [5], async () => {
    const to = ivanJoin.companyId;
    expectStatus(await ana.call("POST", "/api/me/mail", { toCompanyId: to, subject: "", body: "Pozdrav" }), 400);
    expectStatus(await ana.call("POST", "/api/me/mail", { toCompanyId: anaJoin.companyId, subject: "Sebi", body: "Pozdrav" }), 400);
    const subject = `Smoke poruka ${Date.now()}`;
    const r = await ana.call("POST", "/api/me/mail", { toCompanyId: to, subject, body: "Pozdrav od Ane! Imamo slobodnih soba ovaj mjesec." });
    expectStatus(r, 200);
    const sent = r.data as MailMessage;
    expect(sent.kind === "hotel" && sent.mine && sent.subject === subject, `poslana poruka: ${JSON.stringify(sent).slice(0, 160)}`);
    const inbox = await ivan.call("GET", "/api/me/mail");
    expectStatus(inbox, 200);
    const got = (inbox.data as MailMessage[]).find((m) => m.id === sent.id);
    expect(got, "Ivan nema poruku u pošti");
    expect(!got.read && !got.mine, `kod Ivana: read ${got.read}, mine ${got.mine}`);
    const unread = ((await ivan.call("GET", "/api/me")).data as MeResponse).unreadMail;
    expect(unread === undefined || unread >= 1, `unreadMail ${unread}`);
    const all = await prof.call("GET", `/api/prof/${world.worldId}/mail`);
    expectStatus(all, 200);
    expect((all.data as MailMessage[]).some((m) => m.id === sent.id), "profesor ne vidi poruku");
    expectStatus(await treci.call("GET", `/api/prof/${world.worldId}/mail`), 403);
  });

  await cityStep(18, "javni profil i ljestvica drugog hotela: bez novca; profesor vidi sve (ADR-040)", [2], async () => {
    const r = await ana.call("GET", `/api/world/${world.worldId}/companies/${ivanJoin.companyId}`);
    expectStatus(r, 200);
    expect(r.data.companyId === ivanJoin.companyId, `companyId ${r.data.companyId}`);
    // javni prihod/dobit zatvorenih mjeseci smiju biti; stanje računa ne
    const banned = new Set(["cash", "startCash", "cashAfter", "balance"]);
    const found: string[] = [];
    const walk = (v: unknown, at: string) => {
      if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`));
      else if (v && typeof v === "object") {
        for (const [k, x] of Object.entries(v)) { if (banned.has(k)) found.push(`${at}.${k}`); walk(x, `${at}.${k}`); }
      }
    };
    walk(r.data, "profil");
    expect(found.length === 0, `javni profil ima novac: ${found.join(", ")}`);
    expectStatus(await treci.call("GET", `/api/world/${world.worldId}/companies/${ivanJoin.companyId}`), 401);
    // ljestvica i karta u /api/me: novac samo na vlastitom retku
    const me = (await ana.call("GET", "/api/me")).data as MeResponse;
    for (const rows of [me.leaderboard, me.city.hotels]) {
      const own = rows.find((h) => h.companyId === me.company.id), other = rows.find((h) => h.companyId === ivanJoin.companyId);
      expect(own?.cash === me.company.cash, `vlastiti redak: cash ${own?.cash} ≠ ${me.company.cash}`);
      expect(other && !("cash" in other), `Ana vidi Ivanov novac: ${JSON.stringify(other)}`);
      expect(rows.every((h) => h.companyId === me.company.id || !("cash" in h)), "tuđi hotel ima cash");
    }
    const ps = (await prof.call("GET", `/api/prof/${world.worldId}`)).data as ProfStateResponse;
    expect(typeof ps.players.find((p) => p.companyId === ivanJoin.companyId)?.cash === "number", "profesor ne vidi Ivanov novac");
  });

  await cityStep(19, "profesor s računom vidi svoju igru, drugi račun dobije 403", [], async () => {
    const stamp = Date.now();
    const owner = new User("profesor s računom"), other = new User("drugi profesor");
    const signUp = (u: User, tag: string) =>
      u.call("POST", "/api/auth/sign-up/email", {
        email: `smoke-${stamp}${tag}@example.test`,
        password: `Smoke-${stamp}-lozinka`,
        name: `Smoke profesor ${tag || "a"}`,
      });
    const s = await signUp(owner, "");
    if (s.status === 404 || s.status >= 500) throw new Skip(`registracija vraća ${s.status}: server nema Better Auth tajnu`);
    expectStatus(s, 200);
    const w = await owner.call("POST", "/api/worlds", { name: `${worldName} račun`, maxPlayers: 2 });
    expectStatus(w, 200);
    const games = await owner.call("GET", "/api/prof/games");
    expectStatus(games, 200);
    expect((games.data as ProfGameSummary[]).some((x) => x.worldId === w.data.worldId), "moje igre nemaju novu igru");
    owner.forget("sp_prof"); // ploča igre radi samo sa sesijom računa, bez profesorskog koda
    expectStatus(await owner.call("GET", `/api/prof/${w.data.worldId}`), 200);
    expectStatus(await signUp(other, "-b"), 200);
    expectStatus(await other.call("GET", `/api/prof/${w.data.worldId}`), 403);
    const theirs = await other.call("GET", "/api/prof/games");
    expectStatus(theirs, 200);
    expect(!(theirs.data as ProfGameSummary[]).some((x) => x.worldId === w.data.worldId), "tuđa igra u mojim igrama");
    expectStatus(await new User("bez računa").call("GET", "/api/prof/games"), 401);
  });

  await step(20, "kasni ulaz: student uđe nakon početka i igra od tekućeg mjeseca (BUG-027)", [], async () => {
    const p = new User("profesor kasni"), a = new User("Rana"), late = new User("Kasni");
    const w = await p.call("POST", "/api/worlds", { name: `${worldName} kasni`, maxPlayers: 2 });
    expectStatus(w, 200);
    expectStatus(await a.call("POST", "/api/join", joinBody(w.data.joinCode, "Rana", "Hotel Rani")), 200);
    expectStatus(await p.call("POST", `/api/prof/${w.data.worldId}/start`), 200);
    const j = await late.call("POST", "/api/join", joinBody(w.data.joinCode, "Kasni", "Hotel Kasni"));
    expectStatus(j, 200);
    const meA = (await a.call("GET", "/api/me")).data as MeResponse;
    const meL = (await late.call("GET", "/api/me")).data as MeResponse;
    expect(meL.situations.length === meA.situations.length && meL.situations.length > 0, `situacije: ${meL.situations.length} prema ${meA.situations.length}`);
    expect(meL.contracts.some((c) => c.status === "offered"), "kasni nema ponudu mjeseca");
    const late2 = new User("Kasni 2"); // ponovni ulaz izdaje novi token, pa dalje radi nova kutija kolačića
    const again = await late2.call("POST", "/api/join", joinBody(w.data.joinCode, "Kasni", "Hotel Kasni"));
    expect(again.data?.companyId === j.data.companyId, "ponovni ulaz dao drugi hotel");
    expectStatus(await p.call("POST", `/api/prof/${w.data.worldId}/round`, { fromRound: 1 }), 200);
    const after = (await late2.call("GET", "/api/me")).data as MeResponse;
    expect(after.world.round === 2 && after.finances.length === 1, `nakon zatvaranja: krug ${after.world.round}, obračuna ${after.finances.length}`);
    const full = await new User("Treći").call("POST", "/api/join", joinBody(w.data.joinCode, "Treći", "Hotel Treći kasni")); // igra za 2 je puna i kad traje
    expectStatus(full, 409);
  });

  console.log(failed ? `\n${failed} korak(a) palo` : "\nSve prošlo");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error("✗ smoke se srušio:", e); process.exit(1); });
