# Preporuke za web prezentaciju (nije obavezno)

**TL;DR**
- Sve ovdje su savjeti, ne pravila. Što god ne stigneš, `deck/index.html` i PDF već rade.
- Zadrži redoslijed i vrijeme iz `SKRIPTA.md`; promo sa zvukom je finale, tipka K skače na kraj od 19 s.
- Animacija služi samo uzroku i posljedici (odgovor, presuda, novac). Jedan stil kretanja kroz cijeli deck, nikad preko promoa.
- Mora ostati: upravljanje strelicama, rad offline iz mape, 16:9, test na 1920x1080 i 1280x720, PDF kao rezerva.
- Radi na kopiji, uvijek zadnja verzija koja radi ostaje u `deck/`. Probaj s pravim clickerom i zvukom sale.

## Struktura

Slajdovi i vrijeme su u `SKRIPTA.md` i ne mijenjaju se.

| Vrijeme | Tko | Slajd |
| --- | --- | --- |
| 0:00 | Leon | 2 Ana, 17 % (slajd 1 je uvodni klip, samo u verziji od 9 min) |
| 0:27 | Simon | 3 Sims + ime, 4 Tema |
| 0:55 | Leon | 5 Tehnika (klipovi bez zvuka) |
| 1:28 | Rino | demo u aplikaciji |
| 3:12 | Simon | 6 Tko plaća, 7 Tražimo |
| 3:50 | promo | 8 video sa zvukom, zadnji kadar stoji |
| rezerva | | 9 kratki kraj (19 s), tipka K |

Tehnički okvir: strelice za slajdove, sve datoteke lokalno (bez CDN-a, biblioteke spremi u mapu), 16:9, test na 1920x1080 i 1280x720. Pažnja: trenutni deck fontove (Plus Jakarta Sans) vuče s Google Fontsa, pa ih za offline spremi lokalno.

## Dobre prakse za pokret na projektoru

- Jedna ideja po slajdu, naslov je tvrdnja ("Ana vježba uz AI i prolazi 17 % lošije"), ne tema ("Problem").
- Velik tekst: najmanje 28 px na 1280 širine, brojevi još veći. Što je dosadnije, to je bolje za govornika.
- Pokret samo za uzrok i posljedicu: odgovor, pa presuda, pa novac. Ako pokret ne objašnjava, makni ga.
- Jedan stil kretanja za cijeli deck (isti easing, ista brzina). Prijelazi sučelja 200 do 400 ms.
- Bez pokreta preko promoa i kad netko govori o brojci.
- Poštuj `prefers-reduced-motion` (isključi ili skrati animacije).
- Videe učitaj unaprijed (`preload="auto"`), zvuk nikad sam od sebe: tek nakon pritiska tipke.
- Čuvaj PDF kao rezervu i testiraj s pravim clickerom, projektorom i zvukom sale.

## Biblioteke

- **GSAP** (core, besplatan zajedno s dodacima): timelinei za "buildove" slajda, redoslijed elemenata. ScrollTrigger ne treba, slajdovi nisu scroll.
- **Motion** (motion.dev): za jednostavne ulaze i izlaze elemenata, malo koda.
- **Reveal.js**: ako želiš gotov okvir za slajdove (fragmenti, bilješke govornika, izvoz u PDF). Znači preseljenje postojećeg decka.
- **Lottie**: vektorske animacije izvezene iz After Effectsa, za ikone i male loopove.
- **HyperFrames ili Remotion**: samo ako HTML animaciju želiš izrenderirati u MP4.

## Claude Code skillovi koje Simon ima

Leon može zamoliti Simona da ih pokrene, ili koristiti slične alate.
- `hyperframes`: HTML u video.
- `gsap-core`, `gsap-timeline`, `gsap-performance`: GSAP animacije bez trzanja.
- `animate`, `emil-design-eng`: odluke o pokretu (kad, koliko dugo, zašto).
- `transitions-dev`: prijelazi između slajdova.
- `frontend-design`, `impeccable`: vizualna dorada i kritika.
- `dataviz`: grafikon za slajd o novcu.

## Izvori o pitchu (pravila, svojim riječima)

- Prve dvije rečenice kažu što je proizvod, uz konkretan primjer (Michael Seibel, YC). Nikad logo kao prvi slajd.
- Jedna osoba, jedan broj, izvor sitno ispod broja (Luka Krejci, "Pitch deck vodič").
- Pitch prodaje, ne objašnjava kako radi (Krejci, "Kuharica prezentacija", www.prezentacija.hr/kuharica; vodič je besplatan).
- Demo je pitch: nešto radi u prvih oko 90 s, jedan tok, snimka kao rezerva (Devpost vodiči za demo i suce, MLH, sažetak sudaca u https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/).
- Reci granice naglas: što je AI, što nije gotovo. Poštenje gradi povjerenje brže od savršene fasade.
- Slajd: jedna poruka, velik font, isti fontovi i boje kao aplikacija (Kevin Hale, YC; Guy Kawasaki).
- Kraj: jedan konkretan zahtjev koji soba može ispuniti i rečenica koju mogu prepričati (Seibel, Nancy Duarte).
- Što kvari: objašnjavanje umjesto prodaje, "nemamo konkurenciju", prekoračeno vrijeme, nečitljive znamenke.
- Ljepota privuče pažnju, ali bodove nosi sadržaj. Pokret je dodatak, ne zamjena.

**Bodovanje i što svaki slajd radi za njega**

| Kategorija | Max | Slajdovi |
| --- | --- | --- |
| Tema | 35 (ocjena x7) | 4 imenuje sva četiri elementa, demo ih pokazuje redom, 8 završava porukom "AI ne daje odgovore" |
| Prezentacija | 25 | 2 i 7 zatvaraju priču o Ani, 6 i 7 daju tko plaća i zahtjev, demo uživo, sva trojica govore |
| Tehnika | 25 | 5: broj PR-ova i testova, moderne tehnologije, radi na mobitelu i laptopu |
| Wow | 15 | demo s botovima, 8 promo sa zvukom |

## Gdje je istraživanje

- Privatni repo `leonkreso784-bit/ri-hack-4`, datoteka `RESEARCH.md` (indeks) i mapa `research/`.
- Dodatni pregledi (pitch playbook, hackathoni u svijetu, prošla izdanja Ri-Hacka) su na Simonovom računalu. Simon ih može poslati.
