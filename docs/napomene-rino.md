# Napomene na arhitekturu (Rino)

> 24.10.2026. Pregled [ARHITEKTURA.md](../ARHITEKTURA.md) iz perspektive frontenda i cijelog sustava.
> Ništa od ovoga ne mijenja `ARHITEKTURA.md`; Leon odlučuje što ulazi.

## Zaključak

Arhitektura je dobra za 24 h i idemo s njom: jedna Next.js aplikacija, Supabase, Vercel, polling svake 3 s.
Motor kao čiste TS funkcije koje dijele preglednik i poslužitelj (§6, W1-d) te `lib/types.ts` + `lib/mock.ts`
(§11) znače da frontend može krenuti odmah, bez čekanja backenda. Igra je web aplikacija koja radi u pregledniku
na mobitelu, tabletu, računalu i projektoru; zasebne mobilne aplikacije nema (§1).

## Što predlažem popraviti

### 1. 🔴 Profesorski kod je u adresi, a profesorova ploča ide na projektor

Putanje su `/profesor/[profCode]` i `/api/prof/[profCode]/*`. Na Kahoot ulazu (§1) profesor pokazuje svoj ekran
cijelom razredu, pa se profesorski kod vidi u adresnoj traci. Tko ga prepiše, može otvarati krugove ili završiti
igru, i to pred žirijem.

**Prijedlog:** `POST /api/prof/login {profCode}` postavi httpOnly kolačić (isto kao kod studenta), a putanje
koriste `id` igre: `/profesor/[worldId]`, `/api/prof/[worldId]/*`.

### 2. 🔴 Zatvaranje kruga „pri sljedećem čitanju" može obračunati krug dvaput

§8: kad istekne rok, poslužitelj zatvori otvorene krugove pri sljedećem čitanju. Uz polling svake 3 s i 30
studenata, više zahtjeva stigne u istoj sekundi i svaki pokuša zatvoriti isti krug, pa se `applyRound` primijeni
dva ili tri puta.

**Prijedlog:** neka baza pusti samo jedan zahtjev:

```sql
UPDATE companies SET closed_round = $k
WHERE id = $id AND closed_round < $k
RETURNING *;
```

Krug obračunava samo zahtjev koji dobije redak natrag. Mentora (Sonnet) ne zvati unutar tog zatvaranja, inače
30 sporih AI poziva krene u istom trenutku: brojke se zatvore odmah, a mentorov tekst se generira kad student
otvori izvještaj.

### 3. 🟡 „Supabase Realtime ako ostane vremena" se kosi s „bez RLS-a"

Realtime iz preglednika traži anon ključ, a anon ključ traži RLS (§3). Predlažem da ostanemo na pollingu i
Realtime maknemo iz plana.

### 4. 🟡 Odbrojavanje treba vrijeme poslužitelja

Uz `round_deadline` neka `/api/me` i profesorova ruta vrate i `serverNow`. Inače svako računalo i projektor
pokazuju drukčije odbrojavanje jer satovi nisu usklađeni.

## Frontend (moj dio)

- `/igra` i `/profesor` su klijentske komponente s jednom kukom za polling (`useMe()`, osvježavanje svake 3 s).
  Razgovor s likom ide preko `useChat` iz AI SDK-a.
- Prepoznavanje lijepljenja (W1-c) u pregledniku se lako zaobiđe. To je u redu kao efekt u igri, dok poslužitelj
  zadrži provjeru ≥ 70 % istih riječi (§6).
- Redoslijed: `lib/types.ts` s Leonom → `lib/mock.ts` → ulaz kodom → čekaonica → `/igra` → situacija s razgovorom
  → izvještaj → profesorova ploča. Živa karta (W1-a) dolazi zadnja od W1 jer joj trebaju podaci iz `events`.
