# Simpolis: stanje projekta

**TL;DR**

- **Stanje na dan 26. 10. 2026.**, `main` na `b6ffb61` (oznaka `ri-hack-4.0`, verzija koja je prošla Ri-Hack 4.0).
- **Provjere su zelene:** 1030 testova u 75 datoteka, typecheck i lint bez grešaka, build prolazi, CI zelen. Testovi pokrivaju motor i logiku igre, ne stranice ni API rute.
- **Glavna nastavna petlja radi na pravom kodu:** ulaz, hotel, gost s ocjenom po rubrici, plan i financije, zatvaranje mjeseca, podij, mentor i profesorov uvid.
- **Za pilot još nije spremno:** fale brisanje podataka, potvrda e-pošte i reset lozinke, duljina sezone i vlastita baza ([Što fali za pilot](#što-fali-za-pilot)).
- **Poznate greške:** 3 otvorena issuea ([#266](https://github.com/leonkreso784-bit/riihack/issues/266), [#198](https://github.com/leonkreso784-bit/riihack/issues/198), [#110](https://github.com/leonkreso784-bit/riihack/issues/110)) i 21 zapis u [BUGS.md](records/BUGS.md), jedan srednje težine.

Ovaj dokument je poštena slika onoga što postoji, ne ono što je obećano u pitchu. Kamo dalje: [ROADMAP.md](ROADMAP.md). Kako pokrenuti i provjeriti: [RAZVOJ.md](RAZVOJ.md). Kako je sve složeno: [ARHITEKTURA.md](ARHITEKTURA.md).

Veličina koda: 26 stranica, 37 datoteka API ruta (41 handler), 19 tablica u bazi. Sadržaj: 6 hotela, 8 situacija, 6 gradskih tvrtki, 8 predložaka ugovora. Povijest: 671 commit, 236 spojenih PR-ova.

## Provjere

Izmjereno 26. 10. 2026. na `b6ffb61`, bez ikakvih varijabli okruženja.

| Provjera | Naredba | Rezultat |
| --- | --- | --- |
| Testovi | `npm test` | prolazi: 1030 testova u 75 datoteka (izmjereno na grani `simon/greske-266-239` nakon rebasea na `0695484`), 0 neuspjelih, 0 preskočenih, oko 2 s |
| Typecheck | `npm run typecheck` | prolazi, bez grešaka |
| Lint | `npm run lint` | 0 grešaka, 11 upozorenja (9 u uvezenoj datoteci iz prezentacije, 2 u `src`) |
| Build | `npm run build` | prolazi (Next.js 16.4.2); baza i prijava se inicijaliziraju tek pri radu, pa build ne treba varijable |
| CI | GitHub Actions | zelen na `b6ffb61` (typecheck, lint, test, build) |

Što ove provjere **ne** kažu:

- Testovi su čiste funkcije i testovi s lažnim ovisnostima: motor (`src/lib/engine`), logika igre (`src/lib/game`), AI sloj, Tokovi i nekoliko komponenti. Za stranice i API rute (`src/app`) nema nijednog testa.
- Logika koja piše u bazu provjerava se samo skriptom `scripts/smoke.ts` na živoj bazi. Skripte `npm run smoke` i `npm run ai:smoke` 26. 10. nisu pokretane (trebaju bazu i ključ za AI), a CI ih ne pokreće.
- Lokalno je korišten Node 22, CI koristi Node 24.
- Test botova „radi istodobno" mjeri stvarno vrijeme pa na sporom stroju može pasti ([BUG-040](#bugovi-u-bugsmd)). Prošao je 3 od 3 puta.

## Što radi

**gotovo** = radi od početka do kraja u kodu na `main`-u. **djelomično** = koristivo, ali fali navedeni dio. **planirano** = u pitchu ili dokumentima, nema radnog koda na `main`-u. „Gotovo" ne znači „spremno za pilot": to je zasebna lista niže.

Od 18 područja koja postoje u kodu, 14 je gotovo i 4 djelomično. Pet stavki je planirano.

| Područje | Stanje | Gdje u kodu | Napomena |
| --- | --- | --- | --- |
| Profesor: račun, nova igra, čekaonica s QR-om, pokretanje | djelomično | `src/lib/auth.ts`, `src/app/profesor/`, `src/app/api/worlds/route.ts` | Radi za demo. Za pilot fale potvrda e-pošte, reset lozinke i brisanje igre ([#296](https://github.com/leonkreso784-bit/riihack/issues/296), [#297](https://github.com/leonkreso784-bit/riihack/issues/297)). |
| Ulazak studenta | gotovo | `src/app/ulaz`, `src/app/cekaonica`, `src/lib/game/join.ts`, `src/lib/engine/assign.ts` | Kod igre, nadimak, hotel iz banke od 6. Kasni ulaz u igru koja je počela radi ([ADR-048](records/DECISIONS.md#adr-048)). PIN za ulazak studenta je planiran ([ADR-053](records/DECISIONS.md#adr-053), [#301](https://github.com/leonkreso784-bit/riihack/issues/301)). Prijave preko LMS-a ili AAI@EduHr nema. |
| Ploča hotela | gotovo | `src/app/igra/page.tsx`, `src/lib/game/views.ts` | Pet pokazatelja, novac, ljestvica, situacije, „Završi mjesec". Gumb šalje mjesec s ekrana, pa zastarjeli klik server odbija (409) i kartica se osvježi. |
| Situacije, razgovor s gostom, ocjena po rubrici | gotovo | `src/lib/ai/character.ts`, `src/lib/ai/judge.ts`, `src/lib/engine/quality.ts`, `src/content/situations.json` | Do 6 poruka gostu, odgovor klikom ili vlastitim tekstom. AI ocjenjuje po rubrici, brojke računa motor. U banci je samo 8 situacija. Rubrika s 3 ili 4 kriterija preračunava se na ljestvicu od 1 do 5, pa i ona može dati 5. Greške: [#110](https://github.com/leonkreso784-bit/riihack/issues/110). |
| Situacije koje piše profesor, AI prijedlog, knjižnica, playbook | gotovo | `src/app/profesor/[worldId]/situacije`, `src/app/profesor/knjiznica`, `src/lib/ai/propose.ts`, `src/lib/engine/draft.ts` | 3 do 5 kriterija po situaciji. AI prijedlog ne dolazi do studenata dok ga profesor ne pregleda i spremi ([ADR-024](records/DECISIONS.md#adr-024)). Playbook se izvozi i uvozi ([ADR-027](records/DECISIONS.md#adr-027)). |
| Pošta i ponude gradskih tvrtki | djelomično | `src/app/igra/posta`, `src/lib/game/mail.ts` | Ponuda agencije: prihvati, odbij ili jedna protuponuda; ishod računa motor, a AI piše odgovor agenta. Poruke među hotelima: obrazac „Nova poruka" i „Odgovori" u Pošti (naslov do 80 i tekst do 1.000 znakova; botovi ne primaju; granice slanja: 5 u minuti, 15 po hotelu primatelju i 60 po igri, inače 429; `src/lib/engine/mail-send.ts`, [ADR-058](records/DECISIONS.md#adr-058)). Profesorov pregled tih poruka u sučelju još nema ([#303](https://github.com/leonkreso784-bit/riihack/issues/303)). |
| Karta grada i javni podaci hotela | gotovo | `src/app/igra/grad`, `src/components/city`, `src/lib/karta.ts`, `src/lib/game/public.ts` | Izometrijski grad, kartica tvrtke (Pregled, Financije, Registar), vijesti. Tuđi novac je skriven; prihod i dobit zatvorenih mjeseci su javni. Profesorova ploča nema kartu. |
| Odjeli, osoblje i Tokovi | gotovo | `src/app/igra/osoblje`, `src/lib/tokovi` | Mjesečno ulaganje po odjelu (0 do 3.000 €), stranice koje objašnjavaju kako odgovor, mjesec i odjeli utječu na brojke, „Što ako?" za obračunat mjesec. Tok odgovora radi i za situacije zatvorenih mjeseci. Osoblje je fiksan popis, bez zapošljavanja. |
| Sobe | gotovo | `src/app/igra/sobe` | 12 do 18 soba po hotelu; stanje sobe mijenjaju situacije. Nema akcija po sobi. Kasni ulaz postavlja stanje sobe kao i otvaranje mjeseca. |
| Plan i financije | gotovo | `src/app/igra/plan`, `src/app/igra/financije`, `src/lib/finance-view.ts` | Cijena, marketing, ulaganja po odjelima, kartice Pregled i Obračun; plan se prenosi u idući mjesec. Brojke su kalibrirane prema kvarnerskim hotelima ([ADR-059](records/DECISIONS.md#adr-059)). |
| Zatvaranje mjeseca i podij | gotovo | `src/app/api/prof/[worldId]/round`, `src/lib/game/round.ts`, `src/components/prof-board.tsx` | Zatvaranje za sve hotele, botovi igraju paralelno, podij mjeseca i sezone, automatski osvrt mentora. Sezona je zasad uvijek 4 mjeseca. Zatvaranje mjeseca traži potvrdu s brojem studenata koji još igraju, a „Pokaži podij" za prošli mjesec nestaje čim netko zatvori novi. |
| Mentor | gotovo | `src/app/igra/mentor`, `src/lib/ai/mentor.ts` | Sokratsko pitanje, studentova refleksija, završni razgovor. Jedna srednja greška: [BUG-075](#bugovi-u-bugsmd). Savjet u mjesečnom osvrtu: [#302](https://github.com/leonkreso784-bit/riihack/issues/302). |
| Profesorov uvid i promjena ocjene | djelomično | `src/app/profesor/[worldId]/tvrtka`, `src/lib/game/override.ts`, `src/lib/game/grades.ts` | Svi odgovori, presude, razgovori i mentorov tekst; ocjena odgovora može se promijeniti (1 do 5). Jedina ocjena je napredak u igri. Gumb „Izvezi ocjene (CSV)" na ploči izvozi jedan redak po studentu: napredak i po situaciji ocjenu (nakon promjena), vrstu odgovora i mjesec ([#298](https://github.com/leonkreso784-bit/riihack/issues/298)). Izravnog upisa u Merlin nema. |
| Botovi (računalni hoteli) | gotovo | `src/lib/game/bots.ts` | Pravila bez AI-ja, razine Lako, Srednje, Teško ([ADR-044](records/DECISIONS.md#adr-044)). Botovi dobavljači nisu napravljeni. |
| Demo igra | gotovo | `scripts/seed-demo.ts` | `npm run seed:demo` pripremi igru s odigranim prvim mjesecom. Treba bazu. |
| Otpornost | gotovo | `src/lib/ai/client.ts`, `src/lib/ai/fallbacks.ts` | Rok 20 s za AI pozive (35 s za završni razgovor mentora, 45 s za prijedlog situacije) i rezervni odgovor; dupli odgovor, odgovor na zatvoren mjesec i dvostruki obračun odbijeni su ili idempotentni (smoke 25. 10.). Zastarjeli klik na „Završi mjesec" server odbija. Jedan neuspjeli dohvat ne zamjenjuje stranicu (Igra, Plan, Financije, čekaonica); Grad i Mentor to još rade ([#266](https://github.com/leonkreso784-bit/riihack/issues/266), stavka 3). |
| Mobitel i projektor | djelomično | `src/components/bottom-nav.tsx`, `src/components/app-frame.tsx` | Prikaz je prvo za mobitel, ploča ima projektorski raspored. Otvorene sitnice na 375 px i na velikim ekranima: BUG-077, 078, 064, 065, 055. Nisu ponovno provjerene u pregledniku 26. 10. |
| Kalibrirana ekonomija | gotovo | `src/lib/rules.ts`, `src/lib/engine/economy.ts`, `src/lib/ranking.ts`, `src/lib/game/season-sim.ts` | PDV, provizija portala, materijal, fiksni trošak i plaće po zvjezdicama, ulaganje samo uz puni ulog, klik najviše 3, marketing do 2.000 €, hotel u blokadi (račun ispod nule) ne stoji iznad solventnog, mala elastičnost potražnje ([ADR-059](records/DECISIONS.md#adr-059)). U simulaciji botova marža sezone je 14 do 20 %. Ostaje u [#198](https://github.com/leonkreso784-bit/riihack/issues/198): rezerva suca na ocjenu 3 i ponovni ulaz (#301). |
| Karta Kvarnera s pinovima | planirano | nema | Zamijenjena izometrijskim gradom, vidi dolje. |
| Ugovori i preusmjeravanje gostiju među studentima | planirano | nema | [ADR-034](records/DECISIONS.md#adr-034), vidi dolje. |
| Više jezika | planirano | nema | Sve je na hrvatskom. |
| Duljina sezone po igri | planirano | `MAX_ROUNDS` u `src/lib/rules.ts` | Zasad 4 mjeseca (lipanj do rujan), [#299](https://github.com/leonkreso784-bit/riihack/issues/299). |
| Povezivanje s Merlinom (LTI) i prijava AAI@EduHr | planirano | nema | Cilj, nije dogovoreno. |

### Što se promijenilo od PRD-a

[PRD, odjeljak 5](https://github.com/leonkreso784-bit/riihack/blob/ri-hack-4.0/docs/product/PRD.md#5-kriteriji-prihvaćanja) (uklonjen s `main`-a, čita se na oznaci `ri-hack-4.0`) bilježi stanje od 25. 10. u 02:30. Ponovno izračunato 26. 10.:

- Stavka „svaki ekran radi na 375, 768 i 1440 px" je sada **djelomično**: na 375 px ostaju BUG-077 i BUG-078.
- Dodano nakon PRD-a: stranica Mentor i financije u dvije kartice ([#285](https://github.com/leonkreso784-bit/riihack/pull/285)), automatski osvrt mentora tek nakon obračuna ([#280](https://github.com/leonkreso784-bit/riihack/pull/280), [ADR-057](records/DECISIONS.md#adr-057)).
- „Hotel šalje poruku drugom hotelu" ostaje **djelomično** (API bez sučelja). „Preusmjeravanje gostiju za proviziju" ostaje **planirano**.
- Radar vještina i simulator unaprijed na Planu su i dalje samo plan: komponenta radara postoji (`src/components/wow/skill-radar.tsx`), ali nije ni na jednom ekranu.
- Ostale stavke s oznakom „radi" potvrđene su u kodu.

## Poznate greške

### Otvoreni issueovi

| Issue | O čemu se radi |
| --- | --- |
| [#266](https://github.com/leonkreso784-bit/riihack/issues/266) | Ostatak noćnog pregleda prije žirija. Otvoreno: jedan neuspjeli dohvat još zamjenjuje stranicu na Gradu i Mentoru (stavka 3). Ostale stavke su popravljene; stavku 5 (rubrika s 3 ili 4 kriterija) riješio je preračun kvalitete po udjelu ispunjenih kriterija. |
| [#198](https://github.com/leonkreso784-bit/riihack/issues/198) | Balans ekonomije: ulaganje, klik, marketing, stečaj, troškovi i elastičnost riješeni su u [ADR-059](records/DECISIONS.md#adr-059). Ostaje: kad AI sudac padne, svaki vlastiti tekst dobije 3, i preuzimanje hotela ponovnim ulazom ([#301](https://github.com/leonkreso784-bit/riihack/issues/301)). |
| [#110](https://github.com/leonkreso784-bit/riihack/issues/110) | Šest složenih kriterija u banci situacija čini suca prestrogim; tekstovi u `src/content/situations.json` nisu promijenjeni. |

### Bugovi u BUGS.md

Od 78 zapisa u [BUGS.md](records/BUGS.md) 21 nije označen kao riješen: 18 otvorenih i 3 u radu. Stanje je provjereno u kodu 26. 10.; za izgled i raspored na ekranu piše „prijavljeno", jer ih bez preglednika nismo mogli ponoviti.

| ID | Težina | Opis | Stanje 26. 10. |
| --- | --- | --- | --- |
| [BUG-075](records/BUGS.md#bug-075--mentorov-odgovor-na-refleksiju-napisanu-prije-obračuna-citira-privremene-brojke) | srednji | Mentorov odgovor na refleksiju napisanu prije obračuna citira privremene brojke. | otvoren |
| [BUG-076](records/BUGS.md#bug-076--igramentor-dok-se-učitava-piše-smišlja-pitanje) | nizak | `/igra/mentor` dok se učitava piše „smišlja pitanje". | otvoren |
| [BUG-077](records/BUGS.md#bug-077--financije--obračun-na-375-px-odreže-zadnji-stupac) | nizak | Financije, Obračun: na 375 px zadnji stupac je odrezan. | prijavljeno |
| [BUG-078](records/BUGS.md#bug-078--na-igra-375-px-prozirno-zaglavlje-preklapa-završi-mjesec) | nizak | `/igra` na 375 px: prozirno zaglavlje preklapa „Završi mjesec". | prijavljeno |
| [BUG-069](records/BUGS.md#bug-069--istekla-ponuda-u-pošti-ostaje-nepročitana-bez-oznake-isteka) | nizak | Istekla ponuda u Pošti ostaje „nepročitana" bez oznake isteka. | otvoren |
| [BUG-067](records/BUGS.md#bug-067--lokalni-smoke-ostavio-5-testnih-igara-u-zajedničkoj-bazi) | nizak | Lokalni smoke ostavio je 5 testnih igara u zajedničkoj bazi. | čišćenje u tijeku, nije provjereno |
| [BUG-066](records/BUGS.md#bug-066--javni-pogled-hotela-za-bota-pokazuje-referentnu-cijenu-do-zatvaranja-mjeseca) | nizak | Javni pogled na bota pokazuje referentnu cijenu do zatvaranja mjeseca. | otvoren |
| [BUG-065](records/BUGS.md#bug-065--na-2560-px-ploča-ostaje-1600-px-a-fontovi-nemaju-2xl-stupanj) | nizak | Na 2560 px ploča ostaje 1600 px, fontovi nemaju `2xl` stupanj. | otvoren |
| [BUG-064](records/BUGS.md#bug-064--zaglavlje-ploče-profesora-ostaje-1152-px-a-ploča-1600-px) | nizak | Zaglavlje ploče profesora ostaje 1152 px, a ploča 1600 px. | otvoren |
| [BUG-062](records/BUGS.md#bug-062--sitnice-sučelja-prazan-panel-odgovor-u-tokovima-natpisi-na-karti-stari-url-situacije) | nizak | Sitnice sučelja: prazan panel „Odgovor" u Tokovima, natpisi na karti, poruka za stari URL situacije. | djelomično provjereno |
| [BUG-061](records/BUGS.md#bug-061--sitni-tekstovi-fiksni-mjesec-u-situaciji-i-ai-prijedlogu-padeži-i-množina) | nizak | Sitni tekstovi situacija. Fiksni mjesec je uklonjen; ostaje „hotel {hotel}" i zadnji obračunati mjesec u AI prijedlogu. | uglavnom riješeno |
| [BUG-056](records/BUGS.md#bug-056--ponovni-uvoz-playbooka-javlja-uvezeno-5-situacija-iako-nije-dodana-nijedna) | nizak | Ponovni uvoz playbooka javlja „Uvezeno 5" iako nije dodana nijedna situacija. | otvoren |
| [BUG-055](records/BUGS.md#bug-055--sitnice-prikaza-na-projektoru-završi-sezonu-podij-na-2560-px-kartice-botova) | nizak | Projektor: „Završi sezonu" sama u retku, podij na 2560 px, kartice botova. | otvoren |
| [BUG-050](records/BUGS.md#bug-050--lik-oslovljava-studenticu-s-gospodine) | nizak | Lik oslovljava studenticu s „Gospodine" (prompt nema rodno neutralno pravilo). | otvoren |
| [BUG-048](records/BUGS.md#bug-048--kartica-agencije-u-pošti-prikazuje-i-praonicu-i-zaštitare) | nizak | Kartica „Agencije" u Pošti prikazuje i praonicu i zaštitare. | vjerojatno otvoren |
| [BUG-044](records/BUGS.md#bug-044--igrasobe-podnaslov-ne-broji-sobu-na-čišćenju-množina-kriva) | nizak | `/igra/sobe`: podnaslov ne broji sobe na čišćenju, kriva množina. | otvoren |
| [BUG-040](records/BUGS.md#bug-040--test-botova-radi-istodobno-ovisi-o-brzini-stroja) | nizak | Test botova „radi istodobno" ovisi o brzini stroja. | otvoren, 26. 10. prošao 3 od 3 |
| [BUG-035](records/BUGS.md#bug-035--botovi-bot-dvaput-moje-igre-ih-broji-kao-studente) | nizak | Botovi: „(bot)" piše dvaput. Broj studenata u „Moje igre" bez botova je popravljen ([#255](https://github.com/leonkreso784-bit/riihack/pull/255)). | djelomično |
| [BUG-031](records/BUGS.md#bug-031--ploča-profesora-nakon-pokretanja-opet-nema-kod-igre) | nizak | Nakon pokretanja ploča profesora ne prikazuje kod igre. | prihvaćeno ([ADR-051](records/DECISIONS.md#adr-051)) |
| [BUG-028](records/BUGS.md#bug-028--mentor-je-spor-ili-ne-odgovori) | visok u trenutku prijave | Mentor je spor. Rok od 20 s i jedan ponovni pokušaj; na API-ju 2 do 5 s. Provjera u pregledniku nije zabilježena. | ublaženo |
| [BUG-006](records/BUGS.md#bug-006--dbpush-predlaže-pražnjenje-tablica-situations-i-contracts) | kritičan (alat) | `drizzle-kit push` predlaže pražnjenje tablica na zajedničkoj bazi. | zaobiđeno pravilom ([ADR-026](records/DECISIONS.md#adr-026)), alat nije popravljen |

Pouka iz pitcha ([BUG-079](records/BUGS.md#bug-079--vercel-challenge-403-za-automatske-zahtjeve-s-našeg-ip-a-prije-pitcha)): Vercelova zaštita je neposredno prije pitcha vraćala 403 na automatske zahtjeve s mreže demonstracije, jer su istodobno radili monitor i agenti. Smoke i monitore ne pokretati prema produkcijskom linku s mreže na kojoj se održava demonstracija.

## Što fali za pilot

Pilot na FMTU-u (Opatija) je plan tima. Popis što još treba vodi se u GitHub Issues: milestone [Pilot FMTU](https://github.com/leonkreso784-bit/riihack/milestone/6) drži devet otvorenih issueova ([svi milestoneovi](https://github.com/leonkreso784-bit/riihack/milestones)), a izvan milestonea su [#302](https://github.com/leonkreso784-bit/riihack/issues/302) i [#303](https://github.com/leonkreso784-bit/riihack/issues/303). Issueovi s oznakom `pilot` su i [popis po oznaci](https://github.com/leonkreso784-bit/riihack/issues?q=is%3Aopen+label%3Apilot).

### Prije prvih pravih studenata

| Što | Zašto | Issue |
| --- | --- | --- |
| Popraviti greške koje pogađaju svaki razred | Neuspjeli dohvat na Gradu i Mentoru zamjenjuje cijelu stranicu porukom o grešci. | [#266](https://github.com/leonkreso784-bit/riihack/issues/266) |
| Ponovno posijati demo nakon kalibracije | Ekonomija je kalibrirana ([ADR-059](records/DECISIONS.md#adr-059)), pa sve brojke igre vrijede drukčije nego u starom demu. Treba `npm run seed:demo` i jedan smoke na vlastitoj bazi; pokus s pravim razredom tek slijedi. | [#198](https://github.com/leonkreso784-bit/riihack/issues/198) |
| Brisanje igre i podataka studenata | Nema načina da profesor obriše igru ni studenta; to radi samo developerova skripta (`scripts/cleanup-test-data.ts`). Treba i izjava o čuvanju podataka. Slobodni tekst studenta obrađuje AI pružatelj (Anthropic), a podaci su u Neon bazi (Frankfurt); to treba navesti fakultetu. Podjelu uloga (fakultet kao voditelj obrade, tim kao izvršitelj) tek treba dogovoriti. | [#297](https://github.com/leonkreso784-bit/riihack/issues/297) |
| Profesorski račun: potvrda e-pošte i reset lozinke | Račun ima samo e-poštu i lozinku. Treba i način da fakultet upravlja računima svojih profesora. | [#296](https://github.com/leonkreso784-bit/riihack/issues/296) |
| Izvoz ocjena | CSV izvoz je napravljen ([#298](https://github.com/leonkreso784-bit/riihack/issues/298)). Treba još potvrditi s fakultetom je li CSV dovoljan ili traži upis izravno u Merlin (LTI, nije dogovoren). | [#298](https://github.com/leonkreso784-bit/riihack/issues/298) |
| Duljina sezone | Kolegij traje semestar (13 do 15 tjedana), a igra ima fiksna 4 mjeseca (`MAX_ROUNDS`, 7 datoteka). Ideja tjednih krugova je u [ROADMAP.md](ROADMAP.md#ideje-bez-datuma). | [#299](https://github.com/leonkreso784-bit/riihack/issues/299) |
| Vlastita baza i migracije | Nema mape s migracijama; promjene sheme bile su ručni SQL na jednoj zajedničkoj bazi ([ADR-026](records/DECISIONS.md#adr-026)). `npm run db:push` je siguran samo na praznoj osobnoj bazi. Pilot treba svoju bazu (Neon grana) i migracije u repou. | [#300](https://github.com/leonkreso784-bit/riihack/issues/300) |
| `NEXT_PUBLIC_USE_MOCK=0` na svakom okruženju | Zadano je lažni način: dok varijabla nije točno `0`, sučelje radi na lažnim podacima. Predlaže se okrenuti zadanu vrijednost. Nema issuea. | nema |
| Ulazak studenta s PIN-om | PIN za ulazak studenta je planiran ([ADR-053](records/DECISIONS.md#adr-053)). | [#301](https://github.com/leonkreso784-bit/riihack/issues/301) |

### Zatim

| Što | Zašto | Issue |
| --- | --- | --- |
| Veća banka sadržaja | Samo 8 situacija, sve o hotelima. Za semestar treba više situacija ili profesori koji pišu svoje. Popraviti rubrike i BUG-050. | [#110](https://github.com/leonkreso784-bit/riihack/issues/110), [#266](https://github.com/leonkreso784-bit/riihack/issues/266) |
| Mentor | BUG-075 (privremene brojke) i odluka smije li mjesečni osvrt davati konkretan savjet, kad je načelo igre da mentor ne daje odgovore. | [#302](https://github.com/leonkreso784-bit/riihack/issues/302) |
| Mobitel i projektor | BUG-077, 078, 064, 065, 055. | [#266](https://github.com/leonkreso784-bit/riihack/issues/266) |
| Pošta među hotelima u sučelju | Obrazac „Nova poruka" postoji, fali profesorov pregled poruka (API već postoji). Uz to BUG-066, 069 i 048. | [#303](https://github.com/leonkreso784-bit/riihack/issues/303) |
| Integracijski testovi | Stranice i API rute nemaju testova, a CI ne pokreće smoke. Greške poput #266 (zastarjeli poziv, nepostavljeno stanje sobe) zato prolaze zeleni CI. Predlaže se testna baza u CI-ju. | nema |

## Što nije izgrađeno

Ovo je u pitchu ili dokumentima, ali na `main`-u nema radnog koda.

| Što | Stanje | Detalji |
| --- | --- | --- |
| Karta Kvarnera s pinovima | nije izgrađena, zamijenjena | Odluka ([zatvoreni issue #125](https://github.com/leonkreso784-bit/riihack/issues/125)): igra je izometrijska društvena igra, ne prava karta. Izgrađen je izometrijski grad `/igra/grad`. Predlošci hotela zadržavaju stvarna mjesta (Rijeka, Opatija, Omišalj, Mali Lošinj, Crikvenica, Rab). Zemljopisna karta nije u rasporedu. |
| Ugovori i preusmjeravanje gostiju među studentima | nema koda | [ADR-034](records/DECISIONS.md#adr-034), zadatak L19 u [planu vala 3](hackathon/plans/2026-10-24-simpolis-val-3.md). Ugovori postoje samo između hotela i gradskih tvrtki (agencija, praonica, pekara, zaštita, vinarija). Preuzimanje gostiju ili osoblja među igračima postoji samo kao ideja u viziji, bez odluke i koda. |
| Više jezika | nema koda | Nema biblioteke za i18n; tekstovi su u oko 80 komponenti, a AI promptovi, rubrike i banka situacija su na hrvatskom. Dodavanje jezika znači izvući tekstove i prevesti sadržaj. |
| Profesorov pregled poruka među hotelima | samo API | `GET /api/prof/[worldId]/mail` radi, sučelje ga ne zove ([#303](https://github.com/leonkreso784-bit/riihack/issues/303)). |
| Botovi dobavljači, druge vrste tvrtki, banka, porezi, više gradova | nema koda | [ROADMAP.md, faza 5](ROADMAP.md#faze), [ADR-044](records/DECISIONS.md#adr-044). |
| Profesor podešava mehaniku igre | nema koda | Profesor mijenja samo sadržaj (playbook), ne sezonu, potražnju ni cijene ([ADR-027](records/DECISIONS.md#adr-027)). |
| Radar vještina, simulator unaprijed, značke iz rubrika, replay sezone | nema ekrana | Komponenta radara postoji s lažnim podacima, ali nije ni na jednom ekranu. |
| Usporedba s prošlim mjesecom na Planu | nema | Bila je dio rada na zadatku S13; njega su većinom nadomjestile financije iz [#142](https://github.com/leonkreso784-bit/riihack/pull/142) i [#285](https://github.com/leonkreso784-bit/riihack/pull/285). |
| Merlin (LTI), prijava AAI@EduHr | cilj, nije dogovoreno | Smjer, ne dogovor sa SRCE-om. |

## Izvori i održavanje

- Stanje po stavkama: [BUGS.md](records/BUGS.md), [DECISIONS.md](records/DECISIONS.md), [CHANGELOG.md](records/CHANGELOG.md), [ROADMAP.md](ROADMAP.md#ideje-bez-datuma). Prvotni kriteriji prihvaćanja (PRD): [oznaka ri-hack-4.0](https://github.com/leonkreso784-bit/riihack/blob/ri-hack-4.0/docs/product/PRD.md#5-kriteriji-prihvaćanja).
- Povijest nastanka i dnevnik hackathona: [hackathon/](hackathon/README.md). Čišćenje repozitorija i dokumentacije prati se u [#294](https://github.com/leonkreso784-bit/riihack/issues/294).
- Ovaj dokument se ažurira kad se spoji PR koji mijenja stanje neke stavke ili zatvori issue s popisa. Datum na vrhu mora odgovarati zadnjoj provjeri.
