# Radni dogovor

## Podjela posla

Projekt: **Simpolis** ([IDEJA.md](IDEJA.md), [ARHITEKTURA.md](ARHITEKTURA.md)). Podjela je **po mapama**, da troje
ljudi ne dira iste datoteke.

| Tko | Što | Mape |
| --- | --- | --- |
| **Rino** | sve ekrane: ulaz, profesorova ploča, uvid u studenta, igra, situacija s razgovorom, izvještaj | `app/` (osim `app/api/`), `components/`, `lib/mock.ts` |
| **Leon** 🟨 | motor, sadržaj hotela, baza, API igre (svijet, ulaz, stanje, klik, zatvaranje kruga, profesorove rute), deploy | `lib/engine/`, `content/hotel/`, `supabase/`, `lib/db/`, `app/api/` (osim AI ruta) |
| **Simon** 🟨 | AI sloj: lik, presuda, mentor, promptovi, rezerve kad AI padne; zatim agencija i ugovori | `lib/ai/`, `prompts/`, `app/api/situations/[id]/chat`, `content/agency/` |
| **Zajedno** | `lib/types.ts` (oblik odgovora API-ja) pišu Leon i Rino **prvi**, prije ičeg drugog; mijenja se samo uz dogovor | `lib/types.ts` |

🟨 Podjelu backenda Leon i Simon još potvrđuju. Rino radi frontend (dogovoreno).

**Granica Leon i Simon:** ruta za vlastiti odgovor (`POST /api/situations/[id]/answer`) je Leonova; ona zove
Simonovu funkciju `judge()` iz `lib/ai/`. Zatvaranje kruga je Leonovo; ono zove Simonov `mentor()`. Simon izlaže
funkcije s dogovorenim potpisom, a Leon ih zove.

## Stack (potvrđuje se)

- **Aplikacija:** Next.js (App Router) + TypeScript + Tailwind, API u `app/api/*`
- **Baza:** Supabase Postgres, samo s poslužitelja
- **AI:** Claude preko AI SDK-a (Haiku za likove, Sonnet za presudu i mentora)
- **Deploy:** Vercel

Detalji i razlozi: [ARHITEKTURA.md](ARHITEKTURA.md) §3. Cilj je demo koji radi na javnom linku, a ne savršen kod.

## Prije početka (svatko provjeri)

- [ ] Pristup ovom repou i `git clone` radi
- [ ] Na Discordu si i imaš ulogu
- [ ] Node 24 i pnpm
- [ ] Računi na Vercelu i Supabaseu (jedan zajednički Supabase projekt)
- [ ] AI ključ: jedan zajednički, samo u `.env.local`, nikad u gitu

## Git pravila

- `main` mora uvijek raditi i deploya se automatski.
- Svatko radi na svojoj grani: `leon/...`, `simon/...`, `rino/...`.
- Merge u `main` često, barem svaka 2 do 3 sata, da ne bude velikih konflikata na kraju.
- Bez `git push --force` na `main`.
- Tajne idu u `.env.local` (u `.gitignore`), a u repo samo `.env.example` s imenima varijabli.
- Kratke poruke commitova koje kažu što se promijenilo.
