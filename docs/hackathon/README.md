# Ri-Hack 4.0: arhiva natjecanja

**TL;DR**

- Simpolis je nastao u 24 sata na hackathonu Ri-Hack 4.0 (Rijeka, 24. i 25.10.2026.). Tim Pojedinci (Leon Kreso, Rino Tomić, Simon Seifert) osvojio je **3. mjesto od 8 timova**.
- Verzija koju je ocjenjivao žiri: [release `ri-hack-4.0`](https://github.com/leonkreso784-bit/riihack/releases/tag/ri-hack-4.0), commit `b6ffb61`.
- Ova mapa je **arhiva**: ideja, plan, pitch, dnevnik i ploča tima s natjecanja. Ne održava se, a brojke vrijede na dan natjecanja.
- Aktualno stanje projekta nije ovdje nego u [../STATUS.md](../STATUS.md), [../ROADMAP.md](../ROADMAP.md) i [../ARHITEKTURA.md](../ARHITEKTURA.md).

## Rezultat i poveznice

| Što | Gdje |
| --- | --- |
| Rezultat | 3. mjesto od 8 timova |
| Tema | „Poticanje ljudi na učenje u doba umjetne inteligencije" ([organizatorov dokument](Ri-Hack%204.0%20Tema.pdf)) |
| Verzija koju je ocjenjivao žiri | [release `ri-hack-4.0`](https://github.com/leonkreso784-bit/riihack/releases/tag/ri-hack-4.0), commit `b6ffb61` |
| Aplikacija uživo | <https://riihack.vercel.app/> |
| Prezentacija (web) | <https://prezentacijariihack.vercel.app/> |
| Promo video | [release `promo-video`](https://github.com/leonkreso784-bit/riihack/releases/tag/promo-video) |

Stanje na kraju natjecanja je commit `b6ffb61`. Izmjerene brojke (commitovi, spojeni PR-ovi, testovi, stranice, API rute, tablice, sadržaj igre) su na jednom mjestu: [STATUS.md](../STATUS.md). Brojke u arhivskim dokumentima razlikuju se od njih jer su pisane ranije tijekom natjecanja.

## Vremenska crta

Vremena su lokalna: CEST do nedjelje 03:00, zatim CET. Oznake `#N` su PR-ovi u [repou](https://github.com/leonkreso784-bit/riihack/pulls). Podrobnije: [PROGRESS.md](PROGRESS.md) (po sesijama) i [CHANGELOG.md](../records/CHANGELOG.md) (spojeni PR-ovi).

| Kad | Prekretnica | Ref |
| --- | --- | --- |
| sub 24.10. 11:52 | **Start:** prvi commit, dokumentacija Simpolisa | `7e53b43` |
| sub 24.10. 13:30 | **M0 Temelj:** kostur na riihack.vercel.app, CI zelen | #37 |
| sub 24.10. ~15:45 | **Obilazak žirija 1 prošao.** Žiri: jezgra bez oslanjanja na AI, a profesor postaje glavni ([ADR-023](../records/DECISIONS.md#adr-023)) | #86 |
| sub 24.10. 16:50 do 17:06 | **Val M2 spojen** redom, uz smoke 14/14 i provjeru produkcije ([ADR-028](../records/DECISIONS.md#adr-028)) | #88, #89, #75, #96, #95 |
| sub 24.10. 17:09 do 17:15 | **Kod za M3 na `main`-u:** playbook, demo igra, promjena ocjene mentora, AI prijedlog situacije | #100, #103, #104, #111 |
| sub 24.10. ~17:52 | **Produkcija na pravim podacima** (prije samo Preview, [ADR-030](../records/DECISIONS.md#adr-030)) | #115 |
| sub 24.10. ~19:00 | **Obilazak žirija 2 prošao:** aplikacija uživo 3 minute, bez primjedbi žirija | #150 |
| sub 24.10. ~23:30 | **Demo spreman za obilazak 3:** val 3, balans cijene i pokazatelja, botovi, kasni ulaz. Baza očišćena, demo igra posijana, smoke na produkciji 20/20, bugovi s testa produkcije (BUG-014 do 027) riješeni | #213, #214, #205, #221 |
| ned 25.10. 02:59 CEST | **Ispravci s testa produkcije spojeni:** obračun grada u izvještaju i podiju, plan se prenosi, ocjena 1 za napisan odgovor, granice AI-ja | #240, #241, #247, #249, #251, #252, #253 |
| ned 25.10. ~02:30 CET | **Demo ponovno spreman za obilazak 3:** noćni ispravci spojeni i potvrđeni na produkciji, demo igra ponovno posijana, smoke na produkciji 20/20 | #241, #252, #253, #262 |
| ned 25.10. ~08:00 CET | **Obilazak žirija 3 prošao:** žiri sam igra produkciju na svojim mobitelima | #262, #264, #267, #272 |
| ned 25.10. ~10:00 CET | **Produkcija zamrznuta:** integrator spaja samo na Leonovo izravno „spoji". Zadnji merge u 09:55 CET je `b6ffb61` (#290), oznaka `ri-hack-4.0` | #290 |
| ned 25.10. 10:30 CET | **Rok predaje:** prezentacija (PDF) i GitHub link | |
| ned 25.10. | **Rezultat:** 3. mjesto od 8 timova | |

## Datoteke u arhivi

| Datoteka | Što je |
| --- | --- |
| [IDEJA.md](IDEJA.md) | Tema natjecanja, izbor ideje, obrasci igre, ime |
| [PROMISE.md](PROMISE.md) | Problem u jednoj rečenici, korisnik, broj s izvorom, tri obećanja |
| [PREDAJA.md](PREDAJA.md) | Tekst dokumentacije za predaju i nacrt pitcha |
| [PLAN-24H.md](PLAN-24H.md) | Raspored 24 sata i prekretnice M0 do M4 |
| [ROADMAP-do-predaje.md](ROADMAP-do-predaje.md) | Tko radi što do predaje, po prekretnicama (ne miješati s [../ROADMAP.md](../ROADMAP.md), koji govori o pilotu) |
| [RADNI-DOGOVOR.md](RADNI-DOGOVOR.md) | Podjela posla po mapama i početna pravila (danas vrijedi [../RAZVOJ.md](../RAZVOJ.md), koji koristi npm, ne pnpm) |
| [TEAM.md](TEAM.md) | Ploča tima tijekom natjecanja: tko što radi, tko na koga čeka, pravila suradnje, odluke, tko smo |
| [SESIJE.md](SESIJE.md) | Kako su Leonove tri Claude sesije (graditelj, integrator, dokumentarist) radile zajedno |
| [PROGRESS.md](PROGRESS.md) | Dnevnik napretka po sesijama, najnovije gore |
| [napomene-rino.md](napomene-rino.md) | Rinov pregled nacrta arhitekture (24.10.). Piše o ranom nacrtu sa Supabaseom, a stack je od tada Neon |
| [Ri-Hack 4.0 Tema.pdf](Ri-Hack%204.0%20Tema.pdf) | Organizatorov dokument s temom natjecanja |
| [plans/](plans/2026-10-24-simpolis.md) | Plan izvedbe (zadaci L0 do L8, S0 do S7, R0 do R9, ugovor tipova, API, prekretnice) i [plan vala 3](plans/2026-10-24-simpolis-val-3.md) |
| [prezentacija/](prezentacija/README.md) | Prezentacija v6 (PDF i web), pitch skripta, odgovori na pitanja žirija, scenariji obilaska, video demoa |
| [branches.tsv](branches.tsv) | Popis grana s natjecanja (vidi niže) |

Ovi dokumenti su premješteni iz korijena repoa i iz `docs/`. Njihove stare putanje (npr. `TEAM.md`, `IDEJA.md`, `ARHITEKTURA.md` u korijenu) i dalje postoje na oznaci `ri-hack-4.0`, pa linkovi iz starih PR-ova i issueova vode tamo.

Spojeni u nove dokumente i uklonjeni s `main`-a (čitaju se na oznaci `ri-hack-4.0`):

| Uklonjena datoteka | Gdje je sada |
| --- | --- |
| `docs/product/PRD.md` | [na oznaci](https://github.com/leonkreso784-bit/riihack/blob/ri-hack-4.0/docs/product/PRD.md) (kriteriji prihvaćanja iz natjecanja); današnje stanje je u [STATUS.md](../STATUS.md) |
| `docs/product/VISION.md` | [ROADMAP.md](../ROADMAP.md#vizija) |
| `docs/records/BACKLOG.md` | [ROADMAP.md](../ROADMAP.md#ideje-bez-datuma) i [STATUS.md](../STATUS.md#što-nije-izgrađeno) ([stara verzija](https://github.com/leonkreso784-bit/riihack/blob/ri-hack-4.0/docs/records/BACKLOG.md)) |
| `docs/records/HISTORY.md` | [Vremenska crta](#vremenska-crta) gore |
| `docs/workflow/TESTING.md` | [RAZVOJ.md](../RAZVOJ.md#pokretanje-i-testovi) |

## Druge verzije pitcha

U [prezentacija/](prezentacija/README.md) je verzija v6. Ostale verzije nisu spojene u `main`, a sačuvane su kao oznake:

| Oznaka | Što sadrži |
| --- | --- |
| `archive/simon/prezentacija-v8` | Završna verzija prezentacije (20 slajdova), PDF i pitch skripta v8 |
| `archive/simon/prezentacija-web` | Druga kopija web prezentacije s preporukama za nastup |

```bash
git fetch --tags
git worktree add ../riihack-v8 archive/simon/prezentacija-v8   # pregled u zasebnom radnom stablu
```

## Grane i `branches.tsv`

[branches.tsv](branches.tsv) je popis grana koje su postojale pri čišćenju repoa (246 redaka, odvojeno tabulatorom): ime grane, SHA zadnjeg commita, broj PR-a i stanje (`MERGED`, `OPEN`, `CLOSED`, `NO_PR`, `MAIN`). Grane se nakon spajanja brišu, a ovdje ostaje trag. Obrisanu granu vraćaš ovako:

```bash
git push origin <sha>:refs/heads/<ime-grane>
# primjer: git push origin c8222fb211b5911905356c347657b4f2eb49cbf4:refs/heads/leon/L0-kostur
```

Grana koja se ne spaja, a vrijedi je sačuvati, dobiva oznaku `archive/<ime>/<grana>` prije brisanja ([RAZVOJ.md](../RAZVOJ.md#git-i-pr-pravila)).
