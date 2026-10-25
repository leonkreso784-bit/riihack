# Backlog: planirano i izvan opsega

Što **nije** u demou ili je u njemu samo djelomično. Izvori: [ARHITEKTURA.md §1a](../../ARHITEKTURA.md#1a--što-je-stvarno-što-je-sučelje-što-je-plan)
i [PROMISE.md](../../PROMISE.md) › „Što NIJE u opsegu". Kamo idemo i redoslijed: [VISION.md](../product/VISION.md).
Zadaci koji **jesu** u demou žive u [planu izvedbe](../superpowers/plans/2026-10-24-simpolis.md) i issueovima.

## Planirano (pitch, slajd „Što dalje")

- Studenti vode i druge vrste tvrtki: turistička agencija, dobavljač, zaštitarska firma.
- Ugovori između studenata: preusmjeravanje gostiju drugom hotelu za proviziju ([ADR-034](DECISIONS.md#adr-034),
  L19 u [planu vala 3](../superpowers/plans/2026-10-24-simpolis-val-3.md)) nije napravljeno; u demou hotel sklapa
  ugovore samo s gradskim tvrtkama.
- Banka i krediti; porezi i općina.
- Profesor podešava mehaniku igre (sezona, potražnja, cijene, broj krugova); u demou samo playbook bez mehanike ([ADR-027](DECISIONS.md#adr-027)).
- Kalibracija troškova prema stvarnim kvarnerskim hotelima ([#209](https://github.com/leonkreso784-bit/riihack/pull/209)), ne spaja se prije predaje
  ([ADR-047](DECISIONS.md#adr-047)).
- Botovi dobavljači: [ADR-044](DECISIONS.md#adr-044) predviđa botove hotele i dobavljače, a u demou su botovi samo
  hoteli ([#205](https://github.com/leonkreso784-bit/riihack/pull/205)).
- **Tjedni krug** (Leon, sub ~19:50: kasnije planiranje, zasad se ne radi): profesor bira tjedni ili mjesečni krug;
  tjedna igra traje 17 tjedana (lipanj–rujan), svaki tjedan barem jedna situacija. Poznati zahtjevi: broj krugova kao
  podatak igre umjesto `MAX_ROUNDS`, tjedna krivulja potražnje, troškovi i kapacitet skalirani s 7/30, trajanje ugovora
  u tjednima, 1 situacija po tjednu, oznake poput „Tjedan 7 · srpanj".
- Više gradova i država.
- Ponovni ulaz studenta s PIN-om, ne samo imenom ([ADR-053](DECISIONS.md#adr-053)).
- Stroga CSP ([ADR-053](DECISIONS.md#adr-053)).
- Šok gumb, novine, glas, replay sezone.
- Značke iz kriterija rubrike (npr. „Smirivač gostiju"), [plan izvedbe](../superpowers/plans/2026-10-24-simpolis.md) (L5, gamifikacija).
- Radar vještina: sljedeći korak, ne radi se prije predaje (graditelj ~02:30). Komponenta
  `src/components/wow/skill-radar.tsx` s lažnim podacima postoji, ali nije ni na jednom ekranu.
- Simulator unaprijed: procjena popunjenosti i dobiti na stranici Plan, prije odluke
  ([ARHITEKTURA.md §9a](../../ARHITEKTURA.md#9a--wow-sloj), W1-d). U demou je samo „Što ako?" za već obračunat
  mjesec (niže).

## Djelomično u demou

- Poruke među hotelima ([ADR-034](DECISIONS.md#adr-034)): API radi ([#177](https://github.com/leonkreso784-bit/riihack/pull/177), smoke korak 17), demo igra
  ima dvije poruke, a student ih čita u Pošti. Obrasca za novu poruku i profesorova pregleda poruka u sučelju nema.
- „Što ako?" ([ADR-042](DECISIONS.md#adr-042)): procjena u pregledniku na stranicama „Kako je izračunat mjesec" i
  „Kako odjeli utječu na hotel", istim motorom i s pravim brojkama zatvorenog mjeseca. Ruta na poslužitelju se ne
  radi.

## Izvan opsega (ne radimo)

- Računi i lozinke za studente ([ADR-004](DECISIONS.md#adr-004)); profesorski računi rade od vala 3
  ([ADR-036](DECISIONS.md#adr-036), [#147](https://github.com/leonkreso784-bit/riihack/pull/147)).
- Više jezika.
- AI koji sam šalje situacije studentima (AI samo predlaže, profesor sprema, [ADR-024](DECISIONS.md#adr-024)).
- Mobilna aplikacija (web je responsive).
- Merlin.
