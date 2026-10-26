# Simpolis: dokumentacija

**TL;DR**

- Ovo je ulaz u svu dokumentaciju. Aktualni dokumenti su u `docs/`, a arhiva natjecanja u [`hackathon/`](hackathon/README.md).
- Novi u projektu: [README.md](../README.md), zatim [STATUS.md](STATUS.md), [ARHITEKTURA.md](ARHITEKTURA.md) i [RAZVOJ.md](RAZVOJ.md).
- Jedna činjenica ima jedno mjesto (tablica niže). Duplikat se briše, ne sinkronizira.
- Što sustav radi određuju kod i testovi. Dokumenti to opisuju, ne definiraju.

## Za novu osobu (čitaj ovim redom)

1. [README.md](../README.md) ([engleski](../README.en.md)): što je Simpolis, kako radi, kako ga pokrenuti.
2. [STATUS.md](STATUS.md): što radi, što je djelomično, poznate greške, što fali za pilot.
3. [ARHITEKTURA.md](ARHITEKTURA.md): stack, podaci, motor, AI, API, ekrani.
4. [ROADMAP.md](ROADMAP.md): kamo idemo (pilot, licence, sljedeći koraci).
5. [RAZVOJ.md](RAZVOJ.md): postavljanje, baza, testovi, git i PR pravila, rad s agentima.
6. [records/DECISIONS.md](records/DECISIONS.md): zašto je nešto tako (najnovije odluke su na vrhu).

Claude Code i ostali agenti: [CLAUDE.md](../CLAUDE.md) i [AGENTS.md](../AGENTS.md).

**Pravila koja se najlakše prekrše** (cijela su u [RAZVOJ.md](RAZVOJ.md)):

- Nitko ne pokreće `npm run db:push` na zajedničkoj bazi ([ADR-026](records/DECISIONS.md#adr-026)).
- PR spaja samo integrator ([ADR-015](records/DECISIONS.md#adr-015)). Ugovor (`types.ts`, `rules.ts`, `package.json`) i sadržaj situacija čekaju Leonovo "spoji" ([ADR-017](records/DECISIONS.md#adr-017)).
- Novo polje u ugovoru je neobavezno ([ADR-011](records/DECISIONS.md#adr-011)).
- Dev server na svom portu; gasi se samo taj proces.
- `NEXT_PUBLIC_USE_MOCK=0` je pravi API, sve ostalo su lažni podaci.

## Struktura

```
README.md, README.en.md     što je Simpolis (hr, en)
LICENSE                     sva prava pridržana
CLAUDE.md, AGENTS.md        pravila za Claude Code i agente
.env.example                imena varijabli okruženja
docs/
  README.md                 ovaj indeks
  ARHITEKTURA.md            tehnika
  STATUS.md                 stanje projekta
  ROADMAP.md                kamo dalje
  RAZVOJ.md                 vodič za programere
  img/                      slike za dokumentaciju
  records/                  odluke, bugovi, changelog
  hackathon/                arhiva natjecanja i vremenska crta
  superpowers/plans/        samo upute na premješteni plan (stari linkovi iz issueova)
```

| Mapa ili datoteka | Uloga | Mijenja se |
| --- | --- | --- |
| [`ARHITEKTURA.md`](ARHITEKTURA.md) | **kako je složeno**: stack, podaci, motor, AI, API, ekrani | uz svaku veću izmjenu koda |
| [`STATUS.md`](STATUS.md) | **što postoji**: gotovo, djelomično, greške, praznine za pilot | stalno |
| [`ROADMAP.md`](ROADMAP.md) | **kamo idemo**: pilot, licence, kasnije faze | uz odluku |
| [`RAZVOJ.md`](RAZVOJ.md) | **kako radimo**: postavljanje, baza, testovi, git, agenti | povremeno |
| [`records/`](records/) | **povijest odluka**: ADR, bugovi, spojeni PR-ovi | stalno |
| [`hackathon/`](hackathon/README.md) | **arhiva** Ri-Hack 4.0: ideja, plan, pitch, dnevnik | ne mijenja se |
| [`superpowers/plans/`](superpowers/plans/2026-10-24-simpolis.md) | **kratke upute** na plan koji je premješten u `hackathon/plans/`; ostale su da stari linkovi ne puknu | ne mijenja se |

## Gdje što ide: jedna činjenica, jedno mjesto

| Vrsta znanja | Jedino mjesto | Ostali |
| --- | --- | --- |
| što sustav radi | **kod i testovi** | dokumenti to opisuju, ne definiraju |
| što je Simpolis, kome je namijenjen, kako ga pokrenuti u minuti | [README.md](../README.md), [README.en.md](../README.en.md) | linkaju |
| tehnika: stack, podaci, motor, AI, API, ekrani | [ARHITEKTURA.md](ARHITEKTURA.md) | linkaju |
| što radi, što ne radi, poznate greške, što fali za pilot | [STATUS.md](STATUS.md) | linkaju |
| kamo idemo: pilot, cijene, licence, kasnije faze | [ROADMAP.md](ROADMAP.md) | linkaju |
| postavljanje, varijable okruženja, baza, testovi, git i PR, agenti | [RAZVOJ.md](RAZVOJ.md) | linkaju |
| **zašto** je nešto tako | [records/DECISIONS.md](records/DECISIONS.md) (ADR) | ostali linkaju ADR |
| bugovi i lekcije | [records/BUGS.md](records/BUGS.md) | STATUS linka otvorene |
| spojeni PR-ovi do predaje | [records/CHANGELOG.md](records/CHANGELOG.md) | |
| otvoreni zadaci | [GitHub issueovi](https://github.com/leonkreso784-bit/riihack/issues), milestone [Pilot FMTU](https://github.com/leonkreso784-bit/riihack/milestone/6) | [STATUS.md](STATUS.md) i [ROADMAP.md](ROADMAP.md) linkaju |
| ideja, obećanja, pitch, dnevnik, plan natjecanja, vremenska crta | [hackathon/README.md](hackathon/README.md) | arhiva, ne održava se |
| licenca | [LICENSE](../LICENSE) | README i ROADMAP linkaju |
| pravila za Claude Code | [CLAUDE.md](../CLAUDE.md) | |

## Kako pisati dokumente

- Jezik je hrvatski (tim govori hrvatski), osim [README.en.md](../README.en.md). Kod i imena varijabli su na engleskom.
- Svaki novi dokument počinje naslovom i kratkim **TL;DR** (3 do 5 točaka).
- Kratke rečenice, tablice gdje pomažu, bez izmišljenih brojki. Ono što nije dogovoreno piše se kao plan ili cilj.
- Brojke (testovi, stranice, tablice) uzimaj iz koda i `npm test`, ne iz starih dokumenata. Arhiva natjecanja sadrži zastarjele brojke.
- U repo ne idu tajne ni osobni podaci. Kodovi igara i računi samo u `.env.local`.
- Vrijednost mijenja jedan dokument, ostali linkaju. Odluka postaje ADR u [DECISIONS.md](records/DECISIONS.md).
