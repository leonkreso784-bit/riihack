# Simpolis: dokumentacija

**Ovo je jedini ulaz u dokumentaciju.** Mape su složene po **ulozi dokumenta**, ne po temi. Dokumenti u korijenu
repoa ostaju gdje jesu (na njih upućuju issueovi i `CLAUDE.md`); ovdje su samo linkani.

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
| zadaci, ugovor tipova, prekretnice | [plan izvedbe](superpowers/plans/2026-10-24-simpolis.md) | linkaju |
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
