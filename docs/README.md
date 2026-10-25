# Simpolis: dokumentacija

**Ovo je jedini ulaz u dokumentaciju.** Mape su složene po **ulozi dokumenta**, ne po temi. Dokumenti u korijenu
repoa ostaju gdje jesu (na njih upućuju issueovi i `CLAUDE.md`); ovdje su samo linkani.

## Za novu sesiju (čitaj ovim redom)

1. [CLAUDE.md](../CLAUDE.md): pravila rada u repou.
2. [TEAM.md](../TEAM.md): ploča (tko što radi sada, tko na koga čeka, pravila suradnje, stanje `main`-a).
3. [workflow/SESIJE.md](workflow/SESIJE.md): uloge sesija, oznake poruka, pravila za agente.
4. [records/DECISIONS.md](records/DECISIONS.md): najnovije odluke su na vrhu.
5. [product/PRD.md](product/PRD.md): što demo mora moći po prekretnicama.
6. [workflow/TESTING.md](workflow/TESTING.md): provjere prije PR-a, smoke, baza.
7. Svoj zadatak u [planu izvedbe](superpowers/plans/2026-10-24-simpolis.md) i otvoreni PR-ovi (`gh pr list`).

**Pravila koja se najlakše prekrše:** nitko ne pokreće `npm run db:push`
([ADR-026](records/DECISIONS.md#adr-026)); ugovor (`types.ts`, `rules.ts`, `package.json`) i sadržaj situacija spajaju
se samo na Leonovo „spoji" ([ADR-017](records/DECISIONS.md#adr-017)); spaja samo integrator
([ADR-015](records/DECISIONS.md#adr-015)); dev server na svom portu, gasi se samo taj proces
([SESIJE.md](workflow/SESIJE.md#pravila-za-agente)); novo polje u ugovoru je neobavezno
([ADR-011](records/DECISIONS.md#adr-011)).

## Mape

| Mapa | Uloga | Mijenja se |
| --- | --- | --- |
| [`product/`](product/) | **što** gradimo: zahtjevi, kriteriji prihvaćanja, vizija | rijetko, uz odluku |
| [`records/`](records/) | **povijest**: odluke (ADR), dnevnik, changelog, bugovi, backlog | stalno |
| [`workflow/`](workflow/) | **kako radimo**: provjere i testiranje, sesije i poruke | povremeno |
| [`superpowers/plans/`](superpowers/plans/) | **plan izvedbe**: zadaci L/S/R, ugovor tipova, API, prekretnice | uz odluku |

## Gdje što ide: jedna činjenica, jedno mjesto

| Vrsta znanja | Jedino mjesto | Ostali |
| --- | --- | --- |
| što sustav radi | **kod i testovi** | dokumenti to opisuju, ne definiraju |
| ideja, tema, ime | [IDEJA.md](../IDEJA.md) | linkaju |
| problem, korisnik, tri obećanja | [PROMISE.md](../PROMISE.md) | PRD linka |
| tehnika: stack, podaci, motor, AI, API, ekrani | [ARHITEKTURA.md](../ARHITEKTURA.md) | linkaju |
| zadaci, ugovor tipova, prekretnice | [plan izvedbe](superpowers/plans/2026-10-24-simpolis.md), [plan vala 3](superpowers/plans/2026-10-24-simpolis-val-3.md) | linkaju |
| kriteriji prihvaćanja demoa | [product/PRD.md](product/PRD.md) | |
| tko što radi **sada**, tko na koga čeka | [TEAM.md](../TEAM.md) (ploča) | dnevnik to ne ponavlja |
| **zašto** je nešto tako | [records/DECISIONS.md](records/DECISIONS.md) (ADR) | ostali linkaju ADR |
| što se kad dogodilo | [HISTORY.md](records/HISTORY.md) (redak po prekretnici) · [PROGRESS.md](records/PROGRESS.md) (sesija) · [CHANGELOG.md](records/CHANGELOG.md) (spojeni PR-ovi) | |
| što nije riješeno | [BUGS.md](records/BUGS.md) · [BACKLOG.md](records/BACKLOG.md) · GitHub issueovi | |
| pitch, predaja | [PREDAJA.md](../PREDAJA.md), [ROADMAP.md](ROADMAP.md), `prezentacija/` (Simon) | |

**Duplikat se briše, ne sinkronizira.** Oznaka 🟨 znači tvrdnju koju tim još nije potvrdio.

## Dokumenti

**U korijenu repoa:** [CLAUDE.md](../CLAUDE.md) (pravila rada) · [TEAM.md](../TEAM.md) (ploča tima) ·
[IDEJA.md](../IDEJA.md) · [PROMISE.md](../PROMISE.md) · [ARHITEKTURA.md](../ARHITEKTURA.md) ·
[RADNI-DOGOVOR.md](../RADNI-DOGOVOR.md) (stack, git) · [PLAN-24H.md](../PLAN-24H.md) · [PREDAJA.md](../PREDAJA.md)

**`product/`**

| Dokument | Svrha |
| --- | --- |
| [PRD.md](product/PRD.md) | problem, korisnici, opseg demoa, kriteriji prihvaćanja po prekretnicama, izvan opsega |
| [VISION.md](product/VISION.md) | kamo Simpolis ide nakon hackathona |

**`records/`**

| Dokument | Svrha |
| --- | --- |
| [DECISIONS.md](records/DECISIONS.md) | odluke (ADR), najnovija gore |
| [PROGRESS.md](records/PROGRESS.md) | dnevnik po sesijama, najnovije gore |
| [CHANGELOG.md](records/CHANGELOG.md) | spojeni PR-ovi po prekretnicama |
| [HISTORY.md](records/HISTORY.md) | jedan redak po prekretnici |
| [BUGS.md](records/BUGS.md) | bugovi i lekcije |
| [BACKLOG.md](records/BACKLOG.md) | planirano i izvan opsega |

**`workflow/`**

| Dokument | Svrha |
| --- | --- |
| [TESTING.md](workflow/TESTING.md) | provjere prije PR-a, CI, smoke, ručna provjera ekrana |
| [SESIJE.md](workflow/SESIJE.md) | tri Claude sesije: uloge, radna stabla, oznake poruka |

**Ostalo u `docs/`:** [ROADMAP.md](ROADMAP.md) (Simon: roadmap do predaje) · [napomene-rino.md](napomene-rino.md)
(Rinove napomene na arhitekturu) · [arhitektura.html](arhitektura.html) (vizualna arhitektura) ·
[SLJEDECA_SESIJA.md](SLJEDECA_SESIJA.md) (predaja između sesija)
