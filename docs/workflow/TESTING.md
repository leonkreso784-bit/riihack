# Testiranje i provjere

Ovo nije popis testova: autoritativan popis je u kodu (`npm test` ispiše sve). Ovdje je samo **što vrtjeti i kada**.
Nađeš li bug, javi ga porukom `[BUG]` ili ga upiši u [BUGS.md](../records/BUGS.md).

## Prije svakog PR-a (lokalno)

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Zatim „Update branch" (ili `git rebase origin/main`) i pričekaj CI na **svježem** `main`-u
([TEAM.md](../../TEAM.md) pravilo 3; zašto: [BUG-001](../records/BUGS.md#bug-001--main-crven-roundgain-uveden-kao-obavezno-polje)).

## CI (GitHub Actions)

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) na svaki push i PR, Ubuntu i Node 24: `npm ci`,
typecheck, lint, test, build. Lokalno zeleno na Windowsu nije dokaz za Linux
([BUG-002](../records/BUGS.md#bug-002--npm-ci-na-linux-ci-ju-pada-zbog-lock-datoteke-s-windowsa)).

**Nakon spajanja** pogledaj CI na `main`-u. Crven `main` = nitko ne spaja dok ga ne popravi onaj čiji je zadnji merge
([TEAM.md](../../TEAM.md) pravilo 4).

## Nakon deploya

Otvori ekran koji si mijenjao u pregledniku: preview link PR-a (pravi podaci) i https://riihack.vercel.app
(lažni podaci dok tim ne odluči, [ADR-018](../records/DECISIONS.md#adr-018)). Vercel nema tvoj `.env.local`
([BUG-003](../records/BUGS.md#bug-003--igra-na-vercelu-vraća-greška-404)).

## Smoke cijelog toka (L8)

```bash
npm run smoke                  # koraci 1–10, BASE_URL zadano http://localhost:3000
SMOKE_CITY=1 npm run smoke     # i koraci 11–14 (grad: plan, obračun mjeseca, ugovori)
```

Koraci (14, od stvaranja igre do dvostrukog obračuna mjeseca) su u
[planu › L8](../superpowers/plans/2026-10-24-simpolis.md#l8--smoke-skripta-i-demo-igra-m2-smoke-m3-demo); pokrivaju
rubne slučajeve iz [Review Focus](../superpowers/plans/2026-10-24-simpolis.md#review-focus). Izlazni kod 1 ako ijedan
korak padne. AI se zasebno provjerava s `npm run ai:smoke`.

## Demo igra (L8, od M3)

```bash
npm run seed:demo      # treba DEMO_JOIN_CODE i DEMO_PROF_CODE u env
```

Prije svakog obilaska žirija: demo igra svježa, krug 2 otvoren.

## Baza

Nikad `npm run db:push` na zajedničkoj Neon bazi. Promjena sheme = ručni aditivni SQL (`CREATE TABLE`,
`ADD COLUMN IF NOT EXISTS`) koji pregleda Leonov graditelj ([ADR-026](../records/DECISIONS.md#adr-026)).

## Ručno: ekrani

Svaki ekran na **375 px, 768 px i 1440 px**; profesorova ploča čitljiva na projektoru. Svaki broj ima ime i jedinicu
([ARHITEKTURA.md §9](../../ARHITEKTURA.md#9--ekrani)).
