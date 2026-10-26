# Simpolis

> A learning game for running a hotel: students manage a hotel and talk to guests played by AI, while a rules engine, not the AI, computes every number.

Hrvatski: [README.md](README.md)

## TL;DR

- **Simpolis** is a web game for hospitality and tourism students. A professor opens a game, the class joins with a code, and every student runs their own hotel in a shared city, month by month.
- AI plays the guests and staff, grades free-text answers against a rubric, and, as a mentor, asks reflective questions. **Every figure (money, occupancy, grades) is computed by the game rules.**
- Built in 24 hours at the Ri-Hack 4.0 hackathon (Rijeka, Croatia, 24 and 25 October 2026): **3rd place out of 8 teams**. Live at <https://riihack.vercel.app/>. Try it: open `/profesor`, create an account and a game, then join as a student on `/ulaz`.
- We are continuing as a startup: the plan is a free pilot at FMTU in Opatija, then paid licences for faculties.
- All rights reserved. The code is publicly visible for review and portfolio only (see [License](#license)).

<p align="center">
  <img src="docs/img/hotel.jpg" alt="Hotel board in the student view: indicators, account balance and this round's situations" width="640">
</p>
<p align="center">
  <img src="docs/img/chat-mob.jpg" alt="Chat with a character on a phone: the technical service manager explains a broken air conditioner" height="360">
  <img src="docs/img/prof.jpg" alt="Professor's situation list: bank situations, own situations and scheduled sends" height="360">
</p>
<p align="center"><sub>Student: hotel board and a conversation with a character. Professor: situations for the class. The interface is in Croatian.</sub></p>

## Links

| What | Where |
| --- | --- |
| Live app | <https://riihack.vercel.app/> |
| Web presentation | <https://prezentacijariihack.vercel.app/> |
| Version the jury judged | [release `ri-hack-4.0`](https://github.com/leonkreso784-bit/riihack/releases/tag/ri-hack-4.0) (commit `b6ffb61`) |
| Promo video | [release `promo-video`](https://github.com/leonkreso784-bit/riihack/releases/tag/promo-video) |

**Try it (in more detail):** on `/profesor` create a professor account, open a game, add bots, or join with the game code on `/ulaz` as a student (for example from your phone). Use made-up nicknames, this is a demo.

## What is Simpolis

Hospitality students meet their first angry guests only during their internship, when a mistake costs a real guest. AI that hands out ready answers does not help here: students who practised with GPT-4 without guardrails scored 17% lower on an exam without AI (Bastani et al., PNAS 2025, high-school mathematics).

Simpolis gives students a safe place to practise decisions that involve people and money. The game loop:

1. **The professor creates a game.** The class joins with a code or QR code, and each student gets one of six hotels in the Kvarner region.
2. **Situations.** Each month brings two situations: a guest or staff member with a problem (for example, the air conditioning breaks in the middle of the season). The student talks to the character, up to six messages.
3. **Answer and rubric.** An offered answer is worth at most 3 out of 5, the student's own words up to 5 out of 5. An AI judge marks which of five rubric criteria the answer met.
4. **Plan.** The student sets the price, marketing and investment in hotel departments.
5. **Month close.** The professor closes the month, the rules compute occupancy, cash and reviews (all hotels share the same tourists), and the class sees the month's podium.
6. **Mentor.** The mentor asks about the student's weakest decision of the month, the student reflects, and the mentor replies.

A season lasts four months (June to September) and ends with a season podium.

## How it works

| Who | What it does |
| --- | --- |
| **Game rules** (code) | Compute money, occupancy, the market and answer quality. Pure functions with no database or network access, covered by tests. |
| **AI** (Claude) | Plays guests and staff (Haiku 5.5), judges against the rubric and runs the mentor (Sonnet 5.5). It computes nothing: it returns criterion ids or text, and any figures in that text come from the game rules' calculations. |
| **Professor** | Has the last word: can change an answer's grade, and reviews and saves every AI-proposed situation before it is sent. |

Every AI call has a time limit and a fallback answer, so the game keeps working when the AI does not respond. The mentor asks first and explains afterwards.

## Status

The `ri-hack-4.0` version works end to end: joining with a code, hotel board, situations with a conversation and rubric grading, plan and finances, a city with contracts with local businesses, month close with a podium, mentor, professor overview and bots.

- **Checks:** 947 tests in 70 files pass, typecheck and lint are clean, the build passes, CI is green.
- **Content:** 6 hotels, 8 situations, 6 city businesses, 8 contract templates. 26 pages, 37 API route files, 19 database tables.
- **Development:** 671 commits and 236 merged pull requests on `main`, all made during the hackathon.
- **Not done yet:** a season is fixed at four months, there are only 8 situations and all are about hotels, and there is no English interface or grade export. Login through the faculty (AAI@EduHr, Merlin) is a goal. A PIN for student entry is planned ([ADR-053](docs/records/DECISIONS.md#adr-053)).

Details and known bugs: [docs/STATUS.md](docs/STATUS.md) (Croatian).

## Plan

- **Pilot:** a free pilot at FMTU in Opatija (Faculty of Tourism and Hospitality Management). The list of what is still needed for the pilot lives in [GitHub Issues](https://github.com/leonkreso784-bit/riihack/issues), in the [Pilot FMTU](https://github.com/leonkreso784-bit/riihack/milestone/6) milestone.
- **Faculties:** licences for faculties, from 10 EUR per student per year. Our estimate of the AI cost is about 7 cents per student per season. The price is a plan and has not been confirmed.
- **Companies:** training for hotels and businesses.
- **Later:** a multiplayer web game and integration with SRCE (University Computing Centre: Merlin through LTI, AAI@EduHr login). The integration is a goal, not an agreement.
- **Incubator:** we are applying to the Startup Incubator Rijeka (RiHub), 18th generation.

Details: [docs/ROADMAP.md](docs/ROADMAP.md) (Croatian).

## Run locally

You need Node 24, npm and your own empty Neon database.

```bash
git clone https://github.com/leonkreso784-bit/riihack.git && cd riihack
npm ci
cp .env.example .env.local   # fill in DATABASE_URL, ANTHROPIC_API_KEY, BETTER_AUTH_SECRET, BETTER_AUTH_URL
npm run db:push              # only on your own empty database, never on a shared one (ADR-026)
npm run dev                  # http://localhost:3000
```

- **Interface only, no database or keys:** set `NEXT_PUBLIC_USE_MOCK=1` in `.env.local`.
- **Mind `NEXT_PUBLIC_USE_MOCK`:** only the value `0` switches on the real API and database. Any other value, including an empty one, means fake data from `src/lib/mock.ts`.
- Checks before every PR, demo data, the smoke test and everything else: [docs/RAZVOJ.md](docs/RAZVOJ.md) (Croatian).

## Technology

| Layer | What |
| --- | --- |
| Interface | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Game rules | Pure TypeScript functions in `src/lib/engine/`, no database or network, tested with Vitest |
| AI | Vercel AI SDK, Claude Haiku 5.5 (characters, agency replies), Claude Sonnet 5.5 (judge, mentor, situation proposals) |
| Database | Neon Postgres, Drizzle ORM |
| Sign-in | Better Auth for professors, game code and nickname for students |
| Hosting and CI | Vercel, GitHub Actions (typecheck, lint, tests, build) |

Architecture in detail: [docs/ARHITEKTURA.md](docs/ARHITEKTURA.md). All documentation: [docs/README.md](docs/README.md). The documentation under `docs/` is written in Croatian.

## Ri-Hack 4.0

Simpolis was built in 24 hours at the Ri-Hack 4.0 hackathon (Rijeka, 24 and 25 October 2026). The theme was "Encouraging people to learn in the age of artificial intelligence". Team Pojedinci took **3rd place out of 8 teams**. Timeline, plan, submission and presentation: [docs/hackathon/README.md](docs/hackathon/README.md) (Croatian).

## Team

Team **Pojedinci**:

- **Leon Kreso:** integration, database, processes.
- **Rino Tomić:** frontend and interface design.
- **Simon Seifert:** game, AI, pitch.

Questions, pilot and collaboration: [GitHub Issues](https://github.com/leonkreso784-bit/riihack/issues).

## License

All rights reserved. The copyright is held jointly by Leon Kreso, Rino Tomić and Simon Seifert. The code is publicly visible for review and portfolio purposes only: without the written permission of all copyright holders you may not copy, modify, distribute or use it, in whole or in part. Third-party dependencies keep their own licences. See [LICENSE](LICENSE).
