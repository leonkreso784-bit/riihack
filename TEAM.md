# Tim

**Zajednička ploča tima.** Svatko uređuje **samo svoje polje** (Leon, Simon, Rino). Zajedničke dijelove (Prekretnice,
Tko na koga čeka, Pravila, Odluke) smije mijenjati svatko, uz poruku na Discordu. Zadaci u detalje su u
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
| Leon L1, Simon S3 | Neon baza (`DATABASE_URL`) | Leon (prihvatiti uvjete na Vercelu) | čeka |
| Simon S3 (ruta chat) | L1 (`appendTranscript`, `route`, `HttpError`), L4 (`requirePlayer`, `getSituationForCompany`) | Leon | čeka |
| Rino R1–R3 (pravi podaci) | L4: ulaz, profesor, sobe, osoblje | Leon | do tada lažni podaci |
| Simon S3 | odluka o #42 (`CharacterInput.messageNo`, `maxMessages`) | Leon | čeka |
| Simon S5, S6 | „Update branch" na #48 i #47 | Simon | ✅ spojeno |
| Leon L7 | `judge` (S2) | Simon | ✅ spojeno (#44) |

## Pravila suradnje (naučeno 24.10.)

1. **Jedan zadatak, jedan čovjek.** Prije početka ga upiši u svoje polje pod „Sad radim". Danas smo dvaput radili
   isto (#36 i #37, #49 i #50).
2. **Ugovor** (`types.ts`, `rules.ts`, `package.json`) mijenja samo Leon, uvijek zajedno s blokom u planu. **Novo polje
   je neobavezno (`?`)** dok ga svi ne pune. Najava pod „Odluke" i na Discordu **prije** spajanja.
3. **Spaja vlasnik PR-a**, i to tek kad je CI zelen **na svježem `main`-u**: neposredno prije spajanja klikni
   „Update branch" (ili rebase) i pričekaj CI. Zeleni CI od prije sat vremena ne vrijedi ako se `main` u međuvremenu
   promijenio.
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

## Leon · temelj, baza, motor, API, sadržaj, deploy (L0–L11)

- **Sad radim:** Neon baza; zatim L1 (#4), L2 (#5) i L3 (#6) usporedno, s agentima
- **Sljedeće:** L4 (#7), API za ulaz i profesora, za M1
- **Čekam od drugih:** —
- **Drugi čekaju od mene:** Neon, L1 i L4 (Simon S3); L4 (Rino R1–R3 na pravim podacima); odluka o #42
- **Spojeno:** L0 (#37), ugovor za osoblje i `roundGain` (#45)
- **Zadnje ažurirano:** sub 14:25

## Simon · AI sloj, karta grada, plan i financije, pitch (S0–S7)

- **Sad radim:** obilazak žirija 1: tekst (`prezentacija/OBILAZAK-1.md`) i slajdovi https://simpolis-ziri-share.vercel.app (#55)
- **Sljedeće:** S3 (#15) čim stignu Neon, L1, L4 i #42; S4 (#16) za M3; ugovori i vijesti na pravim podacima (L11)
- **Čekam od drugih:** Leon: Neon, L1, L4, odluka o #42
- **Drugi čekaju od mene:** —
- **Otvoreno:** #42 tipovi lika, #55 slajdovi
- **Spojeno:** S0 (#35), nacrt pitcha (#38), S1 (#41), S2 (#44), S6 (#47), S5 (#48), roadmap (#43), obilazak (#51); `ANTHROPIC_API_KEY` na Vercelu (production, preview, development)
- **Zadnje ažurirano:** sub 14:21

## Rino · sučelje (R0–R10)

- **Sad radim:** čekam pregled i spajanje R1–R3; zatim R5 (#25) situacija s likom
- **Sljedeće:** stranica Osoblje u R3 (do M2); R4 (#24), R5 (#25), R6 (#26), R7 (#27), R10 (#46) za M2
- **Čekam od drugih:** Leon: L4 za prave podatke; odluka o smjeru dizajna (#39) s Leonom
- **Drugi čekaju od mene:** —
- **Otvoreno:** R1 ulaz i čekaonica (#54), R2 profesor (#56, nosi i R1), R3 sobe (#57, nosi R1 i R2). Spojiti redom ili samo #57.
- **Spojeno:** R0 (#40), popravak `roundGain` (#49), lažni podaci zadano na Vercelu (#52)
- **Zadnje ažurirano:** sub 14:33 (popunio Claude, ispravi)

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
