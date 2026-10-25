# Changelog

Spojeni PR-ovi po prekretnicama, najnovije gore. Vrijeme spajanja: CEST do ned 03:00 CEST, zatim CET (sat vraćen u 03:00 na 02:00). Priča po sesijama je u
[PROGRESS.md](PROGRESS.md).

## M3 · Obilazak 3 (rok ned 07:45)

| PR | Spojeno | Autor | Što |
| --- | --- | --- | --- |
| [#278](https://github.com/leonkreso784-bit/riihack/pull/278) | 08:21 CET | Leon | graditelj: `README.md` i `CLAUDE.md` više ne upućuju `db:push` na zajedničku bazu, samo na svoju praznu ([ADR-026](DECISIONS.md#adr-026)); Simonov `PREDAJA.md` usklađen s demoom |
| [#267](https://github.com/leonkreso784-bit/riihack/pull/267) | 08:03 CET | Simon | popravci iz noćnog pregleda: brojke u Tokovima, karta, ponude ugovora, vijesti, mentor i 3 teksta u `situations.json`; 5 Rinovih datoteka minimalno; motor netaknut; Leonovo „pokreni 267" |
| [#276](https://github.com/leonkreso784-bit/riihack/pull/276) | 08:02 CET | Leon | dokumentacija: baza očišćena, jutro prije žirija |
| [#275](https://github.com/leonkreso784-bit/riihack/pull/275) | 04:39 CET | Leon | skripta za čišćenje: način `--kodovi` briše točno navedene igre; suhi prolaz je zadan, `KVRNDM` se nikad ne briše |
| [#274](https://github.com/leonkreso784-bit/riihack/pull/274) | 04:33 CET | Leon | dokumentacija: botovi planiraju (#272), BUG-057 do 059 potvrđeni |
| [#272](https://github.com/leonkreso784-bit/riihack/pull/272) | 04:24 CET | Leon | plan iz prethodnog mjeseca više se ne prenosi botovima (`withoutBotPlans` u `carryPlansForward`), pa bot opet planira sam svaki mjesec; regresija iz [#241](https://github.com/leonkreso784-bit/riihack/pull/241) (BUG-063); dira `city.ts` po [ADR-054](DECISIONS.md#adr-054) |
| [#273](https://github.com/leonkreso784-bit/riihack/pull/273) | 04:22 CET | Leon | dokumentacija: projektor potvrđen |
| [#271](https://github.com/leonkreso784-bit/riihack/pull/271) | 04:19 CET | Leon | izvještaj se osvježava svakih 15 s dok je mjesec privremen, napomena „Brojke su privremene…" samo tada (BUG-057, BUG-059); Tokovi kasnog studenta za mjesec prije ulaska „U tom mjesecu još nisi bio u igri" (BUG-058); dira Rinov `izvjestaj/[krug]/page.tsx` i Simonov `tok/page.tsx` po [ADR-054](DECISIONS.md#adr-054) |
| [#270](https://github.com/leonkreso784-bit/riihack/pull/270) | 04:11 CET | Leon | dokumentacija: BUG-063 botovi ne planiraju |
| [#269](https://github.com/leonkreso784-bit/riihack/pull/269) | 04:06 CET | Leon | dokumentacija: projektor spojen (#264) |
| [#264](https://github.com/leonkreso784-bit/riihack/pull/264) | 03:48 CET | Leon | projektor: podij mjeseca i ljestvica nakon kraja sezone bez crvenog (`Delta` i `Leaderboard` dobivaju `neutral`), kompaktni podij sezone uz ljestvicu u dva stupca na `xl:`, ploča profesora do 1600 px s većom ljestvicom (BUG-051 do 054, BUG-060); dira 5 Rinovih komponenti po [ADR-054](DECISIONS.md#adr-054); rebase zbog sukoba s [#252](https://github.com/leonkreso784-bit/riihack/pull/252) |
| [#265](https://github.com/leonkreso784-bit/riihack/pull/265) | 03:08 CET | Leon | dokumentacija: #262 potvrđen, BUG-057 do 062 |
| [#263](https://github.com/leonkreso784-bit/riihack/pull/263) | 02:40 CET | Leon | dokumentacija: sitni ispravci (#262), demo ponovno posijan |
| [#262](https://github.com/leonkreso784-bit/riihack/pull/262) | 02:31 CET | Leon | dvostruki uvoz playbooka preskače situacije koje su već u igri (BUG-046), „Soba je spremljena" (BUG-047), „Uvezeno N situacija" s množinom (BUG-045), napomena „Brojke su privremene…" u izvještaju (BUG-043), kasni student za raniji mjesec dobiva 404 „U tom mjesecu još nisi bio u igri" (BUG-049); dira Rinove `situacije/page.tsx` i `izvjestaj/[krug]/page.tsx` ([ADR-054](DECISIONS.md#adr-054)) |
| [#261](https://github.com/leonkreso784-bit/riihack/pull/261) | 02:18 CET | Leon | dokumentacija: tester potvrdio ispravke |
| [#260](https://github.com/leonkreso784-bit/riihack/pull/260) | 02:10 CET | Leon | dokumentacija: plan, račun i ocjena spojeni; promjena sata |
| [#253](https://github.com/leonkreso784-bit/riihack/pull/253) | 02:59 CEST | Leon | napisan vlastiti odgovor s ocjenom 1 vrijedi 0, zalijepljen ostaje −2; „Promijeni ocjenu" računa istim množiteljem kao motor (ADR-052, BUG-030, BUG-041; dira plan i pozivna mjesta u Simonovim Tokovima) |
| [#252](https://github.com/leonkreso784-bit/riihack/pull/252) | 02:58 CEST | Leon | student ne vidi stanje računa tuđih hotela na ljestvici i karti, Financije „Rang po napretku" (ADR-040, BUG-034; mijenja ugovor `LeaderboardRow.cash?`, dira Rinove datoteke) |
| [#241](https://github.com/leonkreso784-bit/riihack/pull/241) | 02:58 CEST | Leon | plan mjeseca se prenosi u sljedeći (#227.1), protuponuda bez koristi vraća 400 (#227.3) (ADR-050, BUG-029) |
| [#259](https://github.com/leonkreso784-bit/riihack/pull/259) | 02:58 CEST | Leon | dokumentacija: projektor 1920/2560 i 1440 px, BUG-051 do 055 |
| [#258](https://github.com/leonkreso784-bit/riihack/pull/258) | 02:51 CEST | Leon | dokumentacija: spajanja 02:35–02:44, ADR-054 izravno odobrenje, BUG-039 riješen |
| [#257](https://github.com/leonkreso784-bit/riihack/pull/257) | 02:44 CEST | Leon | dokumentacija: BUG-040 do 050, ADR-054, suženi kriterij karte i vijesti |
| [#255](https://github.com/leonkreso784-bit/riihack/pull/255) | 02:39 CEST | Leon | „Moje igre" broji studente bez botova (BUG-035, dio), knjižnica bez duplikata (BUG-039) |
| [#247](https://github.com/leonkreso784-bit/riihack/pull/247) | 02:38 CEST | Leon | granica AI prijedloga: 30 po igri i 5 u minuti (ADR-053) |
| [#249](https://github.com/leonkreso784-bit/riihack/pull/249) | 02:38 CEST | Leon | granica 6 poruka u razgovoru drži i pod istodobnim zahtjevima (BUG-042, ADR-053) |
| [#250](https://github.com/leonkreso784-bit/riihack/pull/250) | 02:38 CEST | Simon | mentorovo pitanje s tisućicama se više ne reže, rodno neutralno obraćanje |
| [#256](https://github.com/leonkreso784-bit/riihack/pull/256) | 02:35 CEST | Leon | dokumentacija: ARHITEKTURA.md §1a, §3 i §9a prema stanju main-a |
| [#254](https://github.com/leonkreso784-bit/riihack/pull/254) | 02:29 CEST | Leon | dokumentacija: PRD i BACKLOG prema demou |
| [#251](https://github.com/leonkreso784-bit/riihack/pull/251) | 02:23 CEST | Leon | sigurnosna zaglavlja na svim rutama: `X-Frame-Options`, `nosniff`, `Referrer-Policy` (ADR-053) |
| [#248](https://github.com/leonkreso784-bit/riihack/pull/248) | 02:18 CEST | Leon | dokumentacija: ADR-053 sigurnost |
| [#246](https://github.com/leonkreso784-bit/riihack/pull/246) | 01:33 | Leon | dokumentacija: ADR-052, račun tuđih hotela, BUG-033, 036, 037 i 038 riješeni |
| [#242](https://github.com/leonkreso784-bit/riihack/pull/242) | 01:28 | Simon | mentor prepozna prazan odgovor (BUG-033), množina u Tokovima odjela (BUG-037) |
| [#245](https://github.com/leonkreso784-bit/riihack/pull/245) | 01:27 | Leon | brže „Moje igre": igre se traže odmah, usporedno sa sesijom (#227.6) |
| [#244](https://github.com/leonkreso784-bit/riihack/pull/244) | 01:27 | Rino | situacija ne skrola stranicu (BUG-038), poruka bez padeža i potvrda praznog odgovora (BUG-036) |
| [#243](https://github.com/leonkreso784-bit/riihack/pull/243) | 01:16 | Leon | dokumentacija: ADR-050 i 051, BUG-032 riješen, BUG-037 do 039 |
| [#240](https://github.com/leonkreso784-bit/riihack/pull/240) | 01:12 | Leon | izvještaj mjeseca, mentor i podij vide obračun grada (BUG-032, #226) |
| [#235](https://github.com/leonkreso784-bit/riihack/pull/235) | 01:12 | Simon | botovi igraju mjesec paralelno, najviše 5 odjednom (#227.2) |
| [#237](https://github.com/leonkreso784-bit/riihack/pull/237) | 01:12 | Rino | „Mentor" u izborniku nakon prvog mjeseca; profesor sprema ocjenu gumbom |
| [#233](https://github.com/leonkreso784-bit/riihack/pull/233) | 01:05 | Rino | animacije čekanja: učitavanje, mentor i lik „pišu", točkice u gumbima |
| [#238](https://github.com/leonkreso784-bit/riihack/pull/238) | 01:05 | Leon | dokumentacija: BUG-028 mjerenje, BUG-029 do 036, test sezone i put žirija |
| [#236](https://github.com/leonkreso784-bit/riihack/pull/236) | 00:32 | Leon | dokumentacija: BUG-028 mentor spor |
| [#234](https://github.com/leonkreso784-bit/riihack/pull/234) | 00:28 | Leon | dokumentacija: popravci iz audita |
| [#232](https://github.com/leonkreso784-bit/riihack/pull/232) | 00:28 | Simon | Tokovi: odjeli kao staze (skica 3 v2) |
| [#231](https://github.com/leonkreso784-bit/riihack/pull/231) | 00:28 | Simon | mentorov osvrt ne pada na fiksni tekst (BUG-028, dio) |
| [#229](https://github.com/leonkreso784-bit/riihack/pull/229) | 00:22 | Rino | sitnice iz audita: protuponuda s istom cijenom, tekstovi, `/igra` bez kolačića (Leonovo „spoji", jedan redak na Simonovim Financijama) |
| [#228](https://github.com/leonkreso784-bit/riihack/pull/228) | 00:17 | Simon | audit: lik odgovara, mentorov osvrt stiže, karta bez vodoravnog scrolla |
| [#230](https://github.com/leonkreso784-bit/riihack/pull/230) | 00:17 | Leon | dokumentacija: ADR-049, audit, predaja graditelja |
| [#225](https://github.com/leonkreso784-bit/riihack/pull/225) | 00:01 | Leon | bez donje granice teksta: prazan odgovor ocjenjuje motor s 1, mentor prepozna praznu refleksiju (ADR-049) |
| [#224](https://github.com/leonkreso784-bit/riihack/pull/224) | 00:00 | Rino | poveznice „Kako …" i natrag svugdje iste (`FlowLink`); poruke o granici znakova |
| [#223](https://github.com/leonkreso784-bit/riihack/pull/223) | 23:35 | Leon | dokumentacija: demo spreman za obilazak 3 |
| [#222](https://github.com/leonkreso784-bit/riihack/pull/222) | 23:31 | Leon | dokumentacija: kasni ulaz, bugovi s testa zatvoreni |
| [#206](https://github.com/leonkreso784-bit/riihack/pull/206) | 23:27 | Simon | Tokovi: „Kako odjeli utječu na hotel" (`/igra/osoblje/tok`), BUG-020b |
| [#221](https://github.com/leonkreso784-bit/riihack/pull/221) | 23:26 | Leon | BUG-027: kasni ulaz dok igra traje, demo igra 15 mjesta, smoke korak 20 (ADR-048) |
| [#215](https://github.com/leonkreso784-bit/riihack/pull/215) | 23:22 | Simon | grad: karta se prilagođava broju hotela |
| [#220](https://github.com/leonkreso784-bit/riihack/pull/220) | 23:17 | Leon | dokumentacija: vremena odluka ispravljena |
| [#212](https://github.com/leonkreso784-bit/riihack/pull/212) | 23:15 | Leon | BUG-019 i 021 ostatak: „rok je istekao", Knjižnica u zaglavlju profesora |
| [#217](https://github.com/leonkreso784-bit/riihack/pull/217) | 23:14 | Leon | plan: ugovor za botove (`isBot?`, `BotsRequest`) iz #205 |
| [#219](https://github.com/leonkreso784-bit/riihack/pull/219) | 23:13 | Leon | dokumentacija: ADR-047 i 048, kasni ulaz |
| [#216](https://github.com/leonkreso784-bit/riihack/pull/216) | 23:08 | Rino | `/profesor` bez bljeska prijave, ploča bez dvostrukog „Moje igre" |
| [#214](https://github.com/leonkreso784-bit/riihack/pull/214) | 23:06 | Leon | BUG-026: odgovor na situaciju uvijek se isplati (učinak po ocjeni, ADR-046) |
| [#218](https://github.com/leonkreso784-bit/riihack/pull/218) | 23:06 | Leon | dokumentacija: ADR-046, bugovi riješeni, botovi |
| [#205](https://github.com/leonkreso784-bit/riihack/pull/205) | 23:00 | Simon | botovi: računalni hoteli s težinom, profesor ih dodaje u čekaonici (ADR-044) |
| [#213](https://github.com/leonkreso784-bit/riihack/pull/213) | 22:55 | Leon | BUG-024: kvaliteta iz svih pokazatelja određuje privlačnost i potražnju hotela (ADR-045) |
| [#211](https://github.com/leonkreso784-bit/riihack/pull/211) | 22:50 | Rino | rok „Ručno" (BUG-025), podij sezone i ljestvica cijelom širinom (BUG-022), kraj sezone na `/igra` (BUG-023), „Bez odgovora" (BUG-019), „← Moje igre" i kod igre na ploči |
| [#210](https://github.com/leonkreso784-bit/riihack/pull/210) | 22:45 | Leon | dokumentacija: ponovna provjera testera, BUG-025 i 026 |
| [#208](https://github.com/leonkreso784-bit/riihack/pull/208) | 22:45 | Leon | „Moje igre": „2 studenta" (BUG-020a) |
| [#207](https://github.com/leonkreso784-bit/riihack/pull/207) | 22:45 | Leon | skripta za čišćenje: `--stare` za stare testne igre |
| [#203](https://github.com/leonkreso784-bit/riihack/pull/203) | 22:37 | Leon | seed: knjižnica situacija na demo računu |
| [#204](https://github.com/leonkreso784-bit/riihack/pull/204) | 22:30 | Leon | dokumentacija: ADR-045 |
| [#192](https://github.com/leonkreso784-bit/riihack/pull/192) | 22:29 | Simon | grad: tuđi hoteli bez stanja računa, javni prihod i dobit, visina zgrade po napretku (ADR-040) |
| [#196](https://github.com/leonkreso784-bit/riihack/pull/196) | 22:29 | Rino | R10: podij mjeseca i sezone za projektor, „Pokaži podij", anonimna ljestvica |
| [#195](https://github.com/leonkreso784-bit/riihack/pull/195) | 22:29 | Simon | AI prijedlog situacije: područje kao u banci (BUG-017) |
| [#200](https://github.com/leonkreso784-bit/riihack/pull/200) | 22:28 | Rino | „bez odgovora" na uvidu i hrvatska množina uz brojeve (BUG-015, BUG-016) |
| [#202](https://github.com/leonkreso784-bit/riihack/pull/202) | 22:23 | Leon | dokumentacija: ADR-044 botovi, BUG-019 do 024 |
| [#194](https://github.com/leonkreso784-bit/riihack/pull/194) | 22:14 | Leon | balans cijene: iznad referentne cijene privlačnost pada s kvadratom, iznad 2,5× je 0 (ADR-043, BUG-014 riješen) |
| [#199](https://github.com/leonkreso784-bit/riihack/pull/199) | 22:13 | Leon | `/profesor/prijava` bez mrtve poveznice „Imaš samo profesorski kod?" |
| [#197](https://github.com/leonkreso784-bit/riihack/pull/197) | 22:13 | Leon | dokumentacija: bugovi s testa produkcije, ADR-044 botovi |
| [#193](https://github.com/leonkreso784-bit/riihack/pull/193) | 21:59 | Leon | dokumentacija: val 3 spojen, ADR-043 i BUG-014 |
| [#184](https://github.com/leonkreso784-bit/riihack/pull/184) | 21:51 | Leon | L14: prihod i dobit zatvorenih mjeseci u javnom profilu tuđeg hotela (ADR-040, ugovor) |
| [#190](https://github.com/leonkreso784-bit/riihack/pull/190) | 21:51 | Leon | `SituationView.rubric?` i `effects?` nakon odgovora (za Tokove skica 2, ugovor) |
| [#189](https://github.com/leonkreso784-bit/riihack/pull/189) | 21:51 | Leon | knjižnica situacija: stranica `/profesor/knjiznica` |
| [#186](https://github.com/leonkreso784-bit/riihack/pull/186) | 21:51 | Rino | profesor ulazi preko računa; `/ulaz` bez „Ja sam profesor" (ADR-041) |
| [#191](https://github.com/leonkreso784-bit/riihack/pull/191) | 21:51 | Leon | L8: demo igra za val 3 (demo račun, hoteli po mjestu, pregovor, poruke) i smoke 19 koraka |
| [#188](https://github.com/leonkreso784-bit/riihack/pull/188) | 21:51 | Leon | skripta za čišćenje testnih podataka (zadano suhi prolaz, `--apply` briše) |
| [#179](https://github.com/leonkreso784-bit/riihack/pull/179) | 21:44 | Simon | Tokovi skica 2: „Kako je tvoj odgovor prošao kroz hotel" |
| [#174](https://github.com/leonkreso784-bit/riihack/pull/174) | 21:44 | Simon | Tokovi skica 1: „Kako je izračunat mjesec", sa „Što ako?" u pregledniku |
| [#185](https://github.com/leonkreso784-bit/riihack/pull/185) | 21:41 | Leon | dokumentacija: ADR-042 |
| [#183](https://github.com/leonkreso784-bit/riihack/pull/183) | 21:33 | Leon | dokumentacija: ADR-031 zatvoren |
| [#176](https://github.com/leonkreso784-bit/riihack/pull/176) | 21:31 | Simon | popravci iz revizije: sudac čuva kriterije kad drugi pokušaj padne, AI nacrt zaključava obrazac, skraćeno ime hotela na karti |
| [#180](https://github.com/leonkreso784-bit/riihack/pull/180) | 21:22 | Rino | dokumenti: nema zamrzavanja koda (`CLAUDE.md`, `PLAN-24H.md`, glavni plan; ADR-031) |
| [#182](https://github.com/leonkreso784-bit/riihack/pull/182) | 21:20 | Leon | dokumentacija: odluke ADR-037 do 041, BUG-013 |
| [#181](https://github.com/leonkreso784-bit/riihack/pull/181) | 21:15 | Leon | dokumentacija: L16 ekrani, S12, L18 |
| [#177](https://github.com/leonkreso784-bit/riihack/pull/177) | 21:11 | Leon | L18: poruke među hotelima (`POST /api/me/mail`, `GET /api/prof/[worldId]/mail`, ugovor `SendMailRequest`) |
| [#169](https://github.com/leonkreso784-bit/riihack/pull/169) | 21:10 | Leon | L16 ekrani: registracija, prijava i „Moje igre" profesora (Rinov ok) |
| [#170](https://github.com/leonkreso784-bit/riihack/pull/170) | 21:10 | Simon | S12: knjižnica na stranici situacija, spremi i dodaj iz knjižnice (Rinov ok za `client.ts`) |
| [#175](https://github.com/leonkreso784-bit/riihack/pull/175) | 21:01 | Leon | dokumentacija: R8 uvid, sitnice, dnevnik do 21:00 |
| [#173](https://github.com/leonkreso784-bit/riihack/pull/173) | 20:58 | Rino | sitnice: oznaka „od profesora", mjesec zadnjeg obračuna na `/igra`, čekaonica bez bljeska |
| [#168](https://github.com/leonkreso784-bit/riihack/pull/168) | 20:52 | Rino | R8: uvid profesora u razmišljanje studenta (`/profesor/[worldId]/tvrtka/[id]`) i „Promijeni ocjenu" |
| [#171](https://github.com/leonkreso784-bit/riihack/pull/171) | 20:51 | Leon | dokumentacija: BUG-012 riješen, L17 knjižnica |
| [#165](https://github.com/leonkreso784-bit/riihack/pull/165) | 20:44 | Leon | L17: knjižnica situacija na računu profesora |
| [#166](https://github.com/leonkreso784-bit/riihack/pull/166) | 20:44 | Leon | dvoklik na zatvaranju mjeseca ne preskače mjesec (`fromRound`, BUG-012) |
| [#167](https://github.com/leonkreso784-bit/riihack/pull/167) | 20:43 | Leon | dokumentacija: R7, R13, shema knjižnice |
| [#164](https://github.com/leonkreso784-bit/riihack/pull/164) | 20:40 | Rino | R13: pošta na `/igra/posta`, ponude s protuponudom, broj nepročitanih u navigaciji |
| [#163](https://github.com/leonkreso784-bit/riihack/pull/163) | 20:35 | Leon | dokumentacija: obilazak 2 po Leonovom opisu |
| [#160](https://github.com/leonkreso784-bit/riihack/pull/160) | 20:35 | Rino | R7: izvještaj mjeseca (`/igra/izvjestaj/[krug]`) i sokratski mentor |
| [#161](https://github.com/leonkreso784-bit/riihack/pull/161) | 20:30 | Leon | dokumentacija: profesorski računi na produkciji, BUG-012 |
| [#159](https://github.com/leonkreso784-bit/riihack/pull/159) | 20:17 | Leon | dokumentacija: BUG-008 riješen |
| [#157](https://github.com/leonkreso784-bit/riihack/pull/157) | 20:13 | Rino | plan bez imena prijašnjeg projekta (BUG-008 riješen) |
| [#150](https://github.com/leonkreso784-bit/riihack/pull/150) | 20:11 | Simon | `PROMISE.md`: obilazak žirija 2, opseg dopunjen s L16 i S9 |
| [#158](https://github.com/leonkreso784-bit/riihack/pull/158) | 20:10 | Leon | dokumentacija: L16 i S11, BUG-011 |
| [#147](https://github.com/leonkreso784-bit/riihack/pull/147) | 20:06 | Leon | L16: profesorski računi (Better Auth), moje igre, vlasnik igre (BUG-011 riješen) |
| [#154](https://github.com/leonkreso784-bit/riihack/pull/154) | 20:06 | Simon | S11: AI agent agencije piše odgovor na protuponudu, brojke iz motora, rezerva kad AI padne |
| [#155](https://github.com/leonkreso784-bit/riihack/pull/155) | 20:06 | Leon | `scripts/lock-merge.py`: nova ovisnost bez kvarenja lock datoteke na Windowsu |
| [#156](https://github.com/leonkreso784-bit/riihack/pull/156) | 20:06 | Leon | dokumentacija: obilazak 2, L15, karta grada |
| [#107](https://github.com/leonkreso784-bit/riihack/pull/107) | 19:58 | Leon | kraći komentari u sučelju, bez imena prijašnjeg projekta (BUG-008) |
| [#128](https://github.com/leonkreso784-bit/riihack/pull/128) | 19:58 | Simon | S10/R12: karta grada kao izometrijska društvena igra, kartica tvrtke (Rinov ok) |
| [#152](https://github.com/leonkreso784-bit/riihack/pull/152) | 19:57 | Rino | R4: „Završi mjesec" za studenta |
| [#151](https://github.com/leonkreso784-bit/riihack/pull/151) | 19:57 | Rino | QR kod za ulaz na profesorovoj čekaonici (`uqr`) |
| [#153](https://github.com/leonkreso784-bit/riihack/pull/153) | 19:57 | Leon | dokumentacija: tjedni krug u backlog |
| [#142](https://github.com/leonkreso784-bit/riihack/pull/142) | 19:54 | Rino | detaljnije Financije, Plan i Odjeli (Leonovo izravno „spoji" umjesto Simonovog ok) |
| [#148](https://github.com/leonkreso784-bit/riihack/pull/148) | 19:54 | Leon | L15: pošta s agencijama i pregovaranje |
| [#149](https://github.com/leonkreso784-bit/riihack/pull/149) | 19:42 | Leon | dokumentacija: #144, shema pošte |
| [#144](https://github.com/leonkreso784-bit/riihack/pull/144) | 19:39 | Leon | raspodjela prihoda i troškova u obračunu mjeseca (`FinanceBreakdown`), zbrojevi motora isti |
| [#146](https://github.com/leonkreso784-bit/riihack/pull/146) | 19:31 | Leon | dokumentacija: L14, shema računa |
| [#143](https://github.com/leonkreso784-bit/riihack/pull/143) | 19:27 | Leon | L14: javni profil hotela (`GET /api/world/[worldId]/companies`), samo član igre, bez novca i ocjena |
| [#145](https://github.com/leonkreso784-bit/riihack/pull/145) | 19:21 | Leon | dokumentacija: plan vala 3 spojen |
| [#134](https://github.com/leonkreso784-bit/riihack/pull/134) | 19:16 | Leon | plan vala 3: odjeli, pošta, tuđi hoteli, karta, profesorski računi |
| [#139](https://github.com/leonkreso784-bit/riihack/pull/139) | 19:16 | Leon | paket `uqr` za QR kod ulaza |
| [#135](https://github.com/leonkreso784-bit/riihack/pull/135) | 19:12 | Rino | R11: odjeli s ulaganjem na `/igra/osoblje` |
| [#140](https://github.com/leonkreso784-bit/riihack/pull/140) | 19:07 | Leon | dokumentacija: odjeli na `main`-u |
| [#138](https://github.com/leonkreso784-bit/riihack/pull/138) | 18:59 | Rino | `/ulaz?kod=…` sam upiše kod (prvi dio QR ulaza) |
| [#137](https://github.com/leonkreso784-bit/riihack/pull/137) | 18:59 | Leon | L13: motor odjela, ulaganje u troškove i pokazatelje, `departments` u `/api/me` |
| [#136](https://github.com/leonkreso784-bit/riihack/pull/136) | 18:55 | Leon | dokumentacija: ADR-033 do 036 (val 3) |
| [#132](https://github.com/leonkreso784-bit/riihack/pull/132) | 18:54 | Leon | ugovor: ulaganje u odjele (`types.ts`, `rules.ts`, plan) |
| [#129](https://github.com/leonkreso784-bit/riihack/pull/129) | 18:45 | Simon | S8: playbook (izvoz i uvoz) i AI prijedlog situacije na stranici situacija |
| [#118](https://github.com/leonkreso784-bit/riihack/pull/118) | 18:02 | Leon | L12: AI prijedlog situacije za profesora (`POST …/situations/generate`) |
| [#111](https://github.com/leonkreso784-bit/riihack/pull/111) | 17:15 | Simon | S9: AI prijedlog situacije iz stanja hotela, mentor s obračunom mjeseca |
| [#104](https://github.com/leonkreso784-bit/riihack/pull/104) | 17:12 | Leon | L12: profesor mijenja ocjenu mentora |
| [#103](https://github.com/leonkreso784-bit/riihack/pull/103) | 17:10 | Leon | L8: demo igra (`npm run seed:demo`) |
| [#100](https://github.com/leonkreso784-bit/riihack/pull/100) | 17:09 | Leon | L12: playbook, izvoz i uvoz profesorovih situacija |
| [#79](https://github.com/leonkreso784-bit/riihack/pull/79) | 15:20 | Simon | S4: sokratski mentor (pitanje i osvrt) |

## M2 · Obilazak 2 (✅ žiri ~19:00)

| PR | Spojeno | Autor | Što |
| --- | --- | --- | --- |
| [#131](https://github.com/leonkreso784-bit/riihack/pull/131) | 18:50 | Simon | ROADMAP i pitch bez zamrzavanja, nedjeljni raspored |
| [#133](https://github.com/leonkreso784-bit/riihack/pull/133) | 18:49 | Leon | dokumentacija: shema odjela, dnevnik do 18:50 |
| [#130](https://github.com/leonkreso784-bit/riihack/pull/130) | 18:41 | Leon | dokumentacija: ADR-031 i ADR-032 |
| [#127](https://github.com/leonkreso784-bit/riihack/pull/127) | 18:36 | Rino | popravci prije obilaska: `/igra` na 1000–1100 px, bez „(S6)", plavi „polis" |
| [#126](https://github.com/leonkreso784-bit/riihack/pull/126) | 18:30 | Leon | dokumentacija: ok za playbook u `client.ts` |
| [#124](https://github.com/leonkreso784-bit/riihack/pull/124) | 18:27 | Leon | dokumentacija: BUG-008 u radu (Rino) |
| [#123](https://github.com/leonkreso784-bit/riihack/pull/123) | 18:11 | Leon | dokumentacija: BUG-009 riješen |
| [#122](https://github.com/leonkreso784-bit/riihack/pull/122) | 18:07 | Leon | dokumentacija: BUG-010 dopunjen |
| [#120](https://github.com/leonkreso784-bit/riihack/pull/120) | 18:07 | Simon | BUG-009: presuda ne pada na rezervu zbog stila obrazloženja |
| [#121](https://github.com/leonkreso784-bit/riihack/pull/121) | 18:06 | Leon | dokumentacija: #118, BUG-010 |
| [#119](https://github.com/leonkreso784-bit/riihack/pull/119) | 17:59 | Leon | dokumentacija: BUG-009 |
| [#117](https://github.com/leonkreso784-bit/riihack/pull/117) | 17:55 | Leon | dokumentacija: produkcija na pravim podacima (ADR-030) |
| [#116](https://github.com/leonkreso784-bit/riihack/pull/116) | 17:51 | Leon | dokumentacija: BUG-007, BUG-008, ADR-030 |
| [#115](https://github.com/leonkreso784-bit/riihack/pull/115) | 17:50 | Leon | demo igra: profesorski kod samo iz `.env.local` (BUG-007) |
| [#113](https://github.com/leonkreso784-bit/riihack/pull/113) | 17:18 | Rino | osoblje hotela po odjelima, poveznica „Situacije" na ploči |
| [#114](https://github.com/leonkreso784-bit/riihack/pull/114) | 17:17 | Leon | dokumentacija: M3 spojen iza vala |
| [#112](https://github.com/leonkreso784-bit/riihack/pull/112) | 17:14 | Leon | dokumentacija: val M2, uvod za novu sesiju |
| [#95](https://github.com/leonkreso784-bit/riihack/pull/95) | 17:06 | Leon | L12: profesorove situacije, slanje odabranima, izbor iz banke |
| [#109](https://github.com/leonkreso784-bit/riihack/pull/109) | 17:04 | Simon | S8: sučelje za profesorove situacije i slanje |
| [#108](https://github.com/leonkreso784-bit/riihack/pull/108) | 17:02 | Rino | R6: profesorova ploča uživo |
| [#105](https://github.com/leonkreso784-bit/riihack/pull/105) | 17:01 | Leon | dokumentacija: ADR-028 i 029 |
| [#96](https://github.com/leonkreso784-bit/riihack/pull/96) | 16:59 | Leon | odjava: `POST /api/logout` briše kolačiće |
| [#75](https://github.com/leonkreso784-bit/riihack/pull/75) | 16:55 | Leon | L6: 8 situacija s rubrikama (BUG-004 riješen) |
| [#89](https://github.com/leonkreso784-bit/riihack/pull/89) | 16:52 | Leon | ugovor: profesorove situacije i playbook |
| [#88](https://github.com/leonkreso784-bit/riihack/pull/88) | 16:50 | Leon | L11 faza B: obračun mjeseca, ugovori i vijesti u igri |
| [#99](https://github.com/leonkreso784-bit/riihack/pull/99) | 16:41 | Simon | pitch: jednostavniji nakon žirija 1 |
| [#97](https://github.com/leonkreso784-bit/riihack/pull/97) | 16:40 | Rino | R5: situacija s likom, odgovor i presuda |
| [#98](https://github.com/leonkreso784-bit/riihack/pull/98) | 16:35 | Leon | dokumentacija: ADR-027 playbook |
| [#93](https://github.com/leonkreso784-bit/riihack/pull/93) | 16:24 | Rino | predstavljanje na `/`, ulaz kodom na `/ulaz` |
| [#94](https://github.com/leonkreso784-bit/riihack/pull/94) | 16:24 | Leon | dokumentacija: BUG-006 i ADR-026 detalji |
| [#92](https://github.com/leonkreso784-bit/riihack/pull/92) | 16:19 | Leon | dokumentacija: BUG-006 i ADR-026 |
| [#91](https://github.com/leonkreso784-bit/riihack/pull/91) | 16:03 | Rino | logo i favicon |
| [#90](https://github.com/leonkreso784-bit/riihack/pull/90) | 15:59 | Leon | dokumentacija: Rinov ok za S8, prijedlog playbooka |
| [#87](https://github.com/leonkreso784-bit/riihack/pull/87) | 15:55 | Leon | dokumentacija: odluke nakon žirija 1 |
| [#86](https://github.com/leonkreso784-bit/riihack/pull/86) | 15:51 | Simon | komentari žirija 1 i odgovor u pitchu |
| [#85](https://github.com/leonkreso784-bit/riihack/pull/85) | 15:45 | Leon | dokumentacija: ADR-021 i 022, BUG-005 |
| [#84](https://github.com/leonkreso784-bit/riihack/pull/84) | 15:42 | Leon | dokumentacija: BUG-004 |
| [#83](https://github.com/leonkreso784-bit/riihack/pull/83) | 15:40 | Leon | L7: krugovi, odgovori s presudom, zatvaranje kruga, uvid |
| [#82](https://github.com/leonkreso784-bit/riihack/pull/82) | 15:28 | Leon | L11 faza A: logika grada i rute (plan, ugovori, obračun, vijesti); spajanje u igru u fazi B |
| [#81](https://github.com/leonkreso784-bit/riihack/pull/81) | 15:23 | Leon | L8: smoke provjera toka, koraci 1–10 |
| [#80](https://github.com/leonkreso784-bit/riihack/pull/80) | 15:21 | Leon | dokumentacija: ADR-018 do 020 |
| [#78](https://github.com/leonkreso784-bit/riihack/pull/78) | 15:19 | Rino | uspravan logo, gumb Odjava, mobitel bez prelijevanja |
| [#77](https://github.com/leonkreso784-bit/riihack/pull/77) | 15:13 | Leon | dokumentacija: ADR-017, changelog i dnevnik |
| [#76](https://github.com/leonkreso784-bit/riihack/pull/76) | 15:12 | Simon | S3: lik u ulozi i ruta chat |
| [#73](https://github.com/leonkreso784-bit/riihack/pull/73) | 15:08 | Rino | animacije sučelja |
| [#70](https://github.com/leonkreso784-bit/riihack/pull/70) | 15:07 | Leon | L5: motor B, krugovi, kvaliteta, prepisivanje, napredak |
| [#69](https://github.com/leonkreso784-bit/riihack/pull/69) | 15:07 | Leon | L10: gradske tvrtke i ugovori (sadržaj) |
| [#68](https://github.com/leonkreso784-bit/riihack/pull/68) | 15:02 | Leon | L9: motor C, ekonomija grada i ugovori |

## M1 · Obilazak 1 (✅ žiri ~15:45, rok bio sub 14:30)

| PR | Spojeno | Autor | Što |
| --- | --- | --- | --- |
| [#74](https://github.com/leonkreso784-bit/riihack/pull/74) | 15:09 | Leon | L4: API za stvaranje igre, ulaz kodom, sobe, profesorovo stanje |
| [#72](https://github.com/leonkreso784-bit/riihack/pull/72) | 15:07 | Simon | tema: kako Simpolis potiče učenje |
| [#71](https://github.com/leonkreso784-bit/riihack/pull/71) | 15:07 | Leon | dokumentacija za gradnju na `main` |
| [#67](https://github.com/leonkreso784-bit/riihack/pull/67) | 14:59 | Simon | pitch i obilazak: iskrenije tvrdnje, jedan kupac, tema na početku |
| [#63](https://github.com/leonkreso784-bit/riihack/pull/63) | 14:58 | Leon | ugovor: `CharacterInput.messageNo?` i `maxMessages?` (ADR-016) |
| [#66](https://github.com/leonkreso784-bit/riihack/pull/66) | 14:48 | Simon | pitch: jednostavan jezik i tko plaća |
| [#59](https://github.com/leonkreso784-bit/riihack/pull/59) | 14:45 | Leon | L2: motor A, kodovi, dodjela hotela, provjere unosa |
| [#64](https://github.com/leonkreso784-bit/riihack/pull/64) | 14:45 | Leon | L3: banka od 6 hotela |
| [#65](https://github.com/leonkreso784-bit/riihack/pull/65) | 14:45 | Rino | novi logo Simpolisa |
| [#57](https://github.com/leonkreso784-bit/riihack/pull/57) | 14:44 | Rino | R3: sobe po katovima i detalj sobe |
| [#56](https://github.com/leonkreso784-bit/riihack/pull/56) | 14:44 | Rino | R2: profesor, nova igra, kod, čekaonica za projektor |
| [#62](https://github.com/leonkreso784-bit/riihack/pull/62) | 14:44 | Leon | L1: shema baze i zajednički upiti |
| [#61](https://github.com/leonkreso784-bit/riihack/pull/61) | 14:44 | Simon | obilazak: Rinov tok demoa nakon R1 |
| [#60](https://github.com/leonkreso784-bit/riihack/pull/60) | 14:40 | Leon | revert #58 (dokumentacija se ipak vraća s #71) |
| [#54](https://github.com/leonkreso784-bit/riihack/pull/54) | 14:38 | Rino | R1: ulaz kao Kahoot i čekaonica |
| [#55](https://github.com/leonkreso784-bit/riihack/pull/55) | 14:38 | Simon | obilazak žirija: slajdovi |
| [#58](https://github.com/leonkreso784-bit/riihack/pull/58) | 14:38 | Leon | dokumentacija (vraćeno s #60) |
| [#52](https://github.com/leonkreso784-bit/riihack/pull/52) | 14:14 | Rino | fix: lažni podaci zadani, `/igra` više ne pada s 404 (BUG-003) |
| [#48](https://github.com/leonkreso784-bit/riihack/pull/48) | 14:14 | Simon | S5: karta grada, vijesti, radar |
| [#47](https://github.com/leonkreso784-bit/riihack/pull/47) | 14:14 | Simon | S6: plan kruga, financije, ponude ugovora |
| [#43](https://github.com/leonkreso784-bit/riihack/pull/43) | 14:14 | Simon | roadmap do predaje |
| [#51](https://github.com/leonkreso784-bit/riihack/pull/51) | 14:14 | Simon | obilazak žirija 1: tko što govori |
| [#53](https://github.com/leonkreso784-bit/riihack/pull/53) | 14:11 | Leon | ploča tima u `TEAM.md` |
| [#49](https://github.com/leonkreso784-bit/riihack/pull/49) | 14:04 | Rino | fix: `roundGain` u lažnoj ljestvici (BUG-001) |
| [#41](https://github.com/leonkreso784-bit/riihack/pull/41) | 13:55 | Simon | S1: AI temelj (klijent, rezerve, potpisi) |
| [#44](https://github.com/leonkreso784-bit/riihack/pull/44) | 13:55 | Simon | S2: presuda po rubrici |
| [#40](https://github.com/leonkreso784-bit/riihack/pull/40) | 13:52 | Rino | R0: ljuska, tema, komponente, klijent s lažnim podacima |
| [#45](https://github.com/leonkreso784-bit/riihack/pull/45) | 13:45 | Leon | ugovor: osoblje hotela i `roundGain` |
| [#31](https://github.com/leonkreso784-bit/riihack/pull/31) | 13:39 | Simon | plan: gamifikacija R10 i napredak kao normalizirani dobitak |
| [#35](https://github.com/leonkreso784-bit/riihack/pull/35) | 13:29 | Simon | S0: tri obećanja za žiri (`PROMISE.md`) |
| [#38](https://github.com/leonkreso784-bit/riihack/pull/38) | 13:29 | Simon | S7: nacrt pitcha |

Zatvoreni bez spajanja: #36 (duplikat L0, ADR-010), #50 (duplikat #49).

## M0 · Temelj (✅ sub 13:30)

| PR | Spojeno | Autor | Što |
| --- | --- | --- | --- |
| [#37](https://github.com/leonkreso784-bit/riihack/pull/37) | 13:29 | Leon | L0: kostur iz startera, ugovor tipova, CI |
| [#2](https://github.com/leonkreso784-bit/riihack/pull/2) | 12:25 | Rino | napomene na arhitekturu |
