# Odluke (ADR)

Svaka značajna odluka: kontekst, odluka, posljedice. **Najnovija na vrhu.** Odluka ovdje objašnjava **zašto**;
**što vrijedi** piše u [ARHITEKTURA.md](../../ARHITEKTURA.md), [planu](../superpowers/plans/2026-10-24-simpolis.md) i
kodu. Kratki popis odluka tima vodi se i u [TEAM.md › Odluke](../../TEAM.md#odluke).

Status: ✅ odlučeno · 🔁 zamijenjeno · 🟨 potvrditi

---

<a id="adr-042"></a>
## ADR-042 · Skice „Tokovi" ipak idu u aplikaciju
**Datum:** 24.10. ~21:40 · **Status:** ✅ (Leon; graditelj prenio porukom [ODLUKA]) · **Vezano:** zamjenjuje [ADR-038](#adr-038), [ADR-002](#adr-002)

**Kontekst.** U ~21:15 i ~21:30 skice „Tokovi" bile su samo za prezentaciju (ADR-038). To su nove stranice koje ne
diraju motor, API ni bazu, a demo s njima objašnjava kako igra radi.
**Odluka.** Simonovi [#174](https://github.com/leonkreso784-bit/riihack/pull/174) („Kako je izračunat mjesec", sa
„Što ako?" kao procjenom u pregledniku) i [#179](https://github.com/leonkreso784-bit/riihack/pull/179) („Kako je tvoj
odgovor prošao kroz hotel") idu u `main` preko integratora, uz Rinov ok za poveznice. Polja `SituationView.rubric?` i
`effects?` (Simonov issue [#178](https://github.com/leonkreso784-bit/riihack/issues/178)) dodaje graditelj. Ruta
„Što ako?" na poslužitelju se i dalje ne radi.
**Posljedice.** Procjena „Što ako?" je samo prikaz u pregledniku; brojke mjeseca i dalje računa samo motor (ADR-002).

Odluke ADR-037 do 041 donio je Leon u sub ~21:15 (graditelj ih je prenio dokumentaristu porukom [ODLUKA]).

<a id="adr-041"></a>
## ADR-041 · Demo za žiri ide s profesorskim računom
**Datum:** 24.10. ~21:15 · **Status:** ✅ (Leon) · **Vezano:** [ADR-036](#adr-036)

**Kontekst.** Na obilasku 3 žiri sam isprobava aplikaciju. Profesorski računi rade na produkciji od ~20:25.
**Odluka.** Demo na žiriju obavezno ide s profesorskim računom, ne samo s profesorskim kodom.
**Posljedice.** Demo pokazuje „moje igre" i knjižnicu situacija. 🟨 Tehnički detalji (koji račun, koja igra, kako
žiri dobiva pristup) dogovaraju se s Leonom.

<a id="adr-040"></a>
## ADR-040 · Tuđi hotel: prihod i dobit zatvorenih mjeseci su javni
**Datum:** 24.10. ~21:15 · **Status:** ✅ (Leon) · **Vezano:** [ADR-035](#adr-035)

**Kontekst.** ADR-035 skriva sav novac tuđih hotela. Pravim tvrtkama su prihod i dobit javni (FINA).
**Odluka.** Prihod i dobit zatvorenih mjeseci tuđeg hotela vide se kao javni podaci. Ostalo o novcu ostaje skriveno,
kao i odgovori i ocjene.
**Posljedice.** Djelomično mijenja ADR-035. Student uspoređuje poslovanje s konkurencijom, a učenje drugih ostaje
privatno.

<a id="adr-039"></a>
## ADR-039 · Redoslijed do predaje: demo i smoke prvo
**Datum:** 24.10. ~21:15 · **Status:** ✅ (Leon) · **Vezano:** [plan vala 3](../superpowers/plans/2026-10-24-simpolis-val-3.md)

**Kontekst.** Do predaje ostaju L8 (demo i smoke za val 3), L19 (suradnja među hotelima) i čišćenje baze.
**Odluka.**
- Graditelj prvo radi L8 demo i smoke za val 3; L19 suradnju samo ako ostane vremena.
- Imena hotela u demo seedu usklađuju se s mjestom (L8).
- Stranicu knjižnice situacija za profesora radi graditelj (Leonov agent), a Rino je stilski pregleda.
- Skriptu za čišćenje testnih podataka iz baze graditelj piše i isproba večeras, ne u nedjelju ujutro.

**Posljedice.** Demo za obilazak 3 ne ovisi o L19. Čišćenje baze nije posao za zadnji sat.

<a id="adr-038"></a>
## ADR-038 · Skice „Tokovi" samo za prezentaciju; „Što ako?" se ne radi
**Datum:** 24.10. ~21:15 · **Status:** 🔁 zamijenjeno u [ADR-042](#adr-042) (~21:40)

**Kontekst.** Simon je napravio skice „Tokovi"; trebalo je odlučiti što od njih ide u aplikaciju.
**Odluka.** Skice su samo za prezentaciju i ne idu u aplikaciju. Ruta „Što ako?" se ne radi.
**Posljedice.** Nema novog posla u kodu; „Što ako?" je u [BACKLOG.md](BACKLOG.md). Leon (~21:30, Simonu): Simonovi
PR-ovi [#174](https://github.com/leonkreso784-bit/riihack/pull/174) (skica 1 sa „Što ako?") i
[#179](https://github.com/leonkreso784-bit/riihack/pull/179) (skica 2) ne idu u `main`; grane ostaju za slajdove
(slike ili Simonov Vercel link).

<a id="adr-037"></a>
## ADR-037 · Integrator sam spaja aditivne dodatke ugovoru prepisane iz plana
**Datum:** 24.10. ~21:15, potvrđeno integratoru ~21:20 · **Status:** ✅ (Leon) · **Vezano:** [ADR-017](#adr-017), [ADR-011](#adr-011)

**Kontekst.** Svaki dodatak ugovoru čekao je Leonovo „spoji" (ADR-017), i kad je bio doslovno iz plana vala 3.
**Odluka.** Integrator sam spaja aditivne, neobavezne dodatke ugovoru (novi tip ili polje s `?` u `types.ts`)
prepisane iz bloka „Ugovor" u planu. Leonovo „spoji" ostaje za izmjene postojećih tipova, `rules.ts`, `package.json`,
lock datoteku i plan.
**Posljedice.** Djelomično mijenja ADR-017. Manje čekanja na Leona, a promjene koje mogu slomiti tuđi kod i dalje
idu preko njega.

Odluke ADR-033 do 036 su val 3; zadaci, ugovor i raspored su u planu vala 3
([#134](https://github.com/leonkreso784-bit/riihack/pull/134), spojen 19:16; [plan vala 3](../superpowers/plans/2026-10-24-simpolis-val-3.md)).

<a id="adr-036"></a>
## ADR-036 · Profesorski računi (Better Auth); prijava kodom ostaje
**Datum:** 24.10. ~18:50 · **Status:** ✅ (Leon) · **Vezano:** [ADR-004](#adr-004), [ADR-027](#adr-027), [ADR-026](#adr-026)

**Kontekst.** Žiri pita kako bi Simpolis koristio pravi profesor; bez računa profesor nema popis svojih igara, a
situacije prenosi samo datotekom (playbook, ADR-027).
**Odluka.** Profesor se prijavljuje e-mailom i lozinkom (Better Auth, računi u našoj Neon bazi) i vidi **moje igre**
i **knjižnicu situacija**. Prijava profesorskim kodom ostaje za postojeće igre i demo; studenti i dalje ulaze kodom.
**Posljedice.** Djelomično mijenja ADR-004. Tablice Better Autha dodaju se pregledanim aditivnim SQL-om (ADR-026).
Kod je [#147](https://github.com/leonkreso784-bit/riihack/pull/147) (20:06). **Na produkciji od ~20:25** (Leonovo izravno „da"
integratoru): `BETTER_AUTH_SECRET` (Production i Preview, samo na Vercelu) i `BETTER_AUTH_URL`; registracija, prijava,
odjava i „moje igre" rade, ulaz kodom nepromijenjen.

<a id="adr-035"></a>
## ADR-035 · Tuđi hotel: samo javni podaci
**Datum:** 24.10. ~18:50 · **Status:** ✅ (Leon), novac djelomično zamijenjen u [ADR-040](#adr-040) · **Vezano:** [ADR-008](#adr-008)

**Kontekst.** Na karti i ljestvici student vidi druge hotele u gradu; treba odlučiti koliko vidi.
**Odluka.** Vidi samo javno: mjesto, zvjezdice, cijenu, recenzije, popunjenost prošlog mjeseca, broj zaposlenih po
odjelima i ugovore s tvrtkama. **Bez novca, odgovora i ocjena.**
**Posljedice.** Natjecanje je vidljivo, a učenje drugih ostaje privatno.

<a id="adr-034"></a>
## ADR-034 · Pošta među hotelima: poruke i prijedlog suradnje
**Datum:** 24.10. ~18:50 · **Status:** ✅ (Leon) · **Vezano:** [ADR-008](#adr-008), [ADR-002](#adr-002)

**Kontekst.** Hoteli dijele tržište turista (ADR-008), ali se međusobno ne mogu dogovarati.
**Odluka.** Slobodne poruke među hotelima i jedna vrsta dogovora s posljedicom: hotel preusmjerava goste drugom
hotelu za proviziju. Obračun radi motor.
**Posljedice.** Mijenja obračun tržišta, pa se radi zadnje u valu 3, iza smokea.

<a id="adr-033"></a>
## ADR-033 · Pošta s agencijama i pregovaranje: motor odlučuje, AI piše
**Datum:** 24.10. ~18:50 · **Status:** ✅ (Leon) · **Vezano:** [ADR-002](#adr-002), [ADR-023](#adr-023)

**Kontekst.** Ponude gradskih tvrtki dosad su se samo prihvaćale ili odbijale. Žiri traži stabilnu mehaniku, ne
odluke AI-ja (ADR-023).
**Odluka.** Ponuda stiže kao e-mail; student prihvaća, odbija ili predlaže drugu cijenu. **Motor** odlučuje po
pravilu: protuponuda do 15 % u korist hotela se prihvaća, 15–30 % agencija jednom nudi sredinu, iznad 30 % ponuda
propada. **AI** samo piše tekst odgovora agenta.
**Posljedice.** Isti ishod za istu protuponudu; AI ne mijenja brojke (ADR-002).

<a id="adr-032"></a>
## ADR-032 · Odjeli s pravim ulaganjem: budžet po odjelu u planu mjeseca
**Datum:** 24.10. ~18:40 · **Status:** ✅ (Leon) · **Vezano:** [ADR-002](#adr-002), [ADR-012](#adr-012), [ADR-011](#adr-011)

**Kontekst.** Osoblje i odjeli hotela dosad su samo sadržaj ([ADR-012](#adr-012)): student ih vidi, ali na njih ne
utječe novcem.
**Odluka.** U planu mjeseca student svakom odjelu dodijeli budžet. Motor ga obračuna kao trošak i pomakne pokazatelj
tog odjela, uz ograničenje. Graditelj radi motor, API i ugovor (`types.ts`, `rules.ts`, blok u planu, **sva nova
polja neobavezna**); Rino radi stranicu odjela.
**Posljedice.** Brojke i dalje računa samo motor (ADR-002). Shema ručnim aditivnim SQL-om ([ADR-026](#adr-026)):
`plans.investments` (jsonb, `'{}'`) i `finances.investments` (int, 0), broj redaka nepromijenjen. Ugovor je
[#132](https://github.com/leonkreso784-bit/riihack/pull/132) (spojen 18:54): do 3000 € mjesečno po odjelu i najviše +3
na pokazatelj odjela (1 bod na 1000 €); vrijednosti vrijede iz `rules.ts`. Motor je
[#137](https://github.com/leonkreso784-bit/riihack/pull/137) (18:59).

<a id="adr-031"></a>
## ADR-031 · Nema zamrzavanja koda; gradi se do predaje
**Datum:** 24.10. ~18:40 · **Status:** ✅ (Leon) · **Vezano:** [plan › Prekretnice](../superpowers/plans/2026-10-24-simpolis.md#prekretnice)

**Kontekst.** Plan i pravila tima predviđali su zamrzavanje koda u ned 06:30, poslije samo popravci.
**Odluka.** Zamrzavanja nema: radi se punom brzinom do predaje. Rok predaje ostaje **ned 10:30**.
**Posljedice.** Pravilo spajanja (`main` uvijek radi, integrator, smoke) vrijedi do kraja. Dokumenti
usklađeni: `docs/ROADMAP.md` i pitch (Simon, [#131](https://github.com/leonkreso784-bit/riihack/pull/131)), ploča u
`TEAM.md` (integrator, 21:15) te `CLAUDE.md`, `PLAN-24H.md` i glavni plan (Rino,
[#180](https://github.com/leonkreso784-bit/riihack/pull/180), 21:22).

<a id="adr-030"></a>
## ADR-030 · Integrator dobiva dozvole i sam prebacuje produkciju na prave podatke
**Datum:** 24.10. ~17:35 · **Status:** ✅ (Leon) · **Vezano:** [ADR-029](#adr-029), [ADR-015](#adr-015)

**Kontekst.** Prelazak produkcije na prave podatke (ADR-029) traži promjenu env varijable na Vercelu, a integrator
je dotad samo spajao PR-ove.
**Odluka.** Integrator smije `gh pr merge/diff/view/checks` i `vercel env add/ls`; **bez ručnog deploya i bez
pristupa Neonu**. Sam postavlja `NEXT_PUBLIC_USE_MOCK=0` za Production (učinjeno ~17:40); novi build nastaje
spajanjem [#115](https://github.com/leonkreso784-bit/riihack/pull/115).
**Posljedice.** Produkcija na pravim podacima od 17:52 (build s #115; `/`, `/ulaz`, `/igra`, `/profesor` 200). Shema i
baza ostaju kod Leonovog graditelja ([ADR-026](#adr-026)).

<a id="adr-029"></a>
## ADR-029 · Produkcija prelazi na prave podatke nakon probe M2
**Datum:** 24.10. ~16:50 · **Status:** ✅ (Leon) · **Vezano:** [ADR-018](#adr-018), [ADR-013](#adr-013), [ADR-028](#adr-028)

**Kontekst.** Prave podatke do sada je imao samo Preview (ADR-018); produkcija je pokazivala lažne podatke.
**Odluka.** Nakon vala M2 slijedi proba M2 na pravim podacima, a zatim se `NEXT_PUBLIC_USE_MOCK=0` postavlja i na
produkciji.
**Posljedice.** Mijenja ADR-018 nakon probe. Oznaka „primjer" ostaje samo na ekranima koji su po planu samo sučelje
(radar vještina).

<a id="adr-028"></a>
## ADR-028 · Val spajanja M2: redom, uz smoke i provjeru produkcije između koraka
**Datum:** 24.10. ~16:50 · **Status:** ✅ (Leon) · **Vezano:** [ADR-017](#adr-017), [ADR-025](#adr-025), [ADR-019](#adr-019)

**Kontekst.** Pet PR-ova za M2 međusobno ovisi: ugovor, obračun grada, situacije i profesorove situacije.
**Odluka.** Integrator spaja na Leonovo izravno „da", ovim redom: [#88](https://github.com/leonkreso784-bit/riihack/pull/88) L11 faza B → [#89](https://github.com/leonkreso784-bit/riihack/pull/89) ugovor
(profesorove situacije i playbook) → [#75](https://github.com/leonkreso784-bit/riihack/pull/75) L6 (Leon pregledao struku, 3 jezične ispravke) → [#95](https://github.com/leonkreso784-bit/riihack/pull/95) L12
→ [#96](https://github.com/leonkreso784-bit/riihack/pull/96) odjava. Između koraka smoke 14/14 i provjera produkcije; **ako išta pukne, lanac staje.**
**Posljedice.** M3 PR-ovi koji su gotovi ([#100](https://github.com/leonkreso784-bit/riihack/pull/100) playbook, [#103](https://github.com/leonkreso784-bit/riihack/pull/103) demo igra, [#104](https://github.com/leonkreso784-bit/riihack/pull/104) promjena
ocjene mentora) čekaju iza vala. **Izvedeno:** spojeno 16:50–17:06, svaki korak uz zelen CI, Vercel i produkciju;
smoke 14/14 nakon #75; #96 spojen prije #95. M3 PR-ovi spojeni odmah iza vala, 17:09–17:12.

<a id="adr-027"></a>
## ADR-027 · Playbook kao izvoz i uvoz, bez mijenjanja mehanike
**Datum:** 24.10. ~16:35 · **Status:** ✅ (Leon, na Rinov prijedlog) · **Vezano:** [ADR-024](#adr-024), [ADR-004](#adr-004), [#89](https://github.com/leonkreso784-bit/riihack/pull/89)

**Kontekst.** Rino je predložio da profesor ima „playbook": sam određuje mehaniku igre i svoje situacije ponovno
koristi u novim igrama. Profesorove situacije pripadaju jednoj igri, profesor nema račun (ADR-004), a mehanika su
konstante u `rules.ts` koje motor čita izravno.
**Odluka.** Lagana verzija za **M3**: tip `Playbook { version: 1; name; settings: { autoDraw }; situations:
SituationDraft[] }` u ugovoru (#89) i rute `GET` (izvoz) i `POST` (uvoz) `/api/prof/[worldId]/playbook`. Simon u S8
dodaje gumbe „Izvezi" i „Uvezi". **Profesor ne mijenja mehaniku motora**; to je vizija.
**Posljedice.** Ponovna upotreba radi bez računa, preko datoteke. Mehanika po igri ide u [VISION.md](../product/VISION.md).
**Dopuna (sub 18:28, Leon):** Simon smije u Rinov `src/lib/client.ts` dodati `exportPlaybook` i `importPlaybook` (samo
dodavanje, lažna verzija u `mock.ts`) za gumbe u S8 ([ok na #108](https://github.com/leonkreso784-bit/riihack/pull/108)).

<a id="adr-026"></a>
## ADR-026 · Nitko ne pokreće `db:push`; shema se mijenja ručnim aditivnim SQL-om
**Datum:** 24.10. ~16:25 · **Status:** ✅ (Leon) · **Vezano:** [BUG-006](BUGS.md#bug-006--dbpush-predlaže-pražnjenje-tablica-situations-i-contracts), [ADR-025](#adr-025), [ADR-005](#adr-005)

**Kontekst.** `drizzle-kit push` na zajedničkoj Neon bazi predložio je pražnjenje tablica `situations` i `contracts`
jer krivo čita postojeća unique ograničenja (BUG-006).
**Odluka.** Nitko ne pokreće `npm run db:push`. Promjene sheme idu ručnim **aditivnim** SQL-om (`CREATE TABLE`,
`ADD COLUMN IF NOT EXISTS`), koji pregleda Leonov graditelj. Shema L12 primjenjuje se tako: tri aditivne naredbe u jednoj
transakciji (`custom_situations`, `dispatches`, `worlds.auto_draw` sa zadanim `true`).
**Posljedice.** Mijenja korak „`db:push` samo aditivno" iz ADR-025. [TEAM.md](../../TEAM.md) pravilo 5 usklađeno
(`12a2f25`).

<a id="adr-025"></a>
## ADR-025 · Ugovor za profesorove situacije i redoslijed spajanja
**Datum:** 24.10. ~16:15 · **Status:** ✅ (Leon s timom, redoslijed dogovoren s integratorom) · **Vezano:** [ADR-024](#adr-024), [ADR-011](#adr-011), [ADR-017](#adr-017), [#75](https://github.com/leonkreso784-bit/riihack/pull/75)

**Kontekst.** L12, S8 i S9 trebaju nove tipove i rute, a L11 faza B i L6 (#75) još nisu spojeni.
**Odluka.** PR „ugovor: profesorove situacije" mijenja `types.ts` i plan zajedno; **sva nova polja su neobavezna**.
Novi tipovi: `SituationSource`, `SituationDraft`, `SituationSummary`, `DispatchView`, `DispatchRequest`,
`WorldSettingsRequest`, `QualityOverrideRequest`, `GenerateSituationRequest`, `SituationIdeaInput`; nova polja:
`ProfStateResponse.bank`, `.dispatches`, `.autoDraw`, `SituationView.source`, `AnswerView.overridden`,
`MentorInput.finance`. Nove rute: `POST /api/prof/[worldId]/situations`, `/dispatch`, `/settings` (M2);
`/answers/[situationId]/quality` i `/situations/generate` (M3).
**Redoslijed spajanja:** ugovor (Leonovo „spoji") → L11 faza B → L12 (shema ručnim aditivnim SQL-om neposredno prije
spajanja, [ADR-026](#adr-026)). S8 ide neovisno. L6 (#75) mora biti spojen prije demoa L12 i S8, inače je banka situacija prazna.
**Posljedice.** S8 dira Rinove `client.ts` i `mock.ts` samo za nove pozive i lažno stanje profesorovih situacija;
Rino je dao „ok" (~16:35, [TEAM.md](../../TEAM.md) pravilo 6). Ugovor je PR [#89](https://github.com/leonkreso784-bit/riihack/pull/89), čeka Leonovo „spoji".

<a id="adr-024"></a>
## ADR-024 · Profesorove situacije: L12, S8, S9
**Datum:** 24.10. ~16:15 · **Status:** ✅ (Leon s timom, nakon obilaska žirija 1) · **Vezano:** [ADR-023](#adr-023), [ADR-025](#adr-025), [PRD](../product/PRD.md#5-kriteriji-prihvaćanja)

**Kontekst.** Profesor je glavni (ADR-023), a do sada je samo vodio mjesece; situacije je izvlačila igra iz banke.
**Odluka.**
- **L12 (Leon, M2):** profesor piše svoje situacije (lik kojeg glumi AI, 3–5 kriterija, opcije 0–4 neobavezne,
  učinci), bira iz banke i šalje bilo koju situaciju **odabranim studentima**, odmah ili u krug k (i sobu). Prekidač
  „slučajno izvlačenje" (`autoDraw`). U M3 profesor može promijeniti ocjenu mentora (`overridden`).
- **S8 (Simon, M2):** sučelje `/profesor/[worldId]/situacije`: popis, forma, dijalog „Pošalji" (kome, kada, soba),
  prekidač.
- **S9 (Simon, M3):** AI predlaže situaciju iz stanja hotela (`proposeSituation` → `SituationDraft`). **Profesor je
  uvijek pregleda i spremi sam; AI ništa ne šalje studentima.**
**Posljedice.** Rino dodaje poveznicu „Situacije" na ploči profesora; R5 mora podnijeti situaciju bez opcija; R8 u M3
dobiva gumb „Promijeni ocjenu". „Profesor sam dodaje situacije" više nije plan nego demo
([BACKLOG.md](BACKLOG.md)).

<a id="adr-023"></a>
## ADR-023 · Jezgra odvojena od AI-ja, profesor je glavni
**Datum:** 24.10. ~16:15 · **Status:** ✅ (Leon s timom) · **Vezano:** [ADR-002](#adr-002), [#86](https://github.com/leonkreso784-bit/riihack/pull/86), [PROMISE.md](../../PROMISE.md)

**Kontekst.** Obilazak žirija 1 (~15:45) je prošao. Žiri (Borna Sila): ne oslanjati se na AI i ne raditi sve kao AI
agente; temelj neka bude stabilna, pouzdana softverska mehanika. Žiri je pohvalio i partnerstvo tvrtki i fakulteta.
**Odluka.** Jezgra (motor) je odvojena od AI-ja: AI glumi likove i radi kao mentor. **Profesor je glavni:** mentor je
uvijek tu, ali iza njega stoji profesor. Mentor iz brojki jezgre objašnjava što se dogodilo i kako svijet radi
(`MentorInput.finance`, S9). AI presuda po kriterijima ostaje dio mentora; bodove i dalje računa samo motor (ADR-002).
**Posljedice.** Pitch pokazuje da je igra obična, testirana pravila, a AI samo jedan sloj ([#86](https://github.com/leonkreso784-bit/riihack/pull/86)).
Profesor dobiva situacije (ADR-024) i promjenu ocjene mentora.

<a id="adr-022"></a>
## ADR-022 · Smoke korak 11: Ivan postavlja 300 €, ne 150 €
**Datum:** 24.10. ~16:00 · **Status:** ✅ (Leon) · **Vezano:** [ADR-019](#adr-019), [plan › L8](../superpowers/plans/2026-10-24-simpolis.md#l8--smoke-skripta-i-demo-igra-m2-smoke-m3-demo), [#82](https://github.com/leonkreso784-bit/riihack/pull/82)

**Kontekst.** Korak 11 provjerava da jeftiniji hotel dobije više noćenja (Ana 60 €, Ivan 150 €). Ivanovu hotelu s
4★ 150 € je ispod vlastite referentne cijene, pa je test bio na rubu (239 : 238 noćenja).
**Odluka.** Ivan u koraku 11 postavlja 300 €.
**Posljedice.** Ulazi u L11 fazu B i u plan.

<a id="adr-021"></a>
## ADR-021 · Vijesti grada bez sklonidbe
**Datum:** 24.10. ~16:00 · **Status:** ✅ (Leon) · **Vezano:** [ARHITEKTURA §5c](../../ARHITEKTURA.md#5c--ekonomija-grada-svi-utječu-na-sve), [#82](https://github.com/leonkreso784-bit/riihack/pull/82)

**Kontekst.** Predlošci vijesti iz plana („Hotel … potpisala ugovor s Agencijom …") uvrštavaju imena u rečenicu, pa
daju krive padeže.
**Odluka.** Vijesti su oblika u kojem se ime ne sklanja: „Novi hotel u gradu: {hotel} ({mjesto})", „Novi ugovor:
{hotel} i {tvrtka}", „Počinje {mjesec}", „{Mjesec}: najpopunjeniji je {hotel} ({x} %)".
**Posljedice.** Ulazi u L11 fazu B i u plan.

<a id="adr-020"></a>
## ADR-020 · Razgovor s likom (S3): transkript, situacije, rubni slučaj
**Datum:** 24.10. ~15:10 · **Status:** ✅ (Leon, na Simonova pitanja) · **Vezano:** [#76](https://github.com/leonkreso784-bit/riihack/pull/76), [#75](https://github.com/leonkreso784-bit/riihack/pull/75), [ADR-016](#adr-016)

**Kontekst.** Simon za S3 (lik u ulozi i ruta chat) treba tri odgovora prije spajanja.
**Odluka.** (1) Transkript razgovora je `ChatTurn[]`. (2) Situacije (`situations.json`) puni L6 (#75), koji čeka
Leonov pregled struke. (3) Dva istodobna chat zahtjeva mogu prijeći ograničenje od 6 poruka: to je **prihvaćen rubni
slučaj**, uz uvjet da sučelje drži gumb onemogućenim dok lik odgovara.
**Posljedice.** R5 (situacija s likom) mora onemogućiti slanje dok traje odgovor lika.

<a id="adr-019"></a>
## ADR-019 · Smoke (L8, koraci 1–10) gradi se usporedno s L7
**Datum:** 24.10. ~15:10 · **Status:** ✅ (Leon) · **Vezano:** [plan › L8](../superpowers/plans/2026-10-24-simpolis.md#l8--smoke-skripta-i-demo-igra-m2-smoke-m3-demo), [TESTING.md](../workflow/TESTING.md)

**Kontekst.** U planu je smoke (L8) vezan uz M2 i M3, a koraci 1–10 provjeravaju upravo rute iz L4 i L7.
**Odluka.** Koraci 1–10 smokea grade se usporedno s L7, ne tek u M3. Koraci 11–14 (grad) dolaze nakon L11.
**Posljedice.** Koraci 1–10 su spremni kad i L7.

<a id="adr-018"></a>
## ADR-018 · Pravi podaci najprije samo na Previewu
**Datum:** 24.10. ~15:10 · **Status:** ✅ (Leon) · **Vezano:** [ADR-013](#adr-013), [#74](https://github.com/leonkreso784-bit/riihack/pull/74)

**Kontekst.** L4 je živ (#74), a rute za krugove i odgovore (L7) još ne postoje.
**Odluka.** `NEXT_PUBLIC_USE_MOCK=0` samo za **Preview** na Vercelu; **produkcija ostaje na lažnim podacima** dok tim
ne odluči drukčije.
**Posljedice.** Prave podatke vidiš na preview linku PR-a; https://riihack.vercel.app pokazuje oznaku „primjer".

<a id="adr-017"></a>
## ADR-017 · Ugovor i situacije spajaju se samo na Leonovo „spoji"
**Datum:** 24.10. ~15:10 · **Status:** ✅ (Leon), djelomično zamijenjen u [ADR-037](#adr-037) · **Vezano:** [ADR-015](#adr-015), [ADR-011](#adr-011), [#75](https://github.com/leonkreso784-bit/riihack/pull/75)

**Kontekst.** Integrator spaja automatski sve što prođe provjeru (ADR-015), ali neke datoteke mijenjaju temelj za
sve ostale: ugovor tipova i pravila, ovisnosti i sadržaj po kojem AI sudi.
**Odluka.** PR-ovi koji diraju `src/lib/types.ts`, `src/lib/rules.ts`, `package.json` ili `package-lock.json`, te
L6 (8 situacija s rubrikama, #75), spajaju se samo na Leonovo „spoji".
**Posljedice.** Ostalo integrator i dalje spaja sam.

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
`main`-u (Leon, ~15:00), osim iznimki iz ADR-017. Stanje PR-ova (draft, ready, spajanje) vodi **isključivo**
integrator; graditelj samo gradi i javlja (Leon, ~15:15). **Dokumentacija je na
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
**Posljedice.** Kad L4/L7 rute prorade, na Vercelu se postavlja `NEXT_PUBLIC_USE_MOCK=0` i radi redeploy. Za sada
samo na Previewu ([ADR-018](#adr-018)).

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
**Datum:** 24.10. 13:39 · **Status:** ✅ (Leon s timom) · **Vezano:** [#31](https://github.com/leonkreso784-bit/riihack/pull/31), [#45](https://github.com/leonkreso784-bit/riihack/pull/45), [plan izvedbe](../superpowers/plans/2026-10-24-simpolis.md) (L5)

**Kontekst.** Hoteli kreću s različito raspoređenim pokazateljima; zbroj razlika nagrađuje one koji kreću nisko.
**Odluka.** Napredak je normalizirani dobitak (Hake 1998), raspon −100 do +100; ljestvica nosi i
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
**Datum:** 24.10. 11:59 · **Status:** 🔁 za profesora djelomično zamijenjeno [ADR-036](#adr-036); studenti i dalje bez računa (Leon, na Rinov prijedlog) · **Vezano:** `bef8ab5`, [ARHITEKTURA §8](../../ARHITEKTURA.md#8--api), [napomene-rino.md](../napomene-rino.md) točka 1

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
**Datum:** 24.10. 11:52 · **Status:** ✅ (Leon) · **Vezano:** [ARHITEKTURA §2](../../ARHITEKTURA.md#2--načela), [CLAUDE.md](../../CLAUDE.md)

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
