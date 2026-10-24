# Bugovi i lekcije

Aktivni gore, riješeni dolje (najnoviji riješeni na vrhu). Bug prijavi dokumentaristu porukom `[BUG]` jednim
retkom ([SESIJE.md](../workflow/SESIJE.md)) ili issueom.

**Format:** ID · status (🔴 otvoren · 🟡 u radu · ✅ riješen) · težina (kritičan / visok / srednji / nizak) ·
opis · uzrok · rješenje · **lekcija**.

---

## Aktivni

Bugove BUG-015 do 017 prijavio je tester produkcije (sesija koja samo testira, ne mijenja kod) u sub ~22:05.

### BUG-015 · Uvid u studenta: propuštena situacija piše „klik"
- **Status:** 🔴 otvoren (Rinova datoteka) · **Težina:** srednji (profesor misli da je student odabrao odgovor)
- **Opis:** student ostavi situaciju bez odgovora i završi mjesec; u uvidu (`/profesor/[worldId]/tvrtka/[id]`) ta
  situacija piše „klik · 1/5" umjesto „bez odgovora".
- **Uzrok:** `src/app/profesor/[worldId]/tvrtka/[id]/page.tsx:21`: sve što nije `mode === "own"` prikazuje se kao
  „klik".
- **Rješenje:** 🟨 čeka Rina (R8).
- **Lekcija:** kad stanje ima više od dvije vrijednosti, prikaži svaku izričito; „sve ostalo" pretvori rubni slučaj u
  laž na ekranu.

### BUG-016 · Krivi hrvatski u brojevima i rodu
- **Status:** 🔴 otvoren (Rinove datoteke) · **Težina:** nizak (žiri čita sučelje)
- **Opis:** (a) `/igra`, „Ponude grada": „1 nova ponuda i 0 aktivan ugovor", „0 nova ponuda i 1 aktivan ugovor"
  (`src/app/igra/page.tsx:87-88`); (b) uvid u studenta: „Razgovor s likom (2 poruka)" umjesto „2 poruke"
  (`tvrtka/[id]/page.tsx:129`); (c) „Završi mjesec" s jednom situacijom: „One vrijede 1 od 5" umjesto „Ona vrijedi"
  (`src/components/close-round.tsx:78`).
- **Uzrok:** broj se lijepi uz imenicu bez sklonidbe po broju (1, 2–4, 5+).
- **Rješenje:** 🟨 čeka Rina.
- **Lekcija:** tekst s brojem u hrvatskom treba oblike za 1, 2–4 i 5+ (0 ide kao 5+); provjeri ga s 0, 1, 2 i 5.

### BUG-017 · AI prijedlog situacije: područje kao sirovi ključ
- **Status:** 🔴 otvoren · **Težina:** nizak
- **Opis:** nakon spremanja AI prijedloga (`/profesor/[id]/situacije` → Nova situacija → Predloži AI-jem → Spremi) popis
  piše „recepcija · težina 3 od 5", a situacije iz banke „Recepcija i smještaj".
- **Uzrok:** 🟨 potvrditi: prikazuje se ključ područja umjesto naziva (stranica situacija je Simonova, AI nacrt
  graditeljev).
- **Rješenje:** 🟨 čeka vlasnika.
- **Lekcija:** ključ u podacima nije tekst za korisnika; naziv uvijek ide kroz isti popis oznaka.

### BUG-006 · `db:push` predlaže pražnjenje tablica `situations` i `contracts`
- **Status:** 🟡 zaobiđeno pravilom, alat nije popravljen · **Težina:** kritičan (gubitak podataka na zajedničkoj
  bazi), uhvaćeno prije upisa, podaci netaknuti
- **Opis:** sub ~16:25 `npm run db:push` (drizzle-kit) za L12 na zajedničkoj Neon bazi predlaže pražnjenje tablica
  `situations` (120 redaka) i `contracts` (40 redaka). Agent je stao prije potvrde.
- **Uzrok:** drizzle-kit krivo čita postojeća unique ograničenja i misli da tablice treba stvoriti iznova.
- **Rješenje:** nitko ne pokreće `db:push`; shema se mijenja ručnim aditivnim SQL-om koji pregleda Leonov graditelj
  ([ADR-026](DECISIONS.md#adr-026)).
- **Lekcija:** na bazi koju dijeli cijeli tim alat koji „usklađuje" shemu može predložiti brisanje. Svaku promjenu
  sheme pročitaj kao SQL prije upisa i radi samo dodavanja.

## Riješeni

### BUG-014 · Najviša cijena (400 €) je gotovo uvijek najisplativija
- **Status:** ✅ riješen 24.10. 22:14 ([#194](https://github.com/leonkreso784-bit/riihack/pull/194), Leonovo „spoji") · **Težina:** visok (žiri na obilasku 3 sam igra; igra bi učila krivo)
- **Opis:** Simonov issue [#162](https://github.com/leonkreso784-bit/riihack/issues/162), provjeren pravim
  `settleMarket` i `roundFinance`: uz 400 € hotel ima 48 % popunjenosti i 69.700 € dobiti u kolovozu, a uz
  referentnu cijenu (~90 €) 91 % i ~23.000 €. Tester potvrdio na produkciji (22:00): hotel 4★ sa 17 soba uz 400 € i
  5.000 € marketinga u lipnju ide s 20.000 € na 81.850 €, a susjed uz 70 € na 28.860 €.
- **Uzrok:** u `attractiveness` (`src/lib/engine/economy.ts`) faktor cijene je ograničen na 0,5 do 1,5. Iznad 2×
  referentne cijene više ne pada, pa hotel zadrži goste, a svaka noć donosi sve više.
- **Rješenje:** [ADR-043](DECISIONS.md#adr-043), [#194](https://github.com/leonkreso784-bit/riihack/pull/194): iznad
  referentne cijene faktor pada s kvadratom, iznad 2,5× je 0; test da je vrh prihoda između 80 i 150 € u sva 4
  mjeseca (416 testova). Poslije spajanja ponovni seed demo igre i smoke.
- **Lekcija:** granica koja štiti od ekstremnih vrijednosti može ukloniti kaznu baš ondje gdje treba. Uz motor drži
  test koji traži najbolju odluku i provjerava da ona ima smisla u stvarnom svijetu.

### BUG-018 · Čišćenje baze obrisalo testerovu igru usred testa
- **Status:** ✅ riješen pravilom ~22:05 (graditelj) · **Težina:** nizak (izgubljen testni napredak, ne demo)
- **Opis:** skripta za čišćenje (`--apply`, ~22:00) obrisala je testerove igre „QA 2150 glavni" i „QA proba tim" dok
  je tester testirao produkciju.
- **Uzrok:** graditelj nije javio testeru prije brisanja.
- **Rješenje:** prije svakog `--apply` graditelj javlja testeru.
- **Lekcija:** brisanje na zajedničkoj bazi najavi svima koji je koriste, i onima koji samo testiraju.

### BUG-013 · Provjera pada u mapi bez `npm ci` nakon promjene `package-lock.json`
- **Status:** ✅ riješen pravilom 24.10. ~21:15 (Leon) · **Težina:** nizak (lokalno, ne na `main`-u)
- **Opis:** provjera u Leonovoj mapi pala je jer u `node_modules` nije bilo paketa `better-auth` i `uqr`.
- **Uzrok:** nakon povlačenja koje je promijenilo `package-lock.json` (nove ovisnosti iz
  [#139](https://github.com/leonkreso784-bit/riihack/pull/139) i [#147](https://github.com/leonkreso784-bit/riihack/pull/147))
  nitko nije pokrenuo `npm ci`.
- **Rješenje:** nakon svakog povlačenja koje mijenja `package-lock.json` svi pokreću `npm ci`.
- **Lekcija:** ako se lock datoteka promijenila, lokalni `node_modules` više ne odgovara kodu; pokreni `npm ci` prije
  provjere, inače tražiš grešku koje u kodu nema.

### BUG-012 · Dva istodobna `POST /round`: drugi vraća 409 „Sezona je gotova"
- **Status:** ✅ riješen 24.10. 20:44 ([#166](https://github.com/leonkreso784-bit/riihack/pull/166); smoke na produkciji
  14/14) · **Težina:** srednji (dvoklik profesora mogao je preskočiti mjesec; dvostrukog obračuna nije bilo)
- **Opis:** smoke na produkciji (~20:25) jednom je pao na koraku 14: od dva istodobna zahtjeva za zatvaranje mjeseca
  drugi je dobio 409 „Sezona je gotova" umjesto 200.
- **Uzrok:** na Vercelu dva istodobna `POST /round` idu u dvije funkcije. Ako drugi pročita igru nakon prvog, vidi već
  otvoren sljedeći mjesec i otvori još jedan (preskočen mjesec); u zadnjem mjesecu dobije 409. Dvostruki obračun je
  spriječen (`settled_round`).
- **Rješenje:** novo neobavezno polje `OpenRoundRequest.fromRound`: ploča profesora šalje mjesec koji zatvara, a ako
  je igra taj mjesec već prešla, ruta vraća trenutno stanje bez prelaska. Smoke korak 14 provjerava i zakašnjeli klik.
- **Lekcija:** radnja koja pomiče stanje igre mora reći od kojeg stanja kreće; bez toga dvoklik ili ponovljeni zahtjev
  napravi dva koraka umjesto jednog.

### BUG-008 · Ime prijašnjeg projekta još je u repou
- **Status:** ✅ riješen 24.10. 20:13 (`git grep -i` po cijelom `main`-u: 0 pogodaka; provjerili integrator i
  dokumentarist) · **Težina:** srednji (žiri čita repo; pravilo tima je da se ime nigdje ne piše)
- **Opis:** ime je bilo u planu (`docs/superpowers/plans/2026-10-24-simpolis.md`, 9 redaka) i u komentarima koda
  (`src/app/globals.css` 2, `src/components/bottom-nav.tsx` 1, `src/components/panel.tsx` 1), te u porukama starih
  commitova.
- **Uzrok:** ime se koristilo kao kratica za izgled i bodovanje prije nego što je pravilo uvedeno.
- **Rješenje:** kod očišćen u [#107](https://github.com/leonkreso784-bit/riihack/pull/107) (19:58), plan u
  [#157](https://github.com/leonkreso784-bit/riihack/pull/157) (Rino, 20:13). Poruke starih commitova ostaju jer se
  povijest ne prepisuje (nema force pusha na `main`).
- **Lekcija:** ime koje ne smije u predaju ne smije ni u komentare i commitove od prvog dana; kad se pravilo uvede,
  odmah `git grep -i` po cijelom repou, ne samo po dokumentima.

### BUG-011 · L16 bez `BETTER_AUTH_SECRET`: stvaranje igre vraća 500
- **Status:** ✅ riješen 24.10. 20:06 (uhvaćeno u provjeri prije spajanja [#147](https://github.com/leonkreso784-bit/riihack/pull/147)) ·
  **Težina:** kritičan da je spojeno (profesor ne može napraviti igru)
- **Opis:** u provjeri #147 (~19:50) `POST /api/worlds` bez varijable `BETTER_AUTH_SECRET` vraća 500.
- **Uzrok:** Better Auth bez tajne baca grešku „default secret", iako igra s kodom računa ne treba.
- **Rješenje:** bez tajne `getProfUser` vraća `null`, pa stvaranje igre radi (smoke korak 1 ✅); dopuštene domene
  sužene na `riihack.vercel.app` i preview domene projekta. Ostaje: `/api/auth/*` vraća 500 dok varijable
  `BETTER_AUTH_*` nisu postavljene na Vercelu (🟨 čeka Leona).
- **Lekcija:** nova ovisnost s tajnom mora raditi i kad tajne nema, ako je značajka neobavezna; provjeri glavni tok
  bez nove env varijable prije spajanja.

### BUG-009 · Presuda vlastitog odgovora pada na rezervu: kvaliteta 3, bez obrazloženja
- **Status:** ✅ riješen 24.10. 18:07 ([#120](https://github.com/leonkreso784-bit/riihack/pull/120), Simon; 292 testa, smoke
  14/14) · **Težina:** visok (vlastiti odgovor je jezgra demoa; student ne dobije obrazloženje)
- **Opis:** u probi M2 (graditelj, ~18:00) odbijeno je 4 od 4 obrazloženja suca; nakon dva pokušaja `judge.ts` vraća
  `null`, pa motor uzima rezervnu kvalitetu 3.
- **Uzrok:** prompt suca traži obraćanje s „ti", a hrvatski perfekt u 2. licu traži rod, pa model piše „postavio/la".
  `judge.ts` takvo obrazloženje odbacuje (`SLASH_GENDER`) i s njim odbacuje i ispravno označene kriterije.
- **Rješenje:** presuda zadržava označene kriterije; kad stil obrazloženja dvaput ne prođe, obrazloženje se slaže iz
  rubrike (`judge.ts`, `prompts.ts`). Ista provjera postoji u `propose.ts` (S9), a #120 je ne mijenja; 🟨 provjeriti
  pada li prijedlog situacije na isti način.
- **Lekcija:** provjera stila ne smije baciti presudu. Kad prompt i provjera izlaza traže nešto što jezik teško daje
  zajedno, prvo izmjeri koliko odgovora prolazi na pravom pozivu.

### BUG-010 · Smoke integratora otišao na tuđi dev server, a integrator ga je ugasio
- **Status:** ✅ riješen 24.10. 18:02 · **Težina:** srednji (ugašen tuđi `next dev`; provjera #118 bila bi na
  krivom kodu)
- **Opis:** pri provjeri [#118](https://github.com/leonkreso784-bit/riihack/pull/118) port 3107 je bio zauzet
  (`EADDRINUSE`), integratorov server se nije podigao, pa je smoke išao na tuđi `next dev`. Integrator je taj proces
  ugasio; server je bio graditeljev, a proba M2 je tada već bila gotova, pa šteta nije nastala.
- **Uzrok:** port nije provjeren prije pokretanja, a pad pokretanja servera nije zaustavio smoke.
- **Rješenje:** smoke ponovljen na slobodnom portu 3917, 14/14; demo igra vraćena (`KVRNDM`, krug 2).
  Dogovor: graditelj koristi portove 3107 i 3199, integrator 3917.
- **Lekcija:** prije pokretanja provjeri je li port slobodan; ako se server ne podigne, smoke staje. Tuđi proces se
  ne gasi ([BUG-005](#bug-005--agent-je-pri-gašenju-dev-servera-pokušao-ugasiti-sve-nodeexe-procese)).

### BUG-007 · Profesorski kod demo igre bio je zadana vrijednost u javnom kodu
- **Status:** ✅ rizik uklonjen 24.10. ~17:25 (kod zamijenjen); popravak skripte spojen 17:50 ([#115](https://github.com/leonkreso784-bit/riihack/pull/115)) · **Težina:**
  visok (tko pročita javni repo mogao je upravljati demo igrom pred žirijem)
- **Opis:** `scripts/seed-demo.ts` je za `DEMO_PROF_CODE` imao zadanu vrijednost u čistom tekstu, koja se koristi
  kad varijabla nije postavljena. Našao dokumentarist pri provjeri `TESTING.md`.
- **Uzrok:** tajna je dobila zadanu vrijednost da skripta radi i bez `.env.local`.
- **Rješenje:** demo igra ponovno napravljena s novim tajnim kodom koji je samo u Leonovom `.env.local`; stari kod
  na produkciji vraća 404. #115 uklanja zadanu vrijednost, pa skripta bez `DEMO_PROF_CODE` pada. Kod igre ostaje javan
  po namjeni (njime se samo ulazi, [ADR-004](DECISIONS.md#adr-004)).
- **Lekcija:** zadana vrijednost tajne u javnom repou je javna tajna. Tajne se čitaju samo iz env-a, bez rezerve, a
  skripta bez njih staje.

### BUG-004 · Smoke korak 5 na `main`-u pada: „Ana ima 0 situacija"
- **Status:** ✅ riješen 24.10. 16:55 ([#75](https://github.com/leonkreso784-bit/riihack/pull/75)); smoke na `main`-u 14/14 · **Težina:** srednji (smoke na
  `main`-u crven; korisnik nije vidio jer je produkcija bila na lažnim podacima, [ADR-018](DECISIONS.md#adr-018))
- **Opis:** `npm run smoke` na `main`-u: nakon pokretanja igre student nema nijednu situaciju.
- **Uzrok:** `situations.json` je prazan dok se ne spoji L6. Kod nije neispravan: s #75 lokalno prolaze koraci 1–10.
- **Rješenje:** spojen #75 u valu M2 ([ADR-028](DECISIONS.md#adr-028)).
- **Lekcija:** smoke ovisi o sadržaju, ne samo o kodu. Kad su sadržaj i kod u različitim PR-ovima, crven smoke prvo
  provjeri ima li sadržaja.

### BUG-005 · Agent je pri gašenju dev servera pokušao ugasiti sve `node.exe` procese
- **Status:** ✅ riješen 24.10. u L8 (pokušaj odbijen, ništa nije ugašeno) · **Težina:** nizak (alat, ne proizvod),
  ali bi srušio dev servere i sesije ostalih
- **Opis:** pri gašenju svog dev servera agent je pokušao ubiti sve `node.exe` procese na računalu.
- **Uzrok:** agent nije znao PID svog servera, pa je posegnuo za svim procesima istog imena.
- **Rješenje:** pravilo za agente: dev server na vlastitom portu, gasi se samo taj proces ([SESIJE.md](../workflow/SESIJE.md#pravila-za-agente)).
- **Lekcija:** na računalu na kojem radi više sesija naredba „ugasi sve istog imena" nikad nije sigurna. Pokreni
  proces tako da znaš njegov port ili PID i gasi samo njega.

### BUG-003 · `/igra` na Vercelu vraća „Greška 404"
- **Status:** ✅ riješen 24.10. 14:14 ([#52](https://github.com/leonkreso784-bit/riihack/pull/52)) · **Težina:** visok (javni link za obilazak žirija)
- **Opis:** https://riihack.vercel.app/igra pokazuje „Greška 404".
- **Uzrok:** na Vercelu nije postavljen `NEXT_PUBLIC_USE_MOCK`, pa sučelje zove pravi `/api/me`, a ta ruta (L4) još
  ne postoji. Lokalno je radilo jer je `.env.local` imao varijablu.
- **Rješenje:** lažni podaci su zadani; `NEXT_PUBLIC_USE_MOCK=0` prebacuje na poslužitelj ([ADR-013](DECISIONS.md#adr-013)).
- **Lekcija:** zadana vrijednost mora raditi **bez** env varijable, jer Vercel nema tvoj `.env.local`. Javni link
  provjeri u pregledniku nakon svakog spajanja, ne samo lokalno.

### BUG-002 · `npm ci` na Linux CI-ju pada zbog lock datoteke s Windowsa
- **Status:** ✅ riješen 24.10. 13:23 (`998f2dc`, u [#37](https://github.com/leonkreso784-bit/riihack/pull/37)) · **Težina:** visok (CI crven, nema spajanja)
- **Opis:** `npm ci` na GitHub Actions (Linux) odbija instalaciju.
- **Uzrok:** `package-lock.json` generiran na Windowsu nije imao opcionalne pakete `@emnapi/core` i `@emnapi/runtime`
  koje Linux treba.
- **Rješenje:** uzet lock iste konfiguracije ovisnosti iz grane `simon/L0-kostur`, koji ih ima.
- **Lekcija:** lock datoteka ovisi o platformi na kojoj je nastala. Nakon promjene ovisnosti pričekaj CI na Linuxu
  prije spajanja; zeleno lokalno na Windowsu nije dokaz.

### BUG-001 · `main` crven: `roundGain` uveden kao obavezno polje
- **Status:** ✅ riješen 24.10. 14:04 ([#49](https://github.com/leonkreso784-bit/riihack/pull/49)) · **Težina:** kritičan (produkcijski build pada, nitko ne smije spajati)
- **Opis:** nakon spajanja #40 (13:52) `next build` na `main`-u pada na TypeScriptu; produkcijski deploy `c62bb99` ne prolazi.
- **Uzrok:** #45 (13:45) dodao je **obavezno** polje `LeaderboardRow.roundGain` u ugovor, a `mock.ts` iz #40 ga nema.
  Oba PR-a bila su zelena svaki za sebe, na različitim `main`-ovima.
- **Rješenje:** `roundGain` dodan u 5 lažnih redaka ljestvice (#49). Usporedni popravak #50 zatvoren kao duplikat.
- **Lekcija:** novo polje u ugovoru je **neobavezno** dok ga svi ne pune ([ADR-011](DECISIONS.md#adr-011)). Prije
  spajanja „Update branch" i CI na **svježem** `main`-u; nakon spajanja pogledaj CI na `main`-u
  ([TEAM.md](../../TEAM.md) pravila 2–4).
