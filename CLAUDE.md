# CLAUDE.md

Upute za Claude Code (i za ljude) u ovom repou.

> **Nova sesija počinje čitanjem [docs/SLJEDECA_SESIJA.md](docs/SLJEDECA_SESIJA.md)** (gdje smo, što je prvo, što je otvoreno).

## Što je ovo

Radni repo tima Leon, Simon i Rino za **Ri-Hack 4.0**, hackathon RITEH Web Teama u STEP RI-ju u Rijeci. Imamo 24 sata da napravimo rješenje na zadanu temu i predamo dokumentaciju preko Discorda. Natjecanje je isključivo programersko, ali žiri cijeni jasnu viziju i poslovni model.

**Tema:** *Poticanje ljudi na učenje u doba umjetne inteligencije*. Radimo **Simpolis**: svijet simulacija za učenje (prvo hotel), na foru Leonovog HotelixSima. Iz HotelixSima se prenose ideje, ne kod. Ime nikad nije HotelixSim. Rok predaje: **ned 25.10.2026. u 10:30**. **Ovo je repo natjecanja:** prvi commit napravljen je na natjecanju (pravilo s Discorda, [ocjenjivanje](https://github.com/leonkreso784-bit/ri-hack-4/blob/main/research/ocjenjivanje-2026.md)), a predaje se GitHub link na ovaj repo. Priprema i istraživanje ostaju u [ri-hack-4](https://github.com/leonkreso784-bit/ri-hack-4). Sve o ideji je u [IDEJA.md](IDEJA.md), a tehnika u [ARHITEKTURA.md](ARHITEKTURA.md).

## Istraživanje (u repou ri-hack-4)

[RESEARCH.md](https://github.com/leonkreso784-bit/ri-hack-4/blob/main/RESEARCH.md) je indeks svega što smo skupili: prošla izdanja i što je pobijedilo, pitanja žirija, problemi i otvoreni podaci Rijeke, ljudi u žiriju, pitch pravila, ažurni vodiči za stack u `docs/briefs/`. Kad izađe tema, prvo koristi [research/data-pack.md](https://github.com/leonkreso784-bit/ri-hack-4/blob/main/research/data-pack.md), [research/rijeka-problems.md](https://github.com/leonkreso784-bit/ri-hack-4/blob/main/research/rijeka-problems.md) i [research/inspiration.md](https://github.com/leonkreso784-bit/ri-hack-4/blob/main/research/inspiration.md). Stack pitanja provjeri u `docs/briefs/<alat>.md` (u ri-hack-4) prije weba.

## Dokumenti

- [README.md](README.md): osnovno o natjecanju i linkovi
- [TEAM.md](TEAM.md): tko smo i u čemu je tko jak
- [RADNI-DOGOVOR.md](RADNI-DOGOVOR.md): zadani stack, provjera prije početka, git pravila
- [PLAN-24H.md](PLAN-24H.md): raspored 24 sata
- [IDEJA.md](IDEJA.md): tema, ideja, ime
- [ARHITEKTURA.md](ARHITEKTURA.md): stack, podaci, motor, AI, API, ekrani
- [PREDAJA.md](PREDAJA.md): dokumentacija i pitch
- **[Plan izvedbe](docs/superpowers/plans/2026-10-24-simpolis.md)**: svi zadaci (L0–L8, S0–S7, R0–R9), ugovor tipova, API, prekretnice; svaki zadatak ima GitHub issue istog ID-a
- [RESEARCH.md](https://github.com/leonkreso784-bit/ri-hack-4/blob/main/RESEARCH.md): istraživanje, strategija, predlošci

## Kako raditi

- **Demo koji radi je važniji od savršenog koda.** Biraj najjednostavnije rješenje koje radi. Bez apstrakcija "za kasnije", bez preranih optimizacija.
- **Glavni tok prvo.** Prvo jedan korisnik i jedan scenarij od početka do kraja, a tek onda rubni slučajevi i dorada.
- **Ne diraj tuđi dio bez pitanja.** Troje ljudi radi paralelno u istom repou. Ako izmjena dira tuđi kod, reci to prije nego što je napraviš.
- **AI ne odlučuje o brojkama.** Bodove računa motor (`lib/engine/`), AI samo glumi likove, sudi po rubrici i piše mentora.
- **Nakon zamrzavanja (ned 06:00) nema novih značajki**, samo popravci (vidi [PLAN-24H.md](PLAN-24H.md)).
- **Jezik:** dokumenti i UI na hrvatskom, osim ako tema ne traži drugačije. Kod i imena varijabli na engleskom.

## Rad s agentima

Svatko radi s više agenata usporedno. Pravila su u [planu izvedbe](docs/superpowers/plans/2026-10-24-simpolis.md) pod „Kako radimo s više agenata". Ukratko:

- Agent dobije **jedan zadatak** (ID iz plana i issue), radi u svom radnom stablu i grani `ime/ID-opis`
  (`git worktree add ../riihack-L2 -b leon/L2-motor-a`).
- Dira **samo datoteke iz svog zadatka**. `package.json`, `src/lib/types.ts` i `src/lib/rules.ts` mijenja samo Leon;
  `src/app/layout.tsx` i `globals.css` samo Rino.
- Prije PR-a: `npm run typecheck && npm run lint && npm test && npm run build`. PR zatvara issue s „Closes #N".
- Next.js 16: prije koda pročitaj vodič u `node_modules/next/dist/docs/` (vidi `AGENTS.md`).

## Git

- `main` mora uvijek raditi. Radi se na granama `ime/opis` (npr. `simon/ai-chat`).
- Merge u `main` često, barem svaka 2 do 3 sata.
- Nikad `git push --force` na `main`.
- Tajne samo u `.env.local`. U repo ide `.env.example` s imenima varijabli, bez vrijednosti.

## Stack

Next.js + TypeScript + Tailwind, Neon Postgres + Drizzle, Claude preko AI SDK-a, Vercel ([ARHITEKTURA.md](ARHITEKTURA.md) §3). Podjela po mapama je u [RADNI-DOGOVOR.md](RADNI-DOGOVOR.md). Pokretanje: `npm install`, `cp .env.example .env.local` (vrijednosti od Leona), `npm run db:push`, `npm run dev`. Lažni podaci za sučelje: `NEXT_PUBLIC_USE_MOCK=1`.
