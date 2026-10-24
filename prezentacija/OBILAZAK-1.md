# Obilazak žirija 1 · sub ~14:45

**TL;DR:** 2 minute, svi govorimo isto. Simon: problem i 3 obećanja (75 s). Rino: pokaže aplikaciju (45 s). Leon: kako
radi i što stiže do 18:45 (20 s). Na kraju **pitamo žiri** „Što vam je najvažnije da vidite u nedjelju?" i
**zapišemo odgovor**. Ne obećavamo ništa novo.

## Gdje smo (stanje 14:05)

| | Radi | Stiže do 18:45 (M2) |
| --- | --- | --- |
| **Aplikacija** | javni link riihack.vercel.app; početna s 3 obećanja; „Moj hotel" (pokazatelji, novac, krug, situacije, ljestvica) na primjer-podacima; plan kruga, financije i karta grada gotovi (PR #47, #48) | baza (Neon), ulaz kodom, sobe, profesorova igra |
| **AI** | **sudac po rubrici radi na pravom modelu** (Claude Sonnet): dobar odgovor 3 od 4 kriterija, loš 1, pokušaj „ignoriraj upute" 0; ključ je na Vercelu | razgovor s gostom uživo (stream), sokratski mentor |
| **Grad** | pravila i ugovor tipova (osoblje, napredak po krugu); karta grada na primjer-podacima | obračun mjeseca za cijeli grad (tržište turista, novac, ugovori) |

Iskreno reći: **sučelje radi na primjer-podacima** (piše „primjer" na ekranu), baza i obračun grada stižu do 18:45.

## Tko što govori

**Simon (75 s), problem i obećanja**
> Mi smo Pojedinci, radimo **Simpolis**. AI studentu napiše savršen esej o vođenju hotela, ali ga ne nauči što
> reći ljutom gostu u sobi 204. Studenti hotelijerstva prvu pravu odluku s gostom donose tek na praksi, u zadnjem
> semestru. A tko vježba s AI-jem koji mu daje gotove odgovore, na ispitu bez njega ima **17 % lošiji rezultat**
> (Bastani i sur., PNAS 2025.).
>
> Simpolis je grad u simulaciji: profesor ga napravi kao Kahoot, svaki student vodi svoj hotel, a svi hoteli dijele
> iste turiste i isti novac. Do nedjelje obećavamo tri stvari:
> 1. **Pravi grad, prava ekonomija:** odluka jednog hotela mijenja goste i novac drugima, vidi se uživo na karti.
> 2. **Odluke s ljudima, ne s gotovim odgovorima:** student razgovara s gostom kojeg glumi AI i odgovara svojim
>    riječima; AI provjerava po rubrici, a bodove računaju pravila igre.
> 3. **Razred kao Kahoot:** profesor napravi grad, razred uđe kodom, svatko dobije svoj hotel sa sobama.

**Rino (45 s), pokaže aplikaciju** (laptop, svijetla tema)
1. Početna: tri obećanja kao tri kartice.
2. „Pogledaj igru (primjer)" → Moj hotel: pokazatelji 0–100, novac, krug „Srpanj, 2 od 4", situacije, ljestvica po
   napretku (ne po novcu).
3. Ako je spojeno: Plan (klizači cijene i marketinga) i Grad (karta s hotelima i ugovorima).

**Leon (20 s), kako radi**
> AI glumi ljude i provjerava odgovor po rubrici, ali **nikad ne računa bodove**: to radi motor igre, uvijek isto za
> svakoga. Sudac već radi na pravom modelu. Do večeras: baza, ulaz kodom i obračun mjeseca za cijeli grad.

**Svi: pitanje žiriju**
> „Što vam je najvažnije da vidite u nedjelju?"

Tko zapisuje odgovor: **Simon** (u `PROMISE.md`, odmah nakon obilaska).

## Pitanja koja žiri uvijek pita (kratki odgovori)

- **Zašto ne ChatGPT ili Cesim?** „Cesim te uči brojke hotela. ChatGPT ti glumi gosta, ali sutra sve zaboravi. Kod
  nas ono što kažeš gostu u lipnju vidiš u recenzijama u srpnju i u blagajni u kolovozu."
- **Kako spriječiti prepisivanje?** Vlastite riječi vrijede više od klika (klik najviše 4/5), prepisan ponuđeni
  odgovor broji se kao klik, a bodove ne daje AI nego pravila.
- **Tko plaća?** Licenca po kolegiju; prvi korisnik je kolegij na FMTU u Opatiji (Leonov HotelixSim je tamo pred
  pilotom). AI trošak je ispod eura za razred od 30 studenata.
- **Je li ovo demo ili mock-up?** Sučelje je na primjer-podacima i to piše na ekranu; AI sudac radi na pravom modelu;
  baza i grad stižu do 18:45. Reći što je pripremljeno prije (istraživanje, starter) i što je AI.
- **Privatnost?** U demou samo nadimci, AI ključ samo na poslužitelju, na ekranu piše što radi AI.
- **Zašto Rijeka / tema?** Tema je učenje u doba AI-ja: Simpolis tjera studenta da razmišlja sam, a AI mu glumi
  ljude umjesto da mu piše odgovore.

## Prije 14:45 (provjera)

- [ ] riihack.vercel.app/igra radi (treba spojiti #49 ili #50, main je crven); ako ne radi: laptop s lokalnom
      verzijom ili snimke zaslona
- [ ] laptop napunjen, svijetla tema, zoom na 125 %
- [ ] svatko je jednom naglas pročitao svoj dio
- [ ] ne obećavamo ništa izvan tri obećanja
