# Pitch Simpolis, nacrt 8 (ned 25.10., 10:45): promo na kraju, sa zvukom

**TL;DR**
- **Odluka (Simon, 09:30): opcija A.** Leonov promo (56 s) je završnica, pušta se sa zvukom, nitko ne govori preko njega. Zadnji kadar („AI ne daje odgovore. AI glumi svijet u kojem moraš sam odlučiti.") ostaje na ekranu dok čekamo pitanja.
- **Redoslijed (09:55):** Leon (problem, Ana) → Simon (rješenje, ime, tema, tim) → Leon (kako radi, tehnika) → Rino (demo uživo, 1 igrač i 9 botova) → Simon (tko plaća, zahtjev, povratak na Anu) → promo.
- **Vrijeme za 5 min:** govor i demo do 3:45, promo 3:45 do 4:41, 19 s rezerve. Ako je 9 min, dodaci su u zadnjem odjeljku.
- **Deck:** `simpolis-pitch-share/index-v8.html` (u izradi): slajd 8 je promo sa zvukom, slajd 9 kratki kraj (19 s) kao rezerva kad kasnimo.
- **Iz v7 vrijedi bez promjene:** Rinov demo po koracima (osim satnice niže), rezerve dema, priprema demo igre, popis „Što se ne govori". Ovdje su samo promjene.

## Bodovi (ocjenjivanje): gdje ih skupljamo

| Kategorija | Max | Gdje u pitchu |
| --- | --- | --- |
| **Tema** (jedna ocjena × 7) | 35 | Simon imenuje sva četiri elementa teme i obeća da će ih Rino pokazati; Rino svaki korak dema počne imenom elementa (elementi igre, personalizirani sadržaj, interaktivni izazov, praćenje napretka); pravilo 4 od 5 i „AI ne daje odgovore" na kraju videa |
| **Prezentacija** | 25 | koherentna (Ana na početku i na kraju), koncizna (pod 5 min), sve informacije (problem, rješenje, kako radi, tko plaća, zahtjev), dobar demo uživo, sva trojica govore |
| **Tehnika** | 25 | složenost i „puno napravljeno": 200+ PR-ova, 550+ testova u 24 sata; moderne tehnologije na slajdu (Next.js, Claude, Postgres, Vercel); UI/UX: radi u pregledniku, na mobitelu i laptopu, a demo to pokazuje; sigurnost: 37 API ruta (ASEE) |
| **Wow** | 15 | demo s 9 botova i zatvaranjem mjeseca uživo, Tokovi objašnjavaju svaku brojku, promo sa zvukom kao završnica |

## Zašto ovako (Simonove prošle pitcheve smo pročitali)

Iz Ardena (Ideja godine 3., Demo Day 2. i 7.000 €, Laqothon finale) i Simonovog predavanja 2026, pravila koja ovdje primjenjujemo:
1. **Bez „Dobar dan, mi smo…".** Prva rečenica je priča o osobi (Ana), kao biljka i mama u Ardenu.
2. **Tim u jednom dahu, s „underdog" rečenicom**, kao „umjesto da smo učili za maturu": „i sve ovo smo napravili u 24 sata."
3. **Pokaži prije nego objasniš:** demo je u sredini, a video na kraju pokazuje cijelu sezonu.
4. **Brojke zamrznute jednom** (Arden je imao 5 / 10 / 15 testera): preko 550 testova, 37 API ruta, 7 centi, 17 %.
5. **Povratak na početnu priču na kraju**, kao „da ne plaču biljke, da ne viče mama".
6. **Zahtjev koji soba može ispuniti:** „prvi razgovor može biti danas", ne zahvala.

## Satnica za 5 minuta (Leon otvara, 09:55)

| Sat | Tko | Slajd / ekran | Teme |
| --- | --- | --- | --- |
| 0:00 do 0:27 | **Leon** | 2 · Ana, 17 % | Ana; ljuti gost (i galeb) tek na praksi, u zadnjem semestru; do tada teorija i gotovi AI odgovori; 17 % lošije |
| 0:27 do 0:55 | **Simon** | 3 · Sims + ime, 4 · Tema | Simpolis = Sims za pravi posao; simulacija + polis; četiri elementa teme, Rino ih pokazuje; tim u jednom dahu |
| 0:55 do 1:28 | **Leon** | 5 · Tehnika (+ Leonovi klipovi) | AI glumi, sudac označi, pravila računaju; 4 od 5 vs 5; 200+ PR-ova, 550+ testova, 37 API ruta; preglednik, mobitel i laptop |
| 1:28 do 3:12 | **Rino** | aplikacija | demo, svaki korak počinje imenom elementa teme |
| 3:12 do 3:50 | **Simon** | 6 · Tko plaća, 7 · Tražimo | licenca za cijeli fakultet, partner tvrtka, besplatno predvorje; od 10 € po studentu godišnje naspram oko 1 $ troška; pilot; povratak na Anu |
| 3:50 do 4:46 | promo | 8 · video sa zvukom | nitko ne govori; zadnji kadar ostaje |
| 4:46 do 5:00 | svi | 8 (stoji) | čekaju pitanje |

## Doslovne rečenice

**Leon, slajd 2 (0:00, bez pozdrava):**
„Zamislite Anu, prosječnu studenticu hotelijerstva. Prvog ljutog gosta, ili gosta kojem je galeb ukrao doručak, upozna tek na praksi, a praksa dolazi tek u zadnjem semestru. Do tada uči iz teorije i, sve češće, iz gotovih odgovora AI-ja. A tko vježba uz AI koji daje gotove odgovore, na ispitu bez njega prođe 17 % lošije od onih koji su vježbali sami." *(62 riječi, oko 27 s)*
- *Činjenice:* FMTU, obavezna praksa 420 sati u 8. semestru, zadnjem semestru četvrte godine prijediplomskog studija (fthm.uniri.hr, stranica Stručna praksa, 30.4.2025.). 17 %: Bastani i sur., PNAS 2025, gotovo 1.000 srednjoškolaca, matematika (izvor je na slajdu). Zato „učenici" ili „oni koji", ne „studenti", i ne „diplomski".
- *Druge šale umjesto galeba (ista duljina):* „gosta koji u tri ujutro traži bezglutensku pizzu" · „gosta koji traži pogled na more iz sobe koja gleda na parkiralište".

**Simon, slajd 3:**
„Zato smo napravili Simpolis: Sims, ali za pravi posao. Ime je simulacija i polis, grčki grad: svaki student vodi hotel u istom gradu, i svaka odluka se osjeti." *(28 riječi, oko 12 s)*

**Simon, slajd 4:**
„Tema traži elemente igre, interaktivne izazove, personalizirani sadržaj i praćenje napretka. Rino će vam pokazati sva četiri. Mi smo Leon, Rino i Simon, i sve ovo smo napravili u 24 sata. Leon, kako to radi?" *(34 riječi, oko 15 s)*

**Leon, slajd 5:**
„Gosta glumi AI, a sudac po rubrici označi što je student pogodio. Ponuđeni ili prepisan odgovor vrijedi najviše 4 od 5, vlastite riječi do 5. Bodove, potražnju i blagajnu računaju pravila, nikad AI, pa svaku brojku možemo objasniti i testirati. U 24 sata: preko 200 spojenih PR-ova i preko 550 testova, a sigurnost smo provjerili na svih 37 API ruta. Radi u pregledniku, na mobitelu i laptopu. Rino, pokaži im." *(73 riječi, oko 32 s; ako kasni, izostaviti „Radi u pregledniku, na mobitelu i laptopu.")*

*Leonovi novi kratki klipovi idu na slajd 5 (ili odmah iza njega) i vrte se bez zvuka dok Leon govori. Ne produljuju njegov dio.*

**Rino, demo (1:28 do 3:12):** koraci su isti, satnica se pomiče za 2 do 3 s; **u 3:12 Rino je u decku na slajdu 6.** koraci iz v7, ista rečenica po koraku, nova satnica. Korak 4 (Plan) je izbačen iz 5-minutne verzije.

| Korak | Sat | Što |
| --- | --- | --- |
| 1 | 1:25 do 1:39 | Hotel. „**Elementi igre:** Anin hotel, novac i pokazatelji. Uz nju je devet botova, pa i jedan igrač ima tržište." |
| 2 | 1:39 do 1:48 | Situacija „od profesora". „**Personalizirani sadržaj:** ovu situaciju profesor je poslao samo Ani. Gosta glumi AI." |
| 3 | 1:48 do 2:05 | Pošalji vlastiti odgovor. „**Interaktivni izazov:** Ana piše svojim riječima, a sudac kaže što je dobro, a što nedostaje." |
| 5 | 2:05 do 2:27 | Profesor zatvara mjesec; dok traje, rečenice F1 do F4 iz v7 |
| 6 | 2:27 do 2:40 | Grad: drugi hoteli, samo javni podaci |
| 7 | 2:40 do 2:53 | **Financije** u navigaciji → kartica „Kako je izračunat mjesec" → korak Dobit (Tokovi) |
| 8 | 2:53 do 3:04 | **Mentor** u navigaciji (nova stranica `/igra/mentor`): pitanje stoji na ekranu. „**Praćenje napretka:** mentor ne kaže rješenje, nego pita, a podij se računa po napretku." „Simon, tko to plaća?" Ako piše „smišlja pitanje": „Mentor smišlja pitanje za Anu: ne kaže rješenje, nego pita." |

*Promjena zbog #285 (spojen u 09:3x): Mentor u navigaciji više ne otvara izvještaj, nego zasebnu stranicu s razgovorom. Put do Tokova je zato preko Financija. Rino ovo mora proći jednom u probi.*
| rezerva | 3:04 do 3:10 | **U 3:10 Rino je u decku na slajdu 6, bez obzira na korak.** |

**Simon, slajd 6 (3:12):**
„Tko plaća? Fakultet, licencu za sve kolegije, po semestru ili godini, a partner je hotelska kuća: donosi stvarne situacije i put do prakse. Svi ostali igraju besplatno, u zasebnom predvorju. Ciljamo od deset eura po studentu godišnje: za fakultet veličine FMTU-a to je oko dvanaest i pol tisuća eura, a naš trošak je oko dolar po studentu. Pilot je besplatan." *(57 riječi, oko 25 s; promo tada završava oko 4:50)*

**Simon, slajd 7:**
„Tražimo jedan kolegij i jednu hotelsku kuću za pilot, a prvi razgovor može biti danas. Cesim su brojke. ChatGPT je razgovor. Simpolis je oboje. Da Ana ljutog gosta prvi put sretne u učionici, a ne na praksi." *(39 riječi, oko 17 s)*

Simon klimne, Rino pritisne →. **Promo, slajd 8, 56 s sa zvukom.** Nitko ne govori. Kad završi, zadnji kadar stoji; svi stoje mirno i čekaju pitanje. Ne govoriti „hvala" preko videa.

## Štoperica (5 min)

Leon pokreće sat na Simonovu prvu riječ. Znakovi kao u v7 (1 prst = 10 s kasnimo, 2 prsta = 20 s, dlan = predaj odmah).

1. **Leon u 1:25 nije gotov:** izostavlja rečenicu o mentoru.
2. **Rino:** ako je sat iznad 2:05 prije zatvaranja mjeseca, preskače korak 7 (Kako je izračunat mjesec). **U 3:10 je u decku.**
3. **Simon, slajd 6 počinje iza 3:20:** izostavlja „koja donosi stvarne situacije" i rečenicu o 7 centi.
4. **Promo:** cijeli video mora krenuti najkasnije u **4:02**. Ako Simon završi iza 4:02, Rino ne pušta slajd 8 nego kratki kraj (slajd 9, 19 s). *(u decku: tipka za izravan skok na slajd 9 dodaje se u v8; potvrditi u probi)*
5. Simon nikad ne govori brže, samo reže.

## Ako je pitch 9 minuta (potvrditi kod organizatora)

Ista kostur, dodaci po redu važnosti. Ciljani kraj oko 8:40.

| Dodatak | Tko | Koliko | Što |
| --- | --- | --- | --- |
| Uvodni klip (slajd 1) | nitko | +12 s | AI napiše odgovor, student klikne Kopiraj; Simon kreće s Anom kad klip stane |
| Publika ulazi QR-om (slajd 10) | Simon | +45 s | „Izvadite mobitele": sala ulazi u istu igru kao Kahoot; Rino ih vidi na ploči profesora |
| Mehanika detaljnije | Leon | +60 s | plan (cijena, marketing), tržište koje dijele svi hoteli, botovi, podij po napretku, Tokovi objašnjavaju svaku brojku |
| Sigurnost (za ASEE) | Leon | +25 s | provjera na produkciji: profesor B dobiva 403 u igri profesora A, sigurnosna zaglavlja, granica poruka i AI prijedloga; iskreno: sljedeći korak PIN za ponovni ulaz |
| Demo puni | Rino | +90 s | vraća korak 4 (Plan); profesor šalje situaciju uživo (AI prijedlog); zum Tokova; mentor |
| Tržište i usporedba | Simon | +30 s | FMTU koristi Cesim od 2012., Cesim nema riječi ni hrvatski; ChatGPT nema posljedica |
| Iskreni slajd | Simon | +20 s | slajd „Realno, a jeftino": što košta i gdje još puca (cijena licence, kalibracija ekonomije nakon natjecanja) |
| Sljedeći korak | Leon | +5 s | ulaz izravno iz Merlina, bez kodova i lozinki |

## Što se ne govori (dodano u v8)

Sve iz v7 vrijedi. Novo: ništa preko promoa; ne najavljivati video („sad ćete vidjeti video"), nego ga pustiti; nakon videa ne govoriti „hvala", nego čekati pitanje.

## Poslovni model i financije (za slajd 6 i za pitanja)

**Model (Simonova odluka 09:00, dorađeno 09:55):**
1. **Plaća fakultet:** licenca za cijeli fakultet (svi kolegiji i profesori), po semestru ili godini, cijena po studentu. Profesor je voditelj igre, fakultet je voditelj obrade podataka.
2. **Partner je tvrtka (hotelska kuća):** donosi stvarne situacije za svoj scenarij, mentora i put do prakse; može sufinancirati licencu kolegija (oblik kao AWS Academy: tvrtka podupire obrazovanje, ne kao dokaz da će platiti).
3. **Svi ostali igraju besplatno, u zasebnom predvorju:** studenti kolegija ostaju u kontroliranom okruženju. Predvorje je kanal prema novim korisnicima; trošak AI-ja ograničen je granicama po igri koje već postoje (#247, #249).
4. **Pilot je besplatan:** jedan kolegij i jedna hotelska kuća.

**Brojke (izvori u `BIZNIS.md` i `simpolis-research/`):**

| Stavka | Iznos | Status |
| --- | --- | --- |
| AI po studentu za sezonu (4 mjeseca) | ≈ 0,07 $ (s mentorom na Haikuu ≈ 0,045 $) | izmjereno za gosta, ostalo procjena |
| Razred od 30 | 2 do 4 $ AI-ja | procjena |
| Jedan fakultet, jedan semestar (3 razreda po 30) | ≈ 100 $ ukupno (Vercel 80 $ fiksno, AI 13 $, Neon 5 $) | procjena, `troskovi-burn-rate.md` |
| **Ciljana cijena licence** | **od 10 € po studentu godišnje, svi kolegiji**; fakultet veličine FMTU-a (1.250 studenata) ≈ 12.500 € godišnje | **prijedlog, nitko ga nije potvrdio** |
| Naš trošak za takav fakultet | ≈ 1 $ po studentu godišnje (AI 2 sezone s rezervom ≈ 350 $, Vercel ≈ 720 $, Neon ≈ 240 $) | procjena |
| Usporedba | Capsim, Marketplace, Harvard i slični 11 do 139 $ po studentu; AdPrax od 39 $ | `analiza-konkurencije.md` |
| Bruto marža na infrastrukturu | ≈ 90 % | izračun iz gornjih redaka |
| Slajdovi | 6 (Tko plaća), 10 (Put do tržišta i vizija), 11 (SRCE, GDPR, AI Act) | 10 i 11 su dodatak; u PDF-u stoje iza slajda 7 |
| Rad (scenarij i podrška) | ≈ 30 sati po semestru | pretpostavka |
| Prva godina, realno | pilot besplatan; zatim nekoliko kolegija na jednom fakultetu, nekoliko tisuća eura godišnje | pretpostavka; ne obećavamo milijune |

**Što govorimo na pitanjima:**
- *Koliko košta?* „Od deset eura po studentu godišnje, za sve kolegije; za FMTU oko dvanaest i pol tisuća eura. Slični simulatori naplaćuju 11 do 139 dolara po studentu za jedan kolegij. Pilot je besplatan, a cijenu još nismo provjerili ni s jednim fakultetom."
- *Zašto bi tvrtka sudjelovala?* „Hotelima trebaju ljudi: dobiva studente koji su njihove situacije već vježbali i put do prakse. To je naša pretpostavka, tvrtke još nismo pitali."
- *Zarađuje li besplatno predvorje?* „Ne, ono je kanal. Trošak je mali i ograničen po igri."
- *Koliko je tržište?* „Malo, i to kažemo: FMTU ima oko 1.250 studenata. Prvi cilj je pilot, pa drugi kolegiji i fakulteti s istim motorom."
- **Ne govoriti:** TAM u milijardama; da je ijedan fakultet ili tvrtka pristao; da je cijena potvrđena.
- *Kako ćete doći do studenata?* „Jedan kolegij i jedna hotelska kuća za besplatni pilot u ljetnom semestru 2027., pa licenca za fakultet, pa javno predvorje i drugi fakulteti." (slajd 10)
- *Kako to uđe u sustav fakulteta?* „Sljedeći korak je otvaranje iz Merlina preko LTI-ja i ulaz s AAI@EduHr, oba su sustavi SRCE-a. Suradnju sa SRCE-om tražimo, nije dogovorena." (slajd 11)
- *GDPR?* „Fakultet je voditelj obrade, mi izvršitelj uz ugovor; baza je u Frankfurtu; u pilotu samo nadimci. Tekst ide Anthropicu u SAD uz standardne klauzule, a za fakultet postoji obrada u EU." (slajd 11)
