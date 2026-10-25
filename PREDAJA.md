# Predaja

## Dokumentacija (šalje se na Discord)

Provjeriti s pravilima na Discordu koji se format traži. Nacrt sadržaja (dopuniti na kraju):

1. **Simpolis:** svijet simulacija u kojem student vodi tvrtku, rješava stvarne situacije i uči odlučivati sam,
   a AI glumi likove i procjenjuje njegovo razmišljanje umjesto da mu da gotov odgovor.
2. **Problem:** AI danas odgovara na sve, pa se učenje svodi na prepisivanje. Studenti znaju gradivo napamet, ali
   ga ne znaju primijeniti, a profesor ne vidi kako student razmišlja, nego samo konačni odgovor.
3. **Rješenje:** profesor stvori svijet i vodi krugove. Student dobije tvrtku (hotel, agenciju…) i u svakom krugu
   rješava situacije: klikom, vlastitim riječima ili razgovorom s likom. Vlastito razmišljanje vrijedi više od
   klika; prepisan gotov odgovor ne donosi bodove. Na kraju kruga mentor objasni zašto. Ocjena je napredak u
   odnosu na vlastiti početak. Tvrtke žive u istom svijetu i sklapaju ugovore s gradskim tvrtkama.
4. **Tehnologija:** Next.js, TypeScript, Tailwind, Neon Postgres, Drizzle, Claude (AI SDK), Vercel. Vidi
   [ARHITEKTURA.md](ARHITEKTURA.md).
5. **Uloga AI-ja:** AI glumi likove, provjerava koje kriterije rubrike odgovor ispunjava i piše mentorov osvrt.
   **Bodove računaju pravila igre**, uvijek jednako, pa je ocjena fer i provjerljiva.
6. **Poslovni model** 🟨: licenca po kolegiju ili semestru za fakultete i srednje škole; besplatna proba za
   profesora. Kasnije: tvrtke za obuku novih zaposlenika (hotelski lanci, agencije). Prvi korisnik: FMTU Opatija.
7. **Što bismo radili dalje:** nove simulacije u istom svijetu (dobavljač, zaštitarska firma…), situacije iz gradiva
   kolegija, engleski jezik. Već u demou, a dalje ih razrađujemo: ugovori među studentima (L19), radar vještina,
   simulator unaprijed, karta na profesorovoj ploči, kalibracija troškova (#209), PIN za studente.
8. **Linkovi:** demo, repo, video
9. **Tim:** Rino (frontend), Leon i Simon (backend i AI); dopuniti tko je što radio.
10. **Dokumentacija:** [docs/README.md](docs/README.md) (ulaz), [docs/product/PRD.md](docs/product/PRD.md)
    (kriteriji), [docs/records/DECISIONS.md](docs/records/DECISIONS.md) (ADR),
    [ARHITEKTURA.md](ARHITEKTURA.md) §1a (što je stvarno).

## Pitch (provjeriti stvarno ograničenje; 2023. i 2024. bilo je ~7 min + 3-5 min pitanja)

Za 7 minuta vidi [prep/pitch-template.md](https://github.com/leonkreso784-bit/ri-hack-4/blob/main/prep/pitch-template.md). Ispod je kratka verzija ako je ograničenje 3 minute.

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
- [ ] Dokumentacija predana na Discordu prije roka (predaja 10:15, rok 10:30)
- [ ] Pitch isproban barem jednom naglas
