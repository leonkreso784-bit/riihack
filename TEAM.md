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
| Zamrzavanje koda | ned 06:30 | poslije samo popravci |
| M4 Predaja | ned 10:15 (rok 10:30) | — |

## Tko na koga čeka

| Tko čeka | Što | Od koga | Stanje |
| --- | --- | --- | --- |
| Leon L1, Simon S3 | Neon baza (`DATABASE_URL`) | Leon (prihvatiti uvjete na Vercelu) | ✅ sub 14:35, `simpolis-db` (Frankfurt), env na Vercelu |
| Simon S3 (ruta chat) | L1 (`appendTranscript`, `route`, `HttpError`), L4 (`requirePlayer`, `getSituationForCompany`) | Leon | ✅ L1 (#62) i L4 (#74) spojeni |
| Rino R1–R3 (pravi podaci) | L4: ulaz, profesor, sobe, osoblje | Leon | ✅ L4 spojen (#74); `NEXT_PUBLIC_USE_MOCK=0` je na Vercelu samo za Preview (PR pregledi idu na pravi API), produkcija ostaje na lažnim podacima |
| Simon S3 | odluka o #42 (`CharacterInput.messageNo`, `maxMessages`) | Leon | ✅ spojeno kao #63 (neobavezna polja) |
| Simon S5, S6 | „Update branch" na #48 i #47 | Simon | ✅ spojeno |
| Leon L7 | `judge` (S2) | Simon | ✅ spojeno (#44) |
| Rino (gumb Odjava) | ruta `POST /api/logout` koja briše `sp_player` i `sp_prof` | Leon | čeka; gumb do tada samo vodi na `/` |

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
| 24.10. | Gamifikacija kao u HotelixSimu: #31 prihvaćen (R10 = #46, napredak = normalizirani dobitak, `roundGain`) | Leon s timom |
| 24.10. | Osoblje hotela vidi se uz sobe (`/igra/osoblje`, sadržaj bez baze, `GET /api/me/staff`); karta pokazuje cijelu ekonomiju grada | Leon s timom |
| 24.10. | Simon i Rino su u Vercel timu; env dobivate s `vercel link` i `vercel env pull .env.local` | Leon |
| 24.10. | Ploča tima u `TEAM.md`, svatko svoje polje, izravno na `main` | Leon |
| 24.10. | Tri Leonove sesije: graditelj, integrator (jedini spaja), dokumentacija | Leon |
| 24.10. | Dokumentacija ipak ide na `main` preko PR-a (po njoj grade ljudi i agenti): #58 vraćen s #60, ponovno kao #71 (15:05) | Leon |

## Stanje main-a (vodi integrator)

- **CI na `main`-u:** ✅ zelen · https://riihack.vercel.app, `/igra`, `/cekaonica`, `/profesor`, `/igra/sobe` 200; `/api/me` 401 bez kolačića (L4 živ)
- **Zadnja spajanja (sub 16:00–16:50):** #84, #85, #87, #90 dokumentacija, #86 žiri 1, #91 logo
- **Red čekanja (čeka Leonovo „spoji"):** #75 L6 situacije (blokira tok igre), #88 L11 B (mijenja plan), #89 ugovor L12 (types.ts + plan); zatim L12 faza B. #42 duplikat #63 (Simon zatvara)
- **Zadnje ažurirano:** sub 16:50

## Leon · temelj, baza, motor, API, sadržaj, deploy (L0–L12)

- **Sad radim:** čekam spajanje za M2; zatim demo igra (L8 `seed-demo`), playbook (M3), promjena ocjene (L12 dio 2, M3)
- **Sljedeće:** proba M2 na pravim podacima (~17:30), `NEXT_PUBLIC_USE_MOCK=0` na produkciji kad smoke prođe 14/14 na `main`-u
- **Čekam od drugih:** Leonovo „spoji" integratoru za #88 (L11 faza B), #89 (ugovor: profesorove situacije), #75 (L6, nakon pregleda struke), pa #95 (L12)
- **Drugi čekaju od mene:** Simon S8 (ugovor #89, L12 #95); Rino: #96 odjava, #75 za R5 na pravoj bazi
- **Otvoreno:** #75 L6, #88 L11 B (smoke 14/14), #89 ugovor, #95 L12 (smoke 14/14), #96 odjava
- **Spojeno:** L0–L5, L7 (#83), L8 smoke (#81), L9, L10, L11 faza A (#82); Neon `simpolis-db`. **Pravilo:** nitko ne pokreće `npm run db:push` (drizzle-kit predlaže pražnjenje tablica); shema samo ručnim aditivnim SQL-om
- **Zadnje ažurirano:** sub 16:50

## Simon · AI sloj, karta grada, plan i financije, pitch, profesorove situacije (S0–S9)

- **Sad radim:** S8 sučelje profesorovih situacija (grana `simon/S8-profesor-situacije`, na lažnim podacima i ugovoru #89; Rinov ok za `client.ts`/`mock.ts`, samo dodaje); pojednostavljenje pitcha i slajdova (manje teksta)
- **Sljedeće:** S8 PR nakon #89; nakon L12 u `mentor-input.ts` zamijeniti `getSituation` s `getTemplate`; S4 `MentorInput.finance` (S9, M3); S9 AI prijedlog situacije (M3); video demoa do ned 09:00
- **Čekam od drugih:** Leon: #89 (ugovor), L11 faza B (`views.ts` puni `finances`, `contracts`, `news`), L12; L6 na `main` (inače nema situacija)
- **Drugi čekaju od mene:** —
- **Obilazak 1 (~15:45):** prošli. Pokazali **samo slajdove, bez živog demoa**: demo čuvamo za obilazak 2 (19:00). Komentari u `PROMISE.md`.
- **E2E 15:45** (lokalno, prava baza, main + L6 samo lokalno): smoke 1–10 ✅, 11 ✗ (nema `finances`); chat 2 s ✅, presuda 2,5–3 s ✅ (5/5 i 1/5 točno)
- **Spojeno:** S0 (#35), pitch (#38, #66, #67, #72, #86), S1 (#41), S2 (#44), S3 (#76), S4 (#79), S6 (#47), S5 (#48), roadmap (#43), obilazak (#51, #55, #61); `ANTHROPIC_API_KEY` na Vercelu
- **Zadnje ažurirano:** sub 16:00

## Rino · sučelje (R0–R10)

- **Sad radim:** R6 (#26) profesorova ploča uživo (+ poveznica „Situacije"), na lažnim podacima
- **Sljedeće:** R5 na pravom API-ju čim #75 bude na `main`-u; R4 (+ mjesec umjesto „lipanj"); Odjava čim se spoji #96 (kod u `21bb687`); oznaka „od profesora" u R5 nakon #89; zatim Osoblje (`api.staff()`), R7, R10; M3: R8 „Promijeni ocjenu" (ruta dogovorena, tipovi u #89)
- **Čekam od drugih:** Leon: #75 (situacije, za test R5 na pravom API-ju), #96 (logout), #89 (`source`, ugovor za R8); prijedlog: neobavezno `rubric?: { id, label }[]` u `SituationView` da presuda pokaže nazive kriterija (sad pokazuje broj); odluka o dizajnu (#39)
- **Drugi čekaju od mene:** —
- **Odluke:** OK da Simon u `client.ts`/`mock.ts` samo doda `createSituation`, `dispatch`, `worldSettings` po istom uzorku i javi prije PR-a. `/` je predstavljanje, ulaz kodom je **`/ulaz`** (Simon: adresa u slajdovima i obilasku → riihack.vercel.app/ulaz)
- **Otvoreno:** —
- **Spojeno:** R0 (#40), #49, #52, R1 (#54), R2 (#56), R3 (#57), logo (#65), animacije (#73), logo u igri i mobitel (#78), logo i favicon V1 (#91), predstavljanje na `/` i `/ulaz` (#93), R5 situacija s likom (#97, lažni podaci provjereni, pravi API čeka #75)
- **Bilješke za nastavak:** grana `rino/dokumentacija`, `docs/rino/STANJE.md`
- **Zadnje ažurirano:** sub 16:45 (popunio Claude, ispravi)
---

## Tko smo

Podjela posla za Simpolis je u [RADNI-DOGOVOR.md](RADNI-DOGOVOR.md) i u planu izvedbe: Leon temelj, baza, motor i API;
Simon AI, karta grada, plan i financije; Rino sučelje.

### Leon Kreso — [@leonkreso784-bit](https://github.com/leonkreso784-bit)

Student hotelijerstva (FMTU Opatija) koji je sam naučio programirati. Drugi hackathon, prvi je bio SHAKER 2026.

- **Stack:** Rust, TypeScript/JavaScript, Python, PostgreSQL/Supabase, React, Svelte, Node, Vercel, Railway
- **Projekti:**
  - **HotelixSim:** simulacija vođenja hotela za studente. Rust jezgra, Axum, Postgres, React, Claude glumi likove i ocjenjuje odgovore. Ide u pilot na fakultetu.
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
