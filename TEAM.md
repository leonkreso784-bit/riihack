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
5. **Zajednička Neon baza:** `npm run db:push` radi samo onaj tko mijenja shemu (Leon).
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
- **Zadnja spajanja (sub 15:15–15:30):** #76 S3 lik i chat, #77 i #80 dokumentacija, #78 logo i odjava, #79 S4 mentor (156 testova zeleno)
- **Red čekanja:** #75 L6 situacije (nacrt, čeka Leonov pregled struke i „spoji"); #42 duplikat #63 (Simon zatvara)
- **Zadnje ažurirano:** sub 15:30

## Leon · temelj, baza, motor, API, sadržaj, deploy (L0–L11)

- **Sad radim (agenti usporedno):** L7 (#10) krugovi, odgovori, zatvaranje; L8 (#11) smoke koraci 1–10; L11 (#34) faza A: plan, obračun mjeseca, ugovori (nove datoteke), faza B nakon L7
- **Sljedeće:** L11 faza B (pozivi u `world.ts`, podaci u `views.ts`), smoke 14/14, zatim demo igra (L8, M3)
- **Čekam od drugih:** — (L6 #75 čeka moj pregled struke)
- **Drugi čekaju od mene:** L7 (Rino R4–R6 na pravim podacima), L11 (Simon S5, S6 na pravim podacima)
- **Otvoreno:** #75 L6 osam situacija (draft, ne spajati prije pregleda)
- **Spojeno:** L0 (#37), #45, L1 (#62), L2 (#59), L3 (#64), ugovor #63, L4 API (#74), L5 (#70), L9 (#68), L10 (#69); Neon `simpolis-db`
- **Zadnje ažurirano:** sub 15:20

## Simon · AI sloj, karta grada, plan i financije, pitch (S0–S7)

- **Sad radim:** pitch i obilazak žirija (slajdovi https://simpolis-ziri-share.vercel.app); S4 sokratski mentor sljedeće
- **Sljedeće:** S3 PR čim L4 bude na `main`-u; S4 (#16) za M3; karta, plan i financije na prave podatke kad stigne L11
- **Čekam od drugih:** Leon: L4 (`requirePlayer`, `getSituationForCompany`) za S3. Pitanja za S3: (1) vraća li
  `getSituationForCompany` `situation.transcript` kao `ChatTurn[]`? (2) `src/content/situations.json` je zasad `[]`
  (L6?) (3) dva istodobna chat zahtjeva mogu oba proći limit od 6 poruka: ostavljam kao rubni slučaj, OK?
- **Drugi čekaju od mene:** —
- **Otvoreno:** #72 tema (kako potiče učenje); grana `simon/S3-lik` (lik + ruta chat, testovi zeleni, čeka L4)
- **Spojeno:** S0 (#35), pitch (#38, #66, #67), S1 (#41), S2 (#44), S6 (#47), S5 (#48), roadmap (#43), obilazak (#51, #55, #61); `ANTHROPIC_API_KEY` na Vercelu
- **Zadnje ažurirano:** sub 15:05

## Rino · sučelje (R0–R10)

- **Sad radim:** animacije sučelja (ulaz stranica, trake pokazatelja, brojke, kartice, čekaonica, kod), grana `rino/animacije`, ~45 min
- **Sljedeće:** za M2 (18:45): R5 (#25) situacija s likom, R7 (#27) sokratski mentor, R6 (#26) ploča profesora, R4 (#24) dovršiti (zatvaranje kruga); zatim Osoblje uz sobe, R10 (#46) podij
- **Čekam od drugih:** Leon: L4 za prave podatke (do tada lažni podaci); odluka o smjeru dizajna (#39) s Leonom
- **Drugi čekaju od mene:** —
- **Otvoreno:** —
- **Spojeno:** R0 (#40), `roundGain` (#49), lažni podaci zadano (#52), R1 ulaz (#54), R2 profesor (#56), R3 sobe (#57), logo V1 (#65)
- **Zadnje ažurirano:** sub 15:02 (popunio Claude, ispravi)

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
