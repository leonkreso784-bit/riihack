# Bugovi i lekcije

Aktivni gore, riješeni dolje (najnoviji riješeni na vrhu). Bug prijavi dokumentaristu porukom `[BUG]` jednim
retkom ([SESIJE.md](../workflow/SESIJE.md)) ili issueom.

**Format:** ID · status (🔴 otvoren · 🟡 u radu · ✅ riješen) · težina (kritičan / visok / srednji / nizak) ·
opis · uzrok · rješenje · **lekcija**.

---

## Aktivni

### BUG-006 · `db:push` predlaže pražnjenje tablica `situations` i `contracts`
- **Status:** 🟡 zaobiđeno pravilom, alat nije popravljen · **Težina:** kritičan (gubitak podataka na zajedničkoj
  bazi), uhvaćeno prije upisa, podaci netaknuti
- **Opis:** sub ~16:25 `npm run db:push` (drizzle-kit) na zajedničkoj Neon bazi predlaže pražnjenje tablica
  `situations` i `contracts`.
- **Uzrok:** drizzle-kit krivo čita postojeća unique ograničenja i misli da tablice treba stvoriti iznova.
- **Rješenje:** nitko ne pokreće `db:push`; shema se mijenja ručnim aditivnim SQL-om koji pregleda Leonov graditelj
  ([ADR-026](DECISIONS.md#adr-026)).
- **Lekcija:** na bazi koju dijeli cijeli tim alat koji „usklađuje" shemu može predložiti brisanje. Svaku promjenu
  sheme pročitaj kao SQL prije upisa i radi samo dodavanja.

### BUG-004 · Smoke korak 5 na `main`-u pada: „Ana ima 0 situacija"
- **Status:** 🟡 čeka spajanje L6 ([#75](https://github.com/leonkreso784-bit/riihack/pull/75), Leonov pregled struke) · **Težina:** srednji (smoke na `main`-u
  crven; korisnik ne vidi jer je produkcija na lažnim podacima, [ADR-018](DECISIONS.md#adr-018))
- **Opis:** `npm run smoke` na `main`-u: nakon pokretanja igre student nema nijednu situaciju.
- **Uzrok:** `situations.json` je prazan dok se ne spoji L6. Kod nije neispravan: s #75 lokalno prolaze koraci 1–10.
- **Rješenje:** spojiti #75 (na Leonovo „spoji", [ADR-017](DECISIONS.md#adr-017)).
- **Lekcija:** smoke ovisi o sadržaju, ne samo o kodu. Kad su sadržaj i kod u različitim PR-ovima, crven smoke prvo
  provjeri ima li sadržaja.

## Riješeni

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
