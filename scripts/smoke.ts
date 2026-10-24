// Smoke provjera toka igre preko HTTP-a. Pokretanje: npm run smoke (BASE_URL, zadano http://localhost:3000).
// SMOKE_CITY=1 uključuje korake 11–14 (grad, čeka L11). Izlazni kod 1 ako ijedan korak padne.
import type {
  AnswerView, CreateWorldResponse, JoinResponse, MeResponse, ProfStateResponse, RoundReportView, SituationView,
} from "../src/lib/types";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const CITY = process.env.SMOKE_CITY === "1";

// Odgovori API-ja se čitaju bez shema; tipovi ugovora stavljaju se na mjestu upotrebe.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = { status: number; data: any };

// Svaki "korisnik" ima svoju kutiju kolačića (Node fetch ih ne pamti).
class User {
  private jar = new Map<string, string>();
  constructor(readonly label: string) {}
  async call(method: string, path: string, body?: unknown): Promise<Res> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["content-type"] = "application/json";
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

let failed = 0;
const done = new Set<number>();
async function step(n: number, name: string, needs: number[], fn: () => Promise<void>) {
  const missing = needs.filter((d) => !done.has(d));
  if (missing.length) { console.log(`– ${n} ${name}: preskočeno (treba korak ${missing.join(", ")})`); return; }
  try { await fn(); done.add(n); console.log(`✓ ${n} ${name}`); }
  catch (e) { failed++; console.log(`✗ ${n} ${name}: ${e instanceof Error ? e.message : String(e)}`); }
}
function skipped(n: number, name: string) { console.log(`– ${n} ${name}: preskočeno (čeka L11)`); }

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

  await step(8, "vlastiti odgovor od 15 znakova → 400", [5], async () => {
    const r = await ana.call("POST", `/api/situations/${anaSits[1].id}/answer`, { text: "x".repeat(15), pastedChars: 0 });
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

  // Grad (nakon L11): koraci 11–14 samo uz SMOKE_CITY=1.
  const cityStep = async (n: number, name: string, needs: number[], fn: () => Promise<void>) =>
    CITY ? step(n, name, needs, fn) : skipped(n, name);
  const finances = async (u: User) => ((await u.call("GET", "/api/me")).data as MeResponse).finances;

  await cityStep(11, "cijena 60 € daje Ani više noćenja nego Ivanu po 150 €", [10], async () => {
    expectStatus(await ana.call("POST", "/api/me/plan", { price: 60, marketing: 0 }), 200);
    expectStatus(await ivan.call("POST", "/api/me/plan", { price: 150, marketing: 0 }), 200);
    expectStatus(await prof.call("POST", `/api/prof/${world.worldId}/round`, {}), 200);
    const a = (await finances(ana)).find((f) => f.round === 2), i = (await finances(ivan)).find((f) => f.round === 2);
    expect(a && i, "nema finances za krug 2");
    expect(a.nights > i.nights, `Ana ${a.nights} noćenja, Ivan ${i.nights}`);
  });

  await cityStep(12, "cash = početni račun + dobit iz finances", [11], async () => {
    const me = (await ana.call("GET", "/api/me")).data as MeResponse;
    const profit = me.finances.reduce((s, f) => s + f.profit, 0);
    expect(me.company.cash === me.company.startCash + profit, `cash ${me.company.cash} ≠ ${me.company.startCash} + ${profit}`);
  });

  await cityStep(13, "prihvaćen ugovor agencije → contractNights > 0", [11], async () => {
    const me = (await ana.call("GET", "/api/me")).data as MeResponse;
    const offer = me.contracts.find((c) => c.status === "offered");
    expect(offer, "nema ponuđenog ugovora");
    expectStatus(await ana.call("POST", `/api/contracts/${offer.id}/decide`, { accept: true }), 200);
    expectStatus(await prof.call("POST", `/api/prof/${world.worldId}/round`, {}), 200);
    const f = (await finances(ana)).at(-1);
    expect(f && f.contractNights > 0, `contractNights ${f?.contractNights}`);
  });

  await cityStep(14, "dvostruki obračun: dva istovremena zatvaranja mjeseca", [13], async () => {
    const roundOf = async () => ((await prof.call("GET", `/api/prof/${world.worldId}`)).data as ProfStateResponse).world.round;
    const before = await roundOf();
    await Promise.all([prof.call("POST", `/api/prof/${world.worldId}/round`, {}), prof.call("POST", `/api/prof/${world.worldId}/round`, {})]);
    const after = await roundOf();
    expect(after === before + 1, `krug ${before} → ${after}`);
    const rounds = (await finances(ana)).map((f) => f.round);
    expect(new Set(rounds).size === rounds.length, `dupli retci u finances: ${rounds.join(",")}`);
  });

  console.log(failed ? `\n${failed} korak(a) palo` : "\nSve prošlo");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error("✗ smoke se srušio:", e); process.exit(1); });
