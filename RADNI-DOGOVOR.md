# Radni dogovor

## Podjela posla

Projekt: **Simpolis** ([IDEJA.md](IDEJA.md), [ARHITEKTURA.md](ARHITEKTURA.md)). Podjela je **po mapama**, da troje
ljudi ne dira iste datoteke.

| Tko | Što | Mape |
| --- | --- | --- |
| **Rino** | sve ekrane: ulaz, čekaonica, profesor, moja tvrtka, sobe, situacija, izvještaj, uvid (R0–R9) | `src/app/**` osim `api/`, `igra/plan`, `igra/financije`; `src/components/` osim `wow/`; `src/lib/client.ts`, `mock.ts` |
| **Leon** | kostur, baza, motor, sadržaj, API igre, smoke, demo igra, deploy (L0–L8) | `src/db/`, `src/lib/engine/`, `src/lib/game/`, `src/lib/session.ts`, `http.ts`, `types.ts`, `rules.ts`, `src/content/`, `src/app/api/**` osim dvije AI rute, `scripts/`, `.github/` |
| **Simon** | obećanja, AI sloj, lik, presuda, sokratski mentor, karta i radar, plan i financije (sučelje), prezentacija (S0–S7) | `src/lib/ai/`, `api/situations/[id]/chat`, `api/me/reflection`, `api/me/report/[round]`, `src/components/wow/`, `src/app/igra/plan`, `igra/financije`, `src/lib/mock-wow.ts`, `prezentacija/`, `PROMISE.md` |

🟨 Podjelu backenda Leon i Simon još potvrđuju. Rino radi frontend (dogovoreno).

Točan popis datoteka i redoslijed: [plan izvedbe](docs/superpowers/plans/2026-10-24-simpolis.md). Svatko radi s više agenata usporedno.

**Granica Leon i Simon:** ruta za vlastiti odgovor (`POST /api/situations/[id]/answer`) je Leonova; ona zove
Simonovu funkciju `judge()` iz `lib/ai/`. Zatvaranje kruga je Leonovo; ono zove Simonov `mentor()`. Simon izlaže
funkcije s dogovorenim potpisom, a Leon ih zove.

## Stack (potvrđuje se)

- **Aplikacija:** Next.js (App Router) + TypeScript + Tailwind, API u `app/api/*`
- **Baza:** Neon Postgres + Drizzle, samo s poslužitelja (Simonov starter bez Better Autha)
- **AI:** Claude preko AI SDK-a (Haiku za likove, Sonnet za presudu i mentora)
- **Deploy:** Vercel

Detalji i razlozi: [ARHITEKTURA.md](ARHITEKTURA.md) §3. Cilj je demo koji radi na javnom linku, a ne savršen kod.

## Prije početka (svatko provjeri)

- [ ] Pristup ovom repou i `git clone` radi
- [ ] Na Discordu si i imaš ulogu
- [ ] Node 24 i pnpm
- [ ] Računi na Vercelu i Neonu (jedna zajednička Neon baza, spojena preko Vercela)
- [ ] AI ključ: jedan zajednički, samo u `.env.local`, nikad u gitu

## Git pravila

- `main` mora uvijek raditi i deploya se automatski.
- Svatko radi na svojoj grani: `leon/...`, `simon/...`, `rino/...`.
- Merge u `main` često, barem svaka 2 do 3 sata, da ne bude velikih konflikata na kraju.
- Bez `git push --force` na `main`.
- Tajne idu u `.env.local` (u `.gitignore`), a u repo samo `.env.example` s imenima varijabli.
- Kratke poruke commitova koje kažu što se promijenilo.
