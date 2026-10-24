# Rino · sučelje: gdje smo stali

> Zapisano **sub 24.10.2026. oko 15:40**. Ovo je jedina datoteka koju nova sesija (ili druga sesija usporedno) čita
> da nastavi Rinov dio. Živi na grani `rino/dokumentacija`; na `main` ide samo ploča u `TEAM.md`.

## Prvo pročitaj

1. `TEAM.md` na `main`-u: ploča tima, **pravila suradnje** i tko na koga čeka.
2. Plan izvedbe: `docs/superpowers/plans/2026-10-24-simpolis.md` (zadaci R0–R10, ugovor tipova, API).
3. Ova datoteka: stanje i sljedeći koraci.

## Pravila koja vrijede (iz TEAM.md)

- **Spaja samo integrator (Leonova sesija).** Ti otvoriš PR, provjeriš ga na svježem `main`-u i javiš „#N je spreman".
- Na `main` izravno ide **samo** tvoje polje u `TEAM.md` (commit `ploča: Rino`). Sve ostalo ide preko grana i PR-ova.
- Jedan zadatak = jedna grana `rino/<ID>-<opis>` = jedan PR. Diraš **samo svoje datoteke** (`src/app/` bez `api/`,
  `src/components/` bez `city/` i `wow/`, `src/lib/client.ts`, `src/lib/mock.ts`, `globals.css`, `layout.tsx`).
- `types.ts`, `rules.ts`, `package.json` mijenja samo Leon. Karta grada, plan, financije su Simonovi (S5, S6).
- Prije PR-a: `npm run typecheck && npm run lint && npm test && npm run build` na svježem `main`-u.

## Gdje je što

| Što | Gdje |
| --- | --- |
| Repo | `leonkreso784-bit/riihack`, lokalno `C:\Users\Korisnik\Desktop\riihack` |
| Produkcija (`main`) | https://riihack.vercel.app |
| Preview grane | `https://riihack-git-<grana-s-crticama>-leon-kresos-projects.vercel.app` (prijava u Vercel, Rino je u timu) |
| Lažni podaci | zadano **uključeni**; `NEXT_PUBLIC_USE_MOCK=0` na Vercelu prebacuje na pravi API (Leon, kad L4–L7 rade) |
| Logo | `public/brand/logo.svg`, `src/components/logo.tsx` (`LogoMark`), `src/app/icon.svg` |
| Tema i animacije | `src/app/globals.css` (tokeni, `gloss`, `surface`, `glass`, `anim-*`, sve isključeno uz reduced-motion) |
| Zajedničke komponente | `panel`, `stat-card`, `metric-bar`, `pill`, `round-banner`, `leaderboard`, `count-up`, `form`, `room-tile`, `code-input` |

## Gotovo (spojeno na `main`)

| PR | Što |
| --- | --- |
| #40 | R0: ljuska, tema, komponente, `client.ts` + `mock.ts`, profesionalni i sjajni izgled |
| #49, #52 | `roundGain` u mocku; lažni podaci zadano na Vercelu |
| #54 | R1: ulaz kao Kahoot (`/`) i čekaonica (`/cekaonica`) |
| #56 | R2: profesor (`/profesor`, `/profesor/novi`, `/profesor/[worldId]` s golemim kodom za projektor) |
| #57 | R3: sobe po katovima i detalj sobe (`/igra/sobe`, `/igra/sobe/[broj]`) |
| #65 | Logo V1 (ChatGPT koncept, vektorski) |
| #73 | Animacije (kartice ulaze redom, trake rastu, brojke se odbrojavaju, sjaj, puls odbrojavanja) |

Provjereno kroz cijeli tok na produkciji (profesor stvori igru → kod → student uđe → čekaonica → `/igra` → sobe),
0 grešaka u konzoli, nijedan ekran nije širi od 375 px.

## Otvoreno

- **#78** uspravan logo, logo u igri na pločici, mobitel bez prelijevanja. Spremno za integratora.
- **Gumb Odjava** je maknut: treba Leonova ruta `POST /api/logout` (upisano u TEAM.md). Kod je u povijesti grane
  `rino/logo-odjava` (commit `21bb687`), lako se vrati.
- **Smjer dizajna (#39)**: Simon predlaže A (BitLife); odlučuješ s Leonom. Do tada vrijedi HotelixSim izgled.

## Sljedeće (redom, za M2 sub 18:45)

| Red | Zadatak | Issue | Datoteke | Procjena |
| --- | --- | --- | --- | --- |
| 1 | **R5 situacija s likom**: razgovor (stream), vlastiti odgovor, klik, „Gost razmišlja…", presuda, „Zvučite kao brošura" | #25 | `igra/situacija/[id]/page.tsx`, `chat-panel`, `answer-form`, `verdict-card` | 45 min |
| 2 | **R7 sokratski mentor**: prvo pitanje, pa osvrt | #27 | `igra/izvjestaj/[krug]/page.tsx`, `mentor-dialog` | 20 min |
| 3 | **R6 profesorova ploča uživo**: krug, odbrojavanje, „Zatvori mjesec", studenti, mjesto za Simonovu kartu | #26 | `profesor/[worldId]/page.tsx` (`Running`), `prof-board` | 30 min |
| 4 | **R4 dovršiti**: „Zatvori krug" (potvrda u stranici), prazna stanja, kraj sezone | #24 | `igra/page.tsx` | 20 min |
| 5 | Osoblje uz sobe (`/igra/osoblje`, `GET /api/me/staff`) | — | `igra/osoblje/page.tsx` | 20 min |
| 6 | R10 podij kruga i ljestvica za projektor | #46 | `round-podium`, `leaderboard-tabs` | 20 min |
| 7 | R8 uvid u studenta, R9 poliranje | #28, #29 | | M3 |

## Više sesija usporedno

Svaka sesija radi **jedan** zadatak u **svojem radnom stablu**, da se ne sudaraju:

```bash
cd C:/Users/Korisnik/Desktop/riihack
git fetch
git worktree add ../riihack-R5 -b rino/R5-situacija origin/main
cd ../riihack-R5 && npm install && cp ../riihack/.env.local .
```

Zatim u tom folderu otvori novu Claude Code sesiju i zalijepi (zamijeni ID, issue i granu):

> Radi zadatak **R5** iz `docs/superpowers/plans/2026-10-24-simpolis.md` (issue #25), grana `rino/R5-situacija`.
> Prvo pročitaj `TEAM.md` (pravila suradnje) i `docs/rino/STANJE.md` s grane `rino/dokumentacija`
> (`git show origin/rino/dokumentacija:docs/rino/STANJE.md`). Diraj samo datoteke iz zadatka; koristi postojeće
> komponente (`Panel`, `Pill`, `FormError`, `SubmitButton`, `gloss`, `surface`, `anim-*`) i `api`/`usePoll` iz
> `src/lib/client.ts` (lažni podaci već imaju stream lika i presudu). Na kraju: provjere na svježem `main`-u, PR s
> „Closes #25" i oznakom „Spremno za integratora", pa ažuriraj svoje polje u `TEAM.md`. Ne spajaj sam.

Nakon spajanja: `git worktree remove ../riihack-R5`.

## Kad završiš sesiju

1. Ažuriraj polje **Rino** u `TEAM.md` (izravno na `main`, `ploča: Rino`).
2. Dopiši ovdje (grana `rino/dokumentacija`) što je gotovo, što je otvoreno i što je sljedeće.
