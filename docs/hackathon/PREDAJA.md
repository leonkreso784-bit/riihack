# Predaja

## Dokumentacija (šalje se na Discord)

Predaja u #prezentacije do ned 25.10. u 10:30: prezentacija (PDF) i GitHub link. Sadržaj:

1. **Simpolis:** svijet simulacija u kojem student vodi tvrtku, rješava stvarne situacije i uči odlučivati sam,
   a AI glumi likove i procjenjuje njegovo razmišljanje umjesto da mu da gotov odgovor.
2. **Problem:** AI danas odgovara na sve, pa se učenje svodi na prepisivanje. Studenti znaju gradivo napamet, ali
   ga ne znaju primijeniti, a profesor ne vidi kako student razmišlja, nego samo konačni odgovor.
3. **Rješenje:** profesor stvori svijet i vodi krugove. Student dobije hotel (druge vrste tvrtki su sljedeći korak) i u svakom krugu
   rješava situacije: klikom, vlastitim riječima ili razgovorom s likom. Vlastito razmišljanje vrijedi više od
   klika: ponuđeni ili prepisan odgovor vrijedi najviše 4 od 5, vlastite riječi do 5. Na kraju kruga mentor objasni zašto. Ocjena je napredak u
   odnosu na vlastiti početak. Tvrtke žive u istom svijetu i sklapaju ugovore s gradskim tvrtkama.
4. **Tehnologija:** Next.js, TypeScript, Tailwind, Neon Postgres, Drizzle, Claude (AI SDK), Vercel. Vidi
   [ARHITEKTURA.md](../ARHITEKTURA.md).
5. **Uloga AI-ja:** AI glumi likove, provjerava koje kriterije rubrike odgovor ispunjava i piše mentorov osvrt.
   **Bodove računaju pravila igre**, uvijek jednako, pa je ocjena fer i provjerljiva.
6. **Poslovni model:** prvi korisnici su fakulteti u partnerstvu s tvrtkama (npr. hotelska kuća donosi stvarne
   situacije i put do prakse i posla). Fakultet plaća licencu za korištenje po semestru ili godini. Uz to svi ostali
   mogu igrati u zasebnom predvorju, odvojeno od studenata koji igraju u kontroliranom okruženju kolegija. Cijenu
   licence još nismo dogovorili; AI košta oko 0,07 $ po studentu za cijelu sezonu (procjena). Ciljani prvi pilot:
   jedan kolegij (npr. FMTU Opatija) i jedna hotelska kuća; još nikoga nismo pitali.
7. **Što bismo radili dalje:** nove simulacije u istom svijetu (dobavljač, agencija…), situacije iz gradiva
   kolegija, ulaz iz Merlina (LTI), engleski jezik. Sljedeći korak (nije u demou): ugovori među studentima (preusmjeravanje gostiju), radar vještina,
   simulator unaprijed, karta na profesorovoj ploči, kalibracija troškova prema stvarnim hotelima, PIN za studente.
8. **Linkovi:** demo <https://riihack.vercel.app> (student ulazi kodom na /ulaz, profesor s računom na /profesor),
   repo <https://github.com/leonkreso784-bit/riihack>, prezentacija [prezentacija/](prezentacija/README.md) (PDF i deck),
   video [prezentacija/video/simpolis-demo.mp4](prezentacija/video/simpolis-demo.mp4) (80 s).
9. **Tim:** Leon (motor igre, ekonomija grada, API i baza, integracija i dokumentacija), Rino (sučelje studenta i
   profesora, izgled, mobitel i projektor), Simon (AI: gost, sudac i mentor; Tokovi, karta grada, botovi, situacije
   profesora; pitch i istraživanje).
10. **Dokumentacija:** [docs/README.md](../README.md) (ulaz), [docs/product/PRD.md](https://github.com/leonkreso784-bit/riihack/blob/ri-hack-4.0/docs/product/PRD.md)
    (kriteriji), [docs/records/DECISIONS.md](../records/DECISIONS.md) (ADR),
    [ARHITEKTURA.md](../ARHITEKTURA.md) §1a (što je stvarno; danas [STATUS.md](../STATUS.md)).

## Pitch (5 minuta, ned od 10:45)

Aktualni scenarij je [prezentacija/PITCH-SKRIPTA-v6.md](prezentacija/PITCH-SKRIPTA-v6.md). Ispod je rani nacrt (subota).

| Vrijeme | Što | Tko |
| --- | --- | --- |
| 0:00 – 0:30 | Problem: „Zašto učiti ako AI zna sve?" Sokrat nije davao odgovore, nego je postavljao pitanja | |
| 0:30 – 2:00 | Live demo: profesor otvori krug, student razgovara s gostom, napiše svoj odgovor, mentor objasni | |
| 2:00 – 2:30 | Kako radi: AI ne računa bodove, vlastite riječi vrijede više od klika, jedan svijet za sve simulacije | |
| 2:30 – 3:00 | Poslovni model i sljedeći koraci (agencija, dobavljač, FMTU pilot) | |

## Kontrolna lista

- [ ] Demo radi na javnom linku
- [ ] Snimljen video demoa (rezerva)
- [ ] Repo je uredan, README objašnjava pokretanje
- [ ] Nema tajni ni ključeva u repou
- [ ] Dokumentacija predana na Discordu prije roka (ned 10:30)
- [ ] Pitch isproban barem jednom naglas
