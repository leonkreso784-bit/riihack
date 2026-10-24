# PRD: Simpolis

**Status:** živi dokument · **Zadnja izmjena:** 24.10.2026. · Definicija bez kronologije: što se kad dogodilo je u
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
| **Profesor** (kupac) | vidjeti **kako** studenti odlučuju, ne samo kako pišu | napravi grad, vodi mjesece, gleda ploču i uvid u studenta |

## 3. Tri obećanja

Ista na slajdu i u demou, jedino mjesto je [PROMISE.md](../../PROMISE.md):
1. pravi grad, prava ekonomija; 2. odluke s ljudima, ne s gotovim odgovorima; 3. razred kao Kahoot.

## 4. Opseg demoa

Što je stvarno (baza i backend), što samo sučelje na lažnim podacima, a što plan za pitch: tablica u
[ARHITEKTURA.md §1a](../../ARHITEKTURA.md#1a--što-je-stvarno-što-je-sučelje-što-je-plan). Ekonomija grada:
[§5c](../../ARHITEKTURA.md#5c--ekonomija-grada-svi-utječu-na-sve). Ekrani: [§9](../../ARHITEKTURA.md#9--ekrani).

## 5. Kriteriji prihvaćanja

Svaka stavka je gotova kad **korisnik može** učiniti ono što piše, na javnom linku (https://riihack.vercel.app),
ne kad je test zelen. Rokovi prekretnica su u [planu izvedbe](../superpowers/plans/2026-10-24-simpolis.md#prekretnice).

### M1 · Obilazak 1

- [ ] Profesor može napraviti igru s brojem studenata i vidi kod igre golemim slovima (`/profesor/novi`, `/profesor/[worldId]`).
- [ ] Student može upisati kod, svoje ime i ime hotela i ući (`/`), pa vidi svoj hotel u čekaonici (`/cekaonica`).
- [ ] Profesor vidi kako se mjesta pune („7 / 24") i može pokrenuti igru.
- [ ] Svaki student dobije drukčiji hotel iz banke i može pregledati sve njegove sobe po katovima (`/igra/sobe`).

### M2 · Obilazak 2

- [ ] Student vidi svoju tvrtku: pokazatelje (početak prema sada), krug, situacije i ljestvicu (`/igra`).
- [ ] Student može odgovoriti na situaciju klikom ili vlastitim tekstom i dobije AI presudu po rubrici (`/igra/situacija/[id]`).
- [ ] Student može razgovarati s likom kojeg glumi AI (najviše 6 poruka) prije vlastitog odgovora.
- [ ] Student može postaviti plan kruga: cijenu noćenja (30–400 €) i marketing (0–5.000 €) (`/igra/plan`).
- [ ] Kad profesor zatvori mjesec, student vidi noćenja, prihod, troškove, dobit i stanje računa (`/igra/financije`), a jeftiniji ili bolje ocijenjen hotel uzme goste drugima.
- [ ] Svi vide kartu grada s hotelima i gradskim tvrtkama.
- [ ] Profesor vidi ploču uživo (krug, tvrtke, tko je zatvorio krug, ljestvica) i može otvoriti sljedeći krug.
- [ ] Student vidi osoblje svog hotela (`/igra/osoblje`).

### M3 · Obilazak 3 (cijeli demo)

- [ ] Hotel dobije ponudu ugovora gradske tvrtke i može je prihvatiti ili odbiti; ugovor se vidi na karti.
- [ ] Svi vide vijesti grada iz događaja („Kolovoz: Hotel … najpopunjeniji").
- [ ] Student može zatvoriti krug i vidi izvještaj s promjenama pokazatelja i pitanjem sokratskog mentora (`/igra/izvjestaj/[krug]`).
- [ ] Profesor može otvoriti uvid u razmišljanje jednog studenta: odgovori, razgovori, presude (`/profesor/[worldId]/tvrtka/[id]`).
- [ ] Demo igra se pokrene jednom naredbom i krene od odigranog prvog kruga, ne od prazne igre.
- [ ] Radar vještina se vidi (lažni podaci s oznakom „primjer").
- [ ] Podij kruga i ljestvica čitljivi su na projektoru.
- [ ] Svaki ekran radi na 375 px, 768 px i 1440 px širine.

### Uvijek (otpornost, iz [Review Focus](../superpowers/plans/2026-10-24-simpolis.md#review-focus))

- [ ] Kad AI ne odgovori ili je spor, igra teče dalje (rezerve).
- [ ] Dupli odgovor, odgovor na stari krug i dvostruki obračun mjeseca ne kvare brojke.
- [ ] Student koji izgubi kolačić i uđe istim kodom, imenom i imenom hotela dobije isti hotel.

## 6. Mjerila uspjeha (za hackathon)

- Glavni tok iz [ROADMAP.md](../ROADMAP.md) prolazi uživo pred žirijem bez ručnih zahvata.
- Wow trenutak iz [PROMISE.md](../../PROMISE.md) (cijena dolje → hotel pun, susjed prazan, grad se mijenja na
  projektoru) se vidi na M3.
- Žiri na obilascima čuje ista tri obećanja koja vidi u demou.

## 7. Izvan opsega

Popis je na jednom mjestu: [records/BACKLOG.md](../records/BACKLOG.md).
