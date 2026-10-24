# Bugovi i lekcije

Aktivni gore, riješeni dolje (najnoviji riješeni na vrhu). Bug prijavi dokumentaristu porukom `[BUG]` jednim
retkom ([SESIJE.md](../workflow/SESIJE.md)) ili issueom.

**Format:** ID · status (🔴 otvoren · 🟡 u radu · ✅ riješen) · težina (kritičan / visok / srednji / nizak) ·
opis · uzrok · rješenje · **lekcija**.

---

## Aktivni

### BUG-008 · Ime prijašnjeg projekta još je u repou
- **Status:** 🔴 otvoren (provjera `git grep -i` na `main`-u, sub ~17:40) · **Težina:** srednji (žiri čita repo;
  pravilo tima je da se ime nigdje ne piše)
- **Opis:** ime je još u planu (`docs/superpowers/plans/2026-10-24-simpolis.md`, 9 redaka) i u komentarima koda
  (`src/app/globals.css` 2, `src/components/bottom-nav.tsx` 1, `src/components/panel.tsx` 1), te u porukama starih
  commitova. Ostali dokumenti u `docs/` su čisti.
- **Uzrok:** ime se koristilo kao kratica za izgled i bodovanje prije nego što je pravilo uvedeno.
- **Rješenje:** 🟨 vlasnici datoteka zamjenjuju ime s „prijašnji projekt" (plan i kod: Leonov graditelj ili Rino);
  povijest commitova se ne prepisuje (nema force pusha na `main`).
- **Lekcija:** ime koje ne smije u predaju ne smije ni u komentare i commitove od prvog dana; kad se pravilo uvede,
  odmah `git grep -i` po cijelom repou, ne samo po dokumentima.

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

### BUG-007 · Profesorski kod demo igre bio je zadana vrijednost u javnom kodu
- **Status:** ✅ rizik uklonjen 24.10. ~17:25 (kod zamijenjen); popravak skripte u [#115](https://github.com/leonkreso784-bit/riihack/pull/115) · **Težina:**
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
