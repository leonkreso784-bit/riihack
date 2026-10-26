# CLAUDE.md

Upute za Claude Code (i za ljude) u ovom repou.

## Što je ovo

Radni repo tima Leon, Simon i Rino za **Simpolis**: svijet simulacija za učenje u kojem student vodi hotel, a AI glumi goste i osoblje. Nastao je na hackathonu Ri-Hack 4.0 (24. i 25.10.2026., 3. mjesto od 8) i nastavlja se. Što je i kako radi: [README.md](README.md). Što je gotovo: [docs/STATUS.md](docs/STATUS.md). Kamo idemo: [docs/ROADMAP.md](docs/ROADMAP.md).

## Dokumenti

- [README.md](README.md) (hrvatski) i [README.en.md](README.en.md): što je Simpolis, kako radi, kako pokrenuti
- [docs/README.md](docs/README.md): indeks dokumentacije i tablica "jedna činjenica, jedno mjesto"
- [docs/ARHITEKTURA.md](docs/ARHITEKTURA.md): stack, podaci, motor, AI, API, ekrani
- [docs/STATUS.md](docs/STATUS.md): što radi, što je djelomično, poznate greške, što treba za pilot
- [docs/ROADMAP.md](docs/ROADMAP.md): pilot, licence, sljedeći koraci
- [docs/RAZVOJ.md](docs/RAZVOJ.md): postavljanje, baza, testovi, git i PR pravila, rad s agentima
- [docs/records/](docs/records/): [DECISIONS.md](docs/records/DECISIONS.md) (ADR, zašto je nešto tako), [BUGS.md](docs/records/BUGS.md), [CHANGELOG.md](docs/records/CHANGELOG.md)
- [docs/hackathon/](docs/hackathon/README.md): arhiva natjecanja (ideja, plan, pitch, dnevnik). Ne održava se, brojke vrijede na dan natjecanja.
- [AGENTS.md](AGENTS.md): automatski blok za Next.js 16 (ne briše se, sam se vraća)

## Kako raditi

- **Demo koji radi je važniji od savršenog koda.** Biraj najjednostavnije rješenje koje radi. Bez apstrakcija "za kasnije", bez preranih optimizacija.
- **Glavni tok prvo.** Prvo jedan korisnik i jedan scenarij od početka do kraja, a tek onda rubni slučajevi i dorada.
- **Ne diraj tuđi dio bez pitanja.** Troje ljudi radi paralelno u istom repou. Ako izmjena dira tuđi kod, reci to prije nego što je napraviš.
- **AI ne odlučuje o brojkama.** Bodove računa motor (`src/lib/engine/`), AI samo glumi likove, sudi po rubrici i piše mentora.
- **Jezik:** dokumenti i UI na hrvatskom, osim ako tema ne traži drugačije. Kod i imena varijabli na engleskom.

## Rad s agentima

Svatko radi s više agenata usporedno. Cijela pravila su u [RAZVOJ.md](docs/RAZVOJ.md#rad-s-ai-agentima). Ukratko:

- Agent dobije **jedan zadatak** (issue), radi u svom radnom stablu i grani `ime/opis`.
- Dira **samo datoteke iz svog zadatka**. `package.json`, `src/lib/types.ts` i `src/lib/rules.ts` mijenja samo Leon; `src/app/layout.tsx` i `globals.css` samo Rino.
- Dev poslužitelj na **vlastitom portu** (`npm run dev -- -p <port>`); gasi se samo taj proces, nikad svi `node` procesi.
- Prije PR-a: `npm run typecheck && npm run lint && npm test && npm run build`. PR zatvara issue s "Closes #N".
- Next.js 16: prije koda pročitaj vodič u `node_modules/next/dist/docs/` (vidi `AGENTS.md`).

## Git

Cijela pravila su u [RAZVOJ.md](docs/RAZVOJ.md#git-i-pr-pravila). Ukratko:

- `main` mora uvijek raditi. Radi se na granama `ime/opis` (npr. `simon/ai-chat`).
- PR spaja samo integrator ([ADR-015](docs/records/DECISIONS.md#adr-015)).
- Nikad `git push --force` na `main`.
- Tajne samo u `.env.local`. U repo ide `.env.example` s imenima varijabli, bez vrijednosti.

## Stack

Next.js 16 + TypeScript + Tailwind, Neon Postgres + Drizzle, Claude preko AI SDK-a, Vercel ([ARHITEKTURA.md](docs/ARHITEKTURA.md)). Pokretanje: `npm ci`, `cp .env.example .env.local`, `npm run dev` (detalji u [RAZVOJ.md](docs/RAZVOJ.md)).

- **Lažni podaci:** `NEXT_PUBLIC_USE_MOCK=0` uključuje pravi API, svaka druga vrijednost (i prazno) prikazuje lažne podatke.
- **Baza:** `npm run db:push` samo na vlastitoj praznoj bazi, nikad na zajedničkoj. Zajednička baza dobiva ručni aditivni SQL ([ADR-026](docs/records/DECISIONS.md#adr-026)).
