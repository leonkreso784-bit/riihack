# Prijedlog stila (Rino)

> 24.10.2026. **Prijedlog, nije odluka.** Vrijedi izgled iz plana (HotelixSim boje, Plus Jakarta Sans, bijele
> kartice 20 px, boje samo kroz tokene). Sve ispod se gradi **na tome**, ne umjesto toga, i može se mijenjati ili
> izbaciti u bilo kojem trenutku. Razine 1 i više mijenjaju dogovoreni izgled, pa idu tek uz Leonov OK.

## Što od poznatih stilova koristimo

| Stil | Gdje | Zašto |
| --- | --- | --- |
| **Bento Grid** | raspored „Moja tvrtka" (R4) | ekran je ploča (pokazatelji, krug, situacije, ljestvica); pločice različitih veličina, radi na 375/768/1440 px, ne košta ništa |
| **Claymorphism** | osjećaj gumba i kartica | mekano, „debelo", malo 3D; slaže se s karticama od 20 px i daje osjećaj igre bez sukoba s bojama |
| **Swiss / Editorial** | samo profesorova ploča na projektoru (R2, R6) | golema slova, stroga mreža, visok kontrast, čitljivo s kraja dvorane |
| **Pixel Art** (možda) | samo karta grada ili ikone | tycoon štih; cijela aplikacija u pikselima bila bi naporna |

**Ne koristimo:** Glassmorphism i Neumorphism (slab kontrast, nestaju na projektoru); Cyberpunk, Synthwave, Y2K,
Cybercore (krivi ton za profesore i tvrtke); Victorian, Bohemian, Surrealism, Ethereal, Scrapbook, Maximalism,
Wabi-Sabi, Conceptual Sketch, Luxury Typography (ne pašu simulaciji vođenja).

## U stilu Simsa

Sims je simulacija vođenja ljudi i njihovih potreba, kao i naša igra. **Samo inspiracija:** bez EA grafike, bez
oblika plumboba, bez Simlisha.

| Iz Simsa | Kod nas |
| --- | --- |
| trake potreba | 5 pokazatelja kao ploča potreba, zeleno → crveno, ikona po pokazatelju |
| plumbob iznad lika | oznaka stanja iznad svakog studenta na profesorovoj ploči: zeleno zatvorio krug, žuto igra, crveno nije počeo (vlastiti oblik) |
| oblačić misli | poruke gosta u oblačićima; „Gost razmišlja…" kao oblačić s tri točke |
| moodleti | obavijesti za događaje: „+5 Recenzije", „Soba 204 u kvaru" |
| izometrijski pogled | sobe (R3) kao izometrijski tlocrt, čisti CSS (`rotateX(60deg) rotateZ(-45deg)` na postojećoj mreži), bez biblioteke |

## Razine (od jednostavnog prema boljem)

Svaka razina je zaseban PR. Sve je u CSS varijablama i klasama, pa nadogradnja mijenja izgled, ne komponente.

| Razina | Što | Cijena | Kada |
| --- | --- | --- | --- |
| **0** | HotelixSim tokeni + Bento raspored | dolazi s R0 i R4 | obavezno, M1 |
| **1** | Clay: meke sjene, „debeli" gumbi koji se utisnu na klik, malo više zaobljenja | ~1 h, samo CSS | nakon M1 |
| **2** | Sims HUD: trake potreba, oznake stanja na profesorovoj ploči, oblačići misli, moodleti | 2–3 h, unutar R4, R5, R6 | prema M2 |
| **3** | izometrijske sobe (R3) i, sa Simonom, izometrijska karta (S5) | 2–3 h | M3, ako ima vremena |
| **4** | mikroanimacije, zvukovi radnji, ilustrirani avatari | ostatak | poslije zamrzavanja samo poliranje |

**Pravila na svakoj razini:** tekst čitljiv na projektoru; gumbi najmanje 44 px na mobitelu; animacije se gase uz
`prefers-reduced-motion`.
