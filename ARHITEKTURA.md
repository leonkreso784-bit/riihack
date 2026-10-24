# Simpolis: arhitektura

> Status: **nacrt za potvrdu tima** (24.10.2026.). Oznaka 🟨 znači pretpostavku koju tim još nije potvrdio.
> Ideja i obrasci: [IDEJA.md](IDEJA.md). Podjela posla: [RADNI-DOGOVOR.md](RADNI-DOGOVOR.md). Raspored: [PLAN-24H.md](PLAN-24H.md).

## 1 · Što gradimo (za demo)

**Simpolis** je svijet simulacija za učenje. Profesor stvori **svijet**, studenti uđu kodom i svaki dobije
**tvrtku** u tom svijetu. Igra ide u **krugovima**: u svakom krugu tvrtka dobije **situacije**, student ih rješava
(klik, vlastiti odgovor ili razgovor s likom kojeg glumi AI), a na kraju kruga **mentor** objasni što je bilo dobro.
Ocjena je **napredak** u odnosu na početak vlastite tvrtke.

Za demo su dvije vrste tvrtki:

1. **Hotel** (glavni tok, obavezno): pune situacije, likovi, presuda, mentor.
2. **Turistička agencija** 🟨 (drugi korak, samo ako glavni tok radi): manje situacija, i **ugovor s hotelom**
   (agencija ponudi zakup soba za grupu, hotel prihvati, odbije ili da protuponudu). To pokazuje „isti svijet".

**Oblik:** web platforma, **responsive za sve uređaje** (mobitel, tablet, računalo, projektor). Izgled i osjećaj
kao današnji HotelixSim, opsegom malo veći (svijet, više vrsta tvrtki, profesor), ali **pojednostavljen** (vidi §5a).

**Što NE radimo u 24 h:** račune i lozinke, više jezika, pravu ekonomiju tržišta, zajedničko tržište gostiju,
generiranje situacija AI-jem, mobilnu aplikaciju.

## 2 · Načela (preuzeta iz HotelixSima, kod pišemo iznova)

1. **AI ne odlučuje o brojkama.** AI glumi likove, provjerava koje kriterije rubrike odgovor ispunjava i piše
   mentorov osvrt. Bodove računa **motor** (čiste TypeScript funkcije), uvijek jednako.
2. **Vlastite riječi vrijede više od klika.** Najbolji klik daje kvalitetu najviše **4**, najbolji vlastiti
   odgovor **5**. Tekst koji se s ponuđenim odgovorom poklapa u ≥ 70 % riječi računa se kao klik tog odgovora.
3. **Ulogu dobiješ, ne biraš.** Svaka tvrtka kreće s istim zbrojem pokazatelja, drukčije raspoređenim.
4. **Ocjena je napredak**, ne apsolutni rezultat.
5. **AI ključ samo na poslužitelju.** Preglednik nikad ne zove Claude ni Supabase s tajnim ključem.

## 3 · Stack

| Dio | Izbor | Zašto |
| --- | --- | --- |
| Aplikacija | **Next.js** (App Router) + TypeScript + Tailwind | jedan projekt za sučelje i API, zadano u RADNI-DOGOVOR |
| API | Next.js route handleri pod `app/api/*` | nema zasebnog servera ni CORS-a |
| Baza | **Supabase Postgres**, samo s poslužitelja (service key) | brzo, besplatno, bez RLS-a jer sve ide kroz naš API |
| Osvježavanje | **polling svake 3 s** | najjednostavnije i pouzdano; Supabase Realtime samo ako ostane vremena |
| AI | **Claude preko AI SDK-a** (`@ai-sdk/anthropic`) | lik: `claude-haiku-5-5` (brz, stream); presuda i mentor: `claude-sonnet-5-5` (strukturirani izlaz) |
| Deploy | **Vercel**, `main` se deploya sam | javni link od prvog sata |

🟨 Stack je zadani iz [RADNI-DOGOVOR.md](RADNI-DOGOVOR.md); potvrđuju ga Leon, Simon i Rino.

## 4 · Model podataka

Sve tablice u jednoj Supabase shemi. Identifikatori su `uuid`, vremena `timestamptz`.

| Tablica | Polja (bitna) | Napomena |
| --- | --- | --- |
| `worlds` | `id`, `name`, `join_code` (6 znakova), `prof_code_hash`, `round` (int, 0 = čekaonica), `round_deadline` (null = ručno), `status` (`lobby`/`running`/`finished`), `seed` | jedan svijet = jedna igra razreda |
| `companies` | `id`, `world_id`, `kind` (`hotel`/`agency`), `name`, `profile` (koji početni profil), `start_metrics` (jsonb), `metrics` (jsonb), `closed_round` (int) | tvrtka jednog studenta |
| `players` | `id`, `company_id`, `display_name`, `token_hash` | ulaz bez računa; token u httpOnly kolačiću |
| `situations` | `id`, `company_id`, `round`, `template_id`, `state` (`open`/`answered`/`expired`) | instanca predloška u krugu |
| `events` | `id`, `world_id`, `company_id`, `round`, `type`, `payload` (jsonb), `at` | dnevnik svijeta, samo dodavanje (§9a) |
| `answers` | `situation_id`, `mode` (`click`/`own`/`none`), `option_id`, `text`, `transcript` (jsonb), `verdict` (jsonb: ispunjeni kriteriji, obrazloženje), `quality` (1–5), `effects` (jsonb) | jedan odgovor po situaciji |
| `round_reports` | `company_id`, `round`, `metrics_before`, `metrics_after`, `mentor_text` | izvještaj i mentor po krugu |
| `contracts` 🟨 | `id`, `world_id`, `from_company`, `to_company`, `template_id`, `terms` (jsonb), `status` (`offered`/`accepted`/`rejected`/`countered`), `round` | tek u drugom koraku (agencija) |

Kodovi: `join_code` je 6 znakova bez sličnih slova (0/O, 1/l/I). Profesorski kod ima 12 znakova i u bazi je samo
njegov SHA-256 sažetak, kao i token igrača.

## 5 · Sadržaj (paketi simulacija)

Svaka vrsta tvrtke je **paket** u `content/<kind>/` (JSON u repou, ne u bazi):

- `metrics.json`: pet pokazatelja (hotel: zadovoljstvo gostiju, recenzije, zaposlenici, operativa, financije),
  raspon 0–100.
- `profiles.json`: 3 početna profila s **istim zbrojem** (npr. 250), drukčije raspoređenim.
- `situations.json`: predlošci situacija. Predložak ima: `id`, `title`, `text`, `area`, `difficulty` (1–5),
  `character` (ime, uloga, osobnost, cilj; ako ga nema, nema razgovora ni vlastitog odgovora), `rubric` (5 kriterija),
  `options` (3–4 ponuđena odgovora, svaki s popisom kriterija koje ispunjava), `effects` (koji pokazatelj i koliko po
  koraku kvalitete).

**Svaka situacija u demou ima lika** (moja odluka): bez lika nema vlastitog odgovora, a vlastiti odgovor je srž
pitcha. Situacija bez lika ostaje mogućnost u formatu, ali je u demou ne koristimo.

Za demo: **hotel 8–10 situacija** (Leon piše iz HotelixSim iskustva), **agencija 4–5** 🟨. Situacije u krugu bira
motor iz `seed` svijeta i broja kruga (ne iz stanja tvrtke), pa **svi u istom svijetu dobiju iste situacije u
istom krugu** (moja odluka; usporedivo za profesora).

**Početni profil** (moja odluka): tri profila s istim zbrojem dodjeljuju se redom ulaska (1., 2., 3., pa opet 1.).
„Isti početak" znači isti zbroj, ne iste brojke. **Vrsta tvrtke**: profesor pri stvaranju bira vrste; ako ih je
više, dodjeljuju se naizmjence redom ulaska. Kod i ekrani od početka nose `kind`, i kad postoji samo hotel.

## 5a · Pojednostavljeni HotelixSim (što ostaje, što otpada)

| HotelixSim danas | Simpolis demo |
| --- | --- |
| pregled hotela, pokazatelji, KPI (ADR, RevPAR) | **ostaje**, na jednom ekranu „Moja tvrtka": 5 pokazatelja (početak prema sada) + popunjenost, ADR, RevPAR |
| situacije, razgovor s likom, presuda, mentor | **ostaje** (srž) |
| plan po odjelima (cijene, sezonci, održavanje, obnova) | **pojednostavljeno** 🟨: plan kruga s 3 odluke: cijena sobe, broj zaposlenika, ulaganje u marketing |
| račun dobiti po USALI | **pojednostavljeno** 🟨: prihod, troškovi (plaće, marketing, fiksni), dobit kruga |
| tjedni ili mjesečni krug, sezona lipanj–rujan | krug = jedan mjesec, sezona = 4 kruga (lipanj–rujan) 🟨 |
| odjeli, obnova, banka ljudi, likovi s izgledom, roboti | **otpada** (lik ima ime, ulogu i inicijale u krugu) |
| igrač protiv 3 robota | **zamijenjeno** razredom: studenti jedni protiv drugih u istom svijetu |

**Jednostavna ekonomija hotela** 🟨 (motor, cijeli brojevi, novac u eurima): popunjenost ovisi o cijeni
(prema tržišnoj), recenzijama i marketingu; prihod = sobe × popunjenost × cijena × dani; troškovi = zaposlenici ×
plaća + marketing + fiksni. Broj zaposlenika utječe na pokazatelje *zaposlenici* i *operativa*. Ugovor s agencijom
(§1) daje zajamčene noćenja po nižoj cijeni, pa se uklapa u istu formulu. Točne formule i brojke piše Leon.

## 6 · Motor (čiste funkcije, `lib/engine/`)

Bez baze, mreže i AI-ja; testira se jediničnim testovima.

- `createCompany(kind, profileIndex)` → početni pokazatelji.
- `drawSituations(seed, round, kind)` → 2–3 predloška po krugu.
- `qualityFromClick(option)` → broj kriterija opcije, **najviše 4**.
- `qualityFromVerdict(criteriaMet)` → 0–1 kriterij = 1 … 5 kriterija = 5.
- `isCopiedOption(text, options)` → ≥ 70 % istih riječi (mala slova, bez interpunkcije i kvačica) = klik.
- `applyRound(metrics, answers, templates)` → nove vrijednosti: za svaku situaciju `(quality − 3) × effect`,
  ograničeno na 0–100. Neodgovorena situacija = kvaliteta 1.
- 🟨 `applyPlan(metrics, plan, market)` → popunjenost, prihod, troškovi, dobit kruga i učinak na pokazatelje.
- `progress(start, now)` → zbroj razlika pokazatelja; ljestvica se slaže po napretku.
- 🟨 `applyContract(contract, hotel, agency)` → učinak prihvaćenog ugovora na obje tvrtke pri zatvaranju kruga.

## 7 · AI sloj (`lib/ai/`)

| Poziv | Model | Ulaz | Izlaz | Rezerva ako AI padne |
| --- | --- | --- | --- | --- |
| **Lik** | Haiku | lik iz predloška, situacija, dosadašnji razgovor | odgovor u ulozi (stream), najviše 6 studentovih poruka | poruka „lik trenutno ne odgovara" |
| **Presuda** | Sonnet | situacija, rubrika, studentov tekst, razgovor | `{ criteriaMet: string[], reasoning: string }` (zod shema) | kvaliteta 3 |
| **Mentor** | Sonnet | situacije kruga, odgovori, kvalitete, promjene pokazatelja | kratak osvrt na hrvatskom: što je bilo dobro, što ne i zašto | tekst iz predloška po brojkama |

Promptovi su u `prompts/*.md`, verzionirani. Mentor **ne smije** dati „točan odgovor" za buduće situacije, samo
objasniti razloge. Kriterij smije biti ispunjen i u razgovoru s likom.

**Kako se načini odgovora slažu** (moja odluka):
- Razgovor se računa **samo uz vlastiti odgovor**: presuda tada vidi tekst i razgovor. Klik nakon razgovora je
  klik (najviše 4), presuda se ne zove.
- Odgovor na situaciju je **jednokratan**; nakon odgovora razgovor se zatvara i odgovor se ne mijenja.

## 8 · API

Svi odgovori su JSON. Student se prepoznaje po kolačiću, profesor po kodu u putanji.

**Profesor**

| Metoda i putanja | Što radi |
| --- | --- |
| `POST /api/worlds` `{name, kinds}` | stvori svijet → `{joinCode, profCode}` |
| `GET /api/prof/[profCode]` | stanje svijeta: krug, rok, tvrtke s napretkom i tko je zatvorio krug |
| `POST /api/prof/[profCode]/round` `{deadlineMinutes?}` | otvori sljedeći krug (ručno ili s odbrojavanjem) |
| `GET /api/prof/[profCode]/companies/[id]` | uvid u razmišljanje: odgovori, razgovori, presude, mentor |
| `POST /api/prof/[profCode]/finish` | završi igru, konačna ljestvica |

**Student**

| Metoda i putanja | Što radi |
| --- | --- |
| `POST /api/join` `{joinCode, name}` | uđi u svijet, dobij tvrtku → kolačić |
| `GET /api/me` | moja tvrtka, pokazatelji, krug, rok, situacije, ljestvica |
| `POST /api/situations/[id]/chat` `{message}` | razgovor s likom (stream) |
| `POST /api/situations/[id]/answer` `{optionId}` ili `{text}` | odgovor → kvaliteta i presuda |
| `POST /api/me/close-round` | zatvori svoj krug → izvještaj i mentor |
| 🟨 `POST /api/contracts`, `POST /api/contracts/[id]/respond` | ponuda i odgovor na ugovor |

**Pravila kruga** (kao HotelixSim ADR-037): profesor otvara krug k. Student igra krug k i zatvara ga kad je
spreman; njegova tvrtka se tada obračuna i on odmah vidi rezultat i mentora. Kad istekne rok, poslužitelj pri
sljedećem čitanju zatvori sve otvorene krugove (neodgovoreno = kvaliteta 1). Nitko ne ide ispred otvorenog kruga.

## 9 · Ekrani

| Putanja | Tko | Što |
| --- | --- | --- |
| `/` | svi | ulaz kodom i imenom; poveznica „Ja sam profesor" |
| `/profesor/novi` | profesor | naziv svijeta, vrste tvrtki → prikaz oba koda |
| `/profesor/[profCode]` | profesor | ploča uživo: krug, odbrojavanje, gumb „Otvori krug", popis tvrtki (status, napredak), ljestvica |
| `/profesor/[profCode]/tvrtka/[id]` | profesor | uvid u razmišljanje jednog studenta |
| `/igra` | student | moja tvrtka: pokazatelji (početak prema sada), popunjenost/ADR/RevPAR, situacije kruga, „Zatvori krug", ljestvica |
| `/igra/plan` 🟨 | student | plan kruga: cijena sobe, zaposlenici, marketing, uz procjenu troška |
| `/igra/financije` 🟨 | student | prihod, troškovi i dobit po krugu |
| `/igra/situacija/[id]` | student | situacija, ponuđeni odgovori, vlastiti odgovor, razgovor s likom |
| `/igra/izvjestaj/[krug]` | student | promjene pokazatelja i mentorov osvrt |

Sučelje je na hrvatskom i **responsive**: mobitel (jedan stupac, donja navigacija), tablet i računalo (bočna
navigacija, dva stupca), projektor za profesorovu ploču (velika slova). Svaki ekran se provjerava na 375 px,
768 px i 1440 px širine.

**Izgled** kao HotelixSim: font Plus Jakarta Sans, bijele kartice zaobljene 20 px na svijetloplavoj podlozi,
naglasak plava `#246bfd`, rast zelena `#0f7a3c`, pad crvena `#c42626`, upozorenje jantar `#a16207`, pomoćne podloge
pijesak `#f4e8d5` i menta `#d8f0ee`. Boje kao Tailwind tokeni, ne heks u komponentama. Ikone `lucide-react`.
Svaki broj ima ime i jedinicu (€, %, /100).

## 9a · Wow sloj

Ono što žiri pamti. Svaka stavka gradi se na podacima koje glavni tok već ima, pa ne traži novu arhitekturu.
Oznaka **W1** znači da ide u pitch (radi se odmah nakon glavnog toka), a **W2** da je dodatak ako ostane vremena.

| # | Što | Kako radi | Zašto wow | Tko | h |
| --- | --- | --- | --- | --- | --- |
| **W1-a** | **Živa karta Simpolisa** | SVG grad: svaka tvrtka je zgrada (hotel, agencija). Boja i visina prate napredak, zgrada zasvijetli kad student zatvori krug, ugovori su animirane linije između zgrada. Na projektoru je profesorova ploča | cijeli razred vidi svoj svijet kako živi | Rino | 3–4 |
| **W1-b** | **Sokratski mentor** | prije objašnjenja mentor postavi **jedno pitanje** („Što misliš, zašto je gost i dalje ljut?"). Student odgovori, a mentor tek onda objasni i nadoveže se na njegov odgovor. Refleksija ne nosi bodove, ali je profesor vidi | AI ne daje odgovor, nego tjera na razmišljanje: tema doslovno | Simon | 2 |
| **W1-c** | **Lik zna kad prepisuješ** | sučelje broji zalijepljene znakove u polju odgovora. Ako je više od pola teksta zalijepljeno ili je prepisan ponuđeni odgovor, odgovor se računa kao klik, a lik reagira u ulozi („Zvučite kao brošura. Recite mi vi, svojim riječima.") | gotov odgovor iz ChatGPT-a ne prolazi, a igra to kaže na duhovit način | Rino + Simon | 1 |
| **W1-d** | **Simulator unaprijed** | isti motor (čiste TS funkcije) radi i u pregledniku: dok student pomiče cijenu ili broj zaposlenika, odmah vidi procjenu popunjenosti i dobiti. Poslužitelj pri zatvaranju kruga računa istom funkcijom | student istražuje „što ako" umjesto da pogađa; tehnički elegantno, jedan kod na dva mjesta | Leon | 1 |
| **W1-e** | **Radar vještina** | svaki kriterij rubrike nosi vještinu (empatija, komunikacija, financije, rješavanje problema, etika). Iz presuda se slaže radar po studentu i za cijeli razred („70 % razreda ne ponudi naknadu") | praćenje napretka iz teme; profesor vidi **što** razred ne zna, ne samo bodove | Leon (podaci) + Rino (graf) | 2–3 |
| **W2-a** | **Šok gumb** | profesor pokrene događaj za cijeli svijet (oluja, štrajk, viralna loša recenzija): sve tvrtke dobiju istu situaciju odjednom, a karta bljesne | profesor upravlja svijetom uživo, pred žirijem | Leon | 2 |
| **W2-b** | **Simpolis novine** | na kraju kruga AI (Haiku) iz događaja svijeta napiše naslovnicu: „Hotel Kvarner i agencija Adria potpisali ugovor", „Val pritužbi u Hotelu Lungomare". Na karti teče kao vijesti | svijet ima priču, zabavno na projektoru | Simon | 1 |
| **W2-c** | **Razgovor glasom** | gumb mikrofona uz razgovor s likom (Web Speech API u Chromeu); student govori gostu kao na recepciji | najbliže pravoj situaciji | Rino | 1 |

**Tehnička podloga wow sloja** (sve od prvog sata, jeftino):
- Tablica `events` (samo dodavanje): `world_id`, `company_id`, `round`, `type`, `payload`, `at`. Svaka radnja
  (ulaz, odgovor, zatvaranje kruga, ugovor, šok) upiše jedan redak. Iz nje čitaju karta, novine i radar, a kasnije
  i **replay sezone**.
- Kriterij rubrike u `situations.json` ima polje `skill`.
- Motor je jedan paket koji uvoze i poslužitelj i preglednik (`lib/engine/` bez ovisnosti o Node.js-u).

## 10 · Struktura repoa

```
app/            ekrani i app/api/* (Rino ekrani, backend rute)
lib/engine/     motor, čiste funkcije + testovi
lib/ai/         lik, presuda, mentor
lib/db/         Supabase klijent i upiti
content/hotel/  paket hotela (JSON)
content/agency/ paket agencije (JSON) 🟨
prompts/        promptovi
supabase/       migracije (SQL)
```

Granice datoteka po ljudima su u [RADNI-DOGOVOR.md](RADNI-DOGOVOR.md), da se troje ljudi ne sudara.

## 11 · Ugovor između frontenda i backenda

Rino ne čeka backend: tipovi odgovora API-ja su u `lib/types.ts` (pišu se **prvi**), a dok rute ne rade, ekrani
čitaju lažne podatke iz `lib/mock.ts`. Kad ruta proradi, zamjena je jedna linija.

## 12 · Rizici

| Rizik | Što radimo |
| --- | --- |
| AI spor ili padne na demou | rezerve u §7; snimka demoa čim glavni tok radi |
| Presuda nepredvidiva | rubrika s 5 jasnih kriterija, strukturirani izlaz, temperatura 0 |
| Preveliki opseg (agencija, ugovori) | agencija i ugovori kreću tek kad hotel radi od početka do kraja |
| Sukobi u gitu | podjela po mapama, merge svaka 2–3 sata |
| Trošak AI-ja | najviše 6 poruka po razgovoru, Haiku za lik |
