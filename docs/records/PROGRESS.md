# Dnevnik napretka

Najnovije gore. Svaki unos: što je napravljeno, što je provjereno, što slijedi. Tko što radi **sada** je na ploči u
[TEAM.md](../../TEAM.md), ne ovdje. Spojeni PR-ovi po prekretnicama: [CHANGELOG.md](CHANGELOG.md).
Vremena su lokalna (CEST).

---

## Ned 25.10. ~00:45 · nove sesije

- **Spojeno:** dokumentacija #236 (00:32). Od tada na `main` nije spojeno ništa osim ploče integratora.
- **Nove sesije** (~00:40): integrator, tester (igre „QA …") i dokumentarist; graditelj radi #226 i #227.
- **Otvoreno:** Rinovi #233 (animacije čekanja) i #237 (mentor u izborniku nakon prvog mjeseca; profesor sprema
  ocjenu gumbom), Simonov #235 (botovi igraju paralelno, #227.2); #209 se ne spaja
  ([ADR-047](DECISIONS.md#adr-047)). 🟨 #233 i #237 su dorada sučelja: Rino u opisu traži Leonovu odluku spajaju li
  se prije žirija.
- **Provjereno:** ime prijašnjeg projekta nema na `main`-u (`git grep -i`).

## Ned 25.10. ~00:30 · mentor spor

- **Spojeno:** Simonov #231 (00:28, mentorov osvrt ne pada na fiksni tekst) i #232 (00:28, Tokovi: odjeli kao staze),
  dokumentacija #234 (00:28). Integrator: 514 testova, smoke 1–18, CI zelen, produkcija READY 00:28. U bazi su 3
  igre „Smoke …" za čišćenje prije predaje.
- **Bug (Leon):** mentor je spor ili ne odgovori ([BUG-028](BUGS.md#bug-028--mentor-je-spor-ili-ne-odgovori));
  tester mjeri vrijeme do pitanja i osvrta na produkciji.

## Ned 25.10. 00:15–00:25 · popravci iz Simonovog audita

- **Spojeno:** Simonov #228 (00:17: lik odgovara, mentorov osvrt stiže, karta bez vodoravnog scrolla), dokumentacija
  #230 (00:17), Rinov #229 (00:22, Leonovo „spoji": protuponuda s istom cijenom, tekstovi, `/igra` bez kolačića). CI
  zelen, produkcija READY 00:22.
- **Otvoreno:** Simonovi #231 (mentorov osvrt ne pada na fiksni tekst) i #232 (Tokovi: odjeli kao staze); nova sesija
  graditelja radi #226 i #227.
- **🟨 Čeka Leonovu odluku:** sigurnosna zaglavlja.

## Ned 25.10. 00:00 · prazan odgovor, poveznice

- **Spojeno:** dokumentacija #223 (sub 23:35); Rinov #224 (00:00, dira i Simonove Financije, Leonovo „spoji"); bez
  donje granice teksta #225 (00:01, Leonovo „spoji", [ADR-049](DECISIONS.md#adr-049)). Integrator: 498 testova,
  build, smoke 1–18; CI zelen; produkcija READY 00:01.
- **Čeka Leonovu odluku:** Rinov prijedlog sigurnosnih zaglavlja (CSP, zabrana iframea, `nosniff`); preporuka
  dokumentarista: tri jednostavna zaglavlja da, stroga CSP poslije.
- **Baza:** integratorov smoke u 23:56 ostavio je jednu igru „Smoke …" (javljeno graditelju).
- **Simonov audit produkcije (00:00–00:40, issueovi #226 i #227):** izvještaj mjeseca, mentor i podij ne vide obračun
  grada (#226); plan se ne prenosi u sljedeći mjesec, zatvaranje mjeseca s 12 hotela traje ~18 s jer botovi igraju
  redom, protuponuda s istom cijenom prolazi, „Moje igre" sporo (#227). Ništa ne blokira obilazak.
- **Predaja graditelja (~00:15):** sesija se zatvara, nastavlja nova. Redoslijed: #226, plan se prenosi (#227.1),
  protuponuda bez dobitka vraća 400 (#227.3), brže „Moje igre" (#227.6), pa seed i smoke; prije predaje čišćenje baze
  i provjera imena prijašnjeg projekta. Simon radi paralelne botove (#227.2; Leon timu: „može, kreni").

## Sub 24.10. ~23:30 · demo spreman za obilazak 3

- **Graditelj:** očišćeno 90 testnih igara i 6 računa, pa još 19 smoke igara; demo `KVRNDM` posijan s `main`-a (s #213,
  #214 i #221): 2. mjesec, 5 hotela, 15 mjesta, 4 situacije u knjižnici demo računa, pregovor s Agencijom Adria
  (ponuda 60 €, dogovoreno 66 €), 2 poruke među hotelima. Smoke na produkciji 20/20 (s profesorskim računom i kasnim
  ulazom). Kasni ulaz provjeren i na `KVRNDM`, pa demo ponovno posijan bez testnog hotela.
- **Odluka (Leon, izravno integratoru):** zamrzavanja od 00:00 nema, ima još bugova;
  [ADR-031](DECISIONS.md#adr-031) vrijedi i dalje.
- **Spojeno:** dokumentacija #222 (23:31).
- **Sljedeće:** tester igra cijelu sezonu (dobar i loš student) i provjerava podij na 1280×720.

## Sub 24.10. 23:15–23:30 · kasni ulaz, svi bugovi s testa zatvoreni

- **Spojeno:** #212 (23:15, BUG-019 i 021 ostatak), dokumentacija #220 (23:17), Simonova karta prema broju hotela #215
  (23:22), kasni ulaz #221 (23:26, Leonovo izravno „spoji"; [BUG-027](BUGS.md#bug-027--kasni-student-ne-može-ući-u-igru-koja-je-počela)
  riješen, demo igra 15 mjesta), Simonovi Tokovi za odjele #206 (23:27, BUG-020b). Integrator: 497 testova, build,
  smoke 1–18 i 20; CI zelen; produkcija READY 23:27.
- **Bugovi:** BUG-014 do 027 su riješeni (većinu je prijavio tester produkcije); aktivan je samo BUG-006 (pravilo
  bez `db:push`).
- **Sljedeće:** graditelj čisti QA igre, sije demo igru i pokreće smoke na produkciji, s provjerom kasnog ulaza u
  `KVRNDM`; zatim tester igra cijelu sezonu (dobar i loš student) i provjerava podij na 1280×720.

## Sub 24.10. 23:05–23:15 · balans gotov, kasni ulaz, bez kalibracije

- **Spojeno:** BUG-026 (#214, 23:06, Leonovo „spoji"), Rinov #216 (23:08), dokumentacija #218 (23:06). Integrator:
  436 testova, smoke 18/18, CI zelen, produkcija READY 23:08.
- **Odluke (Leon):** kasni ulaz u igru koja je počela ([ADR-048](DECISIONS.md#adr-048),
  [BUG-027](BUGS.md#bug-027--kasni-student-ne-može-ući-u-igru-koja-je-počela)); #209 se ne spaja prije predaje
  ([ADR-047](DECISIONS.md#adr-047)).
- **Sljedeće:** jedan ponovni seed demo igre i smoke (graditelj), pa tester igra cijelu sezonu s dobrim i lošim
  studentom.
- **Spojeno poslije:** dokumentacija #219 (23:13), ugovor botova u planu #217 (23:14, Leonovo „spoji").
- **Čeka:** #212 (Rinov ok), #206 i #215 (Simonov rebase), PR za kasni ulaz (graditelj).
- **Ispravak:** vremena odluka 22:50–23:10 u ovom zapisu i ADR-ovima ispravljena po vremenima PR-ova; dokumentarist ih
  je prije pisao 5 minuta unaprijed.

## Sub 24.10. 22:45–23:05 · rok „Ručno", pokazatelji, botovi

- **Spojeno:** Rinov #211 (22:50): rok mjeseca zadano „Ručno"
  ([BUG-025](BUGS.md#bug-025--zadani-rok-10-min-na-ploči-profesora-sam-zatvara-mjesec)), podij sezone i ljestvica
  cijelom širinom (BUG-022), kraj sezone na `/igra` (BUG-023), „Bez odgovora" kod studenta (BUG-019), „← Moje igre" i
  kod igre na ploči (dio BUG-021). BUG-024 pokazatelji i gosti (#213, 22:55, Leonovo „spoji"). Simonovi botovi (#205,
  23:00, Leonovo „spoji", Rinova tri uvjeta ispunjena). Uz to #203, #207, #208 (BUG-020a) i dokumentacija #210.
  Integrator: 434 testa, smoke 18/18, CI zelen, produkcija READY 23:00.
- **Odluka (Leon, ~22:50):** odgovorena situacija donosi plus već od ocjene 3 ([ADR-046](DECISIONS.md#adr-046),
  BUG-026); kod je #214, čeka „spoji".
- **Čeka:** #214 (Leonovo „spoji"); #212 (graditelj, BUG-021 ostatak; dobar dio je već u #211); #206 (Simon, rebase
  zbog #213 u `month-flow.ts`); #209 Simonova kalibracija troškova prema stvarnim hotelima (Leon odlučuje;
  preporuka dokumentarista: jedan paket nakon #214, uz test da solidan student napreduje, rok 03:00).
- **🟨 Plan:** polja `isBot?` i `BotsRequest` iz #205 još nisu u bloku „Ugovor".

## Sub 24.10. 22:25–22:35 · Rino i Simon popravljaju, graditelj preuzima ostalo

- **Spojeno:** Rino #200 (22:28, BUG-015 i 016 riješeni) i R10 podij za projektor #196 (22:29); Simon #195 (22:29,
  BUG-017 riješen) i karta s javnim podacima tuđih hotela #192 (22:29, ADR-040); dokumentacija #202 (22:23) i #204
  (22:30). Integrator: 419 testova, smoke 18/18, CI zelen, produkcija READY 22:30.
- **Graditelj s agentima** preuzima ostalo ([ADR-045](DECISIONS.md#adr-045)): BUG-024, ponovni seed i smoke, BUG-019,
  020, 021, 023, botovi. Javljeno mu da preskoči ono što su Rino i Simon već popravili.
- **Novi bug:** zadani rok „10 min" sam zatvara mjesec
  ([BUG-025](BUGS.md#bug-025--zadani-rok-10-min-na-ploči-profesora-sam-zatvara-mjesec), kritičan za demo), popravlja
  Rino; Rino radi i BUG-023 i ostatak BUG-022 (Leon na Discordu, 22:35).
- **Ponovna provjera (tester, 22:45):** BUG-015, 016 i 017 ✅; podij (BUG-022) djelomično; rok „10 min" i dalje
  zadan na produkciji. Novo: napredak je negativan za sve hotele od prvog mjeseca
  ([BUG-026](BUGS.md#bug-026--napredak-je-negativan-za-sve-hotele-od-prvog-mjeseca), visok), javljeno graditelju.
- **Sudari (javljeno graditelju):** Simonov #206 već popravlja BUG-020b; Simonov #205 radi botove cijele, i logiku
  igre (bot po pravilima, težina Lako/Srednje/Teško), pa graditelj ne kreće na motor botova. Leon (~22:50): spaja se #205, graditelj ga pregledava
  ([ADR-044](DECISIONS.md#adr-044)).
- **Graditelj (22:30–22:40):** demo igra ponovno posijana nakon #194, smoke na produkciji 19/19 (22:30). Knjižnica
  demo računa dobila 4 situacije (#203; Leon: „knjižnica je prazna"). Drugo čišćenje starih testnih igara (#207):
  obrisano 47, ostale 33 (demo, igre na demo računu, testerove QA igre, „Smoke …", Simonove probe). Otvoreni PR-ovi:
  #208 (BUG-020a), a agenti rade BUG-024 te BUG-019, 020b i 021 u jednom PR-u.

## Sub 24.10. ~22:15 · balans cijene na `main`-u, botovi za male igre

- **Odluke (Leon):** formula iz #194 (kvadrat već iznad referentne cijene) je u redu. Simon dodaje botove, hotele i
  dobavljače koje vodi računalo, za igre s malo studenata: po pravilima motora, motor radi graditelj, a sučelje
  Simon; profesor ih uključuje pri stvaranju igre ([ADR-044](DECISIONS.md#adr-044)).
- **Tester, drugi krug (~22:20):** situacija nakon isteka roka piše „Ponuđeni odgovor"
  ([BUG-019](BUGS.md#bug-019--situacija-nakon-isteka-roka-piše-ponuđeni-odgovor)), sitni tekstovi
  ([BUG-020](BUGS.md#bug-020--sitni-tekstovi-2-studenata-tehnički-tekst-u-toku-mjeseca)), ploča profesora bez puta
  natrag i bez koda igre nakon početka ([BUG-021](BUGS.md#bug-021--ploča-profesora-nema-puta-natrag-ni-koda-igre-nakon-početka)).
- **Spojeno:** balans cijene #194 (22:14, Leonovo izravno „spoji";
  [BUG-014](BUGS.md#bug-014--najviša-cijena-400--je-gotovo-uvijek-najisplativija) riješen), `/profesor/prijava` bez
  mrtve poveznice #199 (22:13), dokumentacija #197 (22:13). 416 testova, smoke 18/18 lokalno, CI zelen, produkcija
  READY 22:14.
- **Čekalo:** ponovni seed demo igre i smoke na produkciji; napravljeno u 22:30 (vidi gore).
- **Tester, treći krug (~22:25):** kraj sezone na projektoru bez podija, pobjednik u crvenom
  ([BUG-022](BUGS.md#bug-022--kraj-sezone-na-projektoru-nema-podija-pobjednik-izgleda-kao-gubitnik), visok), `/igra`
  nakon kraja sezone čeka obračun ([BUG-023](BUGS.md#bug-023--igra-nakon-kraja-sezone-i-dalje-čeka-obračun)), loši
  pokazatelji jedva utječu na goste u vrhu sezone
  ([BUG-024](BUGS.md#bug-024--loši-pokazatelji-jedva-utječu-na-goste-u-vrhu-sezone)).
- **Odluka (Leon, ~22:35):** pokazatelji jače utječu na goste; graditelj s agentima preuzima sve otvorene bugove
  ([ADR-045](DECISIONS.md#adr-045)).

## Sub 24.10. 22:00–22:10 · tester na produkciji

- **Nova sesija:** tester produkcije (samo testira, ne mijenja kod). Prvi nalazi: uvid u studenta piše „klik" za
  propuštenu situaciju ([BUG-015](BUGS.md#bug-015--uvid-u-studenta-propuštena-situacija-piše-klik)), krivi hrvatski
  uz brojeve ([BUG-016](BUGS.md#bug-016--krivi-hrvatski-u-brojevima-i-rodu)), sirovi ključ područja kod AI prijedloga
  ([BUG-017](BUGS.md#bug-017--ai-prijedlog-situacije-područje-kao-sirovi-ključ)); balans cijene potvrđen na produkciji
  ([BUG-014](BUGS.md#bug-014--najviša-cijena-400--je-gotovo-uvijek-najisplativija)).
- **Spojeno:** dokumentacija #193 (21:59).
- **Baza očišćena (graditeljev agent, ~22:00):** obrisano 208 testnih igara i 28 računa, ostala je 51 igra, demo
  `KVRNDM` netaknut. Obrisane su i dvije testerove igre usred testa
  ([BUG-018](BUGS.md#bug-018--čišćenje-baze-obrisalo-testerovu-igru-usred-testa)); od sad se prije brisanja javlja
  testeru.
- **Balans cijene:** PR #194 (graditelj; 416 testova, smoke 18/18 lokalno). Kvadrat počinje već iznad referentne cijene,
  ne tek iznad 2× ([ADR-043](DECISIONS.md#adr-043)); dira i Simonov `month-flow.ts`. Čeka Leonovo „spoji", a poslije
  ponovni seed demo igre i smoke.

## Sub 24.10. 21:45–22:00 · val 3 skoro gotov, balans cijene

- **Spojeno:** Simonovi Tokovi skica 1 i 2 (#174, #179, 21:44, Leonovo „spoji"; Rinov pregled poveznica naknadno);
  u 21:51 L8 demo i smoke za val 3 (#191), skripta za čišćenje (#188), `/profesor/knjiznica` (#189), polja
  `rubric?`/`effects?` (#190), javni prihod i dobit tuđih hotela (#184) i Rinov ulaz profesora samo preko računa
  (#186); dokumentacija #185 (21:41).
- **Provjereno (integrator):** svih 6 zajedno 414 testova, build, smoke 18/18 lokalno; CI zelen; produkcija READY,
  smoke na produkciji 19/19.
- **Demo igra (graditelj, 21:50):** `KVRNDM`, 2. krug, vlasnik Leonov demo profesorski račun, pet hotela po mjestu,
  prihvaćen pregovor s agencijom, dvije poruke među hotelima ([ADR-041](DECISIONS.md#adr-041)).
- **Odluka (Leon, ~22:00):** balans cijene ([ADR-043](DECISIONS.md#adr-043),
  [BUG-014](BUGS.md#bug-014--najviša-cijena-400--je-gotovo-uvijek-najisplativija)); graditelj radi, poslije popravka
  ponovno sije demo.
- **Baza:** suhi prolaz skripte našao je 166 testnih od 216 igara; smoke je dodao igru „Smoke …" i testne račune.
  🟨 Brisanje još nije pokrenuto.

## Sub 24.10. 21:30–21:45 · popravci iz revizije, „Tokovi" ipak u aplikaciji

- **Spojeno:** Simonov #176 (21:31): sudac čuva kriterije kad drugi pokušaj padne, AI nacrt zaključava obrazac,
  skraćeno ime hotela na karti (388 testova, smoke 14/14); dokumentacija #183 (21:33).
- **Odluka (Leon, ~21:40) mijenja onu od 21:15/21:30:** skice „Tokovi" (#174, #179) ipak idu u aplikaciju; polja
  `SituationView.rubric?` i `effects?` dodaje graditelj; ruta „Što ako?" na poslužitelju se ne radi
  ([ADR-042](DECISIONS.md#adr-042)).
- **Čeka:** #174 i #179 traže Rinov ok za poveznice i Leonovu izravnu potvrdu integratoru.

## Sub 24.10. 21:20–21:30 · bez zamrzavanja i u dokumentima, „Tokovi" ostaju na granama

- **Spojeno:** dokumentacija #182 (21:20); Rinov #180 (21:22): `CLAUDE.md`,
  `PLAN-24H.md` i glavni plan pišu da zamrzavanja nema ([ADR-031](DECISIONS.md#adr-031) zatvoren).
- **Odluka (Leon, ~21:30, Simonu):** Simonovi #174 i #179 (skice „Tokovi") ne idu u `main`, grane ostaju za slajdove;
  #176 (popravci iz revizije) ide normalno ([ADR-038](DECISIONS.md#adr-038)).

## Sub 24.10. ~21:15 · odluke za kraj: redoslijed, demo, javni podaci

- **Odluke (Leon, preko graditelja):** integrator sam spaja aditivne dodatke ugovoru iz plana vala 3
  ([ADR-037](DECISIONS.md#adr-037)); skice „Tokovi" samo za prezentaciju, „Što ako?" se ne radi
  ([ADR-038](DECISIONS.md#adr-038)); L8 demo i smoke prvo, L19 ako ostane vremena, skripta za čišćenje baze večeras
  ([ADR-039](DECISIONS.md#adr-039)); prihod i dobit zatvorenih mjeseci tuđih hotela su javni
  ([ADR-040](DECISIONS.md#adr-040)); demo za žiri s profesorskim računom ([ADR-041](DECISIONS.md#adr-041)).
- **Pravilo:** nakon povlačenja koje mijenja `package-lock.json` svi pokreću `npm ci`
  ([BUG-013](BUGS.md#bug-013--provjera-pada-u-mapi-bez-npm-ci-nakon-promjene-package-lockjson)).
- **Spojeno:** dokumentacija #181 (21:15). Integrator je s ploče maknuo redak o zamrzavanju (`ff2a870`).

## Sub 24.10. 21:00–21:15 · ekrani računa, knjižnica u sučelju, poruke među hotelima

- **Spojeno:** dokumentacija #175 (21:01); Simonov S12 knjižnica na stranici situacija (#170, 21:10) i L16 ekrani
  računa: registracija, prijava, „Moje igre" (#169, 21:10), oba uz Rinov ok na GitHubu (21:01); L18 poruke među
  hotelima (#177, 21:11, Leonovo „spoji" jer dira ugovor): hotel šalje poruku drugom hotelu iste igre, profesor vidi
  sve poruke igre. Poruke ne idu u vijesti grada. Sučelje „Nova poruka" je Rinov R15.
- **Provjereno (integrator):** sve zajedno 387 testova, smoke 14/14, CI zelen; produkcija READY 21:11 (sve stranice
  200, API bez kolačića 401, nepostojeći kod igre 404).
- **Za čišćenje baze prije predaje:** testna igra „L18 test" (graditelj je drži na svom popisu).
- **🟨 Otvoreno:** zastarjelo „zamrzavanje" u `CLAUDE.md`, `PLAN-24H.md`, `TEAM.md` i glavnom planu
  ([ADR-031](DECISIONS.md#adr-031)); poruka za Rina pripremljena (21:09).

## Sub 24.10. 20:45–21:00 · uvid u razmišljanje studenta, nove sesije

- **Spojeno:** Rinov R8 (#168, 20:52): profesor po mjesecu vidi kako je student odgovorio (vlastite riječi, klik,
  prepisano), presudu, razgovor s likom i mentora, a uz svaki odgovor može promijeniti ocjenu. Imena hotela na ploči
  vode na tu stranicu. Simonov radar vještina namjerno nije uključen dok nema prave podatke. Dokumentacija #171 (20:51).
  Rinove sitnice (#173, 20:58): oznaka „od profesora" na situacijama, mjesec zadnjeg obračuna na `/igra`, čekaonica
  bez bljeska kad igra već traje.
- **Provjereno (integrator):** #173, #170 i #169 lokalno zajedno: typecheck, lint, 384 testa, build.
- **Čeka Rinov ok ili Leonovo „spoji":** #170 S12 knjižnica na stranici situacija (`src/lib/client.ts`) i #169 L16
  ekrani računa (`client.ts`, `profesor/page.tsx`, `app-frame.tsx`).
- **Nove sesije (~20:55):** graditelj, integrator i dokumentarist. Graditelj sljedeće radi L18 poruke među hotelima.

## Sub 24.10. 20:44 · knjižnica situacija, popravak dvoklika

- **Spojeno (Leonovo izravno „spoji"):** L17 knjižnica situacija (#165; tri rute, samo vlasnik, bez prijave 401) i
  popravak dvoklika na zatvaranju mjeseca (#166,
  [BUG-012](BUGS.md#bug-012--dva-istodobna-post-round-drugi-vraća-409-sezona-je-gotova) riješen); dokumentacija #167.
  384 testa, smoke na produkciji 14/14.
- **Čeka:** #169 L16 ekrani računa: registracija, prijava, „Moje igre" (mijenja tri Rinove datoteke; Rinov ok ili
  Leonovo „spoji"). Leonova odluka koje Simonove skice „Tokovi" idu u aplikaciju.
- **Prije predaje:** počistiti testne podatke iz baze (graditelj).

## Sub 24.10. 20:30–20:45 · izvještaj mjeseca i pošta u sučelju

- **Spojeno:** Rinov R7 izvještaj mjeseca i sokratski mentor (#160, 20:35) i R13 pošta s protuponudom (#164, 20:40;
  lažni podaci koriste pravi motor pregovora, 376 testova); dokumentacija #161 i #163.
- **Shema L17 (graditelj):** tablica `library_situations` (veza na `user`, briše se s korisnikom) aditivnim SQL-om;
  korisnika 10 prije i poslije ([ADR-036](DECISIONS.md#adr-036), knjižnica situacija).

## Sub 24.10. 20:15–20:30 · profesorski računi na produkciji

- **Odluka (Leon, ~20:20):** prijava profesorskim računom radi i na produkciji. Integrator je na Leonovo izravno „da"
  postavio `BETTER_AUTH_*` na Vercelu; produkcija READY ~20:25, a registracija, prijava, odjava, „moje igre", ulaz
  kodom i smoke 14/14 provjereni ([ADR-036](DECISIONS.md#adr-036)).
- **Smoke na produkciji** jednom pao na koraku 14 zbog dva istodobna zatvaranja kruga
  ([BUG-012](BUGS.md#bug-012--dva-istodobna-post-round-drugi-vraća-409-sezona-je-gotova), nije hitno).
- **Spojeno:** dokumentacija #159 (20:17).

## Sub 24.10. 20:10–20:15 · repo bez imena prijašnjeg projekta

- **Spojeno:** Simonov zapis obilaska 2 i dopuna opsega u `PROMISE.md` (#150, 20:11), Rinovo čišćenje plana (#157,
  20:13, Leonovo „spoji"), dokumentacija #158 (20:10). Otvorenih PR-ova nema.
- **BUG-008 riješen:** `git grep -i` po cijelom `main`-u daje 0 pogodaka
  ([BUG-008](BUGS.md#bug-008--ime-prijašnjeg-projekta-još-je-u-repou)).

## Sub 24.10. 20:00–20:10 · profesorski računi i AI agent agencije na `main`-u

- **Spojeno u 20:06 (sve na Leonovo izravno „spoji"):** L16 profesorski računi (#147) po
  [ADR-036](DECISIONS.md#adr-036), S11 AI agent agencije (#154) po [ADR-033](DECISIONS.md#adr-033),
  `scripts/lock-merge.py` (#155), dokumentacija #156. Zajedno 375 testova, smoke 14/14, CI zelen, produkcija READY.
- **BUG-011 riješen:** igra s kodom radi i bez `BETTER_AUTH_SECRET`
  ([BUG-011](BUGS.md#bug-011--l16-bez-better_auth_secret-stvaranje-igre-vraća-500)).
- **Čeka Leona:** varijable `BETTER_AUTH_*` na Vercelu; dok ih nema, `/api/auth/*` vraća 500 i prijava računom ne radi.

## Sub 24.10. 19:50–20:00 · L15 i karta grada na `main`-u, predaja sesija

- **Obilazak žirija 2 (~19:00):** 3 minute aplikacije uživo, odgovor pozitivan, bez primjedbi i bez novih zahtjeva.
  Leon: žiri je ostao bez riječi, reakcija „wow"; na sve što smo rekli i na svako njihovo pitanje imali smo dobar
  odgovor, pa nisu našli primjedbu.
  Za nedjelju: na obilasku 3 žiri sam isprobava aplikaciju (Simonov zapis u `PROMISE.md`, #150).
- **Spojeno:** L15 pošta i pregovaranje (#148, 19:54) po [ADR-033](DECISIONS.md#adr-033); Rinove detaljnije
  Financije, Plan i Odjeli (#142, 19:54; Leonovo izravno „spoji" umjesto Simonovog ok); Rinov QR kod ulaza na
  čekaonici (#151) i „Završi mjesec" (#152, R4); karta grada kao izometrijska društvena igra (#128, 19:58; dovršio
  Simon jer je Rino bio zauzet, Rino odobrio); kraći komentari bez imena prijašnjeg projekta (#107, 19:58);
  dokumentacija #153. Zajedno 361 test, smoke 14/14, CI 5/5, produkcija READY.
- **Shema vala 3 (sve ručno, aditivno, [ADR-026](DECISIONS.md#adr-026)):** `plans.investments`,
  `finances.investments` i `breakdown`, tablice Better Autha i `worlds.owner_id`, `mail` i stupci pregovaranja u
  `contracts`.
- **Otvoreno:** L16 profesorski računi (#147; bez `BETTER_AUTH_SECRET` stvaranje igre vraćalo 500,
  [BUG-011](BUGS.md#bug-011--l16-bez-better_auth_secret-stvaranje-igre-vraća-500), popravak se provjerava), S11 AI
  agent agencije (#154), Simonov zapis obilaska 2 (#150).
- **Za sljedeće sesije (graditelj):** L17 knjižnica, L18 poruke među hotelima, L19 suradnja, L8 demo i smoke za val 3;
  prije predaje `git grep -i` za ime prijašnjeg projekta. Plan čisti Rino
  ([BUG-008](BUGS.md#bug-008--ime-prijašnjeg-projekta-još-je-u-repou)).

## Sub 24.10. 19:40–19:50 · L15 i L16 u PR-ovima, tjedni krug odgođen

- **Spojeno:** dokumentacija #149 (19:42).
- **U PR-ovima:** L15 pošta i pregovaranje (#148; 331 test, smoke 14/14, čeka Leonovo „spoji"), L16 profesorski
  računi (#147; sukob u `src/db/schema.ts`, graditelj radi rebase).
- **Odluka (Leon, ~19:50):** tjedni krug ide u kasnije planiranje, zasad se ne radi ([BACKLOG.md](BACKLOG.md)).

## Sub 24.10. 19:30–19:40 · raspodjela troškova, shema pošte

- **Spojeno:** raspodjela prihoda i troškova u obračunu mjeseca (#144, 19:39, Leonovo „spoji"; zbrojevi motora
  nepromijenjeni, 308 testova, smoke 14/14), dokumentacija #146. Rinov #142 tako može prikazati pravu raspodjelu
  umjesto marketinga kao ostatka.
- **Shema L15 (graditelj, ~19:31):** tablica `mail` (prazna) i u `contracts` stupci za protuponudu i dogovorenu cijenu
  te `negotiated` (zadano `false`); `contracts` 271 redak prije i poslije ([ADR-033](DECISIONS.md#adr-033)).

## Sub 24.10. 19:20–19:30 · javni profil hotela, shema računa

- **Spojeno:** L14 javni profil hotela (#143, 19:27; testni podaci popravljeni, 307 testova, smoke 14/14) po
  [ADR-035](DECISIONS.md#adr-035); dokumentacija #145.
- **Shema L16 (graditelj, ~19:25):** tablice `user`, `session`, `account`, `verification` i `worlds.owner_id` (prazan)
  aditivnim SQL-om; `worlds` 112 redaka prije i poslije ([ADR-036](DECISIONS.md#adr-036)).
- **Otvoreno:** #144 raspodjela prihoda i troškova u obračunu (čeka Leonovo „spoji"), #142 (Simonov ok), #128 (Rinov
  pregled), #107 (pregled).

## Sub 24.10. 19:05–19:20 · plan vala 3 na `main`-u, stranica odjela

- **Spojeno:** plan vala 3 (#134, 19:16, Leonovo „spoji"), paket `uqr` za QR ulaza (#139, 19:16; `npm ci` prolazi),
  Rinova stranica odjela R11 (#135, 19:12; 301 test), dokumentacija #140.
- **Shema (graditelj, ~19:17):** `finances.breakdown` (jsonb, NULL) aditivnim SQL-om ([ADR-026](DECISIONS.md#adr-026)).
- **Odluka (Leon, ~19:20):** skicu karte #128 prvo pregledava i prilagođava Rino; problemi se rješavaju nakon toga.
- **Otvoreno:** #143 L14 javni profil (CI crven: testni podaci bez `investments`, javljeno graditelju); #142 Rinove
  detaljnije Financije i Plan (čeka Simonov ok, mijenja Simonove stranice); #107 (čeka Rinov ok); #128 (Rino).

## Sub 24.10. 18:50–19:05 · odjeli na `main`-u, ulaz poveznicom

- **Spojeno:** ugovor odjela (#132, 18:54, Leonovo „spoji") i motor odjela L13 (#137, 18:59; 301 test, smoke 14/14),
  pa odjeli imaju pravo ulaganje ([ADR-032](DECISIONS.md#adr-032)). Rinov `/ulaz?kod=…` (#138, 18:59), dokumentacija
  #136. Produkcija READY.
- **Čeka Leona:** plan vala 3 (#134); paket `uqr` za QR na profesorovoj čekaonici (drugi dio #138).

## Sub 24.10. ~18:50 · val 3

- **Odluke (Leon):** pošta s agencijama i pregovaranje ([ADR-033](DECISIONS.md#adr-033)), poruke i suradnja među
  hotelima ([ADR-034](DECISIONS.md#adr-034)), tuđi hotel samo s javnim podacima ([ADR-035](DECISIONS.md#adr-035)),
  profesorski računi ([ADR-036](DECISIONS.md#adr-036)).
- **Plan vala 3** (zadaci L13–L19, S10–S12, R11–R15) u [#134](https://github.com/leonkreso784-bit/riihack/pull/134),
  čeka spajanje.
- **Spojeno:** Simon uskladio ROADMAP i pitch s ADR-031 (#131), dokumentacija #133.

## Sub 24.10. 18:35–18:50 · bez zamrzavanja, odjeli s ulaganjem, popravci pred obilazak 2

- **Odluke (Leon):** nema zamrzavanja koda, gradi se do predaje ([ADR-031](DECISIONS.md#adr-031)); odjeli s pravim
  ulaganjem kroz budžet u planu mjeseca ([ADR-032](DECISIONS.md#adr-032)).
- **Spojeno:** Rinovi popravci prije obilaska M2 (#127, 18:36; dvije boje upisane izravno, ne kroz tokene), Simonov
  S8 playbook i AI prijedlog na stranici situacija (#129, 18:45; 292 testa), dokumentacija #130.
- **Odjeli:** shema dodana aditivnim SQL-om (graditelj); ugovor #132 čeka Leonovo „spoji". Slijede motor i API
  (graditelj) i stranica odjela (Rino).

## Sub 24.10. 18:10–18:30 · pred obilazak 2

- **Ime prijašnjeg projekta:** čisti Rino; kod u #107, plan slijedi
  ([BUG-008](BUGS.md#bug-008--ime-prijašnjeg-projekta-još-je-u-repou)).
- **Playbook u S8:** Leon dao Simonu ok za `exportPlaybook` i `importPlaybook` u `client.ts`
  ([ADR-027](DECISIONS.md#adr-027)).
- **Spojeno:** dokumentacija #123, #124.

## Sub 24.10. 17:55–18:10 · proba M2, AI prijedlog za profesora

- **Proba M2 (graditelj):** sudac odbija obrazloženja s „/la", vlastiti odgovor pada na kvalitetu 3
  ([BUG-009](BUGS.md#bug-009--presuda-vlastitog-odgovora-pada-na-rezervu-kvaliteta-3-bez-obrazloženja)); Simon
  popravio u #120 (18:07; 292 testa, smoke 14/14, produkcija READY).
- **Spojeno:** L12 AI prijedlog situacije za profesora (#118, 18:02; 290 testova, smoke 14/14, produkcija READY,
  ruta bez kolačića 403), dokumentacija #117 i #119.
- **Incident:** integratorov smoke otišao na tuđi dev server koji je zatim ugašen
  ([BUG-010](BUGS.md#bug-010--smoke-integratora-otišao-na-tuđi-dev-server-a-integrator-ga-je-ugasio)).

## Sub 24.10. 17:50–17:52 · produkcija na pravim podacima

- **Spojeno:** #115 profesorski kod demo igre samo iz `.env.local` (17:50; typecheck, lint, 284 testa, build i CI
  zeleni), #116 dokumentacija (17:51).
- **Produkcija na pravim podacima od ~17:52** ([ADR-030](DECISIONS.md#adr-030)): `/`, `/ulaz`, `/igra`,
  `/profesor` vraćaju 200; `/api/me` bez kolačića 401; `/api/join` s krivim kodom 404.
- **Slijedi:** proba M2 na pravim podacima (graditelj), obilazak 2 u 18:45.

## Sub 24.10. 17:12–17:40 · S9, osoblje, produkcija na pravim podacima

- **Spojeno:** S9 AI prijedlog situacije i mentor s obračunom mjeseca (#111, 17:15), osoblje po odjelima i poveznica
  „Situacije" (#113, 17:18), dokumentacija M3 (#114). Na `main`-u svi L-zadaci (L0–L12), smoke 14/14, 272 testa.
- **Produkcija:** integrator dobio dozvole i postavio `NEXT_PUBLIC_USE_MOCK=0` za Production (~17:40); pravi podaci
  vidljivi nakon builda s #115 ([ADR-030](DECISIONS.md#adr-030)).
- **Ime prijašnjeg projekta:** još u planu i u tri datoteke koda
  ([BUG-008](BUGS.md#bug-008--ime-prijašnjeg-projekta-još-je-u-repou)).
- **Nove sesije:** graditelj, integrator i dokumentarist ponovno pokrenuti; graditelj kreće s probom M2 na pravim
  podacima.
- **Otvoreno:** #115 (tajni kod demo igre), #116 (dokumentacija), #107 (kraći komentari u sučelju, čeka Rinov ok).

## Sub 24.10. ~17:25 · tajni kod demo igre

- Profesorski kod demo igre bio je zadana vrijednost u javnom kodu; demo igra ponovno napravljena s novim tajnim
  kodom, stari vraća 404, skripta više nema zadanu vrijednost (#115)
  ([BUG-007](BUGS.md#bug-007--profesorski-kod-demo-igre-bio-je-zadana-vrijednost-u-javnom-kodu)).

## Sub 24.10. 16:50–17:10 · val M2 spojen

- **Val M2** ([ADR-028](DECISIONS.md#adr-028)), na Leonovo izravno „da": #88 L11 faza B (16:50) → #89 ugovor (16:52)
  → #75 L6 (16:55) → #96 odjava (16:59) → #95 L12 (17:06). Nakon svakog koraka testovi (196, nakon L6 220), CI na
  `main`-u, Vercel i produkcija zeleni; smoke 14/14 (`SMOKE_CITY=1`) nakon #75
  ([BUG-004](BUGS.md#bug-004--smoke-korak-5-na-main-u-pada-ana-ima-0-situacija) riješen).
- **Usporedno spojeno:** R6 profesorova ploča uživo (#108), S8 sučelje za profesorove situacije (#109).
- **M3 spojen iza vala (17:09–17:12):** playbook (#100), demo igra (#103), promjena ocjene mentora (#104). Testovi
  196 → 272, smoke 14/14 i nakon #104, produkcija bez ijednog 5xx.
- **Slijedi:** proba M2 na pravim podacima, pa prave podatke i na produkciji ([ADR-029](DECISIONS.md#adr-029)).

## Sub 24.10. 16:15–16:50 · M2 val spreman, M3 gotov iza njega

- **Spojeno:** R5 situacija s likom (#97), predstavljanje na `/` i ulaz na `/ulaz` (#93), logo (#91), jednostavniji
  pitch (#99).
- **Val M2 čeka Leonovo „da"** ([ADR-028](DECISIONS.md#adr-028)): #88 L11 faza B (smoke 14/14) → #89 ugovor → #75
  L6 → #95 L12 (smoke 14/14) → #96 odjava.
- **M3 gotovo, čeka iza vala:** playbook (#100; neispravan uvoz → 400 bez upisa), demo igra (#103,
  `npm run seed:demo`: 5 hotela, lipanj obračunat, 2 ugovora, profesorova situacija zakazana za srpanj, krug 2
  otvoren), promjena ocjene mentora (#104; pomak pokazatelja točno jednom, i na izvještaju).
- **Shema** samo ručnim aditivnim SQL-om ([ADR-026](DECISIONS.md#adr-026)): `custom_situations`, `dispatches`,
  `worlds.auto_draw`, `answers.overridden`; broj redaka nepromijenjen nakon svake izmjene.
- **Slijedi:** proba M2 na pravim podacima, pa prave podatke i na produkciji ([ADR-029](DECISIONS.md#adr-029)).
  Simon: S8 sučelje, `getTemplate` u `mentor-input.ts`. Rino: R6, R4, poveznica „Situacije", R5 bez opcija.

## Sub 24.10. 15:45–16:15 · obilazak žirija 1 i profesor kao glavni

- **Žiri 1 (~15:45):** prošli smo. Borna Sila: temelj neka bude stabilna softverska mehanika, ne AI agenti; pohvala
  partnerstvu tvrtki i fakulteta. Simon je upisao komentare i odgovor u pitch (#86).
- **Odluke (Leon s timom, ~16:15):** jezgra odvojena od AI-ja, profesor je glavni ([ADR-023](DECISIONS.md#adr-023));
  novi zadaci L12, S8 i S9 za profesorove situacije ([ADR-024](DECISIONS.md#adr-024)); ugovor i redoslijed spajanja
  ([ADR-025](DECISIONS.md#adr-025)). PRD dopunjen kriterijima za M2 i M3.
- **~16:25:** `db:push` predložio pražnjenje tablica, uhvaćeno prije upisa
  ([BUG-006](BUGS.md#bug-006--dbpush-predlaže-pražnjenje-tablica-situations-i-contracts)); od sada samo ručni aditivni
  SQL ([ADR-026](DECISIONS.md#adr-026)).
- **~16:35, playbook:** lagana verzija za M3, izvoz i uvoz bez mijenjanja mehanike ([ADR-027](DECISIONS.md#adr-027)).
  Krenuli M3 zadaci: L8 demo igra, L12 promjena ocjene mentora (`answers.overridden` ručnim SQL-om), L12 playbook.
- **~16:35:** Rino dao „ok" za S8 u `client.ts` i `mock.ts`; ugovor za profesorove situacije je #89 (čeka Leona);
  Rinov prijedlog „playbooka" čeka odluku ([BACKLOG.md](BACKLOG.md)); `docs/ROADMAP.md` ažurira Simon.
- **Stanje gradnje:** na `main`-u L0–L5, L7, L8 smoke 1–10, L9, L10, L11 faza A, S3, S4. U izradi L11 faza B. Čeka
  Leona: L6 (#75).

## Sub 24.10. 15:10–16:00 · L7, L8, L11, S3, S4

- **Leon:** L8 smoke koraci 1–10 (#81, 15:23), L11 faza A, logika grada i rute za plan, ugovore,
  obračun i vijesti (#82, 15:28; spajanje u igru je faza B), L7 krugovi, odgovori s presudom, zatvaranje kruga i uvid (#83, 15:40). Odluke za L11 fazu B: vijesti
  bez sklonidbe ([ADR-021](DECISIONS.md#adr-021)) i smoke korak 11 s 300 € ([ADR-022](DECISIONS.md#adr-022)).
- **Simon:** S3 lik i ruta chat (#76, 15:12), S4 sokratski mentor (#79, 15:20).
- **Rino:** uspravan logo, gumb Odjava, mobitel bez prelijevanja (#78).
- **Agenti:** pokušaj gašenja svih `node.exe` odbijen; novo pravilo za dev server
  ([BUG-005](BUGS.md#bug-005--agent-je-pri-gašenju-dev-servera-pokušao-ugasiti-sve-nodeexe-procese)).
- **Otvoreno:** L6 situacije (#75, čeka Leonov pregled; o njemu ovisi BUG-004).

## Sub 24.10. ~15:20 · smoke 1–10

- **Smoke:** na `main`-u pada korak 5 jer nema situacija do L6; s #75 lokalno prolaze koraci 1–10
  ([BUG-004](BUGS.md#bug-004--smoke-korak-5-na-main-u-pada-ana-ima-0-situacija)).
- **Dokumentacija:** ADR-018 do 020 na `main`-u ([#80](https://github.com/leonkreso784-bit/riihack/pull/80)), dopuna koja nije stigla u #77.

## Sub 24.10. 15:00–15:10 · L4 živ, motor B i C

- **Leon:** L4 API ulaza, profesora i soba (#74, 15:09): `/api/me` bez kolačića vraća 401, dakle ruta postoji. Motor
  B (L5, #70) i motor C s ekonomijom grada (L9, #68) te sadržaj gradskih tvrtki (L10, #69).
- **Simon:** pitch i obilazak (#67), tema učenja (#72). Otvoren S3 lik i ruta chat (#76).
- **Rino:** animacije sučelja (#73).
- **Dokumentacija:** na `main`-u (#71).
- **Odluke:** ugovor i L6 spajaju se samo na Leonovo „spoji" ([ADR-017](DECISIONS.md#adr-017)); pravi podaci samo
  na Previewu ([ADR-018](DECISIONS.md#adr-018)); smoke 1–10 usporedno s L7 ([ADR-019](DECISIONS.md#adr-019));
  odgovori za S3 ([ADR-020](DECISIONS.md#adr-020)); stanje PR-ova vodi samo integrator ([ADR-015](DECISIONS.md#adr-015)).
- **Otvoreno:** #75 L6 situacije (čeka Leona), #76 S3.

## Sub 24.10. 14:35–15:00 · baza živa, L1–L3, R1–R3

- **Leon:** Neon baza `simpolis-db` (Frankfurt, besplatni plan) preko Vercel Marketplacea, `DATABASE_URL` na Vercelu
  za sva tri okruženja; L1 shema i zajednički upiti (#62, 14:44), 11 tablica u bazi. Odluka o #42
  ([ADR-016](DECISIONS.md#adr-016)), PR #63 otvoren.
- **Rino:** R1 ulaz kao Kahoot i čekaonica (#54, 14:38).
- **Simon:** slajdovi obilaska žirija (#55) i Rinov tok demoa nakon R1 (#61).
- **Dokumentacija:** #58 spojen, vraćen s #60, pa ponovno na `main` jer po njoj grade ljudi i agenti ([ADR-015](DECISIONS.md#adr-015)).
- **Vercel:** Rino prihvatio pozivnicu u Vercel tim (Leon, ~15:00), pa mu rade `vercel link` i `vercel env pull`.
- **Spojeno do 15:00:** L2 motor A (#59), L3 banka od 6 hotela (#64), R2 profesor (#56), R3 sobe (#57), logo (#65),
  pitch (#66), ugovor lika (#63). Integrator od sada spaja automatski sve što prođe provjeru ([ADR-015](DECISIONS.md#adr-015)).
- **Slijedi:** L4 (#7), API ulaza i profesora, da M1 radi na pravim podacima.

## Sub 24.10. ~14:30 · tri sesije, dokumentacija

Leon pokreće tri Claude sesije: graditelj, integrator, dokumentarist ([ADR-015](DECISIONS.md#adr-015),
[SESIJE.md](../workflow/SESIJE.md)). Dokumentarist gradi strukturu `docs/` (#58).
**Otvoreno:** #42 tipovi lika (čeka Leonovu odluku), #54 R1 ulaz, #55 slajdovi žirija. **Čeka se:** Neon baza
(`DATABASE_URL`), zatim L1–L4 za prave podatke.

## Sub 24.10. 13:30–14:25 · prema M1: sučelje, AI, grad, ploča tima

- **Rino:** R0 ljuska, tema i klijent s lažnim podacima (#40, 13:52); popravak `roundGain` u lažnoj ljestvici (#49,
  14:04, [BUG-001](BUGS.md#bug-001--main-crven-roundgain-uveden-kao-obavezno-polje)); lažni podaci zadani na Vercelu
  (#52, 14:14, [BUG-003](BUGS.md#bug-003--igra-na-vercelu-vraća-greška-404)). Kreće na R1–R3 na lažnim podacima.
- **Simon:** S1 AI temelj (#41) i S2 presuda po rubrici (#44), 13:55; S5 karta grada, vijesti, radar (#48) i S6 plan
  kruga, financije, ponude (#47), 14:14; roadmap do predaje (#43) i plan obilaska žirija 1 (#51).
  `ANTHROPIC_API_KEY` na Vercelu.
- **Leon:** ugovor za osoblje hotela i `roundGain` (#45, 13:45, [ADR-012](DECISIONS.md#adr-012)); gamifikacija #31
  prihvaćena ([ADR-009](DECISIONS.md#adr-009)); ploča tima u `TEAM.md` (#53, 14:11, [ADR-014](DECISIONS.md#adr-014))
  s pravilima suradnje naučenima toga dana.
- **Provjereno:** CI zelen na `main`-u nakon #49.
- **Slijedi:** Neon baza, L1–L3 usporedno s agentima, zatim L4 (API ulaza i profesora) za M1.

## Sub 24.10. 12:45–13:30 · M0 temelj

- **Leon:** L0 kostur iz startera, ugovor tipova (`types.ts` doslovno iz plana), `rules.ts`, Vitest, CI (#37, 13:29);
  Simonov #36 zatvoren ([ADR-010](DECISIONS.md#adr-010)). Popravak lock datoteke za Linux CI
  ([BUG-002](BUGS.md#bug-002--npm-ci-na-linux-ci-ju-pada-zbog-lock-datoteke-s-windowsa)).
- **Simon:** tri obećanja za žiri (`PROMISE.md`, #35) i nacrt pitcha, skraćen na 5 minuta (#38).
- **Provjereno:** M0 ✅ 13:30: https://riihack.vercel.app, CI zelen ([TEAM.md](../../TEAM.md) › Prekretnice).

## Sub 24.10. 11:52–12:40 · ideja, arhitektura, plan

- **Leon:** prvi commit (11:52) s dokumentacijom Simpolisa; ulaz kao Kahoot i banka hotela; Neon umjesto Supabasea
  ([ADR-005](DECISIONS.md#adr-005)); plan izvedbe sa zadacima L0–L8, S0–S7, R0–R9 (12:09); grad i prava ekonomija u
  srži, zadaci L9–L11 (12:36, [ADR-008](DECISIONS.md#adr-008)).
- **Rino:** dva kruga napomena na arhitekturu (#2, 12:25): profesorski kod izvan adrese, dvostruko zatvaranje kruga,
  polling umjesto Realtimea, `serverNow`, mentor izvan zatvaranja, `db.batch`
  ([ADR-003](DECISIONS.md#adr-003), [004](DECISIONS.md#adr-004), [006](DECISIONS.md#adr-006), [007](DECISIONS.md#adr-007)).
- **Simon:** prijedlog gamifikacije R10 i napretka kao normaliziranog dobitka (#31).
