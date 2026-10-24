# Dnevnik napretka

Najnovije gore. Svaki unos: što je napravljeno, što je provjereno, što slijedi. Tko što radi **sada** je na ploči u
[TEAM.md](../../TEAM.md), ne ovdje. Spojeni PR-ovi po prekretnicama: [CHANGELOG.md](CHANGELOG.md).
Vremena su lokalna (CEST).

---

## Sub 24.10. 20:44 · knjižnica situacija, popravak dvoklika

- **Spojeno (Leonovo izravno „spoji"):** L17 knjižnica situacija (#165; tri rute, samo vlasnik, bez prijave 401) i
  popravak dvoklika na zatvaranju mjeseca (#166,
  [BUG-012](BUGS.md#bug-012--dva-istodobna-post-round-drugi-vraća-409-sezona-je-gotova) riješen); dokumentacija #167.
  384 testa, smoke na produkciji 14/14.
- **Čeka:** #169 L16 ekrani računa (mijenja tri Rinove datoteke; Rinov ok ili Leonovo „spoji").

## Sub 24.10. 20:30–20:45 · izvještaj mjeseca i pošta u sučelju

- **Spojeno:** Rinov R7 izvještaj mjeseca i sokratski mentor (#160, 20:35) i R13 pošta s protuponudom (#164, 20:40;
  lažni podaci koriste pravi motor pregovora, 376 testova); dokumentacija #161 i #163.
- **Shema L17 (graditelj):** tablica `library_situations` (veza na `user`, briše se s korisnikom) aditivnim SQL-om;
  korisnika 10 prije i poslije ([ADR-036](DECISIONS.md#adr-036), knjižnica situacija).

## Sub 24.10. 20:15–20:30 · profesorski računi na produkciji

- **Odluka (Leon, ~20:20):** prijava profesorskim računom radi i na produkciji. Integrator je na Leonovo izravno „da"
  postavio `BETTER_AUTH_*` na Vercelu; produkcija READY ~20:25, a registracija, prijava, odjava, „moje igre", ulaz
  kodom i smoke 14/14 provjereni ([ADR-036](DECISIONS.md#adr-036)).
- **Smoke na produkciji** jednom pao na koraku 14 zbog dva istodobna zatvaranja kruga
  ([BUG-012](BUGS.md#bug-012--dva-istodobna-post-round-drugi-vraća-409-sezona-je-gotova), nije hitno).
- **Spojeno:** dokumentacija #159 (20:17).

## Sub 24.10. 20:10–20:15 · repo bez imena prijašnjeg projekta

- **Spojeno:** Simonov zapis obilaska 2 i dopuna opsega u `PROMISE.md` (#150, 20:11), Rinovo čišćenje plana (#157,
  20:13, Leonovo „spoji"), dokumentacija #158 (20:10). Otvorenih PR-ova nema.
- **BUG-008 riješen:** `git grep -i` po cijelom `main`-u daje 0 pogodaka
  ([BUG-008](BUGS.md#bug-008--ime-prijašnjeg-projekta-još-je-u-repou)).

## Sub 24.10. 20:00–20:10 · profesorski računi i AI agent agencije na `main`-u

- **Spojeno u 20:06 (sve na Leonovo izravno „spoji"):** L16 profesorski računi (#147) po
  [ADR-036](DECISIONS.md#adr-036), S11 AI agent agencije (#154) po [ADR-033](DECISIONS.md#adr-033),
  `scripts/lock-merge.py` (#155), dokumentacija #156. Zajedno 375 testova, smoke 14/14, CI zelen, produkcija READY.
- **BUG-011 riješen:** igra s kodom radi i bez `BETTER_AUTH_SECRET`
  ([BUG-011](BUGS.md#bug-011--l16-bez-better_auth_secret-stvaranje-igre-vraća-500)).
- **Čeka Leona:** varijable `BETTER_AUTH_*` na Vercelu; dok ih nema, `/api/auth/*` vraća 500 i prijava računom ne radi.

## Sub 24.10. 19:50–20:00 · L15 i karta grada na `main`-u, predaja sesija

- **Obilazak žirija 2 (~19:00):** 3 minute aplikacije uživo, odgovor pozitivan, bez primjedbi i bez novih zahtjeva.
  Leon: žiri je ostao bez riječi, reakcija „wow"; na sve što smo rekli i na svako njihovo pitanje imali smo dobar
  odgovor, pa nisu našli primjedbu.
  Za nedjelju: na obilasku 3 žiri sam isprobava aplikaciju (Simonov zapis u `PROMISE.md`, #150).
- **Spojeno:** L15 pošta i pregovaranje (#148, 19:54) po [ADR-033](DECISIONS.md#adr-033); Rinove detaljnije
  Financije, Plan i Odjeli (#142, 19:54; Leonovo izravno „spoji" umjesto Simonovog ok); Rinov QR kod ulaza na
  čekaonici (#151) i „Završi mjesec" (#152, R4); karta grada kao izometrijska društvena igra (#128, 19:58; dovršio
  Simon jer je Rino bio zauzet, Rino odobrio); kraći komentari bez imena prijašnjeg projekta (#107, 19:58);
  dokumentacija #153. Zajedno 361 test, smoke 14/14, CI 5/5, produkcija READY.
- **Shema vala 3 (sve ručno, aditivno, [ADR-026](DECISIONS.md#adr-026)):** `plans.investments`,
  `finances.investments` i `breakdown`, tablice Better Autha i `worlds.owner_id`, `mail` i stupci pregovaranja u
  `contracts`.
- **Otvoreno:** L16 profesorski računi (#147; bez `BETTER_AUTH_SECRET` stvaranje igre vraćalo 500,
  [BUG-011](BUGS.md#bug-011--l16-bez-better_auth_secret-stvaranje-igre-vraća-500), popravak se provjerava), S11 AI
  agent agencije (#154), Simonov zapis obilaska 2 (#150).
- **Za sljedeće sesije (graditelj):** L17 knjižnica, L18 poruke među hotelima, L19 suradnja, L8 demo i smoke za val 3;
  prije predaje `git grep -i` za ime prijašnjeg projekta. Plan čisti Rino
  ([BUG-008](BUGS.md#bug-008--ime-prijašnjeg-projekta-još-je-u-repou)).

## Sub 24.10. 19:40–19:50 · L15 i L16 u PR-ovima, tjedni krug odgođen

- **Spojeno:** dokumentacija #149 (19:42).
- **U PR-ovima:** L15 pošta i pregovaranje (#148; 331 test, smoke 14/14, čeka Leonovo „spoji"), L16 profesorski
  računi (#147; sukob u `src/db/schema.ts`, graditelj radi rebase).
- **Odluka (Leon, ~19:50):** tjedni krug ide u kasnije planiranje, zasad se ne radi ([BACKLOG.md](BACKLOG.md)).

## Sub 24.10. 19:30–19:40 · raspodjela troškova, shema pošte

- **Spojeno:** raspodjela prihoda i troškova u obračunu mjeseca (#144, 19:39, Leonovo „spoji"; zbrojevi motora
  nepromijenjeni, 308 testova, smoke 14/14), dokumentacija #146. Rinov #142 tako može prikazati pravu raspodjelu
  umjesto marketinga kao ostatka.
- **Shema L15 (graditelj, ~19:31):** tablica `mail` (prazna) i u `contracts` stupci za protuponudu i dogovorenu cijenu
  te `negotiated` (zadano `false`); `contracts` 271 redak prije i poslije ([ADR-033](DECISIONS.md#adr-033)).

## Sub 24.10. 19:20–19:30 · javni profil hotela, shema računa

- **Spojeno:** L14 javni profil hotela (#143, 19:27; testni podaci popravljeni, 307 testova, smoke 14/14) po
  [ADR-035](DECISIONS.md#adr-035); dokumentacija #145.
- **Shema L16 (graditelj, ~19:25):** tablice `user`, `session`, `account`, `verification` i `worlds.owner_id` (prazan)
  aditivnim SQL-om; `worlds` 112 redaka prije i poslije ([ADR-036](DECISIONS.md#adr-036)).
- **Otvoreno:** #144 raspodjela prihoda i troškova u obračunu (čeka Leonovo „spoji"), #142 (Simonov ok), #128 (Rinov
  pregled), #107 (pregled).

## Sub 24.10. 19:05–19:20 · plan vala 3 na `main`-u, stranica odjela

- **Spojeno:** plan vala 3 (#134, 19:16, Leonovo „spoji"), paket `uqr` za QR ulaza (#139, 19:16; `npm ci` prolazi),
  Rinova stranica odjela R11 (#135, 19:12; 301 test), dokumentacija #140.
- **Shema (graditelj, ~19:17):** `finances.breakdown` (jsonb, NULL) aditivnim SQL-om ([ADR-026](DECISIONS.md#adr-026)).
- **Odluka (Leon, ~19:20):** skicu karte #128 prvo pregledava i prilagođava Rino; problemi se rješavaju nakon toga.
- **Otvoreno:** #143 L14 javni profil (CI crven: testni podaci bez `investments`, javljeno graditelju); #142 Rinove
  detaljnije Financije i Plan (čeka Simonov ok, mijenja Simonove stranice); #107 (čeka Rinov ok); #128 (Rino).

## Sub 24.10. 18:50–19:05 · odjeli na `main`-u, ulaz poveznicom

- **Spojeno:** ugovor odjela (#132, 18:54, Leonovo „spoji") i motor odjela L13 (#137, 18:59; 301 test, smoke 14/14),
  pa odjeli imaju pravo ulaganje ([ADR-032](DECISIONS.md#adr-032)). Rinov `/ulaz?kod=…` (#138, 18:59), dokumentacija
  #136. Produkcija READY.
- **Čeka Leona:** plan vala 3 (#134); paket `uqr` za QR na profesorovoj čekaonici (drugi dio #138).

## Sub 24.10. ~18:50 · val 3

- **Odluke (Leon):** pošta s agencijama i pregovaranje ([ADR-033](DECISIONS.md#adr-033)), poruke i suradnja među
  hotelima ([ADR-034](DECISIONS.md#adr-034)), tuđi hotel samo s javnim podacima ([ADR-035](DECISIONS.md#adr-035)),
  profesorski računi ([ADR-036](DECISIONS.md#adr-036)).
- **Plan vala 3** (zadaci L13–L19, S10–S12, R11–R15) u [#134](https://github.com/leonkreso784-bit/riihack/pull/134),
  čeka spajanje.
- **Spojeno:** Simon uskladio ROADMAP i pitch s ADR-031 (#131), dokumentacija #133.

## Sub 24.10. 18:35–18:50 · bez zamrzavanja, odjeli s ulaganjem, popravci pred obilazak 2

- **Odluke (Leon):** nema zamrzavanja koda, gradi se do predaje ([ADR-031](DECISIONS.md#adr-031)); odjeli s pravim
  ulaganjem kroz budžet u planu mjeseca ([ADR-032](DECISIONS.md#adr-032)).
- **Spojeno:** Rinovi popravci prije obilaska M2 (#127, 18:36; dvije boje upisane izravno, ne kroz tokene), Simonov
  S8 playbook i AI prijedlog na stranici situacija (#129, 18:45; 292 testa), dokumentacija #130.
- **Odjeli:** shema dodana aditivnim SQL-om (graditelj); ugovor #132 čeka Leonovo „spoji". Slijede motor i API
  (graditelj) i stranica odjela (Rino).

## Sub 24.10. 18:10–18:30 · pred obilazak 2

- **Ime prijašnjeg projekta:** čisti Rino; kod u #107, plan slijedi
  ([BUG-008](BUGS.md#bug-008--ime-prijašnjeg-projekta-još-je-u-repou)).
- **Playbook u S8:** Leon dao Simonu ok za `exportPlaybook` i `importPlaybook` u `client.ts`
  ([ADR-027](DECISIONS.md#adr-027)).
- **Spojeno:** dokumentacija #123, #124.

## Sub 24.10. 17:55–18:10 · proba M2, AI prijedlog za profesora

- **Proba M2 (graditelj):** sudac odbija obrazloženja s „/la", vlastiti odgovor pada na kvalitetu 3
  ([BUG-009](BUGS.md#bug-009--presuda-vlastitog-odgovora-pada-na-rezervu-kvaliteta-3-bez-obrazloženja)); Simon
  popravio u #120 (18:07; 292 testa, smoke 14/14, produkcija READY).
- **Spojeno:** L12 AI prijedlog situacije za profesora (#118, 18:02; 290 testova, smoke 14/14, produkcija READY,
  ruta bez kolačića 403), dokumentacija #117 i #119.
- **Incident:** integratorov smoke otišao na tuđi dev server koji je zatim ugašen
  ([BUG-010](BUGS.md#bug-010--smoke-integratora-otišao-na-tuđi-dev-server-a-integrator-ga-je-ugasio)).

## Sub 24.10. 17:50–17:52 · produkcija na pravim podacima

- **Spojeno:** #115 profesorski kod demo igre samo iz `.env.local` (17:50; typecheck, lint, 284 testa, build i CI
  zeleni), #116 dokumentacija (17:51).
- **Produkcija na pravim podacima od ~17:52** ([ADR-030](DECISIONS.md#adr-030)): `/`, `/ulaz`, `/igra`,
  `/profesor` vraćaju 200; `/api/me` bez kolačića 401; `/api/join` s krivim kodom 404.
- **Slijedi:** proba M2 na pravim podacima (graditelj), obilazak 2 u 18:45.

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
