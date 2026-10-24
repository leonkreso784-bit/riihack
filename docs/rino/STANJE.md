# Rino · sučelje: gdje smo stali

> Zapisano **sub 24.10.2026. u 21:05**, dopunjeno u **21:16**. Nova sesija (nakon `/clear`) čita ovu datoteku da nastavi Rinov dio. Živi na
> grani `rino/dokumentacija`; na `main` ide samo Rinovo polje u `TEAM.md`.

## Prvo pročitaj

1. `TEAM.md` na `main`-u: ploča tima, **pravila suradnje**, tko na koga čeka.
2. Plan izvedbe `docs/superpowers/plans/2026-10-24-simpolis.md` (R0–R10) i plan vala 3
   `docs/superpowers/plans/2026-10-24-simpolis-val-3.md` (R11–R15).
3. Ova datoteka.
4. `gh pr list --state open` i `git log origin/main --oneline -15`: što se spojilo dok nas nije bilo.

## Pravila

- **Spaja samo integrator (Leonova sesija).** Ti otvoriš PR, provjeriš na svježem `main`-u i javiš „#N je spreman".
- Na `main` izravno ide **samo** tvoje polje u `TEAM.md` (commit `ploča: Rino`). Sve ostalo preko grana i PR-ova.
- Jedan zadatak = jedna grana `rino/<ID>-<opis>` = jedan PR. Prije PR-a: `npm run typecheck && npm run lint && npm test && npm run build`.
- **Tvoje datoteke:** `src/app/` (bez `api/`, `igra/grad`, `profesor/[worldId]/situacije`), `src/components/` (bez `city/`, `wow/`),
  `src/lib/client.ts`, `src/lib/mock.ts`, `src/lib/format.ts`, `src/lib/finance-view.ts`, `globals.css`, `layout.tsx`.
- **Ne diraj:** grad i karta (Simon, `components/city/`), `types.ts`, `rules.ts`, `package.json` (Leon). Financije i Plan
  su Simonove (S6): Rino ih je proširio u #142 uz Simonov ok.
- U repou se **ne smije** pojaviti ime prijašnjeg projekta (Leonov stari simulator hotela): ni u kodu, komentaru, commitu
  ni PR-u. Prije PR-a `git grep -i` za to ime mora biti prazan.
- Svaki PR provjeri u pregledniku (lažni podaci lokalno, 375 i 1440 px), a nakon spajanja **na produkciji** jednom pravom
  igrom. Previewi traže Vercel prijavu, pa testiramo na https://riihack.vercel.app nakon spajanja.
- `.env.local` lokalno ima zamjenske vrijednosti (nema prave baze). Ne povlačiti tajne bez Rinovog izričitog ok-a.

## Gdje je što

| Što | Gdje |
| --- | --- |
| Repo | `leonkreso784-bit/riihack`, lokalno `C:\Users\Korisnik\Desktop\riihack` |
| Produkcija (`main`, **pravi API od 17:52**) | https://riihack.vercel.app |
| Lažni podaci | lokalno (`npm run build && npx next start`) bez `NEXT_PUBLIC_USE_MOCK=0`; demo igra `/profesor/w-demo`, situacija `/igra/situacija/s-klima` |
| Alat za test u pregledniku | `playwright-core` (+ `jsqr`, `pngjs`) u scratchpad mapi sesije; nakon `/clear` instalirati iznova u novi scratchpad |
| Logo | izvorna slika V1: `public/brand/logo.png`, `logo-mark.png`, `src/components/logo.tsx`. Ne crtati iznova. |

## Spojeno (sve na produkciji)

| PR | Što |
| --- | --- |
| #40–#78, #91 | R0 ljuska i tema, R1 ulaz, R2 profesor, R3 sobe, logo V1, animacije, favicon |
| #93 | `/` predstavljanje, ulaz kodom na `/ulaz` |
| #97 | R5 situacija s likom (razgovor, vlastiti odgovor, klik, presuda) |
| #108 | R6 profesorova ploča (krug, rok, „Zatvori … i otvori …", tko je gotov, ljestvica, „Situacije"), **bez karte grada** (Simonovo) |
| #113, #135 | Osoblje → **Odjeli** (`/igra/osoblje`): pokazatelj, upozorenja, ulaganje 0–3.000 € po odjelu |
| #127 | popravci M2 (prelijevanje na 1000–1100 px, plavi „polis") |
| #138, #151 | `/ulaz?kod=…` sam upiše kod; **QR kod** na profesorovoj čekaonici (provjeren QR čitačem) |
| #142 | detaljnije Financije (sažetak po mjesecima, raspodjela troškova), Plan („Što ova odluka košta"), Odjeli (povijest) |
| #152 | R4 **„Završi mjesec"** za studenta; profesor vidi tko je gotov i otvara sljedeći mjesec **svima** |
| #157 | plan bez imena prijašnjeg projekta |
| #160 | R7 **izvještaj mjeseca i sokratski mentor** (`/igra/izvjestaj/[krug]`) |
| #164 | R13 **Pošta** (`/igra/posta`): ponude agencija, protuponuda, odgovor agencije (motor + Simonov AI), omotnica na mobitelu |
| #166 | Leonov `fromRound` u `prof-board.tsx` (dvoklik ne preskače mjesec), uz Rinov ok |
| #168 | R8 **uvid u studenta** (`/profesor/[worldId]/tvrtka/[id]`): situacije, odgovori, presude, razgovor, mentor, **„Promijeni ocjenu" 1–5**; imena na ploči vode tamo. Radar vještina namjerno izostavljen (pokazni podaci) |
| #173 | sitnice: oznaka „od profesora" (R5), mjesec zadnjeg obračuna na `/igra`, bez bljeska `/cekaonica`, komentar u `logout-button.tsx` |
| pregled | ok i odobrenje za #128 (Simonova karta, smjer D) i #107 (komentari) |

Provjereno na produkciji (20:00): QR → student → Završi mjesec → profesor vidi i otvara srpanj → Financije, Plan, Odjeli,
Grad; 0 grešaka.

## Otvoreno (sub 21:16)

- **#180** (Rino) dokumenti: nema zamrzavanja koda (ADR-031) u `CLAUDE.md`, `PLAN-24H.md`, `TEAM.md` i glavnom planu.
  Samo dokumentacija. U ADR-031 „Posljedice“ ostaje 🟨 napomena, može je zatvoriti vlasnik zapisa.

Ostalo: Čeka se Leonovo spajanje tuđih PR-ova s Rinovim ok-om:

- **#169** (Leon) L16 ekrani: registracija, prijava, Moje igre. **Ovo je bio R14:** Rino je pregledao izgled (375 i
  1440 px, slaže se s aplikacijom) i odobrio. R14 je time gotov.
- **#170** (Simon) knjižnica situacija: Rinov ok za `client.ts` (tri poziva, `isUnauthorized`, `status` u grešci).
- **#174** (Simon) „Kako je izračunat mjesec" (`/igra/izvjestaj/[krug]/tok`, tok obračuna i „Što ako?"): Rino dao ok da
  **Simon sam doda poveznice** na izvještaj mjeseca i na Financije u tom PR-u.

Provjereno na produkciji: **pošta (#164)** u 20:52: ponuda Praonice 1.500 € → protuponuda 1.125 € → AI odgovor agencije
„na pola puta 1.313 €" → Prihvati → ugovor 1.313 € na serveru, 0 nepročitanih.

Poruka Leonu (21:05) poslana: spremni #169, #170, #174 (nakon poveznica); pitanje ima li prioritet prije M3.

## Sljedeće (redom)

1. ~~Provjeri na produkciji #168 i #173~~ ✅ 21:15 (igra `GE4FMD`): ocjena 1 → 5 s oznakom „· profesor“ i nakon osvježavanja;
   „od profesora“ samo na profesorovim vlastitim situacijama (iz banke ne, tako je zamišljeno); bez bljeska; „lipanj“ na karticama; 0 grešaka.
2. Kad Leon spoji #169, #170, #174: kratka provjera na produkciji (registracija → Moje igre → nova igra; poveznica
   „Kako je izračunat mjesec" s izvještaja).
3. Pogledaj odgovor Leona na Discordu: ima li prioritet prije M3.
4. **R10** podij kruga i ljestvica za projektor (#46), ako nema ništa važnije.
5. **R15** poruke među hotelima i suradnja, kad Leon napravi L18 (backend).
6. Tjedni umjesto mjesečnog kruga: u Leonovom backlogu (traži ugovor i motor); sučelje tek kad ugovor bude na `main`-u.

## Rokovi

M3 obilazak 3: **ned 07:45**. **Nema zamrzavanja koda** (ADR-031), gradi se do predaje. Predaja: **ned 10:15** (rok 10:30).
