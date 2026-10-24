# Odabir ideje

## Tema

> Tema
> U današnje doba informacije su dostupnije nego ikad prije. Zahvaljujući internetu i razvoju
> umjetne inteligencije, odgovore na gotovo svako pitanje možemo dobiti u svega nekoliko
> sekundi. Međutim, upravo ta dostupnost informacija otvara novo pitanje: ako nam umjetna
> inteligencija može pružiti odgovor na gotovo sve, zašto bismo uopće učili? Sve se češće
> javlja iskušenje da se oslonimo na gotova rješenja, umjesto da sami istražujemo, razumijemo
> i usvajamo nova znanja. Ipak, sposobnost kritičkog razmišljanja, razumijevanja problema i
> primjene stečenog znanja ostaje ključna za osobni razvoj i napredak društva. Stoga je
> ovogodišnja tema:
>
> POTICANJE LJUDI NA UČENJE U DOBA UMJETNE INTELIGENCIJE
>
> Učenje može poprimiti mnoge oblike, od usvajanja školskog gradiva i učenja stranih jezika
> do razvoja profesionalnih vještina i istraživanja osobnih interesa. Platforme poput
> Duolinga, Coursera i Udemyja već pokazuju kako tehnologija može olakšati pristup
> obrazovanju, dok primjerice YouTube tutorijali omogućuju učenje kroz praktične primjere.
> Alati poput Photomatha mogu pomoći u razumijevanju matematičkih problema, a Merlin
> može poslužiti kao primjer digitalnog alata za e-kolegije. Na koji način možemo iskoristiti
> tehnologiju, uključujući umjetnu inteligenciju, kako bismo učenje učinili zanimljivijim,
> pristupačnijim i učinkovitijim?
>
> Vaš zadatak na ovom hackathonu je osmisliti rješenje koje će potaknuti ljude na aktivno
> učenje, razvijanje novih vještina i cjeloživotno obrazovanje. Razmislite kako motivirati
> korisnike da ne traže samo gotove odgovore, već da razvijaju vlastito razumijevanje,
> istražuju nove teme i primjenjuju stečeno znanje. To možete postići na različite načine,
> uključujući, ali ne ograničavajući se na: primjenu elemenata igre, personaliziranih
> obrazovnih sadržaja, interaktivnih izazova i praćenja napretka. Razmišljajte izvan okvira i
> istražite nove pristupe koji mogu potaknuti motivaciju za učenjem i olakšati usvajanje
> novih znanja. Nemojte se ograničavati samo na navedene primjere. Pokažite kreativnost i
> pronađite nove načine kako tehnologiju pretvoriti u saveznika u učenju.
>
> Vaše rješenje nije ograničeno tehnologijom, specifičnim značajkama ni platformom za koju
> razvijate. Pokažite kreativnost i inovativnost, ali pazite da rješenje bude pristupačno,
> održivo i primjenjivo u stvarnom životu. Žiri će ocjenjivati kreativnost i inovativnost vašeg
> rješenja, ali i njegove tehničke karakteristike (složenost i ispoliranost rješenja). Cilj nije
> ponuditi brze prečace do rješenja, već pronaći način kako iskoristiti tehnologiju za
> poticanje znatiželje, dubljeg razumijevanja i trajne želje za stjecanjem novih znanja.

Simonovi kandidati, ocjene i preporuka prije odabira Simpolisa: [research/tema-2026.md](https://github.com/leonkreso784-bit/ri-hack-4/blob/main/research/tema-2026.md). Nacrt obećanja: [PROMISE.draft.md](https://github.com/leonkreso784-bit/ri-hack-4/blob/main/PROMISE.draft.md).

Sažetak (Leon): žiri ocjenjuje **kreativnost i inovativnost** te **tehničke karakteristike** (složenost i
ispoliranost). Rješenje mora biti pristupačno, održivo i primjenjivo u stvarnom životu.

## Odabrana ideja

**Simpolis.** Radimo na foru Leonovog **HotelixSima** (simulacija vođenja hotela za studente). Prenosimo **ideju i obrasce, ne
kod**: kod se piše tijekom hackathona. Ime **ne smije biti HotelixSim** ni sličan.

- **U jednoj rečenici:** simulacija u kojoj student dobije ulogu i rješava stvarne situacije, AI glumi likove i
  procjenjuje njegovo razmišljanje, a profesor vodi igru za cijeli razred.
- **Pitch:** AI ne daje odgovore. AI glumi svijet u kojem moraš sam odlučiti, a onda ti objasni zašto.
- **Za koga:** studenti i profesori (prvi kupac: fakultet / kolegij).
- **Koji problem rješava:** AI danas daje gotove odgovore pa se ne uči; ovdje gotov odgovor vrijedi manje od
  vlastitog razmišljanja.

### Obrasci iz HotelixSima

1. **Ulogu dobiješ, ne biraš.** Svi kreću s istim ukupnim zbrojem, drukčije raspoređenim (fer natjecanje).
2. **Krugovi sa situacijama.** U svakom krugu stižu situacije (problem, prilika, težina).
3. **Tri načina odgovora:** klik na ponuđeni odgovor, vlastiti odgovor tekstom, ili prvo razgovor s likom kojeg
   glumi AI.
4. **Vlastite riječi vrijede više od klika.** Najbolji klik daje manje od najboljeg vlastitog odgovora; prepisan
   ponuđeni odgovor računa se kao klik. To je srž teme.
5. **AI ne odlučuje o brojkama.** AI glumi likove, sudi o slobodnom odgovoru po unaprijed zadanoj rubrici i kao
   mentor objasni što je bilo dobro, a što ne. Bodove računaju pravila igre, uvijek jednako.
6. **Ocjena je napredak** u odnosu na vlastiti početak, ne apsolutni rezultat.

### Profesorov dio

1. **Profesor stvara igru** i upiše **koliko studenata igra**. Dobije **kod igre** od 6 znakova koji pokaže na
   projektoru (kao Kahoot) i **profesorski kod** za upravljanje (bez računa).
2. **Studenti ulaze kodom**, upišu **svoje ime i ime hotela** koji vode. Svaki dobije **drukčiji hotel** iz banke
   hotela, sa svim sobama koje se mogu pregledati (kao HotelixSim). Svi kreću s istim zbrojem pokazatelja i dobiju
   iste situacije u istom krugu.
3. Profesor vidi kako se mjesta pune („7 / 24") i pokrene igru.
4. **Profesor vodi tempo:** gumb „Otvori sljedeći krug" ili krug s odbrojavanjem (X minuta). Tko ne odgovori,
   dobije najnižu ocjenu i mentor ga upozori.
5. **Ploča uživo:** tko je zatvorio krug, tko još igra, napredak svakog studenta i ljestvica.
6. **Uvid u razmišljanje:** profesor otvori studenta i vidi odgovore, razgovor s likom i AI ocjenu po rubrici.
7. *Ako ostane vremena:* profesor ubaci „šok" situaciju svima odjednom.

**Opseg:** ne gradimo proizvod koji radi do kraja. Najbitnije iz HotelixSima ide u bazu i backend, ostalo je
sučelje na lažnim podacima ili samo plan ([ARHITEKTURA.md](ARHITEKTURA.md) §1a).

### Otvoreno

- **Podjela backenda** između Leona i Simona (prijedlog u [RADNI-DOGOVOR.md](RADNI-DOGOVOR.md)); frontend radi Rino.
- 🟨 **Područje demoa:** hotel je glavni tok, agencija s ugovorom tek kad hotel radi ([ARHITEKTURA.md](ARHITEKTURA.md) §1).
  Generiranje situacija iz profesorova gradiva je za poslije hackathona.

## Vizija: jedan svijet, mnogo simulacija

Hotel je **samo prvi primjer**. Plan je cijeli svijet tvrtki: hotel, turistička agencija, dobavljač, zaštitarska
firma i druge. Svaka je svoja simulacija, ali sve žive u **istom svijetu** i rade jedna s drugom: sklapaju ugovore,
pregovaraju, ovise jedna o drugoj. Student iz hotelijerstva vodi hotel, student iz ekonomije agenciju, i dogovaraju se
međusobno. Ime zato mora pokriti **svijet**, ne jednu djelatnost.

## Ime: kandidati

| Ime | Zašto |
| --- | --- |
| **Agora** | trg u antičkoj Ateni: tržnica gdje se trguje i sklapaju poslovi **i** mjesto gdje je Sokrat učio ljude pitanjima. Točno spoj svijeta tvrtki i učenja |
| **Polis** | grčki grad-država: cijeli svijet u kojem tvrtke žive zajedno |
| **Simpolis** | simulacija + polis; jasnije da je simulacija |
| **Oikos** | grčki „kućanstvo", korijen riječi ekonomija i ekologija: sustav u kojem sve ovisi o svemu |
| **Mikrosvijet** | hrvatski, odmah jasno: mali svijet za učenje |
| **Tržnica** | hrvatski, mjesto gdje se svi susreću i trguju |

**Odabrano ime: Simpolis** (tim, 24.10.). Simulacija + polis (grad-država): svijet u kojem žive sve simulacije.
Provjera 24.10.: nema proizvoda s tim imenom; slobodne domene `simpolis.io`, `simpolis.eu`, `simpolis.app`
(`simpolis.com` je zauzet).
