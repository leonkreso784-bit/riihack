# Simpolis · Ri-Hack 4.0

Repo natjecanja tima za Ri-Hack 4.0 (RITEH Web Team, STEP RI, Rijeka). Priprema i istraživanje: [ri-hack-4](https://github.com/leonkreso784-bit/ri-hack-4).

**Simpolis** je svijet simulacija za učenje: student vodi tvrtku (prvo hotel), rješava stvarne situacije i uči
odlučivati sam, a AI glumi likove i procjenjuje njegovo razmišljanje umjesto da mu da gotov odgovor. Profesor
stvori svijet i vodi krugove. Tema: *Poticanje ljudi na učenje u doba umjetne inteligencije*.

## Najvažnije (1 min)

Žiri 3 puta (sub 14:00, sub 19:00, ned 08:00), boduje napredak od prvih 3 obećanja. Pobjeđuje aplikacija koja radi, za stvaran problem Rijeke. Pitch ~7 min ned od 10:45. Više u [RESEARCH.md](https://github.com/leonkreso784-bit/ri-hack-4/blob/main/RESEARCH.md).

## Osnovno

- **Format:** 24 h kodiranja, isključivo programerski. Ekonomski dio je ukinut, ali jasna vizija i poslovni model ostavljaju bolji dojam na žiri.
- **Tema:** [Ri-Hack 4.0 Tema.pdf](Ri-Hack%204.0%20Tema.pdf), sažetak u [IDEJA.md](IDEJA.md).
- **Rok predaje:** nedjelja 25.10.2026. u 10:30 (prezentacija i GitHub link u #prezentacije na Discordu).
- **Predaja:** dokumentacija se šalje preko Discorda kad isteknu 24 h.
- **Registracija:** petak 23.10. od 13:50, prije predavanja.
- **Discord:** <https://discord.gg/BqhNymCJ> (nakon ulaska čekaj da ti admin dodijeli ulogu)

## Tim

Leon ([@leonkreso784-bit](https://github.com/leonkreso784-bit)), Simon ([@simonseifert](https://github.com/simonseifert)) i Rino ([@rtomic20](https://github.com/rtomic20)). Više u [TEAM.md](TEAM.md).

## Dokumenti

- [TEAM.md](TEAM.md): tko smo i u čemu je tko jak
- [CLAUDE.md](CLAUDE.md): kako radimo u repou (i upute za Claude Code)
- [RADNI-DOGOVOR.md](RADNI-DOGOVOR.md): uloge, stack, git pravila
- [PLAN-24H.md](PLAN-24H.md): raspored 24 sata
- [IDEJA.md](IDEJA.md): tema, ideja, obrasci iz HotelixSima, ime
- [ARHITEKTURA.md](ARHITEKTURA.md): stack, model podataka, motor, AI, API, ekrani
- [PREDAJA.md](PREDAJA.md): predložak dokumentacije i pitcha
- **[Plan izvedbe](docs/superpowers/plans/2026-10-24-simpolis.md)**: tko radi što, zadaci i prekretnice
- [RESEARCH.md](https://github.com/leonkreso784-bit/ri-hack-4/blob/main/RESEARCH.md): istraživanje (prošla izdanja, žiri, Rijeka, pitch) i ažurni vodiči za stack

## Pokretanje

Treba Node 24 i npm.

```bash
npm install
cp .env.example .env.local   # upiši DATABASE_URL i ANTHROPIC_API_KEY (dobiješ ih privatno)
npm run dev                  # http://localhost:3000
```

Provjere prije svakog spajanja: `npm run typecheck && npm run lint && npm test && npm run build`.
Tipovi su u `src/lib/types.ts`, pravila igre u `src/lib/rules.ts`; oba mijenja samo Leon, uz najavu timu.
