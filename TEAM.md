# Tim

**Zajednička ploča tima.** Svatko uređuje **samo svoje polje** (Leon, Simon, Rino). Zajedničke dijelove (Prekretnice,
Tko na koga čeka, Pravila, Odluke, Stanje main-a) smije mijenjati svatko, uz poruku na Discordu. Zadaci u detalje su u
[planu izvedbe](docs/superpowers/plans/2026-10-24-simpolis.md) i u issueovima. Ovdje je samo tko što radi **sada**, tko
na koga čeka i što smo dogovorili.

## Kako koristimo ploču

- Ažuriraj svoje polje kad kreneš na zadatak, kad otvoriš ili spojiš PR i kad zapneš. Barem svaka 2 sata.
- **Ploča ide izravno na `main`**, bez PR-a: samo `TEAM.md`, samo svoje polje, `git pull --rebase` prije pusha,
  commit `ploča: <ime>`. Datoteka ne utječe na build. Sve ostalo i dalje ide preko grana i PR-ova.
- **Prije nego kreneš na nešto**, pogledaj tuđa polja i `gh pr list`, da vidiš radi li to već netko.
- Agenti (Claude Code) smiju ažurirati polje svog vlasnika i dio „Tko na koga čeka".

## Prekretnice

| Prekretnica | Rok | Stanje |
| --- | --- | --- |
| M0 Temelj | sub 13:15 | ✅ 13:30: https://riihack.vercel.app, CI zelen |
| M1 Obilazak 1 | sub 14:30 (žiri ~14:45) | 🔶 obećanja ✅, ljuska ✅; ulaz, profesor i sobe čekaju L1–L4 i R1–R3 |
| M2 Obilazak 2 | sub 18:45 | — |
| M3 Obilazak 3 | ned 07:45 | — |
| M4 Predaja | ned 10:15 (rok 10:30) | — |

## Tko na koga čeka

| Tko čeka | Što | Od koga | Stanje |
| --- | --- | --- | --- |
| Leon L1, Simon S3 | Neon baza (`DATABASE_URL`) | Leon (prihvatiti uvjete na Vercelu) | ✅ sub 14:35, `simpolis-db` (Frankfurt), env na Vercelu |
| Simon S3 (ruta chat) | L1 (`appendTranscript`, `route`, `HttpError`), L4 (`requirePlayer`, `getSituationForCompany`) | Leon | ✅ L1 (#62) i L4 (#74) spojeni |
| Rino R1–R3 (pravi podaci) | L4: ulaz, profesor, sobe, osoblje | Leon | ✅ L4 spojen (#74); `NEXT_PUBLIC_USE_MOCK=0` i na Previewu i na produkciji (od sub 17:52, build s #115) |
| Simon S3 | odluka o #42 (`CharacterInput.messageNo`, `maxMessages`) | Leon | ✅ spojeno kao #63 (neobavezna polja) |
| Simon S5, S6 | „Update branch" na #48 i #47 | Simon | ✅ spojeno |
| Leon L7 | `judge` (S2) | Simon | ✅ spojeno (#44) |
| Rino (gumb Odjava) | ruta `POST /api/logout` koja briše `sp_player` i `sp_prof` | Leon | ✅ spojeno (#96) |

## Pravila suradnje (naučeno 24.10.)

1. **Jedan zadatak, jedan čovjek.** Prije početka ga upiši u svoje polje pod „Sad radim". Danas smo dvaput radili
   isto (#36 i #37, #49 i #50).
2. **Ugovor** (`types.ts`, `rules.ts`, `package.json`) mijenja samo Leon, uvijek zajedno s blokom u planu. **Novo polje
   je neobavezno (`?`)** dok ga svi ne pune. Najava pod „Odluke" i na Discordu **prije** spajanja.
3. **Spaja integrator (Leonova sesija)**, a autor PR-a javlja da je spreman (Discord ili komentar na PR-u). Integrator
   prije spajanja provjeri PR na svježem `main`-u (typecheck, lint, test, build). Ne spajaš sam.
4. **Nakon spajanja pogledaj CI na `main`-u.** Kad je `main` crven, nitko ne spaja dok ga ne popravi onaj čiji je
   zadnji merge. Javi na Discordu.
5. **Zajednička Neon baza:** ⚠️ **nitko ne pokreće `npm run db:push`** (24.10. predložio je pražnjenje tablica `situations` i `contracts`). Shemu mijenja samo Leon, ručnim aditivnim SQL-om u jednoj transakciji.
6. **Ne diraj tuđe datoteke** (vlasništvo je u planu pod „Struktura datoteka"). Ako ti nešto treba, upiši to pod
   „Tko na koga čeka" i javi.

## Odluke

| Kad | Odluka | Tko |
| --- | --- | --- |
| 24.10. | L0 je Leonov #37, a Simonov #36 se zatvara | Leon |
| 24.10. | Neon (Frankfurt, besplatni plan) preko Vercel Marketplacea radi Leon; `ANTHROPIC_API_KEY` vodi Simon | Leon |
| 24.10. | Gamifikacija: #31 prihvaćen (R10 = #46, napredak = normalizirani dobitak, `roundGain`) | Leon s timom |
| 24.10. | Osoblje hotela vidi se uz sobe (`/igra/osoblje`, sadržaj bez baze, `GET /api/me/staff`); karta pokazuje cijelu ekonomiju grada | Leon s timom |
| 24.10. | Simon i Rino su u Vercel timu; env dobivate s `vercel link` i `vercel env pull .env.local` | Leon |
| 24.10. | Ploča tima u `TEAM.md`, svatko svoje polje, izravno na `main` | Leon |
| 24.10. | Tri Leonove sesije: graditelj, integrator (jedini spaja), dokumentacija | Leon |
| 24.10. | Dokumentacija ipak ide na `main` preko PR-a (po njoj grade ljudi i agenti): #58 vraćen s #60, ponovno kao #71 (15:05) | Leon |
| 24.10. ~21:20 | Integrator sam spaja aditivne neobavezne dodatke ugovoru (novi tip ili polje s `?` u `types.ts`) prepisane iz bloka „Ugovor" u planu; Leonovo „spoji" ostaje za izmjene postojećih tipova, `rules.ts`, `package.json`, lock i plan ([ADR-037](docs/records/DECISIONS.md#adr-037)) | Leon |
| 24.10. ~21:40 | Simonove skice „Tokovi" (#174, #179) **ipak idu u aplikaciju** preko integratora, uz Rinov ok za poveznice; polja `SituationView.rubric?` i `effects?` dodaje graditelj; ruta „Što ako?" na poslužitelju se ne radi (zamjenjuje odluku od 21:15, [ADR-042](docs/records/DECISIONS.md#adr-042)) | Leon |
| 24.10. ~21:15 | Graditelj: L8 demo i smoke za val 3 prvo, L19 samo ako ostane vremena; imena hotela u demo seedu po mjestu; stranicu knjižnice radi graditelj, Rino je stilski pregleda; skriptu za čišćenje baze graditelj radi i isproba večeras ([ADR-039](docs/records/DECISIONS.md#adr-039)) | Leon |
| 24.10. ~21:15 | Tuđi hoteli: prihod i dobit zatvorenih mjeseci su javni (kao kod FINA-e), ostali novac skriven ([ADR-040](docs/records/DECISIONS.md#adr-040)) | Leon |
| 24.10. ~21:15 | Demo na žiriju obavezno s profesorskim računom; tehnički detalji s Leonom ([ADR-041](docs/records/DECISIONS.md#adr-041)) | Leon |
| 24.10. ~21:15 | Nakon svakog povlačenja koje mijenja `package-lock.json` svi pokreću `npm ci` ([BUG-013](docs/records/BUGS.md#bug-013--provjera-pada-u-mapi-bez-npm-ci-nakon-promjene-package-lockjson)) | Leon |
| 24.10. ~22:00 | Balans cijene (#162): u motoru privlačnost iznad 2× referentne cijene pada dalje, iznad 2,5× je 0; `PRICE_MAX` i Plan ostaju; poslije ponovno demo i smoke ([ADR-043](docs/records/DECISIONS.md#adr-043)) | Leon |
| 24.10. ~22:20 | Botovi (hoteli i dobavljači koje vodi računalo) za igre s malo studenata: po pravilima motora, ne AI; profesor ih uključuje pri stvaranju igre; izmjena ~22:50: botove cijele radi Simon (#205), graditelj pregledava ([ADR-044](docs/records/DECISIONS.md#adr-044)) | Leon |
| 24.10. ~22:35 | Pokazatelji jače utječu na goste (BUG-024); graditelj preuzima sve otvorene bugove s agentima, za Rinove i Simonove datoteke prvo provjeri njihove grane ([ADR-045](docs/records/DECISIONS.md#adr-045)) | Leon |
| 24.10. ~22:50 | Učinak situacije po ocjeni: 1 (loše ili propušteno) −2×, 2 → 0, 3 → +1×, 4 → +2×, 5 → +3× (BUG-026); radi graditelj s BUG-024 ([ADR-046](docs/records/DECISIONS.md#adr-046)) | Leon |
| 24.10. ~23:05 | Kasni ulaz: student ulazi i u igru koja je počela, igra od trenutnog mjeseca ([ADR-048](docs/records/DECISIONS.md#adr-048)) | Leon |
| 24.10. ~23:10 | Simonov #209 (kalibracija troškova) ne ide prije predaje; u pitchu je „sljedeći korak" ([ADR-047](docs/records/DECISIONS.md#adr-047)) | Leon |
| 24.10. ~23:50 | Bez minimalne duljine odgovora i refleksije; prazan odgovor ocjenjuje motor s 1, bez AI-ja ([ADR-049](docs/records/DECISIONS.md#adr-049)) | Leon |
| 25.10. ~01:10 | Kod igre i QR na ploči nakon pokretanja nisu potrebni; kasni ulaz nije prioritet ([ADR-051](docs/records/DECISIONS.md#adr-051)) | Leon |
| 25.10. ~01:20 | Sigurnost: AI prijedlog najviše 30 po igri i 5 u minuti, atomična granica poruka s likom, zaglavlja `X-Frame-Options`, `nosniff`, `Referrer-Policy` bez CSP-a; PIN poslije natjecanja ([ADR-053](docs/records/DECISIONS.md#adr-053)) | Leon |
| 25.10. ~01:25 | Napisan odgovor s ocjenom 1 ima množitelj 0, propušten i prazan −2× ([ADR-052](docs/records/DECISIONS.md#adr-052)); ljestvica i grad bez stanja računa tuđih hotela ([ADR-040](docs/records/DECISIONS.md#adr-040)) | Leon |

## Stanje main-a (vodi integrator)

- **CI na `main`-u:** ✅ zelen (514 testova, smoke 1–18 lokalno) · produkcija https://riihack.vercel.app READY (ned 00:28)
- **Zadnja spajanja (sub 23:31–ned 00:32):** #224 poveznice „Kako …“, #225 prazan odgovor (ADR-049), #228 i #231 AI popravci iz audita, #229 Rinove sitnice iz audita, #232 Tokovi odjeli kao staze; dokumentacija #222, #223, #230, #234, #236
- **Red čekanja:** #233 animacije čekanja i #235 paralelni botovi (nisu provjereni, za sljedeću sesiju integratora); #209 kalibracija se ne spaja prije predaje (ADR-047)
- **Env na Vercelu:** `NEXT_PUBLIC_USE_MOCK=0` (Production, Preview), `BETTER_AUTH_SECRET` (Production, Preview) i `BETTER_AUTH_URL` (Production) postavljeni sub ~20:25
- **Portovi za lokalni smoke:** graditelj 3107 i 3199, integrator 3917 (korak 19 lokalno se preskače bez auth tajne); integratorov smoke u 23:56, 00:17 i 00:27 ostavio je 3 igre „Smoke …“ za čišćenje
- **Zadnje ažurirano:** ned 00:33

## Leon · temelj, baza, motor, API, sadržaj, deploy (L0–L19)

- **Sad radim (01:05):** sesija graditelja 5. Gotovo: #240 (#226 izvještaj, mentor i podij vide obračun grada) i #241 (#227.1 plan se prenosi, #227.3 protuponuda bez koristi → 400); oba zelena, čekaju Leonovo „spoji"
- **Sljedeće:** nakon spajanja jedan seed demo igre KVRNDM i smoke na produkciji (uz najavu testeru); #227.6 brže „Moje igre"; prije predaje čišćenje baze (i 2 igre „Smoke …" integratora) i provjera imena
- **Čekam od drugih:** Leon: „spoji" za #240 i #241; odluka o balansu općenitog odgovora (q=1 = kao propuštena situacija) i o stanju računa tuđih hotela na ljestvici; sigurna zaglavlja
- **Drugi čekaju od mene:** —
- **Otvoreno:** #240, #241
- **Spojeno:** L0–L18, L8 demo, kasni ulaz (#221), balans cijene i kvalitete (#194, #213, #214), bez donje granice odgovora (#225). **Pravila:** nitko ne pokreće `npm run db:push`; nova ovisnost samo preko `scripts/lock-merge.py`; ime prijašnjeg projekta se nigdje ne piše
- **Zadnje ažurirano:** ned 01:05

## Simon · AI sloj, karta grada, plan i financije, pitch, profesorove situacije (S0–S12)

- **Sad radim:** „Tokovi": (1) stranica „Kako je izračunat mjesec" u aplikaciji (`/igra/izvjestaj/[krug]/tok`, grana `simon/tokovi`, samo stvarni podaci obračuna, „Što ako?" kao procjena po formulama motora); (2) S12 knjižnica na stranici situacija (grana `simon/S12-knjiznica`); (3) skica 3 kao pravi editor pravila; istraživanje n8n, GHL, Zapier, Make
- **Sljedeće:** revizija i test svega (svježi pregled koda, stvarni AI pozivi, E2E na probnoj igri, ne KVRNDM); priprema za nedjelju
- **Čekam od drugih:** Leon: #162 (balans cijene: 400 € je oko 4× isplativije)
- **Drugi čekaju od mene:** —
- **Trebat će:** @rtomic20 ok za jednu poveznicu „Kako je izračunat mjesec →" na izvještaju i Financijama; ok za nove metode knjižnice u `client.ts`
- **Obilasci:** 1 prošao (slajdovi), 2 prošao (aplikacija uživo, žiri oduševljen)
- **Spojeno:** S0–S6, S8 (#109), S9 (#111), playbook i AI prijedlog (#129), BUG-009 (#120), karta D (#128), S11 agent agencije (#154), dokumenti (#99, #131, #150)
- **Zadnje ažurirano:** sub 20:55 (popunio Claude, ispravi)

## Rino · sučelje (R0–R15)

- **Sad radim:** čekam spajanje #211 (sve tri Leonove stavke: BUG-025 rok „Ručno“, BUG-023, BUG-022 bez crvenog ▼); u 23:30 proba na mobitelima
- **Sljedeće:** 23:30–00:00 proba igre za žiri; od 00:00 samo popravci bugova
- **Čekam od drugih:** Leon: spoji #211. Simon: #205 je u sukobu u `prof-board.tsx` (s mojim #196, a bit će i s #211); pri rebaseu zadrži oboje: tvoj filtar `humans` i moj podij, „Anonimno“, „Moje igre“
- **Drugi čekaju od mene:** —
- **Odluke:** R14 = moj pregled #169 (izgled ok). Radar vještina na R8 izostavljen dok ima samo pokazne podatke. Studenti idu u sljedeći mjesec zajedno
- **Otvoreno:** #211 popravci sučelja (BUG-022, BUG-023, BUG-025, protuponuda u Pošti, „Pošalji mentoru“, nova igra bez profesorskog koda)
- **Spojeno (od 16:45):** #127, #135, #138, #142, #151 QR, #152 Završi mjesec, #157, #160 R7 mentor, #164 R13 pošta, #168 R8 uvid u studenta, #173 sitnice, #180 bez zamrzavanja, #186 profesor preko računa, #196 R10 podij, #200 BUG-015 i 016; ok za #128, #107, #166, #169, #170, #174
- **Provjereno na produkciji:** 20:00 cijela igra (QR → Završi mjesec → sljedeći mjesec); 20:52 pošta s AI odgovorom agencije (1.500 → 1.125 → 1.313 €); **21:15 #168 i #173**: ploča → hotel → stranica studenta → ocjena 1 → 5 („5 / 5 · profesor", ostaje nakon osvježavanja); profesorova vlastita situacija ima oznaku „od profesora" (iz banke nema, tako je zamišljeno); bez bljeska čekaonice; nakon zatvaranja lipnja kartice na `/igra` pišu „lipanj"; 0 grešaka; **21:40 #186**: naslovna → „Ja sam profesor" (samo Prijavi se / Napravi račun) → registracija → Moje igre → nova igra → QR → student uđe (1/2), igra na popisu Moje igre; `/ulaz` bez poveznice na profesora; 0 grešaka
- **Bilješke za nastavak:** `docs/rino/STANJE.md` na grani `rino/dokumentacija`
- **Zadnje ažurirano:** sub 22:47 (popunio Claude, ispravi)
---

## Tko smo

Podjela posla za Simpolis je u [RADNI-DOGOVOR.md](RADNI-DOGOVOR.md) i u planu izvedbe: Leon temelj, baza, motor i API;
Simon AI, karta grada, plan i financije; Rino sučelje.

### Leon Kreso — [@leonkreso784-bit](https://github.com/leonkreso784-bit)

Student hotelijerstva (FMTU Opatija) koji je sam naučio programirati. Drugi hackathon, prvi je bio SHAKER 2026.

- **Stack:** Rust, TypeScript/JavaScript, Python, PostgreSQL/Supabase, React, Svelte, Node, Vercel, Railway
- **Projekti:**
  - **Sokrat Study** ([sokratstudy.com](https://www.sokratstudy.com/)): platforma za učenje s karticama, kvizovima i vlastitim materijalima. Javno dostupna.
  - **Sokratis:** desktop aplikacija koja analizira git repo (Rust, Tauri, Svelte).
  - **KuhAI:** projekt sa SHAKER 2026. Plan obroka iz slike frižidera (Hono, Postgres, Claude).
- **Jak u:** arhitekturi, backendu i bazama, AI integraciji, deployu i dovršavanju proizvoda.

### Simon Seifert — [@simonseifert](https://github.com/simonseifert)

- **Stack:** Python, JavaScript/TypeScript, Astro, Tailwind
- **Projekti:**
  - **living-docs:** Claude Code skill koji vodi ažurne bilješke o alatima
  - **osint-intel:** OSINT alat koji slaže izvještaj iz maila, korisničkog imena ili domene
  - **guest-guide:** offline PWA za goste apartmana, besplatna zamjena za plaćene alate
  - **ig-saves:** spremljeni Instagram postovi → Obsidian → Claude analiza → render videa
  - **whatsapp-mcp-pro:** WhatsApp server za AI agente (fork)
- **Jak u:** AI agentima, MCP-u, automatizacijama, scrapingu i spajanju vanjskih servisa.

### Rino Tomić — [@rtomic20](https://github.com/rtomic20)

Student Sveučilišta u Rijeci. Bio na StemGames 2026.

- **Stack:** TypeScript, Angular, Python/Django, Flutter/Dart, C++, C#
- **Projekti:**
  - **MedXpress:** ista aplikacija na tri platforme (Flutter, Django API, Angular web)
  - **OPG app:** web aplikacija za OPG-ove, s upitnicima za OPG-ove i za kupce
  - **Unisupport:** sustav za studentske zahtjeve u uredu Sveučilišta
- **Jak u:** full-stack webu, mobilnim aplikacijama (Flutter) i radu s korisnicima kroz upitnike.

### Zajedno

- Sva trojica rade full-stack, pa se lako možemo uskakati.
- Leon i Simon intenzivno koriste Claude Code. Rino je jedini s Flutterom.
- Sva trojica imaju projekte s pravim korisnicima, što pomaže za priču pred žirijem.
