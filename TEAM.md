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

## Stanje main-a (vodi integrator)

- **CI na `main`-u:** ✅ zelen (292 testa, smoke 14/14) · produkcija https://riihack.vercel.app na **pravim podacima** od sub 17:52: `/`, `/ulaz`, `/igra`, `/profesor` 200; `/api/me` 401 bez kolačića; `/api/join` s krivim kodom 404
- **Zadnja spajanja (sub 17:50–18:27):** #115 demo kod samo iz `.env.local`, #118 L12 AI prijedlog situacije (`POST /api/prof/[worldId]/situations/generate`), #120 BUG-009 presuda zadržava kriterije (Simon), dokumentacija #116, #117, #119, #121–#124
- **Red čekanja:** #107 kraći komentari i čišćenje imena prijašnjeg projekta (BUG-008; nacrt, čeka Rina)
- **Portovi za lokalni smoke:** graditelj 3107 i 3199, integrator 3917
- **Zadnje ažurirano:** sub 18:28

## Leon · temelj, baza, motor, API, sadržaj, deploy (L0–L19)

- **Sad radim:** val 3 (plan u PR-u #134): L14 javni profil hotela za kartu (agent), L16 profesorski računi s Better Authom (agent, backend)
- **Sljedeće:** L15 pošta i pregovaranje s agencijama, L17 knjižnica situacija, L18 poruke među hotelima, L19 suradnja; L8 demo igra i smoke za val 3
- **Čekam od drugih:** Leon: „spoji #134" (plan), odgovor na 3 otvorena pitanja u planu
- **Drugi čekaju od mene:** Simon: L14 (`/api/world/[worldId]/companies`) za kartu; Rino: #137 za stranicu odjela (ugovor #132 je na mainu)
- **Otvoreno:** #137 L13 odjeli (CI zelen, kod integratora), #134 plan vala 3
- **Spojeno:** L0–L12, #118 AI prijedlog situacije, #132 ugovor odjela; shema: `plans.investments`, `finances.investments`. **Pravila:** nitko ne pokreće `npm run db:push`; ime prijašnjeg projekta se nigdje ne piše
- **Zadnje ažurirano:** sub 19:00

## Simon · AI sloj, karta grada, plan i financije, pitch, profesorove situacije (S0–S9)

- **Sad radim:** proba obilaska 2 (18:45, demo samo studentski tok na Leonovoj demo igri); slajdovi za nedjelju (simpolis-pitch-share.vercel.app, ne dijeliti prije nedjelje)
- **Sljedeće:** gumbi playbooka na S8 stranici (M3, čeka Rinov ok za `exportPlaybook`/`importPlaybook` u `client.ts`, pitanje na #108); dokumentacija za predaju (`PREDAJA.md` ima stari poslovni model); video demoa do ned 09:00
- **Čekam od drugih:** Rino: ok za playbook pozive u `client.ts`; Leon: ruta `situations/generate` (poziva `proposeSituation`)
- **Drugi čekaju od mene:** —
- **Obilazak 1 (~15:45):** prošli, samo slajdovi; komentari u `PROMISE.md`. Slajdovi za obilazak 2: simpolis-ziri-share.vercel.app (QR na `/ulaz`)
- **Spojeno:** S0 (#35), S1 (#41), S2 (#44), S3 (#76), S4 (#79), S5 (#48), S6 (#47), **S8 (#109)**, **S9 (#111)**; pitch (#38, #66, #67, #72, #86, #99), roadmap (#43), obilazak (#51, #55, #61); `ANTHROPIC_API_KEY` na Vercelu. Prijedlog rubrika: #110
- **Zadnje ažurirano:** sub 17:20 (popunio Claude, ispravi)

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
