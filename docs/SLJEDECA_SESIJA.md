# Sljedeća sesija (Leon)

> Zapisano sub 24.10.2026. oko 12:30. Otvori Claude Code u mapi `Documents/riihack` i pročitaj ovo prvo.

## Gdje smo

- **Repo natjecanja:** `leonkreso784-bit/riihack` (javni, prvi commit 24.10. u 11:52). Priprema i istraživanje
  ostaju u `ri-hack-4` (njegova kopija dokumenata je zastarjela; vrijedi ovaj repo).
- **Dokumenti su gotovi:** [IDEJA.md](../IDEJA.md), [ARHITEKTURA.md](../ARHITEKTURA.md),
  [plan izvedbe](superpowers/plans/2026-10-24-simpolis.md), [RADNI-DOGOVOR.md](../RADNI-DOGOVOR.md), [PLAN-24H.md](../PLAN-24H.md).
- **GitHub je postavljen:** 27 issuea (#3–#29) s oznakama i prekretnicama M0–M4, dodijeljeni Leonu, Simonu i Rinu;
  pregled je prikvačeni issue **#30 „Plan izvedbe: tko radi što"**. Simon i Rino su suradnici.
- **Koda još nema.** Sve čeka **L0 (#3)**.

## Prvo napraviti (redom)

1. **L0 (#3), cilj M0 sub 13:15.** Kostur iz `ri-hack-4/reference/starter`, bez Better Autha, Groqa i karte;
   `src/lib/types.ts` i `src/lib/rules.ts` točno iz plana; Vitest; CI; `.env.example`.
   - **Treba tebe, ne agenta:** Neon projekt (Frankfurt, pooled URL), Vercel projekt iz repoa `riihack`, env
     varijable `DATABASE_URL` i `ANTHROPIC_API_KEY` na Vercelu, `.env.local` privatno poslati Simonu i Rinu.
2. Čim L0 stigne na `main`: javi timu (Rino kreće s R0, Simon s S1).
3. **Tri agenta usporedno**, svaki u svom radnom stablu: L1 (#4), L2 (#5), L3 (#6). Zatim L4 (#7). Cilj M1 sub 14:30.
4. Prvi obilazak žirija ~14:45: Simonova tri obećanja (S0, #12) + javni link s ulazom kodom i sobama.

Naredba za agenta, primjer:
`Radi zadatak L2 iz docs/superpowers/plans/2026-10-24-simpolis.md (issue #5). Pročitaj Global Constraints,
Review Focus i svoj zadatak. Radi u grani leon/L2-motor-a. Dira samo datoteke iz zadatka. Na kraju provjere i PR s Closes #5.`

## Otvoreno

- **PR #2 (Rino, `docs/napomene-rino.md`):** samo dokumentacija; sve njegove točke su ugrađene u plan i
  odgovoreno mu je u komentaru. Treba ga **pregledati i spojiti** (sustav nije dopustio da ga Claude spoji bez
  pregleda).
- **Simon i ideja:** njegovo istraživanje u `ri-hack-4` preporučilo je „Nauči Ivu" i validiralo „Praxis". Potvrdi
  uživo da je i on na Simpolisu prije nego što krene S0.
- **Tekstovi situacija:** plan kaže da se pišu iznova (ideje iz HotelixSima smiju, tekst ne). Ako želiš drukčije,
  promijeni Global Constraints u planu.
- **Vizualna arhitektura** (`docs/arhitektura.html`, artefakt na claude.ai) još pokazuje stariju verziju (Supabase,
  bez soba i Kahoot ulaza).
