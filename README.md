<p align="center"><b>Hrvatski</b> · <a href="README.en.md">English</a></p>

<p align="center">
  <a href="https://riihack.vercel.app/profesor"><picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/media/banner-dark.jpg">
    <img src="docs/media/banner.jpg" width="800" alt="Simpolis. Vodi hotel. Razgovaraj s gostima. Uči na posljedicama. Desno ilustracija primorskog gradića s lukom.">
  </picture></a>
</p>

<p align="center">
  <a href="https://github.com/leonkreso784-bit/riihack/releases/tag/ri-hack-4.0"><img alt="Ri-Hack 4.0: 3. mjesto od 8" src="https://img.shields.io/badge/Ri--Hack_4.0-3._mjesto_od_8-246bfd"></a>
  <a href="https://riihack.vercel.app/profesor"><img alt="Isprobaj uživo" src="https://img.shields.io/badge/isprobaj-u%C5%BEivo-14213d"></a>
  <a href="https://github.com/leonkreso784-bit/riihack/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/leonkreso784-bit/riihack/actions/workflows/ci.yml/badge.svg?branch=main"></a>
  <a href="docs/ROADMAP.md"><img alt="Pilot: plan 2027." src="https://img.shields.io/badge/pilot-plan_2027-57606a"></a>
</p>

<p align="center">
  <b>Igra za studente ugostiteljstva: vodiš hotel, razgovaraš s gostima koje glumi AI i učiš na posljedicama svojih odluka.</b><br>
  <a href="https://riihack.vercel.app/profesor"><b>Isprobaj uživo</b></a> · <a href="#isprobaj-sam">Kako isprobati</a> · <a href="#simpolis-u-56-sekundi">Promo video</a> · <a href="https://prezentacijariihack.vercel.app/">Prezentacija</a> · <a href="docs/STATUS.md">Stanje projekta</a>
</p>

## Ukratko

**Problem.** Studentica hotelijerstva, nazovimo je Ana, prvog ljutog gosta upozna tek na praksi. Na FMTU-u se [stručna praksa](https://fthm.uniri.hr/zivotfmtu/centar-za-karijere-i-strucnu-praksu/strucna-praksa/) (420 sati) izvodi tek u 8. semestru, na četvrtoj godini. Do tada uči iz teorije, a uz to može posegnuti za gotovim odgovorima AI-ja. To ima cijenu: u [PNAS-ovoj studiji iz 2025.](https://doi.org/10.1073/pnas.2422633122) srednjoškolci koji su vježbali uz GPT-4 bez ograda prošli su na ispitu bez AI-ja 17&nbsp;% lošije od onih koji ga nisu imali (srednjoškolska matematika; vrijedi li isto za ugostiteljstvo, nije provjereno).

- **Što je:** web igra za studente ugostiteljstva i turizma. Profesor otvori igru, razred uđe kodom, a svaki student vodi svoj hotel u zajedničkom gradu na Kvarneru, mjesec po mjesec.
- **Uloga AI-ja:** glumi goste i osoblje, ocjenjuje odgovore po rubrici i kao mentor prvo pita, pa tek onda objašnjava. **Svaku brojku računaju pravila igre, ne AI.**
- **Radi:** glavna petlja radi uživo na pravom kodu, a 1.085 testova prolazi. Napravljen u 24 sata na hackathonu Ri-Hack 4.0, 3. mjesto od 8 timova.
- **Za pilot još nije spremno:** popis što fali je u dijelu [Stanje](#stanje-radi-li).
- **Dalje (plan):** besplatni pilot na FMTU-u u Opatiji 2027., zatim licence za fakultete. Još ništa nije dogovoreno, vidi [Plan](#plan).

## Isprobaj sam

Treba ti samo preglednik. Igru otvaraš sam, kao profesor, pa ti kod igre ne treba unaprijed. Koristi izmišljene podatke. Na kraju igru možeš obrisati tipkom **Obriši igru** na dnu ploče igre.

1. Otvori [riihack.vercel.app/profesor](https://riihack.vercel.app/profesor) i odaberi **Napravi račun**.
2. Odaberi **Nova igra**, upiši naziv i odaberi **Napravi igru** (broj studenata može ostati 24). Dobiješ kod igre i QR kod.
3. Na mobitelu (ili u drugom prozoru) otvori [riihack.vercel.app/ulaz](https://riihack.vercel.app/ulaz) i upiši kod, svoje ime i ime hotela. Sad si student.
4. Na profesorskom ekranu odaberi **Popuni do 5 hotela** (botovi daju tržište) i **Pokreni igru**.
5. Na mobitelu otvori situaciju, razgovaraj s gostom i odgovori svojim riječima. Mjesec zatvaraš na profesorskoj ploči.

## Simpolis u 56 sekundi

<p align="center">
  <a href="https://prezentacijariihack.vercel.app/video/simpolis-promo-1080p.mp4"><img src="docs/media/promo-thumb.jpg" width="640" alt="Promo video, 56 sekundi: ljuti gost na recepciji Hotela Kvarner i chat u kojem mu student odgovara. Klik pušta video."></a><br>
  <sub>Klik pušta video u pregledniku (28 MB, sa zvukom). Za preuzimanje: <a href="https://github.com/leonkreso784-bit/riihack/releases/tag/promo-video">release <code>promo-video</code></a>.</sub>
</p>

## Kako se igra

Profesor otvori igru, razred uđe kodom ili QR kodom, a svaki student dobije jedan od šest hotela. Profesor može dodati botove, pa i mali razred ima tržište. Zatim svaki mjesec ide ovako:

1. **Gost ima problem.** Stižu dvije situacije, npr. klima ne radi usred sezone. Gosta glumi AI, a student s njim razgovara i otkrije što mu zapravo treba.
2. **Odgovor i presuda.** Vlastite riječi vrijede do 5 od 5, ponuđeni odgovor najviše 3. AI sudac označi koje je kriterije rubrike odgovor ispunio i zašto, a bodove računaju pravila.

<p align="center">
  <img src="docs/media/gost-i-presuda.gif" width="360" alt="Na mobitelu student piše gostu: Dobar dan, gospodine Kovaču, hvala što ste nam javili. Što vas je najviše smetalo? Gost odgovara da ga je najviše smetala buka s terase do ponoći i da mu je recepcija samo slegnula ramenima. Student zatim vlastitim riječima piše ispriku i nudi rješenje, sudac razmišlja, pa prikazuje ocjenu 4 od 5, ispunjena 4 kriterija i obrazloženje po rubrici."><br>
  <sub>Razgovor s gostom, odgovor svojim riječima i presuda po rubrici. Čekanje na AI je skraćeno. Snimljeno na hackathonu 25. 10. 2026.</sub>
</p>

3. **Plan i zatvaranje mjeseca.** Student postavi cijenu, marketing i ulaganja u odjele. Profesor zatvori mjesec, a pravila izračunaju popunjenost, novac i recenzije za sve hotele, jer dijele iste turiste. Podij je po napretku, ne po novcu.

<p align="center">
  <img src="docs/media/zatvaranje-mjeseca.gif" width="600" alt="Profesorova ploča: profesor zatvara lipanj, pojavljuje se podij Skok mjeseca s ljestvicom po napretku, zatim počinje srpanj s novom ljestvicom. Imena igrača su zamućena.">
  <br><sub>Profesor zatvara mjesec i razred vidi podij. Imena igrača u snimci su zamućena.</sub>
</p>

4. **Mentor prvo pita, tek onda objašnjava.** Mentor pita o najslabijoj odluci mjeseca, student razmisli, mentor odgovori. Nakon četiri mjeseca (lipanj do rujan) slijedi podij sezone.

<p align="center">
  <a href="docs/media/mentor.jpg"><img src="docs/media/mentor-isjecak.jpg" width="640" alt="Isječak stranice Mentor: student odgovara da nije dovoljno slušao gosta, a mentor nastavlja objašnjenjem što je nedostajalo i dvama pitanjima o troškovima i o tome što bi rekao obitelji."></a><br>
  <sub>Student razmišlja, mentor nastavlja pitanjima. Klik otvara cijelu stranicu.</sub>
</p>

## Plan

**Sve je to plan (cilj), ne dogovor.** Nijedan fakultet, hotel ni SRCE još nije pristao, razgovor s FMTU-om još nije održan, a cijenu nismo provjerili ni s jednim fakultetom. Jedini čvrsti datum je rok prijave u inkubator, 16. 11. 2026. Detalji: [docs/ROADMAP.md](docs/ROADMAP.md).

<p align="center"><img src="docs/media/slide-put-do-trzista.png" width="600" alt="Slajd Put do tržišta: zima 2026. razgovor s jednim kolegijem i jednom hotelskom kućom, ljetni semestar 2027. besplatan pilot, nakon pilota licenca za fakultet. Danas hotel, sutra cijeli grad. Plan, ne dogovor."></p>

- **Inkubator:** prijava u Startup inkubator Rijeka (RiHub), 18. generacija, je u pripremi. Rok je 16. 11. 2026., a ulaz odlučuje komisija.
- **Pilot:** planiramo besplatan pilot u jednom kolegiju na FMTU-u (Fakultet za menadžment u turizmu i ugostiteljstvu, Opatija), u ljetnom semestru 2027.
- **Fakulteti:** nakon pilota planiramo licencu za cijeli fakultet, ciljano od 10&nbsp;€ po studentu godišnje. Naš trošak AI-ja je po našoj procjeni oko 0,07&nbsp;$ po studentu za sezonu. Uz to planiramo ulaz iz Merlina (LTI) i prijavu AAI@EduHr preko SRCE-a; suradnju sa SRCE-om tražimo, nije dogovorena.
- **Hoteli i tvrtke:** planiramo stvarne situacije iz poslovanja i put do prakse, kasnije obuku zaposlenika. Nijednu tvrtku još nismo pitali.
- **Mnogo kasnije:** multiplayer grad u kojem studenti sklapaju ugovore jedni s drugima, bez datuma.

## Stanje: radi li?

Glavna petlja radi od početka do kraja na pravom kodu. Brojke su s `main`-a na dan 26. 10. 2026. Verzija koju je ocjenjivao žiri čuva se na oznaci [`ri-hack-4.0`](https://github.com/leonkreso784-bit/riihack/releases/tag/ri-hack-4.0).

| Što | Brojke |
| --- | --- |
| **Provjere** | 1.085 testova u 80 datoteka prolazi; typecheck, lint, build i CI su zeleni |
| **Sadržaj** | 6 hotela, 8 situacija, 6 gradskih tvrtki, 8 predložaka ugovora |
| **Opseg** | 26 stranica, 38 datoteka API ruta, 20 tablica u bazi |
| **Razvoj** | 700 commitova i 246 spojenih pull requestova (236 tijekom hackathona) |

<p align="center">
  <a href="docs/img/hotel.jpg"><img src="docs/media/hotel-pokazatelji.jpg" width="430" alt="Ploča hotela: pet pokazatelja od 0 do 100 (zadovoljstvo gostiju, recenzije, zaposlenici, operativa, financije)."></a>&nbsp;&nbsp;
  <a href="docs/media/grad.jpg"><img src="docs/media/grad-isjecak.jpg" width="430" alt="Izometrijski grad s hotelima studenata, hotelom računala i gradskim partnerima."></a><br>
  <sub>Lijevo: pokazatelji hotela (student). Desno: zajednički grad (student). Klik otvara cijeli zaslon.</sub>
</p>

<p align="center">
  <a href="docs/img/prof.jpg"><img src="docs/media/situacije-isjecak.jpg" width="430" alt="Profesorov popis situacija: situacije iz banke, vlastita situacija profesora i zakazana slanja."></a>&nbsp;&nbsp;
  <a href="docs/media/tokovi.jpg"><img src="docs/media/tokovi-isjecak.jpg" width="430" alt="Kako je izračunat mjesec: lanac koraka od tržišta grada i popunjenosti preko prihoda do dobiti od 18.700 € i novca na računu od 38.700 €."></a><br>
  <sub>Lijevo: situacije za razred (profesor). Desno: odakle je došla svaka brojka (student).</sub>
</p>

**Za pilot još nije spremno:** fale ručno odobravanje profesorskih računa i reset lozinke, PIN za ulazak studenta, duljina sezone za semestar te migracije i vlastita baza za pilot ([docs/STATUS.md](docs/STATUS.md#što-fali-za-pilot)).

**Još nije gotovo:** sezona traje fiksno četiri mjeseca, situacija je samo 8 i sve su hotelske, a sve je na hrvatskom. Tok u bazi provjeravamo ručnom smoke skriptom koju CI ne pokreće. Mentorov mjesečni osvrt postaje pitanje umjesto savjeta ([#302](https://github.com/leonkreso784-bit/riihack/issues/302)). Ekonomija je od 26. 10. kalibrirana prema hotelima na Kvarneru (marža sezone 14 do 20 %), a profesor može izvesti ocjene u CSV i obrisati igru. Popis za pilot: milestone [Pilot FMTU](https://github.com/leonkreso784-bit/riihack/milestone/6). Detalji i poznate greške: [docs/STATUS.md](docs/STATUS.md).

## Pod haubom

<details>
<summary><b>Kako radi: pravila, AI i profesor</b></summary>

| Tko | Što radi |
| --- | --- |
| **Pravila igre** (kod) | Računaju novac, popunjenost, tržište i bodove. Čiste funkcije bez baze i mreže, pokrivene testovima. |
| **AI** (Claude) | Glumi likove (Haiku 5.5), sudi i vodi mentora (Sonnet 5.5). Ne računa ništa: vraća oznake kriterija i tekst, a brojke u tekstu uzima iz izračuna pravila. |
| **Profesor** | Može promijeniti ocjenu svakog odgovora i pregleda svaki AI prijedlog situacije prije slanja. |

Svaki AI poziv ima rok i rezervni odgovor, pa igra radi i kad AI ne odgovori.

</details>

<details>
<summary><b>Ri-Hack 4.0: tema i četiri elementa</b> (elementi igre, interaktivni izazov, personalizirani sadržaj, praćenje napretka)</summary>

Tema hackathona bila je „Poticanje ljudi na učenje u doba umjetne inteligencije“ i predlaže četiri elementa. Svaki od njih je stvarna funkcija u igri:

| Element teme | U Simpolisu |
| --- | --- |
| **Elementi igre** | Vlastiti hotel, novac i pet pokazatelja, zajednički grad i tržište, podij, botovi kao suparnici. |
| **Interaktivni izazov** | Razgovor s likom koji glumi AI, odgovor svojim riječima, presuda po rubrici. |
| **Personalizirani sadržaj** | Profesor šalje situacije cijelom razredu ili jednom studentu. AI predlaže situaciju za najslabiji pokazatelj hotela, a profesor je pregleda prije slanja. |
| **Praćenje napretka** | Ljestvica po napretku, mentor koji pita o najslabijoj odluci, profesorov uvid u sve odgovore i presude. |

<p align="center"><img src="docs/media/slide-cetiri-elementa.png" width="720" alt="Slajd Četiri elementa teme, četiri ekrana: elementi igre (ploča hotela), interaktivni izazov (razgovor s gostom), personalizirani sadržaj (profesor šalje situaciju jednom studentu), praćenje napretka (mentor)."></p>

Ocijenjena verzija: [release `ri-hack-4.0`](https://github.com/leonkreso784-bit/riihack/releases/tag/ri-hack-4.0). Arhiva natjecanja: [docs/hackathon/](docs/hackathon/README.md).

</details>

## Za programere

Treba Node 24, npm i vlastita prazna Neon baza.

```bash
git clone https://github.com/leonkreso784-bit/riihack.git && cd riihack
npm ci
cp .env.example .env.local   # DATABASE_URL, ANTHROPIC_API_KEY, BETTER_AUTH_SECRET, BETTER_AUTH_URL
npm run db:push              # samo na svojoj praznoj bazi, nikad na zajedničkoj (ADR-026)
npm run dev                  # http://localhost:3000
```

- **Samo sučelje, bez baze i ključeva:** `NEXT_PUBLIC_USE_MOCK=1` u `.env.local`. Pravi API i bazu uključuje samo vrijednost `0`.
- **Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4 · Neon Postgres i Drizzle · Claude preko Vercel AI SDK-a · Better Auth · Vercel i GitHub Actions.
- **Dalje:** [docs/RAZVOJ.md](docs/RAZVOJ.md) (postavljanje, testovi, pravila za PR), [docs/ARHITEKTURA.md](docs/ARHITEKTURA.md) (motor, AI sloj, baza, API), [docs/README.md](docs/README.md) (sva dokumentacija).

## Tim

Tim **Pojedinci**:

- **Leon Kreso:** integracija, baza, procesi.
- **Rino Tomić:** frontend i dizajn sučelja.
- **Simon Seifert:** igra, AI, pitch.

Pitanja, pilot i suradnja: [GitHub Issues](https://github.com/leonkreso784-bit/riihack/issues).

## Licenca

Sva prava pridržana. Autorska prava drže zajedno Leon Kreso, Rino Tomić i Simon Seifert. Kod je javno vidljiv samo radi pregleda i portfelja: bez pisanog dopuštenja svih nositelja nije dopušteno kopirati, mijenjati, distribuirati ni koristiti ga, u cijelosti ili djelomično. Ovisnosti trećih strana zadržavaju vlastite licence. Vidi [LICENSE](LICENSE).
