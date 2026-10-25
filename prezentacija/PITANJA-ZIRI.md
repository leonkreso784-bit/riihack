# Pitanja žirija: kratki odgovori (ned 25.10.)

**TL;DR:** svaki odgovor ima tri koraka: ponovi pitanje u šest riječi, odgovori jednom rečenicom (mehanizam), dokaz (što je izrađeno ili broj). Ne izmišljati brojke. Tko odgovara: Leon tehnika i proces, Simon proizvod, AI i dizajn, Rino posao i sigurnost.

## Pet pitanja koja žiri Ri-Hacka uvijek pita

| Pitanje | Odgovor (jedna do dvije rečenice) | Dokaz |
| --- | --- | --- |
| **Zloupotreba:** student zalijepi odgovor iz ChatGPT-a? | Zalijepljen tekst vrijedi najviše kao klik na ponuđeni odgovor, a profesor vidi da je zalijepljen. Prepisivanje prepoznaju pravila, ne AI. | Pravilo u motoru (udio zalijepljenog teksta), uvid profesora. |
| **Motivacija:** zašto bi student igrao? | Ocjena je napredak u odnosu na vlastiti početak, a grad je zajednički: tvoja cijena i odgovori gostu mijenjaju tvoju blagajnu i tržište. Mentor nakon svakog mjeseca pita zašto. | Ljestvica po napretku, podij, mentor. |
| **Novac:** tko plaća? | Fakultet plaća licencu po semestru ili godini, u partnerstvu s tvrtkom: hotelska kuća donosi stvarne situacije i put do prakse i posla. Svi ostali mogu igrati u zasebnom predvorju, a studenti ostaju u kontroliranom okruženju kolegija. AI košta oko 7 centi po studentu za sezonu. Ciljamo od 10 € po studentu godišnje za sve kolegije (fakultet veličine FMTU-a ≈ 12.500 € godišnje; slični simulatori 11 do 139 $ po studentu za jedan kolegij), a naš trošak je oko 1 $ po studentu godišnje. Pilot je besplatan; cijenu još nismo provjerili ni s jednim fakultetom. | Izmjereni tokeni, razred od 30 je 2 do 4 $. |
| **Usvajanje:** tko će to prvi koristiti? | FMTU Opatija: već koriste Cesim od 2012., a Cesim nema riječi ni hrvatski. Tražimo jedan kolegij i jednu hotelsku kuću za pilot. | Slajd „Što već postoji", slajd „Tražimo". |
| **Dizajn:** radi li na mobitelu? | Žiri ga je jutros igrao na svojim mobitelima. | Obilazak 3. |

## Pitanja o AI-ju

- **Što ako AI pogriješi u ocjeni?** AI samo označava koje kriterije rubrike odgovor ispunjava i to obrazloži; bodove računaju pravila. Profesor vidi obrazloženje i može promijeniti ocjenu.
- **Što ako AI padne?** Igra ide dalje: odgovor dobije srednju ocjenu, gost ima rezervnu rečenicu, mentor osvrt složen iz brojki.
- **Halucinira li gost?** Gost glumi ulogu iz situacije i nema pristup brojkama; brojke nikad ne dolaze od AI-ja.
- **Koji modeli?** Claude Haiku za goste (brzo, 1 do 2 s), Claude Sonnet za suca i mentora.
- **Može li jeftinije?** Da. Testirali smo mentora na manjem modelu (Haiku): oko 18 puta jeftiniji, uz nešto slabija pitanja. AI po studentu za sezonu tako pada s oko 7 na oko 4,5 centa. Sudac ostaje na većem modelu jer o njemu ovisi ocjena. Uključujemo nakon natjecanja, uz provjeru na stvarnim podacima. Upute modelu već se spremaju u predmemoriju (prompt caching), pa ih ne plaćamo pri svakom pozivu.
- **Zašto ne samo ChatGPT kao gost?** ChatGPT ima razgovor, ali nema posljedica: ništa se ne vidi u blagajni, nema tržišta, nema rubrike ni profesora.

## Privatnost i propisi (Rino)

- Student ulazi kodom, imenom i imenom hotela; bez e-maila i lozinke. Demo koristi izmišljene podatke.
- AI Act: AI koji ocjenjuje učenje je visokog rizika (Prilog III, 3b), obveze od 2.12.2027. Mi već imamo ljudski nadzor (profesor mijenja ocjenu) i pravila umjesto AI-ja za bodove. Za pilot: fakultet je voditelj obrade, mi izvršitelj (ugovor o obradi).
- Anthropic komercijalni API ne trenira na našim podacima.

## Realnost i opseg

- **Koliko je ekonomija realna?** Danas pojednostavljena pravila. Kalibracija prema javnim izvješćima Liburnije, Jadrana i Valamara je izrađena (PDV, provizija, materijal, osoblje po zvjezdicama) i ide u igru nakon natjecanja. Ne reći da je već u igri.
- **Samo hoteli?** Ne: isti motor, sudac i Tokovi, mijenja se paket sadržaja (slajd 7, koncept).
- **Što je napravljeno prije natjecanja?** Istraživanje i plan; sav kod je napisan na natjecanju (prvi commit na natjecanju).
- **Koliko ste koristili AI za kod?** Puno, otvoreno: agenti pišu kod, mi odlučujemo, pregledavamo i testiramo (preko 550 testova, smoke na produkciji, audit gumba na mobitelu i desktopu).

## Ako ne znamo

„Nemamo taj podatak; provjerili bismo tako da …" Nikad ne izmišljati broj.

## Sigurnost (Leon; pitanje ASEE-a)

- **Što ste provjerili?** Vlastiti pregled na produkciji s testnim računima: svih 37 API ruta provjeravaju identitet na poslužitelju; profesor B dobiva 403 na svih 15 radnji u igri profesora A; student ne vidi tuđe odgovore ni poštu; 5 od 5 pokušaja prompt injectiona nije prevarilo suca (motor ionako ograničava ocjenu na 1 do 5); XSS kroz ime hotela se prikazuje kao tekst; nema tajni u kodu ni u JS-u; npm audit 0.
- **Što smo popravili iste noći (ADR-053):** sigurnosna zaglavlja na svim rutama (stranica se ne može ugraditi u tuđi iframe, nosniff, Referrer-Policy), #251; granica poruka u razgovoru s gostom drži i pod istodobnim zahtjevima, #249; AI prijedlozi situacija imaju granicu po igri (30 ukupno, 5 u minuti), #247.
- **Što još nije dobro (reći iskreno):** ponovni ulaz samo imenom i hotelom (sljedeći korak: PIN), stroga CSP, ograničenje brzine na ulazu. Detalji u SIGURNOST.md (ne javno dok nije popravljeno).
