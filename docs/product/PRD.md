# PRD: Simpolis

**Status:** živi dokument · **Zadnja izmjena:** 25.10.2026. · Definicija bez kronologije: što se kad dogodilo je u
[records/](../records/).

## 1. Problem

AI studentu napiše savršen esej o vođenju hotela, ali ga ne nauči odlučivati s ljudima i novcem; prvu pravu odluku
donosi tek na praksi. Brojke koje bole i izvori su u [PROMISE.md](../../PROMISE.md) (jedino mjesto):

- 40 do 50 % srednjoškolaca u Hrvatskoj gotovo svaki dan uči uz AI chatbot;
- uz AI bez ograda rezultat na ispitu bez AI-a je 17 % lošiji, a učenici to ne primijete;
- prva prava praksa dolazi tek u zadnjem semestru studija.

## 2. Korisnici

| Tko | Što želi | Uloga u demou |
| --- | --- | --- |
| **Student** (Ana, 2. godina Hospitality Managementa, FMTU) | naučiti voditi hotel prije prave prakse | uđe kodom, vodi svoj hotel, rješava situacije, planira cijenu i marketing |
| **Profesor** (kupac, **glavni u igri**, [ADR-023](../records/DECISIONS.md#adr-023)) | vidjeti **kako** studenti odlučuju, ne samo kako pišu | napravi grad, vodi mjesece, piše i šalje situacije, gleda ploču i uvid u studenta |

## 3. Tri obećanja

Ista na slajdu i u demou, jedino mjesto je [PROMISE.md](../../PROMISE.md):
1. pravi grad, prava ekonomija; 2. odluke s ljudima, ne s gotovim odgovorima; 3. razred kao Kahoot.

## 4. Opseg demoa

Što je stvarno (baza i backend), što samo sučelje na lažnim podacima, a što plan za pitch: tablica u
[ARHITEKTURA.md §1a](../../ARHITEKTURA.md#1a--što-je-stvarno-što-je-sučelje-što-je-plan). Ekonomija grada:
[§5c](../../ARHITEKTURA.md#5c--ekonomija-grada-svi-utječu-na-sve). Ekrani: [§9](../../ARHITEKTURA.md#9--ekrani).
§1a je pisan prije vala 3; stvarno stanje po stavkama je u §5 ispod.

## 5. Kriteriji prihvaćanja

Svaka stavka je gotova kad **korisnik može** učiniti ono što piše, na javnom linku (https://riihack.vercel.app),
ne kad je test zelen. Rokovi prekretnica su u [planu izvedbe](../superpowers/plans/2026-10-24-simpolis.md#prekretnice).

**Stanje 25.10. ~02:30**, po kodu na `main`-u, spojenim PR-ovima ([CHANGELOG.md](../records/CHANGELOG.md)) i smokeu
(`scripts/smoke.ts`, „korak N"): ✅ radi · 🔶 djelomično · ❌ nije napravljeno · ⏭ sljedeći korak (ne broji se u
ono što demo obećava) · 🟨 potvrditi.

### M1 · Obilazak 1

- ✅ Profesor može napraviti igru s brojem studenata i vidi kod igre golemim slovima (`/profesor/novi`, `/profesor/[worldId]`).
  Izvor: #56, #74, smoke korak 1; od #186 profesor ulazi računom ([ADR-041](../records/DECISIONS.md#adr-041)).
- ✅ Student s naslovnice (`/`, predstavljanje) dođe na ulaz (`/ulaz`), upiše kod, svoje ime i ime hotela, pa vidi svoj hotel u čekaonici (`/cekaonica`).
  Izvor: #54, #93, smoke korak 2.
- ✅ Profesor vidi kako se mjesta pune („7 / 24") i može pokrenuti igru. Izvor: #56, smoke korak 5.
- ✅ Svaki student dobije drukčiji hotel iz banke i može pregledati sve njegove sobe po katovima (`/igra/sobe`).
  Izvor: #57, #64, smoke korak 2.

### M2 · Obilazak 2

- ✅ Student vidi svoju tvrtku: pokazatelje (početak prema sada), krug, situacije i ljestvicu (`/igra`). Izvor:
  `src/app/igra/page.tsx`.
- ✅ Student može odgovoriti na situaciju klikom ili vlastitim tekstom i dobije AI presudu po rubrici (`/igra/situacija/[id]`).
  Izvor: #44, #83, #97, smoke korak 6.
- ✅ Student može razgovarati s likom kojeg glumi AI (najviše 6 poruka) prije vlastitog odgovora. Izvor: #76,
  `MAX_STUDENT_MESSAGES` u `rules.ts`; granica pod istodobnim zahtjevima je otvoreni #249.
- ✅ Student može postaviti plan kruga: cijenu noćenja (30–400 €) i marketing (0–5.000 €) (`/igra/plan`). Izvor: #47,
  `PRICE_MIN`, `PRICE_MAX`, `MARKETING_MAX` u `rules.ts`.
- ✅ Kad profesor zatvori mjesec, student vidi noćenja, prihod, troškove, dobit i stanje računa (`/igra/financije`), a jeftiniji ili bolje ocijenjen hotel uzme goste drugima.
  Izvor: #68, #88, #194, #213, smoke koraci 11 i 12.
- ✅ Studenti vide kartu grada s hotelima i gradskim tvrtkama (`/igra/grad`); profesor ima ploču, ljestvicu i uvid.
  Izvor: #128, #215; kriterij sužen (graditelj ~02:32), karta na profesorovoj ploči je sljedeći korak
  ([BACKLOG.md](../records/BACKLOG.md)).
- ✅ Profesor vidi ploču uživo (krug, tvrtke, tko je zatvorio krug, ljestvica) i može otvoriti sljedeći krug. Izvor:
  #108, #211.
- ✅ Student vidi osoblje svog hotela (`/igra/osoblje`). Izvor: #113.
- ✅ Profesor može napisati svoju situaciju (lik, 3–5 kriterija, opcije neobavezne, učinci) ili izabrati jednu iz banke (`/profesor/[worldId]/situacije`).
  Izvor: #95, #109.
- ✅ Profesor može poslati situaciju odabranim studentima, odmah ili u krug k, i uključiti ili isključiti slučajno izvlačenje.
  Izvor: #95, #109 (`/api/prof/[worldId]/dispatch`, `…/settings`).
- ✅ Student može odgovoriti i na situaciju bez ponuđenih odgovora (samo vlastitim tekstom). Izvor: #95, #97.

### M3 · Obilazak 3 (cijeli demo)

- ✅ Hotel dobije ponudu ugovora gradske tvrtke i može je prihvatiti ili odbiti; ugovor se vidi na karti. Izvor: #88,
  #164 (Pošta), sloj „Ugovori" na karti (#128), smoke korak 13.
- ✅ Studenti vide vijesti grada iz događaja („Kolovoz: Hotel … najpopunjeniji") (`/igra/grad`); profesor ima ploču,
  ljestvicu i uvid. Izvor: #88; kriterij sužen (graditelj ~02:32), vijesti na profesorovoj ploči su sljedeći korak
  ([BACKLOG.md](../records/BACKLOG.md)).
- ✅ Student može zatvoriti krug i vidi izvještaj s promjenama pokazatelja i pitanjem sokratskog mentora (`/igra/izvjestaj/[krug]`).
  Izvor: #79, #152, #160, #240, smoke korak 9.
- ✅ Profesor može otvoriti uvid u razmišljanje jednog studenta: odgovori, razgovori, presude (`/profesor/[worldId]/tvrtka/[id]`).
  Izvor: #168.
- ✅ Demo igra se pokrene jednom naredbom i krene od odigranog prvog kruga, ne od prazne igre. Izvor: `npm run
  seed:demo` (#103, #191), igra `KVRNDM`.
- ⏭ Radar vještina se vidi (lažni podaci s oznakom „primjer"). Ne radi se prije predaje (graditelj ~02:30);
  komponenta `src/components/wow/skill-radar.tsx` postoji, ali nije ni na jednom ekranu.
- ✅ Profesor može promijeniti ocjenu mentora za odgovor studenta (gumb „Promijeni ocjenu" u uvidu). Izvor: #104,
  #168, #237.
- ✅ Profesor može izvesti svoj playbook (situacije i postavke) i uvesti ga u novu igru. Izvor: #100, #129
  ([ADR-027](../records/DECISIONS.md#adr-027)).
- ✅ Profesor može zatražiti od AI-ja prijedlog situacije iz stanja hotela, pregledati ga i spremiti; bez njegova spremanja nijedan student ga ne dobije.
  Izvor: #111, #118, #129 ([ADR-024](../records/DECISIONS.md#adr-024)).
- ✅ Mentor iz brojki jezgre objašnjava što se dogodilo u krugu i kako svijet radi. Izvor: #111, #231, #240.
- ✅ Podij kruga i ljestvica čitljivi su na projektoru. Izvor: #196, #211, [#264](https://github.com/leonkreso784-bit/riihack/pull/264), tester ~04:16 CET
  (1280/1920/2560). Ostaju niske sitnice: [BUG-064](../records/BUGS.md#bug-064--zaglavlje-ploče-profesora-ostaje-1152-px-a-ploča-1600-px) i
  [BUG-065](../records/BUGS.md#bug-065--na-2560-px-ploča-ostaje-1600-px-a-fontovi-nemaju-2xl-stupanj).
- ✅ Svaki ekran radi na 375 px, 768 px i 1440 px širine. Tester: 375 i 768 px bez vodoravnog scrolla (PROGRESS.md,
  ned ~01:08), 1440 px ~02:54.

### Val 3 · hotel kao tvrtka ([plan vala 3](../superpowers/plans/2026-10-24-simpolis-val-3.md)) i dodaci

- ✅ Student u planu mjeseca dodijeli budžet odjelima; motor ga obračuna kao trošak i podigne pokazatelj odjela
  (`/igra/osoblje`). Izvor: #132, #135, #137, smoke korak 15 ([ADR-032](../records/DECISIONS.md#adr-032)).
- ✅ Ponuda agencije stiže u Poštu (`/igra/posta`); student prihvaća, odbija ili daje protuponudu; ishod računa motor,
  a AI piše odgovor agenta. Izvor: #148, #154, #164, smoke korak 16 ([ADR-033](../records/DECISIONS.md#adr-033)).
- ✅ Student na karti otvori tuđi hotel i vidi samo javne podatke, uz prihod i dobit zatvorenih mjeseci. Izvor: #143,
  #184, #192, smoke korak 18 ([ADR-035](../records/DECISIONS.md#adr-035), [ADR-040](../records/DECISIONS.md#adr-040)).
- ✅ Profesor se registrira i prijavi e-mailom i lozinkom i vidi „Moje igre". Izvor: #147, #169, #186, smoke korak 19
  ([ADR-036](../records/DECISIONS.md#adr-036)).
- ✅ Profesor sprema situacije u knjižnicu i dodaje ih u drugu igru (`/profesor/knjiznica`). Izvor: #165, #170, #189.
- 🔶 Hotel šalje poruku drugom hotelu, a profesor vidi sve poruke igre. API i smoke korak 17 rade (#177), student
  poruke čita u Pošti (#164); obrasca za novu poruku i profesorova pregleda poruka u sučelju nema (R15 nije napravljen).
- ❌ Hotel preusmjerava goste drugom hotelu za proviziju (L19, [ADR-034](../records/DECISIONS.md#adr-034)): nema koda;
  po [ADR-039](../records/DECISIONS.md#adr-039) samo ako ostane vremena.
- ✅ Profesor u čekaonici dodaje botove (računalne hotele) s težinom Lako, Srednje ili Teško. Izvor: #205, #235
  ([ADR-044](../records/DECISIONS.md#adr-044)); botovi dobavljači nisu napravljeni.
- ✅ Student uđe i u igru koja je već počela i igra od tekućeg mjeseca. Izvor: #221, smoke korak 20
  ([ADR-048](../records/DECISIONS.md#adr-048)).

### Uvijek (otpornost, iz [Review Focus](../superpowers/plans/2026-10-24-simpolis.md#review-focus))

- ✅ Kad AI ne odgovori ili je spor, igra teče dalje (rezerve). Izvor: #41 (`src/lib/ai/fallbacks.ts`), #154, #231.
- ✅ Dupli odgovor, odgovor na stari krug i dvostruki obračun mjeseca ne kvare brojke. Izvor: #166, smoke koraci 7, 10
  i 14.
- ✅ Student koji izgubi kolačić i uđe istim kodom, imenom i imenom hotela dobije isti hotel. Izvor:
  `src/lib/game/join.ts`, smoke korak 4.

## 6. Mjerila uspjeha (za hackathon)

- Glavni tok iz [ROADMAP.md](../ROADMAP.md) prolazi uživo pred žirijem bez ručnih zahvata.
- Wow trenutak iz [PROMISE.md](../../PROMISE.md) (cijena dolje → hotel pun, susjed prazan, grad se mijenja na
  projektoru) se vidi na M3.
- Žiri na obilascima čuje ista tri obećanja koja vidi u demou.

## 7. Izvan opsega

Popis je na jednom mjestu: [records/BACKLOG.md](../records/BACKLOG.md).
