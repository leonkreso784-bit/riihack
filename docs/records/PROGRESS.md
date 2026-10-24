# Dnevnik napretka

Najnovije gore. Svaki unos: što je napravljeno, što je provjereno, što slijedi. Tko što radi **sada** je na ploči u
[TEAM.md](../../TEAM.md), ne ovdje. Spojeni PR-ovi po prekretnicama: [CHANGELOG.md](CHANGELOG.md).
Vremena su lokalna (CEST).

---

## Sub 24.10. 17:12–17:40 · S9, osoblje, produkcija na pravim podacima

- **Spojeno:** S9 AI prijedlog situacije i mentor s obračunom mjeseca (#111, 17:15), osoblje po odjelima i poveznica
  „Situacije" (#113, 17:18), dokumentacija M3 (#114). Na `main`-u svi L-zadaci (L0–L12), smoke 14/14, 272 testa.
- **Produkcija:** integrator dobio dozvole i postavio `NEXT_PUBLIC_USE_MOCK=0` za Production (~17:40); pravi podaci
  vidljivi nakon builda s #115 ([ADR-030](DECISIONS.md#adr-030)).
- **Ime prijašnjeg projekta:** još u planu i u tri datoteke koda
  ([BUG-008](BUGS.md#bug-008--ime-prijašnjeg-projekta-još-je-u-repou)).
- **Nove sesije:** graditelj, integrator i dokumentarist ponovno pokrenuti; graditelj kreće s probom M2 na pravim
  podacima.
- **Otvoreno:** #115 (tajni kod demo igre), #116 (dokumentacija), #107 (kraći komentari u sučelju, čeka Rinov ok).

## Sub 24.10. ~17:25 · tajni kod demo igre

- Profesorski kod demo igre bio je zadana vrijednost u javnom kodu; demo igra ponovno napravljena s novim tajnim
  kodom, stari vraća 404, skripta više nema zadanu vrijednost (#115)
  ([BUG-007](BUGS.md#bug-007--profesorski-kod-demo-igre-bio-je-zadana-vrijednost-u-javnom-kodu)).

## Sub 24.10. 16:50–17:10 · val M2 spojen

- **Val M2** ([ADR-028](DECISIONS.md#adr-028)), na Leonovo izravno „da": #88 L11 faza B (16:50) → #89 ugovor (16:52)
  → #75 L6 (16:55) → #96 odjava (16:59) → #95 L12 (17:06). Nakon svakog koraka testovi (196, nakon L6 220), CI na
  `main`-u, Vercel i produkcija zeleni; smoke 14/14 (`SMOKE_CITY=1`) nakon #75
  ([BUG-004](BUGS.md#bug-004--smoke-korak-5-na-main-u-pada-ana-ima-0-situacija) riješen).
- **Usporedno spojeno:** R6 profesorova ploča uživo (#108), S8 sučelje za profesorove situacije (#109).
- **M3 spojen iza vala (17:09–17:12):** playbook (#100), demo igra (#103), promjena ocjene mentora (#104). Testovi
  196 → 272, smoke 14/14 i nakon #104, produkcija bez ijednog 5xx.
- **Slijedi:** proba M2 na pravim podacima, pa prave podatke i na produkciji ([ADR-029](DECISIONS.md#adr-029)).

## Sub 24.10. 16:15–16:50 · M2 val spreman, M3 gotov iza njega

- **Spojeno:** R5 situacija s likom (#97), predstavljanje na `/` i ulaz na `/ulaz` (#93), logo (#91), jednostavniji
  pitch (#99).
- **Val M2 čeka Leonovo „da"** ([ADR-028](DECISIONS.md#adr-028)): #88 L11 faza B (smoke 14/14) → #89 ugovor → #75
  L6 → #95 L12 (smoke 14/14) → #96 odjava.
- **M3 gotovo, čeka iza vala:** playbook (#100; neispravan uvoz → 400 bez upisa), demo igra (#103,
  `npm run seed:demo`: 5 hotela, lipanj obračunat, 2 ugovora, profesorova situacija zakazana za srpanj, krug 2
  otvoren), promjena ocjene mentora (#104; pomak pokazatelja točno jednom, i na izvještaju).
- **Shema** samo ručnim aditivnim SQL-om ([ADR-026](DECISIONS.md#adr-026)): `custom_situations`, `dispatches`,
  `worlds.auto_draw`, `answers.overridden`; broj redaka nepromijenjen nakon svake izmjene.
- **Slijedi:** proba M2 na pravim podacima, pa prave podatke i na produkciji ([ADR-029](DECISIONS.md#adr-029)).
  Simon: S8 sučelje, `getTemplate` u `mentor-input.ts`. Rino: R6, R4, poveznica „Situacije", R5 bez opcija.

## Sub 24.10. 15:45–16:15 · obilazak žirija 1 i profesor kao glavni

- **Žiri 1 (~15:45):** prošli smo. Borna Sila: temelj neka bude stabilna softverska mehanika, ne AI agenti; pohvala
  partnerstvu tvrtki i fakulteta. Simon je upisao komentare i odgovor u pitch (#86).
- **Odluke (Leon s timom, ~16:15):** jezgra odvojena od AI-ja, profesor je glavni ([ADR-023](DECISIONS.md#adr-023));
  novi zadaci L12, S8 i S9 za profesorove situacije ([ADR-024](DECISIONS.md#adr-024)); ugovor i redoslijed spajanja
  ([ADR-025](DECISIONS.md#adr-025)). PRD dopunjen kriterijima za M2 i M3.
- **~16:25:** `db:push` predložio pražnjenje tablica, uhvaćeno prije upisa
  ([BUG-006](BUGS.md#bug-006--dbpush-predlaže-pražnjenje-tablica-situations-i-contracts)); od sada samo ručni aditivni
  SQL ([ADR-026](DECISIONS.md#adr-026)).
- **~16:35, playbook:** lagana verzija za M3, izvoz i uvoz bez mijenjanja mehanike ([ADR-027](DECISIONS.md#adr-027)).
  Krenuli M3 zadaci: L8 demo igra, L12 promjena ocjene mentora (`answers.overridden` ručnim SQL-om), L12 playbook.
- **~16:35:** Rino dao „ok" za S8 u `client.ts` i `mock.ts`; ugovor za profesorove situacije je #89 (čeka Leona);
  Rinov prijedlog „playbooka" čeka odluku ([BACKLOG.md](BACKLOG.md)); `docs/ROADMAP.md` ažurira Simon.
- **Stanje gradnje:** na `main`-u L0–L5, L7, L8 smoke 1–10, L9, L10, L11 faza A, S3, S4. U izradi L11 faza B. Čeka
  Leona: L6 (#75).

## Sub 24.10. 15:10–16:00 · L7, L8, L11, S3, S4

- **Leon:** L8 smoke koraci 1–10 (#81, 15:23), L11 faza A, logika grada i rute za plan, ugovore,
  obračun i vijesti (#82, 15:28; spajanje u igru je faza B), L7 krugovi, odgovori s presudom, zatvaranje kruga i uvid (#83, 15:40). Odluke za L11 fazu B: vijesti
  bez sklonidbe ([ADR-021](DECISIONS.md#adr-021)) i smoke korak 11 s 300 € ([ADR-022](DECISIONS.md#adr-022)).
- **Simon:** S3 lik i ruta chat (#76, 15:12), S4 sokratski mentor (#79, 15:20).
- **Rino:** uspravan logo, gumb Odjava, mobitel bez prelijevanja (#78).
- **Agenti:** pokušaj gašenja svih `node.exe` odbijen; novo pravilo za dev server
  ([BUG-005](BUGS.md#bug-005--agent-je-pri-gašenju-dev-servera-pokušao-ugasiti-sve-nodeexe-procese)).
- **Otvoreno:** L6 situacije (#75, čeka Leonov pregled; o njemu ovisi BUG-004).

## Sub 24.10. ~15:20 · smoke 1–10

- **Smoke:** na `main`-u pada korak 5 jer nema situacija do L6; s #75 lokalno prolaze koraci 1–10
  ([BUG-004](BUGS.md#bug-004--smoke-korak-5-na-main-u-pada-ana-ima-0-situacija)).
- **Dokumentacija:** ADR-018 do 020 na `main`-u ([#80](https://github.com/leonkreso784-bit/riihack/pull/80)), dopuna koja nije stigla u #77.

## Sub 24.10. 15:00–15:10 · L4 živ, motor B i C

- **Leon:** L4 API ulaza, profesora i soba (#74, 15:09): `/api/me` bez kolačića vraća 401, dakle ruta postoji. Motor
  B (L5, #70) i motor C s ekonomijom grada (L9, #68) te sadržaj gradskih tvrtki (L10, #69).
- **Simon:** pitch i obilazak (#67), tema učenja (#72). Otvoren S3 lik i ruta chat (#76).
- **Rino:** animacije sučelja (#73).
- **Dokumentacija:** na `main`-u (#71).
- **Odluke:** ugovor i L6 spajaju se samo na Leonovo „spoji" ([ADR-017](DECISIONS.md#adr-017)); pravi podaci samo
  na Previewu ([ADR-018](DECISIONS.md#adr-018)); smoke 1–10 usporedno s L7 ([ADR-019](DECISIONS.md#adr-019));
  odgovori za S3 ([ADR-020](DECISIONS.md#adr-020)); stanje PR-ova vodi samo integrator ([ADR-015](DECISIONS.md#adr-015)).
- **Otvoreno:** #75 L6 situacije (čeka Leona), #76 S3.

## Sub 24.10. 14:35–15:00 · baza živa, L1–L3, R1–R3

- **Leon:** Neon baza `simpolis-db` (Frankfurt, besplatni plan) preko Vercel Marketplacea, `DATABASE_URL` na Vercelu
  za sva tri okruženja; L1 shema i zajednički upiti (#62, 14:44), 11 tablica u bazi. Odluka o #42
  ([ADR-016](DECISIONS.md#adr-016)), PR #63 otvoren.
- **Rino:** R1 ulaz kao Kahoot i čekaonica (#54, 14:38).
- **Simon:** slajdovi obilaska žirija (#55) i Rinov tok demoa nakon R1 (#61).
- **Dokumentacija:** #58 spojen, vraćen s #60, pa ponovno na `main` jer po njoj grade ljudi i agenti ([ADR-015](DECISIONS.md#adr-015)).
- **Vercel:** Rino prihvatio pozivnicu u Vercel tim (Leon, ~15:00), pa mu rade `vercel link` i `vercel env pull`.
- **Spojeno do 15:00:** L2 motor A (#59), L3 banka od 6 hotela (#64), R2 profesor (#56), R3 sobe (#57), logo (#65),
  pitch (#66), ugovor lika (#63). Integrator od sada spaja automatski sve što prođe provjeru ([ADR-015](DECISIONS.md#adr-015)).
- **Slijedi:** L4 (#7), API ulaza i profesora, da M1 radi na pravim podacima.

## Sub 24.10. ~14:30 · tri sesije, dokumentacija

Leon pokreće tri Claude sesije: graditelj, integrator, dokumentarist ([ADR-015](DECISIONS.md#adr-015),
[SESIJE.md](../workflow/SESIJE.md)). Dokumentarist gradi strukturu `docs/` (#58).
**Otvoreno:** #42 tipovi lika (čeka Leonovu odluku), #54 R1 ulaz, #55 slajdovi žirija. **Čeka se:** Neon baza
(`DATABASE_URL`), zatim L1–L4 za prave podatke.

## Sub 24.10. 13:30–14:25 · prema M1: sučelje, AI, grad, ploča tima

- **Rino:** R0 ljuska, tema i klijent s lažnim podacima (#40, 13:52); popravak `roundGain` u lažnoj ljestvici (#49,
  14:04, [BUG-001](BUGS.md#bug-001--main-crven-roundgain-uveden-kao-obavezno-polje)); lažni podaci zadani na Vercelu
  (#52, 14:14, [BUG-003](BUGS.md#bug-003--igra-na-vercelu-vraća-greška-404)). Kreće na R1–R3 na lažnim podacima.
- **Simon:** S1 AI temelj (#41) i S2 presuda po rubrici (#44), 13:55; S5 karta grada, vijesti, radar (#48) i S6 plan
  kruga, financije, ponude (#47), 14:14; roadmap do predaje (#43) i plan obilaska žirija 1 (#51).
  `ANTHROPIC_API_KEY` na Vercelu.
- **Leon:** ugovor za osoblje hotela i `roundGain` (#45, 13:45, [ADR-012](DECISIONS.md#adr-012)); gamifikacija #31
  prihvaćena ([ADR-009](DECISIONS.md#adr-009)); ploča tima u `TEAM.md` (#53, 14:11, [ADR-014](DECISIONS.md#adr-014))
  s pravilima suradnje naučenima toga dana.
- **Provjereno:** CI zelen na `main`-u nakon #49.
- **Slijedi:** Neon baza, L1–L3 usporedno s agentima, zatim L4 (API ulaza i profesora) za M1.

## Sub 24.10. 12:45–13:30 · M0 temelj

- **Leon:** L0 kostur iz startera, ugovor tipova (`types.ts` doslovno iz plana), `rules.ts`, Vitest, CI (#37, 13:29);
  Simonov #36 zatvoren ([ADR-010](DECISIONS.md#adr-010)). Popravak lock datoteke za Linux CI
  ([BUG-002](BUGS.md#bug-002--npm-ci-na-linux-ci-ju-pada-zbog-lock-datoteke-s-windowsa)).
- **Simon:** tri obećanja za žiri (`PROMISE.md`, #35) i nacrt pitcha, skraćen na 5 minuta (#38).
- **Provjereno:** M0 ✅ 13:30: https://riihack.vercel.app, CI zelen ([TEAM.md](../../TEAM.md) › Prekretnice).

## Sub 24.10. 11:52–12:40 · ideja, arhitektura, plan

- **Leon:** prvi commit (11:52) s dokumentacijom Simpolisa; ulaz kao Kahoot i banka hotela; Neon umjesto Supabasea
  ([ADR-005](DECISIONS.md#adr-005)); plan izvedbe sa zadacima L0–L8, S0–S7, R0–R9 (12:09); grad i prava ekonomija u
  srži, zadaci L9–L11 (12:36, [ADR-008](DECISIONS.md#adr-008)).
- **Rino:** dva kruga napomena na arhitekturu (#2, 12:25): profesorski kod izvan adrese, dvostruko zatvaranje kruga,
  polling umjesto Realtimea, `serverNow`, mentor izvan zatvaranja, `db.batch`
  ([ADR-003](DECISIONS.md#adr-003), [004](DECISIONS.md#adr-004), [006](DECISIONS.md#adr-006), [007](DECISIONS.md#adr-007)).
- **Simon:** prijedlog gamifikacije R10 i napretka kao normaliziranog dobitka (#31).
