# Sljedeća sesija (Leon)

> Zapisano sub 24.10.2026. oko 13:00. Otvori Claude Code u mapi `Documents/riihack` i pročitaj ovo prvo.

## Najvažnija poruka

**Simpolis je pravi grad u simulaciji s pravom ekonomijom.** Različiti objekti žive u istom gradu, spajaju se
ugovorima i zarađuju novac, a svatko utječe na druge. U demou: hoteli (studenti) dijele isto tržište turista,
sklapaju ugovore s gradskim tvrtkama (agencije, praonica, pekara, zaštita, vinarija), imaju novac i karta grada to
pokazuje uživo. Vizija za pitch: studenti vode i druge vrste tvrtki, ugovori između studenata, banka, država.
(Ideja „Nauči Ivu" je odbačena.)

## Gdje smo

- **Repo natjecanja:** `leonkreso784-bit/riihack` (javni, prvi commit 24.10. u 11:52). `ri-hack-4` je samo
  priprema i istraživanje; njegova kopija dokumenata je zastarjela.
- **Dokumenti:** [IDEJA.md](../IDEJA.md), [ARHITEKTURA.md](../ARHITEKTURA.md) (§5c ekonomija grada),
  [plan izvedbe](superpowers/plans/2026-10-24-simpolis.md) (30 zadataka), [RADNI-DOGOVOR.md](../RADNI-DOGOVOR.md), [PLAN-24H.md](../PLAN-24H.md).
- **GitHub:** issueovi #3–#29 i #32–#34, dodijeljeni Leonu, Simonu i Rinu, s prekretnicama M0–M4; pregled je
  prikvačeni **#30**. Simon i Rino su suradnici.
- **Koda još nema.** Sve čeka **L0 (#3)**.

## Prvo napraviti (redom)

1. **L0 (#3), cilj M0.** Kostur iz `ri-hack-4/reference/starter`, bez Better Autha, Groqa i karte;
   `src/lib/types.ts` i `src/lib/rules.ts` **točno iz plana** (uključujući tipove i pravila grada); Vitest; CI;
   `.env.example`.
   - **Treba tebe, ne agenta:** Neon projekt (Frankfurt, pooled URL), Vercel projekt iz repoa `riihack`, env
     varijable `DATABASE_URL` i `ANTHROPIC_API_KEY` na Vercelu, `.env.local` privatno poslati Simonu i Rinu.
2. Čim L0 stigne na `main`, javi timu (Rino kreće s R0, Simon s S1).
3. **Tri agenta usporedno:** L1 (#4), L2 (#5), L3 (#6); zatim L4 (#7). Cilj M1 sub 14:30.
4. Nakon M1 **četiri agenta usporedno:** L5 (#8), L6 (#9), L9 (#32), L10 (#33); zatim L7 (#10), pa L11 (#34).
5. Prvi obilazak žirija ~14:45: Simonova tri obećanja (S0, #12; prvo obećanje je grad) i javni link s ulazom
   kodom i sobama.

Naredba za agenta, primjer:
`Radi zadatak L9 iz docs/superpowers/plans/2026-10-24-simpolis.md (issue #32). Pročitaj Global Constraints,
Review Focus i svoj zadatak. Radi u grani leon/L9-ekonomija. Dira samo datoteke iz zadatka. Na kraju provjere i PR s Closes #32.`

## Otvoreno (odluči)

- PR #2 (Rinove napomene) je spojen; sve njegove točke su u planu.
- **PR #31 (Simon):** prijedlog R10 gamifikacije (podij kruga, top 5 + moje mjesto, anonimno) i napretka kao
  normaliziranog dobitka (HotelixSim DEMO §8). Mijenja samo plan, ali traži novo polje `LeaderboardRow.roundGain` u
  `types.ts`: odlučuješ ti s Rinom **prije L0**, jer L0 piše `types.ts`.
- **Tekstovi situacija:** pišu se iznova (ideje iz HotelixSima smiju, tekst ne).
- **Vizualna arhitektura** (`docs/arhitektura.html`, artefakt na claude.ai) još pokazuje stariju verziju.
