# Roadmap: kamo Simpolis ide nakon hackathona

**TL;DR**

- Simpolis nastavljamo kao startup: prvo besplatni pilot na FMTU Opatija, zatim plaćene licence za fakultete, obuka u hotelima i tvrtkama, a kasnije multiplayer grad u kojem studenti sklapaju ugovore jedni s drugima.
- Redoslijed: **0** popravci i pilot spremnost (sada do prosinca 2026.), **1** prijava u Startup inkubator Rijeka (rok 16. 11. 2026.), **2** pilot na FMTU (ljetni semestar 2027.), zatim faze **3 do 5** bez datuma.
- Jedini čvrsti datum je rok prijave u inkubator, 16. 11. 2026.
- Sve ostalo je **cilj**, ne dogovor: u trenutku pitcha (25. 10. 2026.) nismo imali razgovor, pismo namjere ni potvrđenu cijenu ni s jednim fakultetom ili hotelskom kućom, a suradnja sa SRCE-om nije dogovorena. Ciljana cijena je od 10 € po studentu godišnje; AI košta oko 0,07 $ po studentu za cijelu sezonu.
- Popis što treba za pilot vodi se u GitHub Issues, u milestoneu [Pilot FMTU](https://github.com/leonkreso784-bit/riihack/milestone/6) ([svi milestoneovi](https://github.com/leonkreso784-bit/riihack/milestones)). Što radi i što ne radi danas: [STATUS.md](STATUS.md).

Stanje na dan 26. 10. 2026. Riječ **cilj** znači: želimo to, ali još nije dogovoreno ni s kim.

## Vizija

Simpolis je svijet simulacija za učenje: svaki student vodi svoju tvrtku u zajedničkom gradu, AI glumi ljude i sudi po rubrici, a brojke uvijek računaju pravila igre ([ADR-002](records/DECISIONS.md#adr-002)). Danas je to hotel, sutra isti motor s drugim paketom sadržaja za druge struke, a poslije više gradova i cijela država. Cilj je da svaki student vježba odluke s ljudima prije prakse, na hrvatskom i u sustavu svog fakulteta.

## Faze

| Faza | Vrijeme | Cilj | Što treba napraviti | Gotovo kad |
| --- | --- | --- | --- | --- |
| **0. Popravci i pilot spremnost** | sada do prosinca 2026. | Pravi razred može odigrati cijelu sezonu bez našeg ručnog zahvata. | Popis issueova u milestoneu Pilot FMTU, vidi [Faza 0 u detalje](#faza-0-u-detalje); plus veća banka situacija | Svi issueovi iz milestonea Pilot FMTU su zatvoreni; testovi, typecheck, lint i build su zeleni; probna cijela sezona prođe bez ručnog zahvata u bazi |
| **1. Prijava u Startup inkubator Rijeka** | prijave do 16. 11. 2026.; program od siječnja 2027. | Ući u 18. generaciju inkubatora (šest mjeseci programa). | Poslati mrežnu prijavnicu (ovaj roadmap je osnova za opis proizvoda, tržišta i plana); pripremiti razgovor i pitch uživo pred komisijom | Prijava je poslana prije roka. Ulazak odlučuje komisija, ne mi |
| **2. Pilot FMTU** | razgovor zimi 2026.; pilot u ljetnom semestru 2027. | Besplatan pilot u jednom postojećem kolegiju. | Razgovor s jednim kolegijem i jednom hotelskom kućom; pismo namjere; ugovor o obradi podataka; dovršena faza 0; mjerenje tijekom pilota | Pilot je odigran do kraja semestra, a izmjereno je: koliko sati troši profesor, koliko studenata igra do kraja i što bi hotelska kuća platila |
| **3. Prvi plaćeni fakulteti** | nakon pilota, bez datuma | Prva licenca za fakultet: svi kolegiji, po semestru ili godini. | Ulaz iz Merlina (LTI) i prijava AAI@EduHr računom; situacije iz gradiva kolegija; profesor podešava mehaniku igre; veća banka situacija; paket sadržaja za drugu struku (koncept „Isti motor" iz pitcha); engleski jezik ako zatreba | Jedan fakultet plaća licencu po ciljanoj ili korigiranoj cijeni |
| **4. Hoteli i tvrtke** | nakon prve licence, bez datuma | Tvrtke partneri donose stvarne situacije, daju put do prakse i sufinanciraju; kasnije obuka novih zaposlenika. | Paket situacija prema poslovanju tvrtke; kalibracija troškova prema stvarnim brojkama; pravila o podacima polaznika | Jedna tvrtka koristi Simpolis ili sufinancira scenarij |
| **5. Multiplayer grad** | kasnije, bez datuma | Studenti međusobno utječu na grad, a ne samo na gradske tvrtke. | Ugovori između studenata ([ADR-034](records/DECISIONS.md#adr-034)); druge vrste tvrtki (turistička agencija, dobavljač, zaštitarska firma); botovi dobavljači; banka i krediti, porezi i općina; više gradova i država; javno predvorje u kojem svi ostali igraju besplatno | Studenti jednog razreda sklapaju ugovore jedni s drugima, a u gradu žive barem dvije vrste tvrtki |

Faze 3 do 5 nemaju datume namjerno: ovise o tome što pilot pokaže. Ideje koje nisu ni u jednoj fazi (tjedni krug, radar vještina, simulator unaprijed, karta na profesorovoj ploči, značke) su u odjeljku [Ideje bez datuma](#ideje-bez-datuma).

### Faza 0 u detalje

Milestone [Pilot FMTU](https://github.com/leonkreso784-bit/riihack/milestone/6) drži deset otvorenih issueova ([svi milestoneovi](https://github.com/leonkreso784-bit/riihack/milestones)). Popis u GitHub Issues je izvor istine: ovdje je samo pregled.

| Issue | Što | Zašto je potrebno za pilot |
| --- | --- | --- |
| [#266](https://github.com/leonkreso784-bit/riihack/issues/266) | Nalazi noćnog pregleda koji nisu popravljeni (zastarjeli „Završi mjesec", rubrike s 3 kriterija, sitnice) | Ispravnost svakog razreda |
| [#239](https://github.com/leonkreso784-bit/riihack/issues/239) | Tok odgovora za zatvorene mjesece | Student može pregledati svoje prošle odgovore |
| [#198](https://github.com/leonkreso784-bit/riihack/issues/198) | Balans ekonomije: kalibracija, ulaganja, klik, marketing, stečaj i elastičnost su u [ADR-059](records/DECISIONS.md#adr-059); ostaje rezerva suca na ocjenu 3 kad AI padne | Pošteno ocjenjivanje kad AI nije dostupan |
| [#110](https://github.com/leonkreso784-bit/riihack/issues/110) | Rubrike situacija: spojeni kriteriji čine suca prestrogim | Pošteno ocjenjivanje |
| [#299](https://github.com/leonkreso784-bit/riihack/issues/299) | Duljina sezone po igri (sada fiksno 4 mjeseca) | Kolegij traje semestar, 13 do 15 tjedana |
| [#297](https://github.com/leonkreso784-bit/riihack/issues/297) | Brisanje igre i podataka studenata | Fakultet je voditelj obrade podataka |
| [#296](https://github.com/leonkreso784-bit/riihack/issues/296) | Profesor: potvrda e-maila i reset lozinke | Računi profesora za stvarnu upotrebu |
| [#298](https://github.com/leonkreso784-bit/riihack/issues/298) | Izvoz ocjena za profesora (CSV) | Profesor mora imati što upisati u svoju evidenciju |
| [#301](https://github.com/leonkreso784-bit/riihack/issues/301) | PIN za ulazak studenta ([ADR-053](records/DECISIONS.md#adr-053)) | Planirano odlukom ADR-053 |
| [#300](https://github.com/leonkreso784-bit/riihack/issues/300) | Migracije baze i zasebna baza za pilot | Pilot ne dijeli bazu s demom |

Uz pilot, ali izvan milestonea: [#302](https://github.com/leonkreso784-bit/riihack/issues/302) (mentorov mjesečni osvrt: savjet ili pitanje) i [#303](https://github.com/leonkreso784-bit/riihack/issues/303) (obrazac za poštu među hotelima; API postoji, sučelja nema). Čišćenje repozitorija i dokumentacije prati se u [#294](https://github.com/leonkreso784-bit/riihack/issues/294). Ikona za iOS čeka u [PR-u #295](https://github.com/leonkreso784-bit/riihack/pull/295).

Još bez issuea: veća banka situacija (sada ih je 8, sve hotelske) i sitni bugovi izgleda na mobitelu i projektoru iz [records/BUGS.md](records/BUGS.md).

### Faza 1: činjenice o inkubatoru

- Program: Startup inkubator Rijeka (RiHub), 18. generacija. Traje šest mjeseci od siječnja 2027., u dva modula, s radionicama, mentorima i radnim prostorom u RiHubu. Najboljim timovima na Demo danu potporu daje Grad Rijeka.
- Prijava: mrežna prijavnica na <https://startup.rijeka.hr/>, samostalno ili u timu, **do 16. 11. 2026.**
- Uvjet: prijaviti se mogu punoljetni državljani Republike Hrvatske koji u trenutku prijave nemaju registriran poslovni subjekt. Prije prijave provjeriti da svi članovi tima to zadovoljavaju.
- Odabir: evaluacija prijava, zatim razgovor i pitch uživo pred komisijom. Kriteriji su inovativnost i tržišni potencijal, razrađenost projekta te motivacija, kompetencije i spremnost tima.
- Izvor: [obavijest Grada Rijeke od 23. 9. 2026.](https://www.rijeka.hr/otvorene-prijave-za-18-generaciju-startup-inkubatora-rijeka/). Prijava ne jamči prijem, pa faze 2 do 5 ne smiju ovisiti o njemu.

## Ideje bez datuma

Ideje koje nisu ni u jednoj fazi ni u milestoneu. Nijedna nije obećana.

- **Tjedni krug** (ideja od 24. 10., vezana uz [#299](https://github.com/leonkreso784-bit/riihack/issues/299)): profesor bira tjedni ili mjesečni krug. Tjedna igra traje 17 tjedana (lipanj do rujan), svaki tjedan barem jedna situacija. Poznati zahtjevi: broj krugova kao podatak igre umjesto `MAX_ROUNDS`, tjedna krivulja potražnje, troškovi i kapacitet skalirani sa 7/30, trajanje ugovora u tjednima, jedna situacija po tjednu, oznake poput „Tjedan 7 · srpanj".
- **Prikaz i ocjenjivanje:** radar vještina i simulator unaprijed na Planu (komponenta radara postoji, ali nije ni na jednom ekranu), značke iz kriterija rubrike (npr. „Smirivač gostiju"), replay sezone.
- **Karta i vijesti grada na profesorovoj ploči:** danas ih vide samo studenti (`/igra/grad`).
- **Šok gumb, novine i glas:** ideje iz backloga hackathona, još bez opisa i bez odluke.
- **Izvan opsega:** mobilna aplikacija (web je responzivan); računi i lozinke za studente ([ADR-004](records/DECISIONS.md#adr-004)); AI koji sam šalje situacije studentima (AI samo predlaže, profesor sprema, [ADR-024](records/DECISIONS.md#adr-024)).

## Poslovni model

Brojke su iz pitcha. Cijenu još nismo provjerili ni s jednim fakultetom.

| Tko | Uloga u modelu |
| --- | --- |
| **Fakultet** | plaća licencu za cijeli fakultet: svi kolegiji, po semestru ili godini; od 10 € po studentu godišnje (ciljana cijena) |
| **Tvrtka partner** | donosi stvarne situacije, otvara put do prakse i sufinancira |
| **Svi ostali** | igraju besplatno, u zasebnom predvorju |

- **Pilot je besplatan.**
- **Računski primjer:** fakultet veličine FMTU-a (oko 1.250 studenata u 2023./24., izvor DZS) uz 10 € po studentu godišnje je oko 12.500 € godišnje. To je gornja granica ako licenca pokrije sve studente, ne prognoza.
- **Naš trošak:** AI oko 0,07 $ po studentu za cijelu sezonu (razred od 30: 2 do 4 $, procjena), oko 1 $ ukupno po studentu godišnje.
- **Usporedba:** slični simulatori naplaćuju 11 do 139 $ po studentu za jedan kolegij.
- **Kod:** javno je vidljiv samo za pregled i portfelj. Sva prava pridržana, autorska prava dijele Leon Kreso, Rino Tomić i Simon Seifert.

## Integracije i usklađenost

| Tema | Cilj | Danas | Sljedeći korak |
| --- | --- | --- | --- |
| **Merlin (LTI)** | Igra se otvara iz Merlina. | Nema integracije; student ulazi kodom igre. | Prvo izvoz ocjena u CSV ([#298](https://github.com/leonkreso784-bit/riihack/issues/298)), zatim LTI. Traži suradnju sa SRCE-om. |
| **AAI@EduHr** | Student ulazi računom svog fakulteta, bez kodova i lozinki. | Student ulazi kodom igre i nadimkom; profesor e-mailom i lozinkom. | Isto kao Merlin. Suradnja sa SRCE-om **još nije dogovorena**, tražimo je. |
| **GDPR** | Fakultet je voditelj obrade, mi smo izvršitelj uz ugovor o obradi. | Baza je u EU (Frankfurt); u pilotu samo nadimci, bez e-maila studenata. Tekst odgovora ide Anthropicu u SAD uz standardne ugovorne klauzule. Prema podacima pružatelja Anthropic ne trenira na API podacima (provjeriti u ugovoru); obrada isključivo u EU je otvoreno pitanje (vidi pitanje 11). | Brisanje igre i studenata ([#297](https://github.com/leonkreso784-bit/riihack/issues/297)), izjava o čuvanju podataka, ugovor o obradi s fakultetom. |
| **EU AI Act** | Biti spremni prije nego što obveze počnu. | Po našoj procjeni iz pitcha AI koji ocjenjuje učenje je visokog rizika od 2. 12. 2027. Već imamo: bodove računaju pravila, a ne AI; profesor vidi obrazloženje i može promijeniti ocjenu. | Prije prve plaćene licence provjeriti obveze i datum s pravnikom. |

## Otvorena pitanja

1. **Cijena:** hoće li fakultet prihvatiti 10 € po studentu godišnje, ili traži paušal po fakultetu ili kolegiju? Nitko je nije potvrdio.
2. **Pilot:** koji kolegij na FMTU-u i tko ga vodi? Još nema razgovora ni pisma namjere.
3. **Hotelska kuća:** koja će biti prva partnerska tvrtka i što točno donosi (situacije, mentora, novac)? Nijednu još nismo pitali.
4. **SRCE:** tko je kontakt i što je potrebno za Merlin (LTI) i AAI@EduHr? Koliko to traje?
5. **Sezona:** ostaje li mjesečni krug i 4 mjeseca, ili idemo na tjedne krugove tijekom semestra ([#299](https://github.com/leonkreso784-bit/riihack/issues/299))?
6. **Ocjena:** je li CSV dovoljan za pilot, ili fakultet traži upis ocjene izravno u Merlin? Tko je odgovoran za ocjenu, profesor ili sustav?
7. **Mentor:** daje li mjesečni osvrt konkretan savjet ili samo postavlja pitanje ([#302](https://github.com/leonkreso784-bit/riihack/issues/302))? Načelo igre je da mentor ne daje gotove odgovore.
8. **Pravni subjekt:** tko potpisuje ugovor o obradi podataka i izdaje račune fakultetima? Treba riješiti prije prve licence. Poziv inkubatora traži da prijavitelji u trenutku prijave nemaju registriran poslovni subjekt, pa se tvrtka ne može osnovati prije prijave.
9. **Jezik:** kada engleski, i za koga? Sada su sav sadržaj, rubrike i AI upute na hrvatskom.
10. **AI Act:** vrijedi li datum 2. 12. 2027. i što točno traži od nas?
11. **Podaci u SAD-u:** treba li nam obrada samo u EU već za prvog fakulteta?

## Vidi i

- [STATUS.md](STATUS.md): što radi i što ne radi danas, poznati bugovi.
- [records/DECISIONS.md](records/DECISIONS.md): zašto je nešto tako napravljeno.
- [hackathon/PREDAJA.md](hackathon/PREDAJA.md): što smo predali na hackathonu.
