# Odluke (ADR)

Svaka značajna odluka: kontekst, odluka, posljedice. **Najnovija na vrhu.** Odluka ovdje objašnjava **zašto**;
**što vrijedi** piše u [ARHITEKTURA.md](../../ARHITEKTURA.md), [planu](../superpowers/plans/2026-10-24-simpolis.md) i
kodu. Kratki popis odluka tima vodi se i u [TEAM.md › Odluke](../../TEAM.md#odluke).

Status: ✅ odlučeno · 🔁 zamijenjeno · 🟨 potvrditi

---

<a id="adr-016"></a>
## ADR-016 · `CharacterInput` dobiva `messageNo?` i `maxMessages?` kao neobavezna polja
**Datum:** 24.10. ~14:40 · **Status:** ✅ (Leon) · **Vezano:** [#42](https://github.com/leonkreso784-bit/riihack/pull/42), [#63](https://github.com/leonkreso784-bit/riihack/pull/63), [ADR-011](#adr-011)

**Kontekst.** Simonov S3 (lik i razgovor) treba znati koja je ovo poruka studenta i koliko ih smije biti (#42).
**Odluka.** Polja ulaze u ugovor kao **neobavezna** (pravilo iz ADR-011); #63 mijenja `types.ts` i blok „Ugovor" u
planu zajedno; Simon zatvara #42 kao duplikat. #63 spojen u 14:58.
**Posljedice.** Postojeći kod koji ne puni polja i dalje prolazi build.

<a id="adr-015"></a>
## ADR-015 · Tri Claude sesije, a spaja samo integrator
**Datum:** 24.10. 🟨 vrijeme · **Status:** ✅ (Leon) · **Vezano:** [SESIJE.md](../workflow/SESIJE.md), ADR-014, BUG-001

**Kontekst.** Prvih sat vremena PR-ove je spajao njihov vlasnik; dvaput se isti zadatak radio dvaput
(#36 i #37, #49 i #50), a jednom je `main` ostao crven (BUG-001).
**Odluka.** Leonov rad ide kroz tri sesije: **graditelj** (L-zadaci s agentima), **integrator** (pregledava i spaja
PR-ove cijelog tima, čuva `main`) i **dokumentarist** (samo `docs/`). Svaka u svom radnom stablu.
**Posljedice.** Spaja samo integrator; autor PR-a javlja da je spreman (integrator, [ODLUKA] 24.10.). Vrijedi za
PR-ove cijelog tima ([TEAM.md](../../TEAM.md) pravilo 3), i to **automatski** za sve što prođe provjeru na svježem
`main`-u (Leon, ~15:00). **Dokumentacija je na
`main`-u** jer po njoj grade ljudi i agenti (Leon, ~15:05; prije toga kratko samo na grani, #58 vraćen s #60).

<a id="adr-014"></a>
## ADR-014 · Ploča tima u `TEAM.md`, izravno na `main`
**Datum:** 24.10. 14:11 · **Status:** ✅ (Leon) · **Vezano:** [#53](https://github.com/leonkreso784-bit/riihack/pull/53)

**Kontekst.** Troje ljudi s agentima radi paralelno; nije se vidjelo tko što radi ni tko na koga čeka.
**Odluka.** `TEAM.md` je zajednička ploča: svatko uređuje samo svoje polje, izravno na `main` bez PR-a, commit
`ploča: <ime>`. Zajedničke dijelove (prekretnice, čekanja, pravila, odluke) smije svatko, uz poruku na Discordu.
**Posljedice.** „Tko što radi sada" živi samo na ploči; dnevnik ([PROGRESS.md](PROGRESS.md)) to ne ponavlja.

<a id="adr-013"></a>
## ADR-013 · Lažni podaci su zadani dok API ne proradi
**Datum:** 24.10. 14:14 · **Status:** ✅ (Rino) · **Vezano:** [#52](https://github.com/leonkreso784-bit/riihack/pull/52), BUG-003

**Kontekst.** Na Vercelu nije bio postavljen `NEXT_PUBLIC_USE_MOCK`, pa je `/igra` zvala nepostojeći `/api/me`.
**Odluka.** Sučelje zadano čita `lib/mock.ts`; `NEXT_PUBLIC_USE_MOCK=0` prebacuje na poslužitelj. Ekran pokazuje
oznaku „primjer" dok su podaci lažni.
**Posljedice.** Kad L4/L7 rute prorade, Leon na Vercelu postavlja `NEXT_PUBLIC_USE_MOCK=0` (Production i Preview) i
radi redeploy; isto u `.env.example`.

<a id="adr-012"></a>
## ADR-012 · Osoblje hotela je sadržaj, bez baze
**Datum:** 24.10. 13:45 · **Status:** ✅ (Leon s timom) · **Vezano:** [#45](https://github.com/leonkreso784-bit/riihack/pull/45)

**Kontekst.** Hotel treba „ljude" uz sobe da bi svijet djelovao živo, a vremena za novu tablicu nema.
**Odluka.** Svaki predložak hotela ima 6–10 ljudi osoblja iz 5 odjela (`HotelTemplate.staff`); `GET /api/me/staff`
ih vraća iz predloška; stranica `/igra/osoblje`.
**Posljedice.** Osoblje se ne mijenja tijekom igre. Karta grada pokazuje cijelu ekonomiju grada.

<a id="adr-011"></a>
## ADR-011 · `types.ts` je doslovno iz plana, a novo polje je neobavezno
**Datum:** 24.10. 13:29 (L0), pravilo nakon BUG-001 (~14:10) · **Status:** ✅ (Leon) · **Vezano:** [#37](https://github.com/leonkreso784-bit/riihack/pull/37), [TEAM.md](../../TEAM.md) pravilo 2, BUG-001

**Kontekst.** Sučelje i backend grade se usporedno preko ugovora `src/lib/types.ts`. Obavezno polje dodano u ugovor
(#45) srušilo je build tuđeg koda koji ga još nije punio.
**Odluka.** `types.ts` je identičan bloku u planu i mijenja ga samo Leon, uvijek zajedno s planom. **Novo polje je
neobavezno (`?`)** dok ga svi ne pune; najava pod „Odluke" i na Discordu prije spajanja.
**Posljedice.** Isto vrijedi za `rules.ts` i `package.json` (vlasnik Leon).

<a id="adr-010"></a>
## ADR-010 · Kostur je Leonov L0 (#37), Simonov (#36) se zatvara
**Datum:** 24.10. 13:29 · **Status:** ✅ (Leon) · **Vezano:** [#37](https://github.com/leonkreso784-bit/riihack/pull/37), [#36](https://github.com/leonkreso784-bit/riihack/pull/36)

**Kontekst.** Leon i Simon su istovremeno napravili kostur iz startera.
**Odluka.** Spaja se #37 (s CI-jem i ugovorom tipova); ljuska je usklađena sa `simon/L0-kostur`, da Rinov R0 (#40)
prijeđe bez sukoba.
**Posljedice.** Uvedeno pravilo „jedan zadatak, jedan čovjek" ([TEAM.md](../../TEAM.md) pravilo 1).

<a id="adr-009"></a>
## ADR-009 · Napredak kao normalizirani dobitak
**Datum:** 24.10. 13:39 · **Status:** ✅ (Leon s timom) · **Vezano:** [#31](https://github.com/leonkreso784-bit/riihack/pull/31), [#45](https://github.com/leonkreso784-bit/riihack/pull/45), [plan › Gamifikacija](../superpowers/plans/2026-10-24-simpolis.md#gamifikacija-bodovanje-iz-hotelixsima-l5-odlučeno-2410)

**Kontekst.** Hoteli kreću s različito raspoređenim pokazateljima; zbroj razlika nagrađuje one koji kreću nisko.
**Odluka.** Napredak je normalizirani dobitak (Hake 1998, kao u HotelixSimu), raspon −100 do +100; ljestvica nosi i
`roundGain` (napredak u zadnjem zatvorenom krugu). Gamifikacija R10: podij kruga, top 5 i moje mjesto, anonimno.
**Posljedice.** Poznati rizik: bod pri vrhu vrijedi više; za demo prihvatljivo.

<a id="adr-008"></a>
## ADR-008 · Grad ima zajedničko tržište turista i novac
**Datum:** 24.10. 12:36 · **Status:** ✅ (Leon) · **Vezano:** `f91128c`, [ARHITEKTURA §5c](../../ARHITEKTURA.md#5c--ekonomija-grada-svi-utječu-na-sve), plan L9–L11

**Kontekst.** Najvažnija poruka (Leon, 24.10.) je „grad u simulaciji s pravom ekonomijom": odluka jednog studenta
mora mijenjati poslovanje drugih.
**Odluka.** Svi hoteli dijele iste turiste (potražnja po mjesecu sezone), dijele se po privlačnosti; plan kruga
(cijena, marketing), novac i ugovori s gradskim tvrtkama. Obračun mjeseca radi se za cijeli grad odjednom kad profesor
zatvori mjesec.
**Posljedice.** Novi zadaci L9–L11, S5, S6. 🟨 [ARHITEKTURA §1a](../../ARHITEKTURA.md#1a--što-je-stvarno-što-je-sučelje-što-je-plan)
pod „Što NE radimo" još navodi „pravu ekonomiju tržišta, zajedničko tržište gostiju", što je suprotno ovoj odluci.

<a id="adr-007"></a>
## ADR-007 · Zatvaranje kruga u `db.batch`, ne u transakciji
**Datum:** 24.10. 12:14 · **Status:** ✅ (Leon, na Rinov prijedlog) · **Vezano:** `0d7e588`, [napomene-rino.md](../napomene-rino.md) točka 7

**Kontekst.** `drizzle-orm/neon-http` nema `db.transaction()`, a zatvaranje kruga piše u više tablica; pad na pola
ostavio bi zatvoren krug bez izvještaja.
**Odluka.** Prvo zaštita `UPDATE … WHERE closed_round < k RETURNING`, zatim svi ostali zapisi u jednom
`db.batch([...])`. Isto za obračun mjeseca (`settled_round`).
**Posljedice.** Samo prvi od istovremenih zahtjeva obračuna krug; provjera je korak „dvostruki obračun" u smokeu (L8).

<a id="adr-006"></a>
## ADR-006 · Mentor se ne zove pri zatvaranju kruga
**Datum:** 24.10. 12:14 · **Status:** ✅ (Leon, na Rinov prijedlog) · **Vezano:** `0d7e588`, [napomene-rino.md](../napomene-rino.md) točka 2 i 6

**Kontekst.** Kad istekne rok, polling 30 studenata zatvara krugove u istoj sekundi: 30 Sonnet poziva odjednom.
**Odluka.** Zatvaranje upiše samo brojke; pitanje mentora nastaje kad student otvori izvještaj
(`GET /api/me/report/[round]`, `UPDATE … WHERE mentor_question IS NULL`).
**Posljedice.** Prvo otvaranje izvještaja čeka AI; rezerva je tekst iz brojki.

<a id="adr-005"></a>
## ADR-005 · Neon i Drizzle umjesto Supabasea
**Datum:** 24.10. 11:59 · **Status:** ✅ (Leon) · **Vezano:** `bef8ab5`, `88421d4`, [ARHITEKTURA §3](../../ARHITEKTURA.md#3--stack)

**Kontekst.** Zadani stack ([CLAUDE.md](../../CLAUDE.md)) bio je Supabase; Simonov starter s Neonom i Drizzleom već je
bio isproban na Vercelu.
**Odluka.** Neon Postgres + Drizzle ORM, samo s poslužitelja; Better Auth izbačen jer nema računa. Neon (Frankfurt,
besplatni plan) preko Vercel Marketplacea: baza `simpolis-db` napravljena sub ~14:35, `DATABASE_URL` na Vercelu
(production, preview, development), tablice iz L1 ([#62](https://github.com/leonkreso784-bit/riihack/pull/62)) u bazi.
**Posljedice.** Nema Supabase Realtimea (vidi ADR-003) ni transakcija na `neon-http` (ADR-007). `CLAUDE.md` › Stack usklađen
(Neon + Drizzle).

<a id="adr-004"></a>
## ADR-004 · Bez računa: kodovi i httpOnly kolačići
**Datum:** 24.10. 11:59 · **Status:** ✅ (Leon, na Rinov prijedlog) · **Vezano:** `bef8ab5`, [ARHITEKTURA §8](../../ARHITEKTURA.md#8--api), [napomene-rino.md](../napomene-rino.md) točka 1

**Kontekst.** Računi i lozinke su izvan opsega 24 h; ulaz mora biti kao na Kahootu. Profesorova ploča ide na
projektor, pa bi kod u adresi vidio cijeli razred.
**Odluka.** Student ulazi kodom igre (6 znakova), imenom i imenom hotela i dobije token u kolačiću `sp_player`.
Profesor ima kod od 12 znakova koji **nikad nije u adresi**, samo u kolačiću `sp_prof`. U bazi su samo SHA-256 sažetci.
**Posljedice.** Ponovni ulaz istim kodom, imenom i imenom hotela vraća isti hotel (smoke L8).

<a id="adr-003"></a>
## ADR-003 · Osvježavanje pollingom svake 3 s
**Datum:** 24.10. 11:52 · **Status:** ✅ (Leon; Rino predložio maknuti Realtime) · **Vezano:** [ARHITEKTURA §3](../../ARHITEKTURA.md#3--stack), [napomene-rino.md](../napomene-rino.md) točka 3

**Kontekst.** Profesorova ploča i ekrani studenata moraju se osvježavati uživo; Realtime iz preglednika traži anon
ključ i RLS.
**Odluka.** Polling svake 3 s (`POLL_MS = 3000`); odbrojavanje iz `roundDeadline − serverNow`.
**Posljedice.** Preglednik nikad ne zove bazu izravno.

<a id="adr-002"></a>
## ADR-002 · AI ne odlučuje o brojkama
**Datum:** 24.10. 11:52 · **Status:** ✅ (Leon, načelo iz HotelixSima) · **Vezano:** [ARHITEKTURA §2](../../ARHITEKTURA.md#2--načela-preuzeta-iz-hotelixsima-kod-pišemo-iznova), [CLAUDE.md](../../CLAUDE.md)

**Kontekst.** Ocjena mora biti ponovljiva i objašnjiva profesoru; AI je nepredvidiv.
**Odluka.** AI glumi likove, vraća popis ispunjenih kriterija rubrike i piše mentora. Kvalitetu i bodove računa motor
(`src/lib/engine/`, čiste funkcije). Najbolji klik daje najviše 4, vlastiti odgovor do 5.
**Posljedice.** Svaki AI poziv ima rok 20 s i rezervu (presuda → kvaliteta 3).

<a id="adr-001"></a>
## ADR-001 · Jedan Next.js projekt s API rutama
**Datum:** 24.10. 11:52 · **Status:** ✅ (Leon) · **Vezano:** [ARHITEKTURA §3](../../ARHITEKTURA.md#3--stack)

**Kontekst.** 24 sata, troje ljudi, deploy od prvog sata.
**Odluka.** Jedan Next.js (App Router) projekt: sučelje i `src/app/api/*`, deploy na Vercel (`main` se deploya sam).
**Posljedice.** Nema zasebnog servera ni CORS-a; sučelje radi na lažnim podacima dok rute ne prorade (ADR-013).
