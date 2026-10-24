# Dnevnik napretka

Najnovije gore. Svaki unos: što je napravljeno, što je provjereno, što slijedi. Tko što radi **sada** je na ploči u
[TEAM.md](../../TEAM.md), ne ovdje. Spojeni PR-ovi po prekretnicama: [CHANGELOG.md](CHANGELOG.md).
Vremena su lokalna (CEST).

---

## Sub 24.10. 14:35–14:45 · baza živa, L1, R1

- **Leon:** Neon baza `simpolis-db` (Frankfurt, besplatni plan) preko Vercel Marketplacea, `DATABASE_URL` na Vercelu
  za sva tri okruženja; L1 shema i zajednički upiti (#62, 14:44), 11 tablica u bazi. Odluka o #42
  ([ADR-016](DECISIONS.md#adr-016)), PR #63 otvoren.
- **Rino:** R1 ulaz kao Kahoot i čekaonica (#54, 14:38).
- **Simon:** slajdovi obilaska žirija (#55) i Rinov tok demoa nakon R1 (#61).
- **Dokumentacija:** #58 spojen pa vraćen s #60: na `main` ide samo `TEAM.md` ([ADR-015](DECISIONS.md#adr-015)).
- **Vercel:** Rino prihvatio pozivnicu u Vercel tim (Leon, ~15:00), pa mu rade `vercel link` i `vercel env pull`.
- **Otvoreno:** #59 L2 motor, #63 ugovor lika, #64 L3 banka hotela, #65 novi logo.

## Sub 24.10. ~14:30 · tri sesije, dokumentacija

Leon pokreće tri Claude sesije: graditelj, integrator, dokumentarist ([ADR-015](DECISIONS.md#adr-015),
[SESIJE.md](../workflow/SESIJE.md)). Dokumentarist gradi strukturu `docs/` (ovaj PR).
**Otvoreno:** #42 tipovi lika (čeka Leonovu odluku), #54 R1 ulaz, #55 slajdovi žirija. **Čeka se:** Neon baza
(`DATABASE_URL`), zatim L1–L4 za prave podatke.

## Sub 24.10. 13:30–14:25 · prema M1: sučelje, AI, grad, ploča tima

- **Rino:** R0 ljuska, tema i klijent s lažnim podacima (#40, 13:52); popravak `roundGain` u lažnoj ljestvici (#49,
  14:04, [BUG-001](BUGS.md#bug-001--main-crven-roundgain-uveden-kao-obavezno-polje)); lažni podaci zadani na Vercelu
  (#52, 14:14, [BUG-003](BUGS.md#bug-003--igra-na-vercelu-vraća-greška-404)). Kreće na R1–R3 na lažnim podacima.
- **Simon:** S1 AI temelj (#41) i S2 presuda po rubrici (#44), 13:55; S5 karta grada, vijesti, radar (#48) i S6 plan
  kruga, financije, ponude (#47), 14:14; roadmap do predaje (#43) i plan obilaska žirija 1 (#51).
  `ANTHROPIC_API_KEY` na Vercelu.
- **Leon:** ugovor za osoblje hotela i `roundGain` (#45, 13:45, [ADR-012](DECISIONS.md#adr-012)); gamifikacija #31
  prihvaćena ([ADR-009](DECISIONS.md#adr-009)); ploča tima u `TEAM.md` (#53, 14:11, [ADR-014](DECISIONS.md#adr-014))
  s pravilima suradnje naučenima toga dana.
- **Provjereno:** CI zelen na `main`-u nakon #49.
- **Slijedi:** Neon baza, L1–L3 usporedno s agentima, zatim L4 (API ulaza i profesora) za M1.

## Sub 24.10. 12:45–13:30 · M0 temelj

- **Leon:** L0 kostur iz startera, ugovor tipova (`types.ts` doslovno iz plana), `rules.ts`, Vitest, CI (#37, 13:29);
  Simonov #36 zatvoren ([ADR-010](DECISIONS.md#adr-010)). Popravak lock datoteke za Linux CI
  ([BUG-002](BUGS.md#bug-002--npm-ci-na-linux-ci-ju-pada-zbog-lock-datoteke-s-windowsa)).
- **Simon:** tri obećanja za žiri (`PROMISE.md`, #35) i nacrt pitcha, skraćen na 5 minuta (#38).
- **Provjereno:** M0 ✅ 13:30: https://riihack.vercel.app, CI zelen ([TEAM.md](../../TEAM.md) › Prekretnice).

## Sub 24.10. 11:52–12:40 · ideja, arhitektura, plan

- **Leon:** prvi commit (11:52) s dokumentacijom Simpolisa; ulaz kao Kahoot i banka hotela; Neon umjesto Supabasea
  ([ADR-005](DECISIONS.md#adr-005)); plan izvedbe sa zadacima L0–L8, S0–S7, R0–R9 (12:09); grad i prava ekonomija u
  srži, zadaci L9–L11 (12:36, [ADR-008](DECISIONS.md#adr-008)).
- **Rino:** dva kruga napomena na arhitekturu (#2, 12:25): profesorski kod izvan adrese, dvostruko zatvaranje kruga,
  polling umjesto Realtimea, `serverNow`, mentor izvan zatvaranja, `db.batch`
  ([ADR-003](DECISIONS.md#adr-003), [004](DECISIONS.md#adr-004), [006](DECISIONS.md#adr-006), [007](DECISIONS.md#adr-007)).
- **Simon:** prijedlog gamifikacije R10 i napretka kao normaliziranog dobitka (#31).
