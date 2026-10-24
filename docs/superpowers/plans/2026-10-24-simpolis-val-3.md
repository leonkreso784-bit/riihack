# Simpolis: plan vala 3 (odjeli, pošta, tuđi hoteli, karta, profesorski računi)

> **Za agente:** svaki zadatak radi jedan agent u svom stablu, TDD za motor s vrijednostima iz ovog plana. Pravila iz
> [glavnog plana](2026-10-24-simpolis.md) vrijede i dalje (Global Constraints, Review Focus, vlasništvo datoteka).

**Pisano za:** Leona, Simona, Rina i njihove agente. Stanje: sub 24.10. 18:50. Odluke su Leonove, sub 18:55–19:20.

**Cilj vala 3:** hotel postaje prava tvrtka u gradu. Student ulaže u odjele, dopisuje se i pregovara s agencijama,
dopisuje se s drugim hotelima i predlaže im suradnju, a na karti Kvarnera vidi druge hotele i tvrtke. Profesor ima
svoj račun, popis svojih igara i knjižnicu situacija. **Brojke i dalje računa samo motor; AI piše tekst agenata.**

## Odluke (Leon, sub 24.10.)

| Odluka | Što znači |
| --- | --- |
| **Nema zamrzavanja koda** | Radimo punom brzinom do predaje (rok ned 10:30). Spajanje i dalje samo preko integratora, `main` uvijek zelen. |
| **Odjeli s pravim ulaganjem** | Budžet po odjelu u planu mjeseca; trošak u obračunu, pokazatelj odjela raste (ugovor u #132). |
| **Pošta s agencijama: pregovaranje** | Ponuda stiže kao e-mail. Student prihvaća, odbija ili predlaže drugu cijenu. **Motor** odlučuje po pravilu, **AI** piše odgovor agenta. |
| **Pošta među hotelima: poruke i prijedlog suradnje** | Slobodne poruke i jedna vrsta dogovora s posljedicom: preusmjeravanje gostiju za proviziju. |
| **Tuđi hotel: javni podaci** | Mjesto, zvjezdice, cijena, recenzije, popunjenost prošlog mjeseca, broj zaposlenih po odjelima, ugovori s tvrtkama. Bez novca, odgovora i ocjena. |
| **Profesorski računi: Better Auth** | Prijava e-mailom i lozinkom, računi u našoj Neon bazi. Nakon prijave: **moje igre** i **knjižnica situacija**. Prijava kodom ostaje za postojeće igre i demo. |
| **Karta Kvarnera (Simon)** | Prava karta (Leaflet + OpenStreetMap) s pribadačama hotela i tvrtki i karticom tvrtke (#125, skica #128). |

## Redoslijed i prioritet

Prvo ono što žiri vidi na obilasku 3 (ned 07:45) i u pitchu; na kraju ono s najviše rizika u motoru.

| Prioritet | Što | Zašto prvo |
| --- | --- | --- |
| **1** | Odjeli (L13, R11) | U izradi; „vodiš hotel kao tvrtku" odmah vidljivo |
| **1** | Javni profil hotela i karta (L14, S10, R12) | Simonova karta je gotova kao skica; čeka samo L14 |
| **2** | Pošta s agencijama i pregovaranje (L15, S11, R13) | Najjači trenutak demoa: AI agent + pravilo motora |
| **2** | Profesorski računi i moje igre (L16, R14) | Pitanje žirija „kako to koristi pravi profesor" |
| **3** | Knjižnica situacija (L17, S12) | Nadogradnja playbooka, malo rizika |
| **3** | Poruke među hotelima (L18, R15) | Malo rizika, bez mehanike |
| **4** | Preusmjeravanje gostiju (L19) | Mijenja obračun tržišta; radi se zadnje, iza smokea |

## Raspored

| Vrijeme | Leon (agenti) | Simon | Rino |
| --- | --- | --- | --- |
| sub 19:00–22:00 | L13 odjeli (u tijeku), L14 javni profil, L16 računi (backend) | S10 karta u pravoj aplikaciji | R11 stranica odjela |
| sub 22:00–01:00 | L15 pošta i pregovaranje, L16 ekrani računa | S11 AI agent agencije | R12 karta u navigaciji, R13 pošta |
| ned 01:00–05:00 | L17 knjižnica, L18 poruke, L19 suradnja | S12 knjižnica na S8 | R14 moje igre (stil), R15 poruke |
| ned 05:00–07:30 | L8 demo igra s poštom i odjelima, smoke 15–20 | proba demoa | responsive, projektor |
| ned 07:45 | **obilazak 3** | | |
| ned 08:00–10:15 | popravci iz obilaska | video demoa do 09:00, predaja | poliranje |

Smjene spavanja kao i prije (uvijek su dvojica budna). Tko ide spavati, prije toga spoji ili preda svoje grane.

## Ugovor: dodaci u `src/lib/types.ts`

Sve novo je **neobavezno** dok ga svi ne pune. Leon ga upisuje u `types.ts` i u blok „Ugovor" glavnog plana; jedan PR
po zadatku, prije koda koji ga koristi. Odjeli su već u #132.

```ts
// L14 Javni profil hotela (karta, ljestvica): samo javni podaci, bez novca
export type CompanyPublicView = {
  companyId: string; hotelName: string; playerName: string; place: string; stars: number; roomsCount: number;
  price: number; reviews: number; guests: number; occupancyPct?: number; // occupancyPct = zadnji obračunati mjesec
  staffByDepartment: Record<StaffDepartment, number>; contracts: { businessId: string; businessName: string; title: string }[];
};

// L15 Pošta i pregovaranje
export type MailKind = "agency" | "hotel" | "system";
export type MailMessage = {
  id: string; kind: MailKind; threadId: string; fromName: string; toName: string; subject: string; body: string;
  at: string; read: boolean; mine: boolean; // mine = poslao ja
  contractId?: string; referralId?: string; // poveznica na ponudu ugovora ili prijedlog suradnje
};
export type CounterOfferRequest = { pricePerNight?: number; monthlyCost?: number; message?: string }; // jedno od dvoje
export type NegotiationOutcome = "accepted" | "countered" | "rejected";
export type NegotiationResult = { outcome: NegotiationOutcome; contract: ContractView; reply: MailMessage };
// ContractView dobiva: negotiated?: boolean; counterPricePerNight?: number; counterMonthlyCost?: number (protuponuda agencije)

// L16 Profesorski računi
export type ProfGameSummary = { worldId: string; name: string; joinCode: string; status: WorldStatus; round: number; maxRounds: number; players: number; createdAt: string };

// L17 Knjižnica situacija (na računu profesora, ne u igri)
export type LibraryItem = SituationSummary & { createdAt: string };

// L18 Poruke među hotelima
export type SendMailRequest = { toCompanyId: string; subject: string; body: string };

// L19 Preusmjeravanje gostiju
export type ReferralStatus = "proposed" | "accepted" | "rejected" | "expired";
export type ReferralView = { id: string; fromCompanyId: string; fromHotel: string; toCompanyId: string; toHotel: string; round: number; maxNights: number; commissionPct: number; status: ReferralStatus; nightsSent?: number };
export type ReferralRequest = { toCompanyId: string; maxNights: number; commissionPct: number; message?: string };

// MeResponse dobiva: mail?: MailMessage[]; unreadMail?: number; referrals?: ReferralView[]
// RoundFinance dobiva: referralNightsIn?: number; referralNightsOut?: number; commission?: number (+ primljena, − plaćena)
```

**Pravila (`src/lib/rules.ts`):** `NEGOTIATE_OK_PCT = 15` (protuponuda do 15 % u korist hotela → prihvaćeno),
`NEGOTIATE_COUNTER_PCT = 30` (15–30 % → agencija nudi sredinu, jednom), iznad 30 % → odbijeno i ponuda propada;
`MAIL_SUBJECT_MAX = 80`, `MAIL_BODY_MAX = 1000`; `REFERRAL_MAX_NIGHTS = 200`, `REFERRAL_COMMISSION_MIN = 5`,
`REFERRAL_COMMISSION_MAX = 25` (posto).

## API (vlasnik L)

| Ruta | Tijelo → odgovor | Greške |
| --- | --- | --- |
| `GET /api/world/companies/[companyId]` | → `CompanyPublicView` (igrač ili profesor iste igre) | 401, 404 |
| `GET /api/world/companies` | → `CompanyPublicView[]` (za kartu) | 401 |
| `GET /api/me/mail` | → `MailMessage[]` (najnovije prvo) | 401 |
| `POST /api/me/mail` | `SendMailRequest` → `MailMessage` | 400 duljina, 404 hotel, 409 „Igra nije u tijeku" |
| `POST /api/me/mail/[id]/read` | → `{ ok: true }` | 404 |
| `POST /api/contracts/[id]/counter` | `CounterOfferRequest` → `NegotiationResult` | 400, 409 „Ova ponuda više ne vrijedi", 409 „Već ste pregovarali" |
| `POST /api/me/referrals` | `ReferralRequest` → `ReferralView` | 400 raspon, 404, 409 |
| `POST /api/referrals/[id]/decide` | `{ accept: boolean }` → `ReferralView` | 409 |
| `GET/POST /api/auth/[...all]` | Better Auth (registracija, prijava, odjava) | — |
| `GET /api/prof/games` | → `ProfGameSummary[]` (igre prijavljenog profesora) | 401 |
| `POST /api/worlds` | kao i prije; prijavljen profesor → igra dobiva `owner_id` | — |
| `GET /api/prof/library` | → `LibraryItem[]` | 401 |
| `POST /api/prof/library` | `SituationDraft` → `LibraryItem` (kroz `validateDraft`) | 400, 401 |
| `POST /api/prof/library/[id]/copy` | `{ worldId }` → `SituationSummary` (kopija u igru, izvor `custom`) | 401, 403, 404 |
| `POST /api/prof/[worldId]/situations/[templateId]/save` | → `LibraryItem` (profesorova situacija iz igre u knjižnicu) | 401, 403, 404 |
| `GET /api/prof/[worldId]/mail` | → `MailMessage[]` (sve poruke među hotelima te igre) | 403 |

`requireProf(worldId)` prihvaća **ili** kolačić `sp_prof` (kod) **ili** Better Auth sesiju vlasnika igre.

## Baza (samo ručni aditivni SQL, nikad `db:push`)

Svaki zadatak koji mijenja shemu: SQL u jednoj transakciji, najava integratoru prije i poslije, broj redaka isti.

- **L13** ✅ `plans.investments jsonb default '{}'`, `finances.investments int default 0` (sub 19:00).
- **L15** `mail(id uuid pk, world_id fk, thread_id uuid, kind text, from_company_id uuid null, to_company_id uuid null, business_id text null, subject text, body text, contract_id uuid null, referral_id uuid null, read_at timestamptz null, created_at)`; `contracts.counter_price_per_night int null`, `contracts.counter_monthly_cost int null`, `contracts.agreed_price_per_night int null`, `contracts.agreed_monthly_cost int null`, `contracts.negotiated boolean default false`.
- **L16** Better Auth tablice `user`, `session`, `account`, `verification` (iz `npx auth@latest generate`, pregledane); `worlds.owner_id text null` (FK na `user.id`).
- **L17** `library_situations(id text pk 'lib-…', owner_id text fk user, template jsonb, source text, created_at)`.
- **L19** `referrals(id uuid pk, world_id fk, from_company_id fk, to_company_id fk, round int, max_nights int, commission_pct int, status text default 'proposed', nights_sent int null, created_at)`; `finances.referral_nights_in int default 0`, `referral_nights_out int default 0`, `commission int default 0`.

## Ovisnosti u `package.json` (Leon)

`better-auth@1.7.12`, `@better-auth/drizzle-adapter@1.7.12` (L16), `leaflet`, `react-leaflet`, `@types/leaflet` (S10).
Dodaju se s `npm install … --save-exact --package-lock-only` i provjerom da lock ništa ne briše (Linux opcionalni
paketi, commit `998f2dc`). Env na Vercelu (integrator): `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

---

## LEON

### L13 · Odjeli: ulaganje, obračun, stanje odjela (u tijeku)

**Files:** Create `src/lib/engine/departments.ts` (+ test). Modify `src/lib/engine/economy.ts`, `src/db/schema.ts`,
`src/lib/game/city.ts`, `src/lib/game/views.ts`.

- `parseInvestments`, `investmentTotal`, `investmentEffects`, `departmentViews`; `roundFinance` + `investments`.
- Učinak po odjelu i mjesecu: `min(INVEST_EFFECT_CAP, floor(ulog / INVEST_EFFECT_DIVISOR))` na `DEPARTMENT_METRIC`.
- Testovi: `{reception:1500, kitchen:3000, maintenance:999}` → zbroj 5499, učinci `{guests: 4}`;
  `{housekeeping:3000, management:2500}` → `{reviews:3, staff:2}`; primjer iz L9 + ulaganja 2000 → troškovi 18000.

### L14 · Javni profil hotela i podaci za kartu

**Files:** Create `src/app/api/world/companies/route.ts`, `src/app/api/world/companies/[companyId]/route.ts`,
`src/lib/game/public.ts` (+ test). Modify `src/lib/session.ts` (`requireWorldMember(worldId)`: igrač ili profesor).

- `toPublicView(company, template, plan, lastFinance, contracts)`: cijena iz plana tekućeg mjeseca, `occupancyPct`
  samo iz zadnjeg **obračunatog** mjeseca, broj zaposlenih po odjelu iz `hotels.json`, aktivni ugovori.
- Test: hotel s planom 94 € i obračunom 50 % → `price 94`, `occupancyPct 50`; bez obračuna → bez `occupancyPct`;
  odgovor nema ključeve `cash`, `metrics.finance`, `situations`.
- Odluka za Leona: Simonova kartica „Financije" (prihod i dobit zatvorenih mjeseci, kao javni FINA podaci) **nije** u
  javnom profilu po odluci „bez novca". Ako je želiš, dodaj `revenueByRound` u `CompanyPublicView`.

### L15 · Pošta s agencijama i pregovaranje

**Files:** Create `src/lib/engine/negotiate.ts` (+ test), `src/lib/game/mail.ts` (+ test), rute `api/me/mail/**`,
`api/contracts/[id]/counter/route.ts`. Modify `src/lib/game/city.ts` (`createOffers` piše e-mail ponude;
obračun koristi dogovorene cijene), `src/lib/game/views.ts` (`mail`, `unreadMail`).

- `negotiate(offer: { pricePerNight: number; monthlyCost: number; nights: number }, counter: CounterOfferRequest): { outcome; pricePerNight; monthlyCost }`:
  agencija (`nights > 0`) plaća hotelu, pa hotel traži **više**; dobavljač (`monthlyCost > 0`) naplaćuje, pa hotel traži
  **manje**. Odstupanje u korist hotela `d = |counter − offer| / offer × 100`: `d ≤ 15` → `accepted` po protuponudi;
  `15 < d ≤ 30` → `countered`, agencija nudi `round((offer + counter) / 2)` i student smije samo prihvatiti ili odbiti;
  `d > 30` → `rejected`, ponuda `expired`. Protuponuda u korist agencije → `accepted` odmah.
- Testovi: agencija 70 €, protuponuda 80 € (14,3 %) → `accepted`, 80; 90 € (28,6 %) → `countered`, 80; 95 € → `rejected`;
  praonica 1500 €, protuponuda 1300 € (13,3 %) → `accepted`; 1100 € (26,7 %) → `countered`, 1300; agencija 70 €, protuponuda 60 € (u korist agencije) → `accepted`, 60.
- Obračun mjeseca koristi `agreed_*` kad postoje (L9 `roundFinance` dobiva predložak s dogovorenim vrijednostima).
- Odgovor agenta piše S11 `agencyReply`; rezerva je fiksni tekst po ishodu. Jedno pregovaranje po ponudi.

### L16 · Profesorski računi i moje igre (Better Auth)

**Files:** Create `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/app/api/auth/[...all]/route.ts`,
`src/db/auth-schema.ts`, `src/app/api/prof/games/route.ts`; ekrani `src/app/profesor/prijava/page.tsx`,
`src/app/profesor/registracija/page.tsx`, `src/app/profesor/igre/page.tsx` (novi; stil i pregled radi Rino, R14).
Modify `src/lib/session.ts` (`requireProf` prihvaća i sesiju vlasnika), `src/app/api/worlds/route.ts` (`owner_id`),
`package.json` (Leonova odluka 19:20).

- `betterAuth({ database: drizzleAdapter(db, { provider: "pg", schema }), emailAndPassword: { enabled: true },
  plugins: [nextCookies()] })`; bez `transaction: true` (neon-http nema transakcija).
- Provjera: registracija → prijava → nova igra → `GET /api/prof/games` ima tu igru → ploča igre radi bez koda;
  drugi profesor dobije 403 na tu igru; stara igra i dalje radi s kodom.

### L17 · Knjižnica situacija

**Files:** Create `src/lib/game/library.ts` (+ test), rute `api/prof/library/**`,
`api/prof/[worldId]/situations/[templateId]/save/route.ts`.

- Spremanje kroz `validateDraft`; kopija u igru preko `createCustomSituation(world, draft, "custom")`.
- Playbook (`GET/POST /api/prof/[worldId]/playbook`) ostaje kakav jest.

### L18 · Poruke među hotelima

**Files:** `src/lib/game/mail.ts` (proširenje L15), `POST /api/me/mail`, `GET /api/prof/[worldId]/mail`.

- Samo hotelima iste igre; naslov 1–80, tekst 1–1000 znakova; događaj `mail.sent` (bez teksta u vijestima).
- Profesor vidi sve poruke među hotelima svoje igre.

### L19 · Preusmjeravanje gostiju (suradnja hotela)

**Files:** Create `src/lib/engine/referral.ts` (+ test), rute `api/me/referrals`, `api/referrals/[id]/decide`.
Modify `src/lib/engine/economy.ts` (`settleMarket` vraća i `unservedNights`), `src/lib/game/city.ts` (obračun).

- Hotel A predloži hotelu B: „šaljem ti do N noćenja ovaj mjesec za P % provizije". B prihvati.
- Obračun: `unserved` = noćenja koja je tržište dodijelilo hotelu A, a nisu stala u kapacitet. `sent = min(unserved, N,
  slobodni kapacitet B)`. B: `nights += sent`, prihod `sent × cijenaB`; B plaća A `commission = floor(sent × cijenaB × P / 100)`.
- Testovi: A pun s 50 neposluženih, N 40, B ima 100 slobodnih, cijena B 80 €, P 10 → `sent 40`, B prihod +3200,
  provizija 320 (A +320, B −320); B pun → `sent 0`; neprihvaćen prijedlog → ništa.
- Dodaje se tek kad su L13–L18 na `main`-u i smoke je zelen; smoke dobiva korak „suradnja".

### L8 · Demo igra i smoke za val 3

- `seed-demo.ts`: ulaganja u odjele kod dva hotela, jedna ponuda agencije s pregovorom, dvije poruke među hotelima,
  jedan prihvaćen prijedlog suradnje. Imena hotela usklađena s mjestom.
- `smoke.ts` koraci 15–20: ulaganje (400 izvan raspona, trošak u obračunu), protuponuda (sva tri ishoda), poruka
  drugom hotelu, javni profil bez novca, profesor s računom vidi svoju igru, suradnja.

## SIMON

### S10 · Karta Kvarnera u pravoj aplikaciji

**Files:** `src/components/city/kvarner-map.tsx`, `src/components/city/company-card.tsx`, `src/lib/karta.ts` (+ test)
iz skice #128; podaci iz L14 (`/api/world/companies`) umjesto primjera. Leaflet iz `package.json` (Leon dodaje).

### S11 · AI agent agencije

**Files:** `src/lib/ai/agency.ts` (+ test), `src/lib/ai/prompts.ts`.

- `agencyReply(i: { business: CityBusiness; contract: ContractTemplate; outcome: NegotiationOutcome; studentMessage?: string; agreed: { pricePerNight: number; monthlyCost: number } }): Promise<string>`
  (Haiku, rok 20 s, rezerva po ishodu). Tekst smije spomenuti samo brojke koje je odredio motor (`agreed`).
- E-mail ponude pri otvaranju mjeseca: fiksni predložak (bez AI-ja), da 30 studenata ne pokrene 30 poziva odjednom.

### S12 · Knjižnica na stranici situacija

**Files:** `src/app/profesor/[worldId]/situacije/page.tsx`, `src/lib/client.ts` (samo novi pozivi, uz Rinov ok).
Gumbi „Spremi u knjižnicu" i „Dodaj iz knjižnice".

## RINO

### R11 · Stranica odjela

`/igra/odjeli`: pet kartica (pokazatelj, ljudi, upozorenja, ulaganje), unos ulaganja po odjelu (0–3.000 €) koji
sprema kroz `api.plan`; ukupno ulaganje i procjena troška mjeseca. Lažni podaci u `mock.ts` dok L13 ne stigne.

### R12 · Karta u navigaciji i tuđi hotel

Simonova karta u `/igra/grad`; klik na hotel u ljestvici otvara karticu tvrtke (L14).

### R13 · Pošta

`/igra/posta`: popis (agencije, hoteli, sustav), broj nepročitanih u navigaciji, otvorena poruka; kod ponude gumbi
Prihvati, Odbij, Predloži cijenu (`counter`); kod `countered` samo Prihvati ili Odbij.

### R14 · Profesor: prijava, registracija, moje igre

Stil i pregled ekrana iz L16; „Nova igra" s popisa igara; poveznica „Prijava kodom" za stare igre.

### R15 · Poruke među hotelima i suradnja

„Nova poruka" (odabir hotela iz grada), na kartici tuđeg hotela gumbi „Pošalji poruku" i „Predloži suradnju".

## Otvoreno (odluka Leona)

1. Kartica „Financije" za tuđe hotele (L14): bez novca (sad) ili prihod i dobit zatvorenih mjeseci kao javni podaci.
2. Tko radi ekrane profesorskog računa: prijedlog je Leonov agent piše stranice (L16), a Rino ih stilski pregleda
   (R14), jer Rino ima R11–R13.
3. Smijemo li ukloniti prijavu kodom nakon predaje (sad ostaje zbog demo igre).
