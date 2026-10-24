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
| Logo | **izvorna slika V1**: `public/brand/logo.png`, kvadrat `public/brand/logo-mark.png`, `src/components/logo.tsx` (`LogoMark`), `src/app/icon.png`. Ne crtati iznova. |
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

## Otvoreno (sub 16:05)

- **#91 logo točno kao V1** (izvorna slika iz `public/brand/`). Spremno za integratora. Dok se ne spoji, produkcija
  prikazuje stari prepisani SVG S. (#78 je spojen prije nego je ovaj commit stigao, zato novi PR.)
- **Ulazna stranica: ODLUKA (Rino, sub 16:10): vratiti predstavljanje na `/`.** Prvi zadatak sljedeće sesije:
  - `/` = predstavljačka stranica kakva je bila prije R1 (commit `cd6ee70`: veliki logo, „Simpolis", podnaslov,
    tri kartice „Pravi grad", „Ljudi, ne gotovi odgovori", „Razred kao Kahoot"), ali s **izvornim logom V1** i manje
    „AI predloška" (bez sjaja iza loga i gradijentnog teksta ako smeta). Gumbi: **„Uđi u igru"** → `/ulaz` i
    **„Ja sam profesor"** → `/profesor`.
  - Sadašnji ulaz kodom (R1) seli s `/` na **`/ulaz`** (premjesti `src/app/page.tsx` u `src/app/ulaz/page.tsx`).
  - Popravi sve poveznice na ulaz: čekaonica i greške („Natrag na ulaz" → `/ulaz`), profesorova čekaonica
    („Uđi na {host} i upiši kod" → prikazati `{host}/ulaz`).
  - Provjeri cijeli tok na previewu (sad pravi API): profesor napravi igru → student `/ulaz` → čekaonica → `/igra`.
- **Pravi podaci su OK** (Rino): previewi idu na pravi API, to je u redu; produkcija na lažnim dok Leon ne kaže.
- **Gumb Odjava** maknut: treba Leonova ruta `POST /api/logout`. Kod je u commitu `21bb687`.
- **Smjer dizajna (#39)**: odlučuješ s Leonom.
- **Nakon žirija 1 (Leon):** profesor piše i šalje situacije (L12 backend, S8 Simon, `/profesor/[worldId]/situacije`).
  Rino je rekao OK da Simon u `client.ts`/`mock.ts` **samo doda** `createSituation`, `dispatch`, `worldSettings` po
  istom uzorku i javi prije PR-a.
- **Preview grane sad idu na pravi API** (`NEXT_PUBLIC_USE_MOCK=0` samo za Preview). Za test `/igra` na previewu prvo
  napravi igru kao profesor pa uđi kao student. Produkcija ostaje na lažnim podacima.

## Sljedeće (redom, za M2 sub 18:45, Leonov redoslijed nakon žirija 1; prije svega vraćanje predstavljanja na `/`, vidi Otvoreno)

| Red | Zadatak | Issue | Što još (nakon žirija) |
| --- | --- | --- | --- |
| 1 | **R5 situacija s likom** (stream, vlastiti odgovor, klik, „Gost razmišlja…", presuda, „Zvučite kao brošura") | #25 | situacija **bez opcija** (`options: []`) = samo vlastiti odgovor; oznaka „od profesora" kad je `source === "custom"` |
| 2 | **R6 profesorova ploča uživo** (krug, odbrojavanje, „Zatvori mjesec", studenti, mjesto za kartu) | #26 | poveznica „Situacije" → `/profesor/[worldId]/situacije` |
| 3 | **R4 dovršiti** („Zatvori krug", prazna stanja, kraj sezone) | #24 | kartice na `/igra` imaju fiksno „lipanj": mjesec iz `ROUND_LABELS[finances.at(-1).round - 1]` |
| 4 | Osoblje uz sobe (`/igra/osoblje`) | — | dodati `api.staff()` u `client.ts` (ruta `/api/me/staff` radi) |
| 5 | R7 sokratski mentor, R10 podij | #27, #46 | poslije M2 |
| 6 | R8 uvid u studenta | #28 | gumb „Promijeni ocjenu" (pitati Leona za rutu) |

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
