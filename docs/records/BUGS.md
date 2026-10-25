# Bugovi i lekcije

Aktivni gore, riješeni dolje (najnoviji riješeni na vrhu). Bug prijavi dokumentaristu porukom `[BUG]` jednim
retkom ([SESIJE.md](../workflow/SESIJE.md)) ili issueom.

**Format:** ID · status (🔴 otvoren · 🟡 u radu · ✅ riješen) · težina (kritičan / visok / srednji / nizak) ·
opis · uzrok · rješenje · **lekcija**.

---

## Aktivni

### BUG-069 · Istekla ponuda u Pošti ostaje „nepročitana" bez oznake isteka
- **Status:** 🔴 otvoren (Rino) · **Težina:** nizak
- **Opis:** tester (jutro nakon čišćenja, produkcija; 🟨 točno vrijeme): ponuda kojoj je istekao rok ostaje u Pošti označena kao „nepročitana", bez
  oznake da je istekla.
- **Rješenje:** —
- **Lekcija:** —

### BUG-067 · Lokalni smoke ostavio 5 testnih igara u zajedničkoj bazi
- **Status:** 🔴 otvoren (graditelj čisti) · **Težina:** nizak
- **Opis:** integratorov agent je u 08:01 CET lokalnim smokeom ostavio 5 igara „Smoke …" u zajedničkoj bazi, preko
  [ADR-055](DECISIONS.md#adr-055) (najviše 3 testne igre).
- **Rješenje:** —
- **Lekcija:** smoke na zajedničkoj bazi stvara igre; nakon smokea počisti ih ili koristi postojeće testne igre.

### BUG-066 · Javni pogled hotela za bota pokazuje referentnu cijenu do zatvaranja mjeseca
- **Status:** 🔴 otvoren (Simon, ujutro) · **Težina:** nizak
- **Opis:** tester (~04:28 CET, produkcija): javni pogled hotela (`/api/world/[worldId]/companies`) za bota pokazuje
  zadanu (referentnu) cijenu, jer bot plan sprema tek pri zatvaranju mjeseca; npr. Bonavia 94 € uz 100 % popunjenost,
  a prihod po noćenju raste. Graditelj (~04:31 CET): stvarna cijena bota je ±5 % od referentne, pa žiri razliku ne
  može vidjeti.
- **Uzrok:** `loadPublicViews` čita planove tekućeg mjeseca (`src/lib/game/public.ts:85`); bot za tekući mjesec još
  nema retka, pa `toPlan` vraća referentnu cijenu (`src/lib/game/city.ts:233`); `playOneBot` sprema plan tek pri
  zatvaranju mjeseca (`src/lib/game/bots.ts:242–245`).
- **Rješenje:** —
- **Lekcija:** javni prikaz treba čitati isti podatak koji koristi obračun.

### BUG-065 · Na 2560 px ploča ostaje 1600 px, a fontovi nemaju `2xl` stupanj
- **Status:** 🔴 otvoren (Rino) · **Težina:** nizak
- **Opis:** tester (~04:16 CET, produkcija, projektor 2560 px): na 2560 px sadržaj ploče profesora ostaje 1600 px
  (`xl:max-w-[1600px]` u `src/components/app-frame.tsx:21`), a veličine slova nemaju `2xl` stupanj
  (`src/components/leaderboard.tsx`, `src/components/round-podium.tsx`), pa je sve sitno. Usp.
  [BUG-055](#bug-055--sitnice-prikaza-na-projektoru-završi-sezonu-podij-na-2560-px-kartice-botova) (2).
- **Rješenje:** —
- **Lekcija:** —

### BUG-064 · Zaglavlje ploče profesora ostaje 1152 px, a ploča 1600 px
- **Status:** 🔴 otvoren (Rino) · **Težina:** nizak
- **Opis:** tester (~04:16 CET, produkcija, projektor 1920 px): na `/profesor/[worldId]` zaglavlje ostaje 1152 px
  (`max-w-6xl` u `src/components/site-header.tsx:39`), a ploča ispod njega 1600 px ([#264](https://github.com/leonkreso784-bit/riihack/pull/264)).
- **Rješenje:** —
- **Lekcija:** —

### BUG-062 · Sitnice sučelja: prazan panel „Odgovor" u Tokovima, natpisi na karti, stari URL situacije
- **Status:** 🔴 otvoren (Rino) · **Težina:** nizak
- **Opis:** tester (~02:50 CET, put žirija na probnoj igri `HYSJV5`): (1) panel „Odgovor" u Tokovima situacije je prazan
  (🟨 potvrditi datoteku); (2) na karti `/igra/grad` natpisi se na 1440 px preklapaju i prekrivaju hotel
  (`src/app/igra/grad/page.tsx`, 🟨 potvrditi redak); (3) stari URL situacije javlja „Ova situacija nije tvoja ili više
  ne postoji" (`src/app/igra/situacija/[id]/page.tsx:37`).
- **Rješenje:** —
- **Lekcija:** —

### BUG-061 · Sitni tekstovi: fiksni mjesec u situaciji i AI prijedlogu, padeži i množina
- **Status:** 🔴 otvoren (Simon; dio Simon/Rino) · **Težina:** nizak
- **Opis:** tester (~02:50 CET, put žirija na probnoj igri `HYSJV5`). **Simon:** situacija „Agencija traži veliki
  popust za grupu" fiksno kaže „u lipnju" (`src/content/situations.json:254`), a AI prijedlog u kolovozu kaže „u
  srpnju" jer dobiva mjesec zadnjeg obračuna (`src/lib/ai/propose.ts:48–50`). **Simon/Rino:** lik oslovljen vokativom
  „Davore"; „u hotel Hotel Žiri" (`u hotel {hotel}` u `src/content/situations.json`); „61 noćenja" bez množine
  (`src/components/city/contract-offers.tsx:25`, 🟨 potvrditi je li to taj ekran); uloga „Zaposlenik" za Ivanu
  (🟨 potvrditi datoteku); Tokovi „razgovor s likom Davor Bilić" bez padeža
  (`src/app/igra/situacija/[id]/tok/page.tsx:41`).
- **Rješenje:** —
- **Lekcija:** —

### BUG-056 · Ponovni uvoz playbooka javlja „Uvezeno 5 situacija" iako nije dodana nijedna
- **Status:** 🔴 otvoren (Rino ili graditelj ako bude vremena) · **Težina:** nizak
- **Opis:** graditelj (~02:35 CET): ponovni uvoz istog playbooka javlja „Uvezeno 5 situacija", a dodano je 0. Nastavak
  [BUG-046](#bug-046--dvostruki-uvoz-playbooka-udvostruči-situacije-u-igri) (riješen u [#262](https://github.com/leonkreso784-bit/riihack/pull/262)). Tester potvrdio (~02:45 CET).
- **Uzrok:** `src/app/profesor/[worldId]/situacije/page.tsx:108` broji `pb.situations.length`; broj preskočenih
  (`skipped`) ide samo u događaj `playbook.imported`, odgovor ga ne nosi.
- **Rješenje:** — (prijedlog: brojati razliku broja situacija prije i poslije uvoza)
- **Lekcija:** —

### BUG-055 · Sitnice prikaza na projektoru: „Završi sezonu", podij na 2560 px, kartice botova
- **Status:** 🔴 otvoren (Rino) · **Težina:** nizak
- **Opis:** tester (ned 02:37–~02:54, produkcija, projektor 1920 i 2560 px): (1) gumb „Završi sezonu" stoji sam u drugom redu (`src/components/prof-board.tsx:179`);
  (2) podij mjeseca na 2560 px je malen, ograničen na `max-w-4xl` (`src/components/round-podium.tsx:70`);
  (3) kartice botova u čekaonici režu ime (🟨 potvrditi datoteku).
- **Rješenje:** —
- **Lekcija:** —

### BUG-050 · Lik oslovljava studenticu s „Gospodine"
- **Status:** 🔴 otvoren (Simon, AI) · **Težina:** nizak
- **Opis:** tester (ned 02:18–02:36, produkcija): lik u razgovoru studenticu oslovljava s „Gospodine".
- **Rješenje:** —
- **Lekcija:** —

### BUG-048 · Kartica „Agencije" u Pošti prikazuje i praonicu i zaštitare
- **Status:** 🔴 otvoren (Rino) · **Težina:** nizak
- **Opis:** tester (ned 02:18–02:36, produkcija): kartica „Agencije" u Pošti uz agencije prikazuje i praonicu i
  zaštitare.
- **Rješenje:** —
- **Lekcija:** —

### BUG-044 · `/igra/sobe`: podnaslov ne broji sobu na čišćenju, množina kriva
- **Status:** 🔴 otvoren (Rino) · **Težina:** nizak
- **Opis:** tester (ned 02:18–02:36, produkcija): podnaslov stranice Sobe ne broji sobe na čišćenju, pa zbroj ne
  odgovara ukupnom broju soba, a množina je kriva.
- **Uzrok:** `src/app/igra/sobe/page.tsx:29` (podnaslov broji samo zauzete, slobodne i u kvaru; fiksni oblici riječi).
- **Rješenje:** —
- **Lekcija:** svaki tekst s brojem ide kroz istu funkciju za množinu.

### BUG-040 · Test botova „radi istodobno" ovisi o brzini stroja
- **Status:** 🔴 otvoren · **Težina:** nizak · **Vlasnik:** Simon
- **Opis:** graditelj (ned ~02:25): test `src/lib/game/bots.test.ts:118` „radi istodobno" mjeri stvarno vrijeme
  (< 300 ms), pa pod opterećenjem stroja može pasti (jednom kod integratora; 22/22 prolaza pri provjeri).
- **Uzrok:** test ovisi o stvarnom vremenu izvođenja.
- **Prijedlog:** prag 400 ms ili bez mjerenja vremena (test „nikad ne prelazi granicu" već pokriva istodobnost).
- **Rješenje:** —
- **Lekcija:** test ne smije ovisiti o brzini stroja.

### BUG-035 · Botovi: „(bot)" dvaput, „Moje igre" ih broji kao studente
- **Status:** 🟡 dio riješen ([#255](https://github.com/leonkreso784-bit/riihack/pull/255), 02:39); broj studenata bez botova: tester potvrdio (02:13 CET); dvostruko „(bot)" Rino · **Težina:** nizak
- **Opis:** tester (ned ~00:55, produkcija): bot ima „(bot)" u imenu i uz to značku „bot"; „Moje igre" botove broji
  kao studente.
- **Rješenje:** graditelj, [#255](https://github.com/leonkreso784-bit/riihack/pull/255): broj studenata u „Moje igre" bez botova. Dvostruko „(bot)" je Rinov prikaz
  (vlasnik Rino, nije u #255).
- **Lekcija:** —

### BUG-031 · Ploča profesora nakon pokretanja opet nema kod igre
- **Status:** 🔴 otvoren, ne radi se prije predaje ([ADR-051](DECISIONS.md#adr-051)) · **Težina:** nizak (Leon
  ~01:10; bilo visok)
- **Opis:** tester (ned ~00:53, produkcija, 1280×720, QA igra): nakon „Pokreni" ploča nema ni kod igre ni QR; kod
  je samo na „Moje igre". Regresija [BUG-021](#bug-021--ploča-profesora-nema-puta-natrag-ni-koda-igre-nakon-početka).
- **Uzrok:** Rinov `1efbe71` ([#216](https://github.com/leonkreso784-bit/riihack/pull/216), 23:08) maknuo je redak
  „Kasniš? Uđi na /ulaz s kodom …" s ploče, a kasni ulaz je proradio tek s #221 (23:26). Na `main`-u
  `prof-board.tsx` više ne prikazuje `joinCode`; ni otvoreni #237 ga ne vraća.
- **Rješenje:** Leon (~01:10): kod i QR na ploči nakon pokretanja nisu potrebni, profesor vidi tko je ušao.
- **Lekcija:** kad se nešto makne sa sučelja, provjeri oslanja li se na to drugi tok (ovdje kasni ulaz).

### BUG-028 · Mentor je spor ili ne odgovori
- **Status:** 🟡 na API-ju brzo ([#231](https://github.com/leonkreso784-bit/riihack/pull/231), 00:28); tester još
  provjerava sučelje u pregledniku · **Težina:** visok (žiri u izvještaju mjeseca čeka mentora)
- **Opis:** Leon (~00:30): u izvještaju mjeseca i kod odgovora mentoru mentor je jako spor ili uopće ne odgovori.
- **Uzrok (graditelj iz koda):** mentor je Sonnet 5.5; svaki AI poziv ima rok 20 s (`AI_TIMEOUT_MS`,
  `src/lib/ai/client.ts:13`) i jedan ponovni pokušaj, a `POST /api/me/reflection` redom zove pitanje mentora (ako ga
  još nema) pa osvrt, pa student u najgorem slučaju čeka 40+ s. Osvrt je uz to u 9 od 15 pokušaja bio odbijen zbog
  broja rečenica i padao na fiksni tekst (Simon).
- **Rješenje:** #231 (Simon): osvrt više ne pada na fiksni tekst (15/15, 3–4,5 s po pokušaju).
- **Mjerenje na produkciji (tester, ~00:46, API, QA igra, 4 mjeseca):** pitanje mentora 1,9–4,1 s, osvrt 4,3–5,0 s,
  0 od 4 osvrta fiksni tekst; zatvaranje mjeseca s 2 bota 4,6–5,7 s. Ispod granice od ~10 s; ako sučelje u
  pregledniku ipak čeka dulje, vlasnik je Simon (AI), uz graditelja za rutu.
- **Lekcija:** AI poziv na putu korisnika treba mjeriti na produkciji (vrijeme i udio rezervnih odgovora); stroga
  provjera izlaza bez mjerenja tiho pretvori pravi odgovor u fiksni tekst.

### BUG-006 · `db:push` predlaže pražnjenje tablica `situations` i `contracts`
- **Status:** 🟡 zaobiđeno pravilom, alat nije popravljen · **Težina:** kritičan (gubitak podataka na zajedničkoj
  bazi), uhvaćeno prije upisa, podaci netaknuti
- **Opis:** sub ~16:25 `npm run db:push` (drizzle-kit) za L12 na zajedničkoj Neon bazi predlaže pražnjenje tablica
  `situations` (120 redaka) i `contracts` (40 redaka). Agent je stao prije potvrde.
- **Uzrok:** drizzle-kit krivo čita postojeća unique ograničenja i misli da tablice treba stvoriti iznova.
- **Rješenje:** nitko ne pokreće `db:push`; shema se mijenja ručnim aditivnim SQL-om koji pregleda Leonov graditelj
  ([ADR-026](DECISIONS.md#adr-026)).
- **Lekcija:** na bazi koju dijeli cijeli tim alat koji „usklađuje" shemu može predložiti brisanje. Svaku promjenu
  sheme pročitaj kao SQL prije upisa i radi samo dodavanja.

## Riješeni

### BUG-070 · Nova stranica `/igra/mentor`
- **Status:** ✅ riješen 25.10. 09:33 CET ([#285](https://github.com/leonkreso784-bit/riihack/pull/285), Rino) · **Težina:** nizak
- **Opis:** svi razgovori s mentorom po mjesecima, najnoviji gore, odgovor na pitanje koje čeka; bez promjene baze i API-ja (opis #285). Oznaku je dao Rino u #285 (dorada sučelja, ne prijava s testa).
- **Rješenje:** `/igra/mentor`; izbornik „Mentor" (ispod Pošte, nakon prvog mjeseca) vodi tamo, izvještaj mjeseca ima poveznicu „Razgovor s mentorom".
- **Lekcija:** —

### BUG-071 · Financije u dvije kartice
- **Status:** ✅ riješen 25.10. 09:33 CET ([#285](https://github.com/leonkreso784-bit/riihack/pull/285), Rino) · **Težina:** nizak
- **Opis:** Financije podijeljene na Pregled i Obračun po mjesecima (opis #285). Oznaku je dao Rino u #285 (dorada sučelja, ne prijava s testa).
- **Rješenje:** **Pregled** (kartice i stanje kroz sezonu) i **Obračun po mjesecima** (sažetak i „Kako je izračunat mjesec").
- **Lekcija:** —

### BUG-072 · Objašnjenja „?" uz nazive
- **Status:** ✅ riješen 25.10. 09:33 CET ([#285](https://github.com/leonkreso784-bit/riihack/pull/285), Rino) · **Težina:** nizak
- **Opis:** „?" uz naziv na Hotelu, Financijama i izvještaju, otvara se klikom ili Enterom, radi na mobitelu (opis #285). 🟨 Leon pregledava tekstove. Oznaku je dao Rino u #285 (dorada sučelja, ne prijava s testa).
- **Rješenje:** komponenta `Hint`, svi tekstovi u `src/lib/hints.ts`.
- **Lekcija:** —

### BUG-073 · Hotel u dva stupca, bez rupe ispod Pokazatelja
- **Status:** ✅ riješen 25.10. 09:33 CET ([#285](https://github.com/leonkreso784-bit/riihack/pull/285), Rino) · **Težina:** nizak
- **Opis:** raspored Hotela od xl imao je rupu ispod Pokazatelja (opis #285). Oznaku je dao Rino u #285 (dorada sučelja, ne prijava s testa).
- **Rješenje:** dva neovisna stupca od xl, na mobitelu isti redoslijed kao prije; „Ponude grada" vodi u Poštu.
- **Lekcija:** —

### BUG-074 · „Rast prihoda" za prvi mjesec
- **Status:** ✅ riješen 25.10. 09:33 CET ([#285](https://github.com/leonkreso784-bit/riihack/pull/285), Rino) · **Težina:** nizak
- **Opis:** „Rast prihoda" za prvi mjesec pisao je „·" (opis #285). Oznaku je dao Rino u #285 (dorada sučelja, ne prijava s testa).
- **Rješenje:** za prvi mjesec piše „prvi mjesec".
- **Lekcija:** —

### BUG-068 · Mentorov osvrt piše privremene brojke prije obračuna grada
- **Status:** ✅ riješen 25.10. 09:01 CET ([#280](https://github.com/leonkreso784-bit/riihack/pull/280), [ADR-057](DECISIONS.md#adr-057): osvrt se piše tek nakon obračuna); tester potvrdio #280 (09:08 CET) · **Težina:** nizak
- **Opis:** tester (jutro nakon čišćenja, produkcija; 🟨 točno vrijeme): mentorov osvrt nastaje prije obračuna grada, pa piše privremene brojke; u
  osvrtu „Financije 28/100 (+4)", a konačni izvještaj 24 → 33 (+9). Usp.
  [BUG-032](#bug-032--izvještaj-mjeseca-mentor-i-podij-ne-vide-obračun-grada) i
  [BUG-059](#bug-059--izvještaj-3-mjeseca-nakon-završi-sezonu-i-dalje-piše-brojke-su-privremene).
- **Rješenje:** [#280](https://github.com/leonkreso784-bit/riihack/pull/280): mentor sam piše osvrt kad je mjesec obračunat, iz konačnih brojki motora.
- **Lekcija:** tekst koji opisuje brojke piši tek kad su brojke konačne.

### BUG-063 · Botovi ostaju na cijeni 1. mjeseca jer im se prenosi plan
- **Status:** ✅ riješen 25.10. 04:24 CET ([#272](https://github.com/leonkreso784-bit/riihack/pull/272), graditelj) · **Težina:** visok (igre s botovima; žiri dodaje botove u čekaonici)
- **Opis:** našao Simon (u nacrtu PR-a [#268](https://github.com/leonkreso784-bit/riihack/pull/268)), javio graditelj ~04:10 CET: od [#241](https://github.com/leonkreso784-bit/riihack/pull/241) se plan
  prenosi i botovima, pa bot više ne planira i ostaje na cijeni 1. mjeseca; poticaj botova iz
  [ADR-044](DECISIONS.md#adr-044) ne radi.
- **Uzrok:** prijenos plana iz [#241](https://github.com/leonkreso784-bit/riihack/pull/241) ([ADR-050](DECISIONS.md#adr-050)), `carryPlansForward`
  (`src/lib/game/city.ts:245`), ne razlikuje botove; `playOneBot` planira samo kad plana nema
  (`src/lib/game/bots.ts:242`).
- **Rješenje:** [#272](https://github.com/leonkreso784-bit/riihack/pull/272): plan iz prethodnog mjeseca prenosi se samo studentskim hotelima; bot planira sam svaki
  mjesec. Simonov dodatak u `bots.ts` ([#268](https://github.com/leonkreso784-bit/riihack/pull/268)) nije potreban.
- **Lekcija:** kad se promijeni zajednički korak (otvaranje mjeseca), provjeri sve tipove igrača koji kroz njega
  prolaze, i botove.

### BUG-059 · Izvještaj 3. mjeseca nakon „Završi sezonu" i dalje piše „Brojke su privremene"
- **Status:** ✅ riješen 25.10. 04:19 CET ([#271](https://github.com/leonkreso784-bit/riihack/pull/271), graditelj); tester potvrdio (~04:28 CET): napomena nestaje 2,6 s nakon „Završi sezonu" i nakon ponovnog učitavanja · **Težina:** srednji
- **Opis:** tester (~02:50 CET, put žirija na probnoj igri `HYSJV5`): nakon „Završi sezonu" izvještaj 3. mjeseca i
  dalje piše „Brojke su privremene; konačne su nakon što profesor zatvori mjesec." Napomenu je uveo [#262](https://github.com/leonkreso784-bit/riihack/pull/262)
  ([BUG-043](#bug-043--izvještaj-mjeseca-odmah-nakon-završi-pokazuje-privremene-brojke)). Tester ponovno potvrdio (~04:16 CET).
- **Uzrok:** `src/app/igra/izvjestaj/[krug]/page.tsx:49` gleda samo `world.round === round`, ne i kraj sezone.
- **Rješenje:** [#271](https://github.com/leonkreso784-bit/riihack/pull/271): napomena „Brojke su privremene…" prikazuje se samo dok je mjesec privremen.
- **Lekcija:** —

### BUG-058 · Tokovi mjeseca za kasnog studenta: „Obračun… još nije gotov" za mjesec prije ulaska
- **Status:** ✅ riješen 25.10. 04:19 CET ([#271](https://github.com/leonkreso784-bit/riihack/pull/271), graditelj); tester potvrdio (~04:28 CET) · **Težina:** nizak
- **Opis:** tester (~02:45 CET, produkcija): `/igra/izvjestaj/1/tok` za kasnog studenta piše „Obračun za ovaj mjesec
  još nije gotov" za mjesec prije njegova ulaska (`src/app/igra/izvjestaj/[krug]/tok/page.tsx:55–57`); dolazi se samo
  ručnom adresom. Izvještaj istog mjeseca to već kaže točno ([BUG-049](#bug-049--kasni-student-vidi-krug-nije-zatvoren-za-mjesec-prije-svog-ulaska), [#262](https://github.com/leonkreso784-bit/riihack/pull/262)).
- **Rješenje:** [#271](https://github.com/leonkreso784-bit/riihack/pull/271): Tokovi za mjesec prije ulaska kasnog studenta pišu „U tom mjesecu još nisi bio u igri".
- **Lekcija:** kad se doda novi slučaj (kasni ulaz), provjeri sve stranice koje čitaju isti podatak, i one do kojih
  se dolazi samo adresom.

### BUG-057 · Izvještaj otvoren dok profesor zatvara mjesec ostaje na privremenim brojkama
- **Status:** ✅ riješen 25.10. 04:19 CET ([#271](https://github.com/leonkreso784-bit/riihack/pull/271), graditelj); tester potvrdio (~04:28 CET): osvježi se 2,1 s nakon zatvaranja · **Težina:** nizak
- **Opis:** tester (~02:45 CET, produkcija): izvještaj mjeseca otvoren dok profesor zatvara mjesec zadrži privremene
  brojke do ručnog osvježavanja. Nastavak [BUG-043](#bug-043--izvještaj-mjeseca-odmah-nakon-završi-pokazuje-privremene-brojke).
- **Uzrok:** `src/app/igra/izvjestaj/[krug]/page.tsx:24–25`: izvještaj i stanje igre osvježavaju se svakih 10 min.
- **Rješenje:** [#271](https://github.com/leonkreso784-bit/riihack/pull/271): dok je mjesec privremen, izvještaj se osvježava svakih 15 s; dira Rinov `izvjestaj/[krug]/page.tsx` i Simonov `tok/page.tsx` po [ADR-054](DECISIONS.md#adr-054).
- **Lekcija:** ekran koji prikazuje privremeno stanje treba se sam osvježiti kad stanje postane konačno.

### BUG-060 · Podij „Skok mjeseca": 2. i 3. mjesto crveno kad padnu
- **Status:** ✅ riješen 25.10. 03:48 CET ([#264](https://github.com/leonkreso784-bit/riihack/pull/264), graditelj); tester potvrdio na projektoru (~04:16 CET) · **Težina:** srednji
- **Opis:** tester (~02:50 CET, put žirija na probnoj igri `HYSJV5`): na podiju „Skok mjeseca" 2. i 3. mjesto
  prikazuju crveni pad (`src/components/round-podium.tsx:44` poziva podij po `roundGain`, `Delta` na `:80`). Isto kao
  [BUG-051](#bug-051--podij-mjeseca-crvena--08-na-3-mjestu).
- **Rješenje:** [#264](https://github.com/leonkreso784-bit/riihack/pull/264): isti popravak kao [BUG-051](#bug-051--podij-mjeseca-crvena--08-na-3-mjestu); na podiju se pad prikazuje bez strelice, tamnim slovima na bijeloj pilulici.
- **Lekcija:** vidi [BUG-051](#bug-051--podij-mjeseca-crvena--08-na-3-mjestu).

### BUG-054 · Ploča profesora uživo stisnuta u 1120 px, ljestvica presitna za projektor
- **Status:** ✅ riješen 25.10. 03:48 CET ([#264](https://github.com/leonkreso784-bit/riihack/pull/264), graditelj); tester potvrdio na projektoru (~04:16 CET) · **Težina:** srednji
- **Opis:** tester (ned 02:37–~02:54, produkcija, projektor 1920 i 2560 px): ploča profesora uživo zauzima samo 1120 px širine ekrana (`max-w-6xl` u
  `src/components/app-frame.tsx:18`), a tekst ljestvice od 12 do 16 px (`src/components/leaderboard.tsx`) je presitan
  za projektor.
- **Rješenje:** [#264](https://github.com/leonkreso784-bit/riihack/pull/264): `AppFrame` samo za `/profesor/[worldId]` (čekaonica i ploča) daje `xl:max-w-[1600px]`, ostale stranice ostaju `max-w-6xl`; ljestvica na ploči dobiva `big` (samo `xl:`: ime 20 px, napredak 18 px, medalja 40 px). Studentska ljestvica ista.
- **Lekcija:** vidi [BUG-051](#bug-051--podij-mjeseca-crvena--08-na-3-mjestu).

### BUG-053 · Podij sezone na 1920×1080 viši od ekrana
- **Status:** ✅ riješen 25.10. 03:48 CET ([#264](https://github.com/leonkreso784-bit/riihack/pull/264), graditelj); tester potvrdio na projektoru (~04:16 CET) · **Težina:** srednji
- **Opis:** tester (ned 02:37–~02:54, produkcija, projektor 1920 i 2560 px): podij sezone (`src/components/round-podium.tsx:53`) na 1920×1080 visok je 1214 px, pa se ispod
  njega vide samo 3 reda ljestvice.
- **Rješenje:** [#264](https://github.com/leonkreso784-bit/riihack/pull/264): kompaktniji podij sezone; na `xl:` podij (`sticky`) i ljestvica stoje u dva stupca. Na 1920×960 podij je visok 444 px i stane oko 12 redova ljestvice.
- **Lekcija:** vidi [BUG-051](#bug-051--podij-mjeseca-crvena--08-na-3-mjestu).

### BUG-052 · Nakon kraja sezone ljestvica ispod podija crvena za mjesta 3–5
- **Status:** ✅ riješen 25.10. 03:48 CET ([#264](https://github.com/leonkreso784-bit/riihack/pull/264), graditelj); tester potvrdio na projektoru (~04:16 CET) · **Težina:** srednji
- **Opis:** tester (ned 02:37–~02:54, produkcija, projektor 1920 i 2560 px): nakon „Završi sezonu" ljestvica ispod podija prikazuje crveni napredak za mjesta 3–5
  (`src/components/leaderboard.tsx:58`, iz `src/components/prof-board.tsx:98`). Ostatak [BUG-022](#bug-022--kraj-sezone-na-projektoru-nema-podija-pobjednik-izgleda-kao-gubitnik): podij je
  neutralan, ljestvica nije.
- **Rješenje:** [#264](https://github.com/leonkreso784-bit/riihack/pull/264): `Leaderboard` dobiva `neutral`, a `prof-board` ga uključuje kad je sezona gotova (`world.status === "finished"`) ili je otvoren podij mjeseca. Studentska ljestvica ista.
- **Lekcija:** vidi [BUG-051](#bug-051--podij-mjeseca-crvena--08-na-3-mjestu).

### BUG-051 · Podij mjeseca: crvena „▼ −0,8" na 3. mjestu
- **Status:** ✅ riješen 25.10. 03:48 CET ([#264](https://github.com/leonkreso784-bit/riihack/pull/264), graditelj); tester potvrdio na projektoru (~04:16 CET) · **Težina:** srednji
- **Opis:** tester (ned 02:37–~02:54, produkcija, projektor 1920 i 2560 px): podij mjeseca na 3. mjestu prikazuje crvenu „▼ −0,8" (`src/components/round-podium.tsx:80`,
  `Delta` za napredak u krugu). Usp. [BUG-022](#bug-022--kraj-sezone-na-projektoru-nema-podija-pobjednik-izgleda-kao-gubitnik): podij sezone je neutralan, podij mjeseca nije.
- **Rješenje:** [#264](https://github.com/leonkreso784-bit/riihack/pull/264): `Delta` dobiva opcionalni `neutral` (zadano `false`); na podiju se vrijednost prikazuje bez strelice, tamnim slovima na bijeloj pilulici.
- **Lekcija:** projektor je glavni ekran obilaska; provjeravaj ga na stvarnoj rezoluciji (1920 i 2560 px), ne samo
  na laptopu.

### BUG-049 · Kasni student vidi „Krug nije zatvoren" za mjesec prije svog ulaska
- **Status:** ✅ riješen 25.10. 02:31 CET ([#262](https://github.com/leonkreso784-bit/riihack/pull/262), graditelj); tester potvrdio na produkciji (~02:45 CET) · **Težina:** nizak
- **Opis:** tester (ned 02:18–02:36, produkcija): student koji je ušao kasnije za mjesec prije svog ulaska vidi
  „Krug nije zatvoren". Graditelj (~02:40): umjesto toga poruka „Nisi bio u igri".
- **Rješenje:** [#262](https://github.com/leonkreso784-bit/riihack/pull/262): ako izvještaja nema, a mjesec je ≤ `closedRound` tvrtke (kasni ulaz postavlja `closedRound = krug − 1`), API vraća 404 „U tom mjesecu još nisi bio u igri"; bez promjene sheme.
- **Lekcija:** poruka o grešci mora reći pravi razlog, ne prvi koji kod nađe.

### BUG-047 · Tipfeler „Soba je spremana" u sadržaju situacija
- **Status:** ✅ riješen 25.10. 02:31 CET ([#262](https://github.com/leonkreso784-bit/riihack/pull/262), graditelj); tester potvrdio na produkciji (~02:45 CET) · **Težina:** nizak
- **Opis:** tester (ned 02:18–02:36, produkcija): u ponuđenom odgovoru piše „Soba je spremana"; ispravak
  „spremljena". Sadržaj situacija spaja se samo na Leonovo „spoji" ([ADR-017](DECISIONS.md#adr-017)).
- **Uzrok:** `src/content/situations.json:44`.
- **Rješenje:** [#262](https://github.com/leonkreso784-bit/riihack/pull/262): u `src/content/situations.json` „Soba je spremljena" (tekst se nigdje drugdje ne koristi).
- **Lekcija:** sadržaj koji vidi student treba proći pravopisnu provjeru kao i kod.

### BUG-046 · Dvostruki uvoz playbooka udvostruči situacije u igri
- **Status:** ✅ riješen 25.10. 02:31 CET ([#262](https://github.com/leonkreso784-bit/riihack/pull/262), graditelj); tester potvrdio na produkciji (~02:45 CET) · **Težina:** nizak
- **Opis:** tester (ned 02:18–02:36, produkcija): kad profesor isti playbook uveze dvaput, situacije su u igri
  dvaput. Graditelj (~02:40): drugi uvoz odbija se s 409. Tester 02:13 CET: i dalje stvara duplikate.
- **Rješenje:** [#262](https://github.com/leonkreso784-bit/riihack/pull/262): uvoz preskače situacije čiji naslov već postoji u igri (isti `hasSituationTitle` kao knjižnica, [#255](https://github.com/leonkreso784-bit/riihack/pull/255)) i uvozi ostale; broj preskočenih ide u događaj `playbook.imported` (`skipped`). Poruka „Uvezeno N" i dalje broji sve situacije iz datoteke ([BUG-056](#bug-056--ponovni-uvoz-playbooka-javlja-uvezeno-5-situacija-iako-nije-dodana-nijedna)).
- **Lekcija:** uvoz mora biti idempotentan ili odbiti ponavljanje.

### BUG-045 · „Uvezeno 2 situacija" (množina)
- **Status:** ✅ riješen 25.10. 02:31 CET ([#262](https://github.com/leonkreso784-bit/riihack/pull/262), graditelj); tester potvrdio na produkciji (~02:45 CET) · **Težina:** nizak
- **Opis:** tester (ned 02:18–02:36, produkcija): nakon uvoza playbooka poruka piše „Uvezeno 2 situacija".
- **Uzrok:** `src/app/profesor/[worldId]/situacije/page.tsx:107`, broj bez sklanjanja imenice.
- **Rješenje:** [#262](https://github.com/leonkreso784-bit/riihack/pull/262): poruka ide kroz `plural()` (1 situacija, 2 situacije, 5 situacija).
- **Lekcija:** svaki tekst s brojem ide kroz istu funkciju za množinu.

### BUG-043 · Izvještaj mjeseca odmah nakon „Završi" pokazuje privremene brojke
- **Status:** ✅ riješen 25.10. 02:31 CET ([#262](https://github.com/leonkreso784-bit/riihack/pull/262), graditelj); tester potvrdio na produkciji (~02:45 CET) · **Težina:** nizak
- **Opis:** tester (ned 02:18–02:36, produkcija): izvještaj otvoren odmah nakon „Završi" pokazuje brojke prije
  obračuna grada, bez napomene da nisu konačne. Graditelj (~02:40): napomena „konačno nakon obračuna mjeseca".
- **Uzrok:** `src/app/igra/izvjestaj/[krug]/page.tsx:47–53` (ploča „Što se promijenilo" prikazuje brojke izvještaja
  bez obzira na to je li mjesec obračunat).
- **Rješenje:** [#262](https://github.com/leonkreso784-bit/riihack/pull/262): dok mjesec traje (`world.round === round`) izvještaj piše „Brojke su privremene; konačne su nakon što profesor zatvori mjesec."
- **Lekcija:** privremeni podatak mora reći da je privremen.

### BUG-042 · Razgovor s likom: istodobne 6. i 7. poruka obje prođu
- **Status:** ✅ riješen 25.10. 02:38 CEST ([#249](https://github.com/leonkreso784-bit/riihack/pull/249), graditelj, [ADR-053](DECISIONS.md#adr-053)); tester potvrdio na produkciji (02:13 CET) ·
  **Težina:** srednji
- **Opis:** tester (ned 02:18–02:36, produkcija): kad se 6. i 7. poruka liku pošalju istodobno (mimo sučelja), obje
  prođu, pa granica od 6 poruka ne vrijedi. Sučelje je zaštićeno.
- **Uzrok:** `src/app/api/situations/[id]/chat/route.ts:28` broji poslane poruke iz transkripta pročitanog prije
  odgovora, a `src/db/queries.ts:69–79` (`appendTranscript`) dopisuje bez provjere granice.
- **Rješenje:** [#249](https://github.com/leonkreso784-bit/riihack/pull/249): granica se provjerava atomično u bazi ([ADR-053](DECISIONS.md#adr-053)). Tester (02:13 CET, produkcija):
  istodobni zahtjevi 200/409/409, najviše 6 poruka.
- **Lekcija:** granica koja se provjerava pa upisuje u dva koraka propušta istodobne zahtjeve; provjera i upis moraju
  biti jedan korak.

### BUG-041 · „Promijeni ocjenu" za ocjenu 1 krivo za 1× učinak
- **Status:** ✅ riješen 25.10. 02:59 CEST ([#253](https://github.com/leonkreso784-bit/riihack/pull/253), graditelj); tester potvrdio na produkciji (02:13 CET) · **Težina:** nizak
- **Opis:** graditelj (ned ~02:28): kad profesor ručno promijeni ocjenu odgovora („Promijeni ocjenu"), pomak
  pokazatelja je krivo za 1× učinak ako je stara ili nova ocjena 1 (npr. 1 → 4 pomiče 3× umjesto 4× učinak).
- **Uzrok:** override je računao (nova − stara) × učinak, a od [ADR-046](DECISIONS.md#adr-046) faktori nisu linearni
  (1 → −2×, 2 → 0, 3 → +1×…).
- **Rješenje:** [#253](https://github.com/leonkreso784-bit/riihack/pull/253): pomak je faktor(nova) × učinak − faktor(stara) × učinak, istim množiteljem kao motor; test provjerava svih 25 parova ocjena (napisan i nenapisan odgovor).
- **Lekcija:** kad se tablica faktora promijeni, provjeri sve putanje koje ju koriste (i ručnu promjenu ocjene).

### BUG-030 · Odgovor koji promaši temu kažnjava se kao propušten, pa je gori od šutnje
- **Status:** ✅ riješen 25.10. 02:59 CEST ([#253](https://github.com/leonkreso784-bit/riihack/pull/253), graditelj, [ADR-052](DECISIONS.md#adr-052)); tester potvrdio na produkciji (02:13 CET) · **Težina:** srednji (poruka igre „potrudi se" ne vrijedi
  za općenite odgovore)
- **Opis:** tester (ned ~00:50, sezona na produkciji): napisan odgovor koji promaši temu dobije kvalitetu 1, isto −2×
  kao propuštena situacija. Student s 8 općenitih odgovora završi na −60,9, gore od studenta koji nije odgovorio
  ništa (−54,6) i od botova (+27, +30).
- **Uzrok:** učinak po kvaliteti iz [ADR-046](DECISIONS.md#adr-046): 1 (loš ili propušten) −2×. 🟨 Zašto je općeniti
  student gori od onoga bez odgovora, nije utvrđeno.
- **Rješenje:** Leon (~01:25): napisan odgovor s ocjenom 1 ima množitelj 0; propušten i prazan ostaju −2×.
  Graditelj (~02:28, po tom pravilu): zalijepljen (kopiran) odgovor s ocjenom 1 također ostaje −2×; 0 daje samo
  vlastiti napisan tekst. Kod u [#253](https://github.com/leonkreso784-bit/riihack/pull/253) (pravilo i test za zalijepljen odgovor od
  02:33). Spojeno: motor (`isWrittenAnswer`, `qualityFactor(quality, written)`) i Tokovi pokazuju isto pravilo.
  Tester (02:13 CET, produkcija): napisan promašaj 0, prazan, zalijepljen i propušten −2×; napredak +1,8 prema
  −11,1 do −12,4.
- **Lekcija:** kazna treba razlikovati „nije odgovorio" od „odgovorio slabo".

### BUG-034 · Ljestvica studentu pokazuje novac tuđih hotela
- **Status:** ✅ riješen 25.10. 02:58 CEST ([#252](https://github.com/leonkreso784-bit/riihack/pull/252), graditelj); tester potvrdio na produkciji (02:13 CET) · **Težina:** nizak
- **Opis:** tester (ned ~00:55, produkcija): ljestvica studentu pokazuje novac tuđih hotela, a po
  [ADR-040](DECISIONS.md#adr-040) javni su samo prihod i dobit zatvorenih mjeseci.
- **Rješenje:** Leon (~01:25): ljestvica i grad pokazuju samo napredak, prihod i dobit tuđih hotela, bez stanja
  računa; svoj račun student vidi (ADR-040). [#252](https://github.com/leonkreso784-bit/riihack/pull/252): odgovor `/api/me` nosi `cash` samo na vlastitom retku
  ljestvice i karte (`ownCashOnly`), `LeaderboardRow.cash` je neobavezan (ugovor), Financije „Rang po napretku";
  profesor i dalje vidi novac svih. Smoke korak 18 to provjerava.
- **Lekcija:** privatnost provjeri u odgovoru API-ja, ne samo u prikazu.

### BUG-029 · Plan se ne prenosi u sljedeći mjesec
- **Status:** ✅ riješen 25.10. 02:58 CEST ([#241](https://github.com/leonkreso784-bit/riihack/pull/241), graditelj, [ADR-050](DECISIONS.md#adr-050)); tester potvrdio na produkciji (02:13 CET) ·
  **Težina:** srednji
- **Opis:** tester (ned ~00:50, produkcija, QA igra): marketing 500 € u 1. mjesecu, u 2. mjesecu 0; student mora
  plan unositi iznova svaki mjesec. Isto je Simon našao u auditu (#227.1).
  Potvrđeno i u sučelju (~00:55): plan 150/1000 u sljedećem mjesecu postane 172/0.
- **Uzrok:** `toPlan` bez retka plana za novi mjesec vraća zadani plan (`src/lib/game/city.ts:229-238`).
- **Rješenje:** #241: pri otvaranju mjeseca plan prethodnog (cijena, marketing) kopira se u novi; ulaganja ne, a plan
  koji je student već spremio za novi mjesec ostaje. Smoke korak 11 provjerava preneseni plan.
- **Lekcija:** novi krug treba naslijediti stanje prethodnog, ne zadane vrijednosti.

### BUG-039 · „Dodaj iz knjižnice" dodaje situaciju koja je već u igri
- **Status:** ✅ riješen 25.10. 02:39 ([#255](https://github.com/leonkreso784-bit/riihack/pull/255), graditelj); tester potvrdio (02:13 CET) · **Težina:** nizak
- **Opis:** tester (ned ~01:08, produkcija): profesor iz knjižnice može dodati situaciju koja je već u igri, pa je
  igra ima dvaput.
- **Uzrok:** `copyToWorld` nije provjeravao ima li igra već tu situaciju.
- **Rješenje:** `copyToWorld` vraća 409 „Ta situacija je već u igri" ako igra već ima situaciju istog naslova
  (bez razlike u slovima i razmacima; `hasSituationTitle`, 2 testa).
- **Lekcija:** kopiranje u igru provjeri na duplikat prije upisa.

### BUG-038 · Situacija na mobitelu sama skrola i skrije naslov
- **Status:** ✅ riješen 25.10. 01:27 ([#244](https://github.com/leonkreso784-bit/riihack/pull/244), Rino) · **Težina:** nizak
- **Opis:** tester (ned ~01:08, produkcija, 375 px): pri otvaranju situacije stranica sama skrola 178 px, a naslov
  ostane pod zaglavljem.
- **Uzrok:** `scrollIntoView` na kraj razgovora pri učitavanju (`src/components/chat-panel.tsx:50`).
- **Rješenje:** skrola se samo okvir razgovora (`scrollTo` na popis poruka), ne stranica.
- **Lekcija:** u ugrađenom okviru `scrollIntoView` pomiče i cijelu stranicu; skrolaj samo spremnik.

### BUG-037 · „Još 2 situacija čeka" u Tokovima odjela
- **Status:** ✅ riješen 25.10. 01:28 ([#242](https://github.com/leonkreso784-bit/riihack/pull/242), Simon) · **Težina:** nizak
- **Opis:** tester (ned ~01:08, produkcija): množina uz broj je kriva.
- **Uzrok:** obje grane uvjeta daju „situacija čeka" (`src/components/tokovi/departments-flow.tsx:478`).
- **Rješenje:** ispravna množina uz broj u Tokovima odjela.
- **Lekcija:** grane uvjeta za množinu provjeri testom s 1, 2 i 5.

### BUG-036 · Sitnice sučelja: padež u razgovoru, prazan odgovor bez potvrde
- **Status:** ✅ riješen 25.10. 01:27 ([#244](https://github.com/leonkreso784-bit/riihack/pull/244), Rino) · **Težina:** nizak
- **Opis:** tester (ned ~00:55, produkcija): „Poruka za Helena Bogdan" (treba dativ; `src/components/chat-panel.tsx:110`); prazan odgovor na situaciju
  šalje se bez pitanja „Sigurno?".
- **Rješenje:** oznaka poruke bez padeža; prazan odgovor traži potvrdu.
- **Lekcija:** tekst s imenom osobe piši tako da ne traži padež; radnja bez sadržaja traži potvrdu.

### BUG-033 · Mentor pita o „tvom odgovoru" kad je odgovor prazan
- **Status:** ✅ riješen 25.10. 01:28 ([#242](https://github.com/leonkreso784-bit/riihack/pull/242), Simon) · **Težina:** nizak
- **Opis:** tester (ned ~00:55, produkcija): na prazan odgovor mentor svejedno pita o „tvom odgovoru"
  (usp. [ADR-049](DECISIONS.md#adr-049): kod prazne refleksije mentor to prepozna).
- **Rješenje:** mentor prepozna prazan odgovor i ne pita o njemu.
- **Lekcija:** prazan ulaz AI-ju označi izričito; ne oslanjaj se na to da će ga model sam primijetiti.

### BUG-032 · Izvještaj mjeseca, mentor i podij ne vide obračun grada
- **Status:** ✅ riješen 25.10. 01:12 ([#240](https://github.com/leonkreso784-bit/riihack/pull/240)) · **Težina:**
  srednji (ista brojka na tri ekrana ima tri vrijednosti)
- **Opis:** Simonov audit (#226), tester potvrdio na produkciji (ned ~00:55): podij +5,9 i +7,7, ljestvica +7,3 i
  +9,9; izvještaj Financije ±0, Tokovi +5.
- **Uzrok:** izvještaj (`roundReports.metricsAfter`) se upisuje pri zatvaranju tvrtke, a obračun grada
  (`writeSettlement`, `src/lib/game/city.ts`) poslije mijenja samo `companies.metrics`; podij čita izvještaj
  (opis u #226).
- **Rješenje:** #240: obračun grada istom deltom ažurira i `round_reports.metrics_after`; smoke korak 12
  provjerava da izvještaj i tvrtka kažu isto.
- **Lekcija:** kad se ista brojka sprema na dva mjesta, svaki naknadni obračun mora mijenjati oba; test neka usporedi
  ekrane koji je prikazuju.

### BUG-027 · Kasni student ne može ući u igru koja je počela
- **Status:** ✅ riješen 24.10. 23:26 ([#221](https://github.com/leonkreso784-bit/riihack/pull/221), Leonovo „spoji") · **Težina:** visok (žiri na obilasku 3 ulazi u demo igru koja je u
  2. mjesecu)
- **Opis:** graditelj (~23:05): ploča piše „Kasniš? Uđi na /ulaz s kodom" (Rinov #211), a `join.ts` novom studentu
  nakon „Pokreni" vraća 409.
- **Uzrok:** ulaz je bio namjerno zatvoren nakon početka igre; tekst na ploči i pravilo na serveru nisu usklađeni.
- **Rješenje:** kasni student dobije hotel, situacije tekućeg mjeseca koje ima svaka tvrtka, ponudu mjeseca i igra
  od tog mjeseca; nakon kraja sezone 409 „Sezona je završena". Demo igra ima 15 mjesta (bilo 6). Smoke korak 20
  ([ADR-048](DECISIONS.md#adr-048)).
- **Lekcija:** kad sučelje nešto obeća („Kasniš? Uđi"), provjeri da server to i dopušta, na pravim podacima.

### BUG-020 · Sitni tekstovi: „2 studenata", tehnički tekst u toku mjeseca
- **Status:** ✅ riješen 24.10. 23:27 ((a) [#208](https://github.com/leonkreso784-bit/riihack/pull/208); (b) Simonov [#206](https://github.com/leonkreso784-bit/riihack/pull/206)) · **Težina:** nizak
- **Opis:** (a) „Moje igre" (`/profesor/igre`, Leonova datoteka): „2 studenata" umjesto „2 studenta". (b) „Kako je
  izračunat mjesec" (`/igra/izvjestaj/1/tok`, Simonov): kartica „Ugled · Nije spremljeno uz obračun" je tehnički
  tekst za studenta (`src/lib/tokovi/month-flow.ts:158`), a početni čvor ponavlja „Početak: Lipanj / Lipanj".
- **Uzrok:** kao [BUG-016](#bug-016--krivi-hrvatski-u-brojevima-i-rodu); tekst pisan za razvoj ostao u sučelju.
- **Rješenje:** (a) „2 studenta" kroz `plural`; (b) tehnički tekst u toku mjeseca zamijenjen.
- **Lekcija:** svaki tekst na ekranu čita student ili žiri; poruke za razvoj ne idu u sučelje.

### BUG-021 · Ploča profesora: nema puta natrag ni koda igre nakon početka
- **Status:** ✅ riješen 24.10. 23:15 ([#211](https://github.com/leonkreso784-bit/riihack/pull/211) i [#212](https://github.com/leonkreso784-bit/riihack/pull/212)) · **Težina:** nizak (srednji za demo: student koji kasni ne može ući)
- **Opis:** ploča (`/profesor/[worldId]`) i uvid u studenta imaju samo „Odjava", bez poveznice na „Moje igre" i
  „Knjižnica"; profesor se vraća tipkom natrag. Nakon početka igre kod igre se više ne vidi na ploči, pa student koji
  kasni ne može ući s projektora.
- **Rješenje:** „← Moje igre" i „Knjižnica" u zaglavlju profesora i na uvidu u studenta; kod igre za one koji kasne.
- **Lekcija:** novi ekrani (računi, knjižnica) traže put do njih sa svih starih ekrana; provjeri navigaciju od
  prijave do svake stranice.

### BUG-026 · Napredak je negativan za sve hotele od prvog mjeseca
- **Status:** ✅ riješen 24.10. 23:06 ([#214](https://github.com/leonkreso784-bit/riihack/pull/214), Leonovo „spoji"; 🟨 tester provjerava cijelu sezonu) · **Težina:** visok (ljestvica i podij pokazuju da su svi izgubili)
- **Opis:** tester (22:35–22:45, produkcija nakon #194): u tri igre svi hoteli imaju negativan napredak već od
  prvog mjeseca, i uz odgovore 3/5 i 5/5 (pobjednik ▼ −12.7, drugi ▼ −14.9).
- **Uzrok (graditelj, produkcijska baza samo čitanjem):** nije od #194, sve su dobiti pozitivne. `applyRound` daje
  (kvaliteta − 3) × učinak, a propuštena situacija ima kvalitetu 1 (`MISSED_QUALITY`) pa daje −2×; ocjena 3 daje 0, a
  4 samo +1×. Financije mjesečno dobiju najviše +5 (`FINANCE_EFFECT_CAP`). U testerovim igrama 14 od 20 situacija je
  isteklo, većinom zbog roka „10 min" ([BUG-025](#bug-025--zadani-rok-10-min-na-ploči-profesora-sam-zatvara-mjesec)).
  Primjer: klima 4/5 i povišica 1/5 u prvom mjesecu → zaposlenici −10, financije −4.
- **Rješenje:** [ADR-046](DECISIONS.md#adr-046) (Leon, ~22:50): učinak 1 → −2×, 2 → 0, 3 → +1×, 4 → +2×, 5 → +3×;
  radi graditelj zajedno s [BUG-024](#bug-024--loši-pokazatelji-jedva-utječu-na-goste-u-vrhu-sezone).
- **Lekcija:** nakon promjene motora provjeri i izvedene brojke (napredak, ljestvica, podij), ne samo onu koju si
  mijenjao.

### BUG-024 · Loši pokazatelji jedva utječu na goste u vrhu sezone
- **Status:** ✅ riješen 24.10. 22:55 ([#213](https://github.com/leonkreso784-bit/riihack/pull/213), Leonovo „spoji") · **Težina:** visok (srž učenja: odgovori na situacije mijenjaju pokazatelje, a
  pokazatelji goste)
- **Opis:** tester (~22:25, nakon #194): hotel koji nije odgovorio ni na jednu situaciju (zadovoljstvo gostiju 34/100,
  zaposlenici 26/100) u kolovozu ima 86 % popunjenosti i 63.102 € dobiti, najviše u gradu.
- **Uzrok (dokumentarist iz koda, 🟨 potvrditi s graditeljem):** potražnja grada je udio kapaciteta grada
  (`SEASON_DEMAND_BP`: lipanj 60 %, srpanj 85 %, kolovoz 95 %, rujan 55 %, `rules.ts:57`), pa se u kolovozu gotovo
  svi hoteli napune bez obzira na privlačnost. U privlačnosti (`attractiveness`, `economy.ts`) su samo recenzije i
  zadovoljstvo gostiju, ne i zaposlenici ni ostali pokazatelji.
- **Rješenje:** privlačnost i potražnja hotela ovise o kvaliteti iz svih pokazatelja (gosti i recenzije po 30 %,
  osoblje i operativa po 15 %, financije 10 %); ispod 50 privlačnost pada s kvadratom (36 → ×0,52), iznad raste do
  ×2,0; uz sve pokazatelje na 50 isto kao prije ([ADR-045](DECISIONS.md#adr-045)).
- **Lekcija:** test balansa treba provjeriti i obrnuto: da loša odluka gubi, ne samo da najbolja odluka ima smisla.

### BUG-025 · Zadani rok „10 min" na ploči profesora sam zatvara mjesec
- **Status:** ✅ riješen 24.10. 22:50 (Rino, [#211](https://github.com/leonkreso784-bit/riihack/pull/211)) · **Težina:** kritičan za demo (žiri na obilasku lako ostane
  dulje od 10 minuta)
- **Opis:** tester potvrdio na produkciji (22:18): za sljedeći mjesec unaprijed je odabran rok „10 min". Kad istekne,
  odgovori se više ne primaju, neodgovorene situacije postanu „expired" s ocjenom 1/5 i mjesec se svima zatvori.
- **Uzrok:** `src/components/prof-board.tsx:83`, `useState<number | undefined>(10)`.
- **Rješenje:** zadano „Ručno" (bez roka); rok 5/10/15 min vrijedi samo ako ga profesor sam odabere.
- **Lekcija:** zadana vrijednost koja sama pokreće radnju mora biti „isključeno"; profesor je uključuje svjesno.

### BUG-022 · Kraj sezone na projektoru: nema podija, pobjednik izgleda kao gubitnik
- **Status:** ✅ riješen 24.10. 22:50 (Rino, [#196](https://github.com/leonkreso784-bit/riihack/pull/196) i [#211](https://github.com/leonkreso784-bit/riihack/pull/211); 🟨 tester ponovno provjerava) · **Težina:** visok (završni trenutak demoa)
- **Opis:** ploča profesora na 1280×720 nakon „Završi sezonu": nema podija, ljestvica zauzima pola širine, desna
  polovica je prazna; pobjednik ima crveno „▼ −19.3", drugi „▼ −36.9". Koraci: igra s 2 studenta, zatvoriti 2
  mjeseca, „Završi sezonu".
- **Ponovna provjera (tester, 22:45):** podij postoji (cijeli ekran, 2. i 1. mjesto, „Nastavi"), ali (1) pobjednik
  i dalje ima crveni „▼ −12.7"; (2) podij se sam zatvori nakon ~5 s, a ispod ostaje ljestvica na pola širine s praznom
  desnom polovicom; (3) „Završi sezonu" u mjesecu u kojem nitko nije igrao piše „Srpanj: tko je najviše napredovao".
- **Rješenje:** podij sezone preko cijele širine ostaje na ekranu, ljestvica ispod cijelom širinom, napredak na podiju
  neutralan (bijelo, bez crvene strelice), decimalni zarez.
- **Lekcija:** završni ekran demoa provjeri na rezoluciji projektora i s pravim brojkama, ne samo s lažnim podacima.

### BUG-023 · `/igra` nakon kraja sezone i dalje čeka obračun
- **Status:** ✅ riješen 24.10. 22:50 (Rino, [#211](https://github.com/leonkreso784-bit/riihack/pull/211)) · **Težina:** nizak
- **Opis:** kartica „Stanje računa" nakon kraja sezone i dalje piše „obračun kad profesor zatvori mjesec".
- **Rješenje:** „Stanje računa" nakon kraja sezone piše „konačno stanje, sezona je gotova".
- **Lekcija:** svaki tekst koji opisuje „što slijedi" treba stanje za kraj igre.

### BUG-019 · Situacija nakon isteka roka piše „Ponuđeni odgovor"
- **Status:** ✅ riješen 24.10. 22:50 (Rino, [#211](https://github.com/leonkreso784-bit/riihack/pull/211)) · **Težina:** srednji (student misli da je nešto odabrao) · ista obitelj
  kao [BUG-015](#bug-015--uvid-u-studenta-propuštena-situacija-piše-klik)
- **Opis:** profesor otvori mjesec s rokom, student ne odgovori, rok istekne (`answer.mode` `"none"`, `state`
  `"expired"`). Situacija tada piše „Ponuđeni odgovor · 1/5" i nudi „Kako je tvoj odgovor prošao kroz hotel →".
- **Uzrok:** `src/components/verdict-card.tsx:28`: sve što nije `"own"` prikazuje se kao „Ponuđeni odgovor".
- **Rješenje:** `verdict-card` piše „Bez odgovora" za situaciju bez odgovora.
- **Lekcija:** kao BUG-015; isti „sve ostalo" uvjet bio je na dva mjesta, pa popravak traži sva mjesta gdje se
  `mode` prikazuje.

### BUG-017 · AI prijedlog situacije: područje kao sirovi ključ
- **Status:** ✅ riješen 24.10. 22:29 (Simon, [#195](https://github.com/leonkreso784-bit/riihack/pull/195); tester potvrdio 22:45) · **Težina:** nizak
- **Opis:** nakon spremanja AI prijedloga (`/profesor/[id]/situacije` → Nova situacija → Predloži AI-jem → Spremi) popis
  piše „recepcija · težina 3 od 5", a situacije iz banke „Recepcija i smještaj".
- **Uzrok:** prompt je tražio područje kao „jednu ili dvije riječi, npr. recepcija".
- **Rješenje:** AI bira područje s popisa iz banke; `normalizeDraft` piše veliko početno slovo (i za stare nacrte).
- **Lekcija:** ključ u podacima nije tekst za korisnika; naziv uvijek ide kroz isti popis oznaka.

### BUG-016 · Krivi hrvatski u brojevima i rodu
- **Status:** ✅ riješen 24.10. 22:28 (Rino, [#200](https://github.com/leonkreso784-bit/riihack/pull/200); tester potvrdio 22:45) · **Težina:** nizak (žiri čita sučelje)
- **Opis:** (a) `/igra`, „Ponude grada": „1 nova ponuda i 0 aktivan ugovor", „0 nova ponuda i 1 aktivan ugovor"
  (`src/app/igra/page.tsx:87-88`); (b) uvid u studenta: „Razgovor s likom (2 poruka)" umjesto „2 poruke"
  (`tvrtka/[id]/page.tsx:129`); (c) „Završi mjesec" s jednom situacijom: „One vrijede 1 od 5" umjesto „Ona vrijedi"
  (`src/components/close-round.tsx:78`).
- **Uzrok:** broj se lijepi uz imenicu bez sklonidbe po broju (1, 2–4, 5+).
- **Rješenje:** nova funkcija `plural(n, jedan, dva–četiri, pet+)` u `src/lib/format.ts` (11–14 uvijek „pet+"); svi
  navedeni tekstovi idu kroz nju.
- **Lekcija:** tekst s brojem u hrvatskom treba oblike za 1, 2–4 i 5+ (0 ide kao 5+); provjeri ga s 0, 1, 2 i 5.

### BUG-015 · Uvid u studenta: propuštena situacija piše „klik"
- **Status:** ✅ riješen 24.10. 22:28 (Rino, [#200](https://github.com/leonkreso784-bit/riihack/pull/200); tester potvrdio 22:45) · **Težina:** srednji (profesor misli da je student odabrao odgovor)
- **Opis:** student ostavi situaciju bez odgovora i završi mjesec; u uvidu (`/profesor/[worldId]/tvrtka/[id]`) ta
  situacija piše „klik · 1/5" umjesto „bez odgovora".
- **Uzrok:** `src/app/profesor/[worldId]/tvrtka/[id]/page.tsx:21`: sve što nije `mode === "own"` prikazuje se kao
  „klik".
- **Rješenje:** situacija s `mode: "none"` piše „bez odgovora" (crvena oznaka).
- **Lekcija:** kad stanje ima više od dvije vrijednosti, prikaži svaku izričito; „sve ostalo" pretvori rubni slučaj u
  laž na ekranu.

### BUG-014 · Najviša cijena (400 €) je gotovo uvijek najisplativija
- **Status:** ✅ riješen 24.10. 22:14 ([#194](https://github.com/leonkreso784-bit/riihack/pull/194), Leonovo „spoji") · **Težina:** visok (žiri na obilasku 3 sam igra; igra bi učila krivo)
- **Opis:** Simonov issue [#162](https://github.com/leonkreso784-bit/riihack/issues/162), provjeren pravim
  `settleMarket` i `roundFinance`: uz 400 € hotel ima 48 % popunjenosti i 69.700 € dobiti u kolovozu, a uz
  referentnu cijenu (~90 €) 91 % i ~23.000 €. Tester potvrdio na produkciji (22:00): hotel 4★ sa 17 soba uz 400 € i
  5.000 € marketinga u lipnju ide s 20.000 € na 81.850 €, a susjed uz 70 € na 28.860 €.
- **Uzrok:** u `attractiveness` (`src/lib/engine/economy.ts`) faktor cijene je ograničen na 0,5 do 1,5. Iznad 2×
  referentne cijene više ne pada, pa hotel zadrži goste, a svaka noć donosi sve više.
- **Rješenje:** [ADR-043](DECISIONS.md#adr-043), [#194](https://github.com/leonkreso784-bit/riihack/pull/194): iznad
  referentne cijene faktor pada s kvadratom, iznad 2,5× je 0; test da je vrh prihoda između 80 i 150 € u sva 4
  mjeseca (416 testova). Poslije spajanja ponovni seed demo igre i smoke.
- **Lekcija:** granica koja štiti od ekstremnih vrijednosti može ukloniti kaznu baš ondje gdje treba. Uz motor drži
  test koji traži najbolju odluku i provjerava da ona ima smisla u stvarnom svijetu.

### BUG-018 · Čišćenje baze obrisalo testerovu igru usred testa
- **Status:** ✅ riješen pravilom ~22:05 (graditelj) · **Težina:** nizak (izgubljen testni napredak, ne demo)
- **Opis:** skripta za čišćenje (`--apply`, ~22:00) obrisala je testerove igre „QA 2150 glavni" i „QA proba tim" dok
  je tester testirao produkciju.
- **Uzrok:** graditelj nije javio testeru prije brisanja.
- **Rješenje:** prije svakog `--apply` graditelj javlja testeru.
- **Lekcija:** brisanje na zajedničkoj bazi najavi svima koji je koriste, i onima koji samo testiraju.

### BUG-013 · Provjera pada u mapi bez `npm ci` nakon promjene `package-lock.json`
- **Status:** ✅ riješen pravilom 24.10. ~21:15 (Leon) · **Težina:** nizak (lokalno, ne na `main`-u)
- **Opis:** provjera u Leonovoj mapi pala je jer u `node_modules` nije bilo paketa `better-auth` i `uqr`.
- **Uzrok:** nakon povlačenja koje je promijenilo `package-lock.json` (nove ovisnosti iz
  [#139](https://github.com/leonkreso784-bit/riihack/pull/139) i [#147](https://github.com/leonkreso784-bit/riihack/pull/147))
  nitko nije pokrenuo `npm ci`.
- **Rješenje:** nakon svakog povlačenja koje mijenja `package-lock.json` svi pokreću `npm ci`.
- **Lekcija:** ako se lock datoteka promijenila, lokalni `node_modules` više ne odgovara kodu; pokreni `npm ci` prije
  provjere, inače tražiš grešku koje u kodu nema.

### BUG-012 · Dva istodobna `POST /round`: drugi vraća 409 „Sezona je gotova"
- **Status:** ✅ riješen 24.10. 20:44 ([#166](https://github.com/leonkreso784-bit/riihack/pull/166); smoke na produkciji
  14/14) · **Težina:** srednji (dvoklik profesora mogao je preskočiti mjesec; dvostrukog obračuna nije bilo)
- **Opis:** smoke na produkciji (~20:25) jednom je pao na koraku 14: od dva istodobna zahtjeva za zatvaranje mjeseca
  drugi je dobio 409 „Sezona je gotova" umjesto 200.
- **Uzrok:** na Vercelu dva istodobna `POST /round` idu u dvije funkcije. Ako drugi pročita igru nakon prvog, vidi već
  otvoren sljedeći mjesec i otvori još jedan (preskočen mjesec); u zadnjem mjesecu dobije 409. Dvostruki obračun je
  spriječen (`settled_round`).
- **Rješenje:** novo neobavezno polje `OpenRoundRequest.fromRound`: ploča profesora šalje mjesec koji zatvara, a ako
  je igra taj mjesec već prešla, ruta vraća trenutno stanje bez prelaska. Smoke korak 14 provjerava i zakašnjeli klik.
- **Lekcija:** radnja koja pomiče stanje igre mora reći od kojeg stanja kreće; bez toga dvoklik ili ponovljeni zahtjev
  napravi dva koraka umjesto jednog.

### BUG-008 · Ime prijašnjeg projekta još je u repou
- **Status:** ✅ riješen 24.10. 20:13 (`git grep -i` po cijelom `main`-u: 0 pogodaka; provjerili integrator i
  dokumentarist) · **Težina:** srednji (žiri čita repo; pravilo tima je da se ime nigdje ne piše)
- **Opis:** ime je bilo u planu (`docs/superpowers/plans/2026-10-24-simpolis.md`, 9 redaka) i u komentarima koda
  (`src/app/globals.css` 2, `src/components/bottom-nav.tsx` 1, `src/components/panel.tsx` 1), te u porukama starih
  commitova.
- **Uzrok:** ime se koristilo kao kratica za izgled i bodovanje prije nego što je pravilo uvedeno.
- **Rješenje:** kod očišćen u [#107](https://github.com/leonkreso784-bit/riihack/pull/107) (19:58), plan u
  [#157](https://github.com/leonkreso784-bit/riihack/pull/157) (Rino, 20:13). Poruke starih commitova ostaju jer se
  povijest ne prepisuje (nema force pusha na `main`).
- **Lekcija:** ime koje ne smije u predaju ne smije ni u komentare i commitove od prvog dana; kad se pravilo uvede,
  odmah `git grep -i` po cijelom repou, ne samo po dokumentima.

### BUG-011 · L16 bez `BETTER_AUTH_SECRET`: stvaranje igre vraća 500
- **Status:** ✅ riješen 24.10. 20:06 (uhvaćeno u provjeri prije spajanja [#147](https://github.com/leonkreso784-bit/riihack/pull/147)) ·
  **Težina:** kritičan da je spojeno (profesor ne može napraviti igru)
- **Opis:** u provjeri #147 (~19:50) `POST /api/worlds` bez varijable `BETTER_AUTH_SECRET` vraća 500.
- **Uzrok:** Better Auth bez tajne baca grešku „default secret", iako igra s kodom računa ne treba.
- **Rješenje:** bez tajne `getProfUser` vraća `null`, pa stvaranje igre radi (smoke korak 1 ✅); dopuštene domene
  sužene na `riihack.vercel.app` i preview domene projekta. Ostaje: `/api/auth/*` vraća 500 dok varijable
  `BETTER_AUTH_*` nisu postavljene na Vercelu (🟨 čeka Leona).
- **Lekcija:** nova ovisnost s tajnom mora raditi i kad tajne nema, ako je značajka neobavezna; provjeri glavni tok
  bez nove env varijable prije spajanja.

### BUG-009 · Presuda vlastitog odgovora pada na rezervu: kvaliteta 3, bez obrazloženja
- **Status:** ✅ riješen 24.10. 18:07 ([#120](https://github.com/leonkreso784-bit/riihack/pull/120), Simon; 292 testa, smoke
  14/14) · **Težina:** visok (vlastiti odgovor je jezgra demoa; student ne dobije obrazloženje)
- **Opis:** u probi M2 (graditelj, ~18:00) odbijeno je 4 od 4 obrazloženja suca; nakon dva pokušaja `judge.ts` vraća
  `null`, pa motor uzima rezervnu kvalitetu 3.
- **Uzrok:** prompt suca traži obraćanje s „ti", a hrvatski perfekt u 2. licu traži rod, pa model piše „postavio/la".
  `judge.ts` takvo obrazloženje odbacuje (`SLASH_GENDER`) i s njim odbacuje i ispravno označene kriterije.
- **Rješenje:** presuda zadržava označene kriterije; kad stil obrazloženja dvaput ne prođe, obrazloženje se slaže iz
  rubrike (`judge.ts`, `prompts.ts`). Ista provjera postoji u `propose.ts` (S9), a #120 je ne mijenja; 🟨 provjeriti
  pada li prijedlog situacije na isti način.
- **Lekcija:** provjera stila ne smije baciti presudu. Kad prompt i provjera izlaza traže nešto što jezik teško daje
  zajedno, prvo izmjeri koliko odgovora prolazi na pravom pozivu.

### BUG-010 · Smoke integratora otišao na tuđi dev server, a integrator ga je ugasio
- **Status:** ✅ riješen 24.10. 18:02 · **Težina:** srednji (ugašen tuđi `next dev`; provjera #118 bila bi na
  krivom kodu)
- **Opis:** pri provjeri [#118](https://github.com/leonkreso784-bit/riihack/pull/118) port 3107 je bio zauzet
  (`EADDRINUSE`), integratorov server se nije podigao, pa je smoke išao na tuđi `next dev`. Integrator je taj proces
  ugasio; server je bio graditeljev, a proba M2 je tada već bila gotova, pa šteta nije nastala.
- **Uzrok:** port nije provjeren prije pokretanja, a pad pokretanja servera nije zaustavio smoke.
- **Rješenje:** smoke ponovljen na slobodnom portu 3917, 14/14; demo igra vraćena (`KVRNDM`, krug 2).
  Dogovor: graditelj koristi portove 3107 i 3199, integrator 3917.
- **Lekcija:** prije pokretanja provjeri je li port slobodan; ako se server ne podigne, smoke staje. Tuđi proces se
  ne gasi ([BUG-005](#bug-005--agent-je-pri-gašenju-dev-servera-pokušao-ugasiti-sve-nodeexe-procese)).

### BUG-007 · Profesorski kod demo igre bio je zadana vrijednost u javnom kodu
- **Status:** ✅ rizik uklonjen 24.10. ~17:25 (kod zamijenjen); popravak skripte spojen 17:50 ([#115](https://github.com/leonkreso784-bit/riihack/pull/115)) · **Težina:**
  visok (tko pročita javni repo mogao je upravljati demo igrom pred žirijem)
- **Opis:** `scripts/seed-demo.ts` je za `DEMO_PROF_CODE` imao zadanu vrijednost u čistom tekstu, koja se koristi
  kad varijabla nije postavljena. Našao dokumentarist pri provjeri `TESTING.md`.
- **Uzrok:** tajna je dobila zadanu vrijednost da skripta radi i bez `.env.local`.
- **Rješenje:** demo igra ponovno napravljena s novim tajnim kodom koji je samo u Leonovom `.env.local`; stari kod
  na produkciji vraća 404. #115 uklanja zadanu vrijednost, pa skripta bez `DEMO_PROF_CODE` pada. Kod igre ostaje javan
  po namjeni (njime se samo ulazi, [ADR-004](DECISIONS.md#adr-004)).
- **Lekcija:** zadana vrijednost tajne u javnom repou je javna tajna. Tajne se čitaju samo iz env-a, bez rezerve, a
  skripta bez njih staje.

### BUG-004 · Smoke korak 5 na `main`-u pada: „Ana ima 0 situacija"
- **Status:** ✅ riješen 24.10. 16:55 ([#75](https://github.com/leonkreso784-bit/riihack/pull/75)); smoke na `main`-u 14/14 · **Težina:** srednji (smoke na
  `main`-u crven; korisnik nije vidio jer je produkcija bila na lažnim podacima, [ADR-018](DECISIONS.md#adr-018))
- **Opis:** `npm run smoke` na `main`-u: nakon pokretanja igre student nema nijednu situaciju.
- **Uzrok:** `situations.json` je prazan dok se ne spoji L6. Kod nije neispravan: s #75 lokalno prolaze koraci 1–10.
- **Rješenje:** spojen #75 u valu M2 ([ADR-028](DECISIONS.md#adr-028)).
- **Lekcija:** smoke ovisi o sadržaju, ne samo o kodu. Kad su sadržaj i kod u različitim PR-ovima, crven smoke prvo
  provjeri ima li sadržaja.

### BUG-005 · Agent je pri gašenju dev servera pokušao ugasiti sve `node.exe` procese
- **Status:** ✅ riješen 24.10. u L8 (pokušaj odbijen, ništa nije ugašeno) · **Težina:** nizak (alat, ne proizvod),
  ali bi srušio dev servere i sesije ostalih
- **Opis:** pri gašenju svog dev servera agent je pokušao ubiti sve `node.exe` procese na računalu.
- **Uzrok:** agent nije znao PID svog servera, pa je posegnuo za svim procesima istog imena.
- **Rješenje:** pravilo za agente: dev server na vlastitom portu, gasi se samo taj proces ([SESIJE.md](../workflow/SESIJE.md#pravila-za-agente)).
- **Lekcija:** na računalu na kojem radi više sesija naredba „ugasi sve istog imena" nikad nije sigurna. Pokreni
  proces tako da znaš njegov port ili PID i gasi samo njega.

### BUG-003 · `/igra` na Vercelu vraća „Greška 404"
- **Status:** ✅ riješen 24.10. 14:14 ([#52](https://github.com/leonkreso784-bit/riihack/pull/52)) · **Težina:** visok (javni link za obilazak žirija)
- **Opis:** https://riihack.vercel.app/igra pokazuje „Greška 404".
- **Uzrok:** na Vercelu nije postavljen `NEXT_PUBLIC_USE_MOCK`, pa sučelje zove pravi `/api/me`, a ta ruta (L4) još
  ne postoji. Lokalno je radilo jer je `.env.local` imao varijablu.
- **Rješenje:** lažni podaci su zadani; `NEXT_PUBLIC_USE_MOCK=0` prebacuje na poslužitelj ([ADR-013](DECISIONS.md#adr-013)).
- **Lekcija:** zadana vrijednost mora raditi **bez** env varijable, jer Vercel nema tvoj `.env.local`. Javni link
  provjeri u pregledniku nakon svakog spajanja, ne samo lokalno.

### BUG-002 · `npm ci` na Linux CI-ju pada zbog lock datoteke s Windowsa
- **Status:** ✅ riješen 24.10. 13:23 (`998f2dc`, u [#37](https://github.com/leonkreso784-bit/riihack/pull/37)) · **Težina:** visok (CI crven, nema spajanja)
- **Opis:** `npm ci` na GitHub Actions (Linux) odbija instalaciju.
- **Uzrok:** `package-lock.json` generiran na Windowsu nije imao opcionalne pakete `@emnapi/core` i `@emnapi/runtime`
  koje Linux treba.
- **Rješenje:** uzet lock iste konfiguracije ovisnosti iz grane `simon/L0-kostur`, koji ih ima.
- **Lekcija:** lock datoteka ovisi o platformi na kojoj je nastala. Nakon promjene ovisnosti pričekaj CI na Linuxu
  prije spajanja; zeleno lokalno na Windowsu nije dokaz.

### BUG-001 · `main` crven: `roundGain` uveden kao obavezno polje
- **Status:** ✅ riješen 24.10. 14:04 ([#49](https://github.com/leonkreso784-bit/riihack/pull/49)) · **Težina:** kritičan (produkcijski build pada, nitko ne smije spajati)
- **Opis:** nakon spajanja #40 (13:52) `next build` na `main`-u pada na TypeScriptu; produkcijski deploy `c62bb99` ne prolazi.
- **Uzrok:** #45 (13:45) dodao je **obavezno** polje `LeaderboardRow.roundGain` u ugovor, a `mock.ts` iz #40 ga nema.
  Oba PR-a bila su zelena svaki za sebe, na različitim `main`-ovima.
- **Rješenje:** `roundGain` dodan u 5 lažnih redaka ljestvice (#49). Usporedni popravak #50 zatvoren kao duplikat.
- **Lekcija:** novo polje u ugovoru je **neobavezno** dok ga svi ne pune ([ADR-011](DECISIONS.md#adr-011)). Prije
  spajanja „Update branch" i CI na **svježem** `main`-u; nakon spajanja pogledaj CI na `main`-u
  ([TEAM.md](../../TEAM.md) pravila 2–4).
