# Razvoj: vodič za programere

**TL;DR**

- Treba Node 24 i npm (ne pnpm). Postavljanje: `npm ci`, `cp .env.example .env.local`, `npm run dev`.
- `NEXT_PUBLIC_USE_MOCK=0` uključuje pravi API. Svaka druga vrijednost, i prazno, prikazuje lažne podatke.
- Nikad `npm run db:push` na zajedničkoj bazi: promjena sheme je ručni aditivni SQL ([ADR-026](records/DECISIONS.md#adr-026)).
- Prije PR-a: `npm run typecheck && npm run lint && npm test && npm run build`. PR spaja samo integrator.
- Rad s agentima: jedan zadatak, jedna grana, jedno radno stablo, vlastiti port.

Vodič je za tim (Leon, Rino, Simon) i njihove AI agente. Kod je javno vidljiv radi pregleda i portfelja, a sva su prava pridržana (vidi [LICENSE](../LICENSE)). Što sustav radi opisuje [ARHITEKTURA.md](ARHITEKTURA.md), a što je gotovo i što nije [STATUS.md](STATUS.md).

## Preduvjeti

| Što | Napomena |
| --- | --- |
| **Node 24** | Verzija koju koristi CI. U repou nema polja `engines` ni `.nvmrc`. Provjere su lokalno prolazile i na Node 22. |
| **npm** | Repo ima `package-lock.json`. pnpm i yarn se ne koriste (stariji dokumenti spominju pnpm, to ne vrijedi). |
| **Git** | `gh` (GitHub CLI) je koristan za PR-ove i issueove, ali nije obavezan. |
| **Neon račun** | Za pravi backend treba Postgres. Koristi vlastitu bazu (vidi [Baza](#baza)). |
| **Anthropic API ključ** | Neobavezan. Bez njega igra radi s fiksnim tekstovima umjesto AI-ja. |
| **Python 3** | Samo za `scripts/lock-merge.py` (vidi [Ovisnosti](#ovisnosti-i-lock-datoteka)). |

## Postavljanje

```bash
git clone https://github.com/leonkreso784-bit/riihack.git
cd riihack
npm ci
cp .env.example .env.local   # upiši vrijednosti, .env.local nikad u git
npm run dev                  # http://localhost:3000
```

Dva načina rada:

| Cilj | Što napraviti |
| --- | --- |
| Samo sučelje, bez baze i ključeva | U `.env.local` postavi `NEXT_PUBLIC_USE_MOCK=1`. Sve ostalo se može ostaviti prazno. |
| Pravi backend | Napravi **vlastitu praznu** Neon bazu, upiši njezin `DATABASE_URL`, pa jednom `npm run db:push` (samo na toj bazi, vidi [Baza](#baza)). Za AI upiši `ANTHROPIC_API_KEY`, za profesorske račune `BETTER_AUTH_SECRET` i `BETTER_AUTH_URL`. Demo igra: `npm run seed:demo`. |

Prije pisanja koda pročitaj vodič za Next.js 16 u `node_modules/next/dist/docs/` (vidi [AGENTS.md](../AGENTS.md)): ova verzija ima izmjene u odnosu na ono što je poznato iz starijih izdanja.

### Varijable okruženja

Imena su u [`.env.example`](../.env.example). Vrijednosti nikad ne idu u repo (`.gitignore` hvata `.env*` osim `.env.example`).

| Varijabla | Treba za | Što radi |
| --- | --- | --- |
| `DATABASE_URL` | pravi backend, skripte, `db:*` | Neon Postgres, pooled connection string (Frankfurt). Bez nje `next build` prolazi, a prvi upit u bazu javi jasnu grešku. |
| `ANTHROPIC_API_KEY` | AI (neobavezno) | Ključ za Claude preko AI SDK-a, samo na poslužitelju. Bez njega: presuda daje ocjenu 3, mentor i agencija fiksne tekstove, lik fiksnu rečenicu, a prijedlog situacije predložak. |
| `NEXT_PUBLIC_USE_MOCK` | prekidač sučelja | `0` = pravi API, sve ostalo = lažni podaci. Vidi niže. |
| `BETTER_AUTH_SECRET` | profesorski računi | Tajna za Better Auth (`openssl rand -base64 32`). Bez nje ne rade prijava računom, "Moje igre" i knjižnica; igra s profesorskim kodom radi. |
| `BETTER_AUTH_URL` | profesorski računi | Osnovni URL aplikacije: `http://localhost:3000` lokalno, produkcijski URL na Vercelu. `src/lib/auth.ts` ima ugrađene adrese Vercel projekta tima, pa je kod forka ova varijabla obavezna. |
| `DEMO_JOIN_CODE` | `npm run seed:demo` | Kod demo igre, 6 znakova (zadano `KVRNDM`). |
| `DEMO_PROF_CODE` | `npm run seed:demo` | Profesorski kod demo igre, 12 znakova. Nema zadane vrijednosti: skripta staje bez njega. Nikad u repo. |

Kodovi koriste abecedu od 31 znaka bez `0`, `O`, `1`, `I` i `L`. Skripte čitaju još neobavezne varijable koje nisu u `.env.example`: `DEMO_PROF_EMAIL` i `DEMO_PROF_PASSWORD` (demo profesorski račun; bez njih demo igra radi samo s kodom) te `BASE_URL` i `SMOKE_CITY` za `npm run smoke`.

Vrijednosti: članovi tima ih dobiju od Leona (ili s `vercel link` i `vercel env pull .env.local`). Pazi, tako dobiješ i adresu **zajedničke** baze, pa pročitaj [Baza](#baza) prije prve naredbe koja piše u nju. Svi ostali koriste vlastitu Neon bazu i vlastiti ključ.

### Prekidač `NEXT_PUBLIC_USE_MOCK`

U `src/lib/client.ts`: `USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "0"`.

- **Samo vrijednost `0` uključuje pravi API.** Prazno, nepostavljeno, `1`, `false` ili bilo što drugo znači lažni podaci iz `src/lib/mock.ts`, bez baze i bez poslužitelja.
- **Mock je zadano.** Zato je u `.env.example` upisano `0`: kopija radi s pravim backendom i traži `DATABASE_URL`. Za rad na sučelju bez backenda postavi `NEXT_PUBLIC_USE_MOCK=1` ili obriši liniju.
- Varijable s prefiksom `NEXT_PUBLIC_` ugrađuju se u build: nakon promjene ponovno pokreni `npm run dev` (ili ponovno izgradi).
- Na Vercelu Production i Preview moraju imati `0`, inače deploy prikazuje lažne podatke. Vercel nema tvoj `.env.local` ([BUG-003](records/BUGS.md#bug-003--igra-na-vercelu-vraća-greška-404)).
- Arhivski dokumenti ponegdje kažu da se mock uključuje s `=1`. To nije prekidač nego zadano ponašanje.

## Baza

Neon Postgres (Frankfurt) i Drizzle ORM s driverom `neon-http`. Veza se otvara tek pri prvom upitu (`src/db/index.ts`), pa uvoz modula i `next build` ne trebaju `DATABASE_URL`.

- Shema: `src/db/schema.ts` (15 tablica igre) i `src/db/auth-schema.ts` (4 tablice Better Autha, generirane, ne uređuju se ručno). Ukupno 19 tablica, popis je u [ARHITEKTURA.md](ARHITEKTURA.md).
- Driver nema `db.transaction()`. Više naredbi atomski ide kroz `db.batch([...])` ili jednu CTE naredbu.
- **Migracija nema.** `drizzle.config.ts` upire u mapu `./drizzle`, ali nje nema u repou. `db:generate` i `db:migrate` zato nemaju što raditi; `db:studio` otvara preglednik baze.

### Pravilo: nikad `npm run db:push` na zajedničkoj bazi

**Zašto.** 24.10.2026. u 16:25 `drizzle-kit push` na zajedničkoj bazi predložio je pražnjenje tablica `situations` i `contracts`, jer krivo čita postojeća unique ograničenja ([BUG-006](records/BUGS.md#bug-006--dbpush-predlaže-pražnjenje-tablica-situations-i-contracts), [ADR-026](records/DECISIONS.md#adr-026)). Otada se shema mijenja ručno.

**Što umjesto toga.**

1. Za vlastiti rad koristi **vlastitu praznu Neon bazu** (ili Neon branch). Samo tamo je `npm run db:push` dopušten.
2. Promjena sheme na zajedničkoj bazi je ručni **aditivni** SQL (`CREATE TABLE`, `ADD COLUMN IF NOT EXISTS`) u jednoj transakciji. Pregledava i primjenjuje ga Leon. SQL napiši u opis PR-a; primjeri su u [planu vala 3](hackathon/plans/2026-10-24-simpolis-val-3.md) (odjeljak Baza).
3. `src/db/schema.ts` mijenjaj u istom PR-u kao i SQL, samo aditivno (bez brisanja i preimenovanja stupaca).

**Pazi.** Ništa u kodu ne sprječava `db:push`: to je običan `drizzle-kit push` na `DATABASE_URL`. Prije svake naredbe koja piše u bazu provjeri na koju bazu pokazuje tvoj `.env.local`.

### Skripte koje pišu u bazu

| Skripta | Što radi |
| --- | --- |
| `npm run seed:demo` | Briše samo prijašnju demo igru (po kodu igre) i, ako je postavljen `DEMO_PROF_EMAIL`, knjižnicu demo profesorskog računa; zatim slaže novu: 5 hotela, odigran 1. mjesec, otvoren 2. mjesec. Ponovno pokretanje je bezopasno. |
| `npm run smoke` | Stvara testne igre s imenom "Smoke ..." na poslužitelju koji gađa. |
| `npx tsx scripts/cleanup-test-data.ts` | Čisti testne igre i račune. Bez `--apply` je suhi prolaz (samo ispiše). Načini `--stare` i `--kodovi`. Demo igra je zaštićena. |

Na zajedničkoj bazi držimo najviše 3 testne igre i koristimo ih ponovno ([ADR-055](records/DECISIONS.md#adr-055)). Zasebna baza i pravi proces migracija poznata su praznina prije pilota, vidi [STATUS.md](STATUS.md).

## Pokretanje i testovi

| Naredba | Što radi |
| --- | --- |
| `npm run dev` | Razvojni poslužitelj na `http://localhost:3000`. Vlastiti port: `npm run dev -- -p 3107`. |
| `npm run typecheck` | `next typegen && tsc --noEmit`. |
| `npm run lint` | ESLint. Rezultat na oznaci `ri-hack-4.0`: [STATUS.md](STATUS.md#provjere). |
| `npm test` | Vitest (`vitest run`), `src/**/*.test.ts`, okruženje `node`. Broj testova i rezultat: [STATUS.md](STATUS.md#provjere). Ne trebaju `.env` ni API ključ (AI moduli se testiraju s lažnim modelima). |
| `npm run build` | Produkcijski build. Dohvaća Google Fonts, pa treba internet. Ne treba tajne. |
| `npm start` | Pokreće gotov build. |
| `npm run seed:demo` | Demo igra (vidi [Baza](#skripte-koje-pišu-u-bazu)). Treba `DATABASE_URL` i `DEMO_PROF_CODE`. |
| `npm run smoke` | HTTP provjera cijelog toka protiv pokrenutog poslužitelja (vidi niže). |
| `npm run ai:smoke` | Pravi pozivi modela: provjera ključa i hrvatskog izlaza. Troši tokene. |
| `npm run db:push`, `db:generate`, `db:migrate`, `db:studio` | Drizzle Kit. **`db:push` vidi pravilo u [Baza](#baza).** |

### Prije svakog PR-a (lokalno)

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Zatim "Update branch" na GitHubu (ili `git rebase origin/main`) i pričekaj CI na **svježem** `main`-u ([BUG-001](records/BUGS.md#bug-001--main-crven-roundgain-uveden-kao-obavezno-polje)).

### CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml), posao `check`, na svaki push i PR (Ubuntu, Node 24): `npm ci`, typecheck, lint, test, build. Ne trebaju tajne jer su `db` i autentifikacija lijeni. Lokalno zeleno na Windowsu nije dokaz za Linux ([BUG-002](records/BUGS.md#bug-002--npm-ci-na-linux-ci-ju-pada-zbog-lock-datoteke-s-windowsa)).

Nakon spajanja pogledaj CI na `main`-u. Crven `main` znači da nitko ne spaja dok ga ne popravi onaj čiji je zadnji merge. Po dogovoru tima Vercel gradi `main` (produkcija) i svaki PR (preview link). Nakon deploya otvori ekran koji si mijenjao.

### Smoke i demo igra

```bash
npm run smoke                  # koraci 1 do 10 i 20, BASE_URL zadano http://localhost:3000
SMOKE_CITY=1 npm run smoke     # dodaje korake 11 do 19: grad, obračun mjeseca, ugovori, ulaganja, protuponuda, poruke, profesorski račun
BASE_URL=http://localhost:3107 npm run smoke   # poslužitelj na svom portu
```

Izlazni kod je 1 ako ijedan korak padne. Korak koji treba profesorski račun preskače se ako poslužitelj nema `BETTER_AUTH_SECRET`. Smoke stvara testne igre (uz `SMOKE_CITY=1` i profesorski račun), pa ga pokreći protiv **lokalnog** poslužitelja s vlastitom bazom, a ne protiv produkcije ili zajedničke baze bez dogovora ([ADR-055](records/DECISIONS.md#adr-055)).

### Ručno: ekrani

Svaki ekran provjeri na **375 px, 768 px i 1440 px**. Profesorova ploča mora biti čitljiva na projektoru. Svaki broj ima ime i jedinicu. Nađeš li grešku, upiši je u [BUGS.md](records/BUGS.md) ili otvori issue.

### Ovisnosti i lock datoteka

Nova ovisnost ide samo uz Leonov ok (`package.json` je njegov) i samo preko `scripts/lock-merge.py`. Razlog: `npm install --package-lock-only` na Windowsu premjesti `@emnapi/*` pod `@tailwindcss/oxide-wasm32-wasi`, pa `npm ci` na Linuxu (CI, Vercel) padne ([BUG-002](records/BUGS.md#bug-002--npm-ci-na-linux-ci-ju-pada-zbog-lock-datoteke-s-windowsa)).

```bash
npm install <paket>@<verzija> --save-exact --package-lock-only
git show origin/main:package-lock.json > ../orig.json
python scripts/lock-merge.py ../orig.json package-lock.json package-lock.json && rm ../orig.json
git diff origin/main -- package-lock.json   # smiju biti samo dodani redci
```

Nakon svakog povlačenja koje mijenja `package-lock.json` pokreni `npm ci` ([BUG-013](records/BUGS.md#bug-013--provjera-pada-u-mapi-bez-npm-ci-nakon-promjene-package-lockjson)). Paketi `better-auth` i `@better-auth/drizzle-adapter` zakucani su na točnu verziju.

## Git i PR pravila

**Grane**

- Svatko radi na svojoj grani: `leon/...`, `rino/...`, `simon/...`. Oblik je `ime/opis` (npr. `simon/ai-chat`), a za zadatak s issuea `ime/ID-opis`.
- `main` mora uvijek raditi. Nikad izravno na `main` i nikad `git push --force` na `main`.
- Commit poruke su kratke i kažu što se promijenilo.
- Tajne samo u `.env.local`. U repo ide `.env.example` s imenima varijabli, bez vrijednosti.

**Pull requestovi**

1. Jedna promjena, jedan PR. Male PR-ove spajamo često, da ne nastaju veliki konflikti.
2. Prije početka provjeri tuđe grane i `gh pr list`, da isto ne radi već netko drugi.
3. Opis PR-a kaže što i zašto. Issue zatvaraš s `Closes #N`.
4. Prije PR-a provjere iz odjeljka iznad, zatim rebase na svježi `main` i zeleni CI.
5. **PR spaja samo integrator** (Leonova integratorska sesija, [ADR-015](records/DECISIONS.md#adr-015)). Autor javlja da je PR spreman (komentar na PR-u ili poruka timu) i ne spaja sam.
6. PR-ovi koji diraju `src/lib/types.ts`, `src/lib/rules.ts`, `package.json`, `package-lock.json` i sadržaj situacija čekaju Leonovo izričito "spoji" ([ADR-017](records/DECISIONS.md#adr-017)). Aditivne neobavezne dodatke ugovoru tipova integrator spaja sam ([ADR-037](records/DECISIONS.md#adr-037)). **Novo polje u ugovoru je neobavezno (`?`)** ([ADR-011](records/DECISIONS.md#adr-011)).
7. Nakon spajanja **obriši granu** (lokalno i `git push origin --delete <grana>`).

**Oznake (tagovi) i arhiva**

| Oznaka | Što je |
| --- | --- |
| `ri-hack-4.0` | Verzija koju je žiri ocjenjivao (commit `b6ffb61`). Ne miče se i ne briše. |
| `promo-video` | Oznaka releasea s promo videom. |
| `archive/<ime>/<grana>` | Arhivirana grana, npr. `archive/simon/prezentacija-v8`. Popis: `git tag -l 'archive/*'`. |

Granu koja se ne spaja, a vrijedi je sačuvati, arhiviraj prije brisanja: `git tag archive/<ime>/<grana> <grana>`, pa `git push origin archive/<ime>/<grana>`. Popis obrisanih grana sa SHA-ovima je u [hackathon/branches.tsv](hackathon/branches.tsv); granu vraćaš s `git push origin <sha>:refs/heads/<grana>`.

**Dokumentacija uz kod.** Odluka postaje ADR u [records/DECISIONS.md](records/DECISIONS.md) (najnovija gore), bug ide u [records/BUGS.md](records/BUGS.md). Jedna činjenica, jedno mjesto: vidi [docs/README.md](README.md). Duplikat se briše, ne sinkronizira.

## Rad s AI agentima

Svatko u timu radi s više agenata usporedno. Pravila su kratka:

- **Jedan zadatak = jedan agent = jedna grana = jedno radno stablo.** Zadatak je GitHub issue.

  ```bash
  git worktree add ../riihack-<zadatak> -b simon/<opis> origin/main
  cd ../riihack-<zadatak>
  npm ci
  cp <glavno stablo>/.env.local .env.local   # tajne ne idu u git i ne ispisuju se
  ```

- **Agent dira samo datoteke iz svog zadatka.** Treba li mu tuđa datoteka, staje i javlja vlasniku. `package.json`, `src/lib/types.ts` i `src/lib/rules.ts` mijenja samo Leon; `src/app/layout.tsx` i `src/app/globals.css` samo Rino. Zapne li agent dulje od 30 minuta, vlasnik javlja timu.
- **Vlastiti port.** Svaka sesija i svako stablo vrti dev poslužitelj na svom portu (`npm run dev -- -p <port>`, smoke s `BASE_URL=http://localhost:<port>`). Gasi se **samo taj proces**, nikad svi `node` procesi ([BUG-005](records/BUGS.md#bug-005--agent-je-pri-gašenju-dev-servera-pokušao-ugasiti-sve-nodeexe-procese)).
- **Što agent ne radi:** ne pokreće `db:push`, ne radi `git push --force`, ne spaja PR, ne mijenja ovisnosti bez Leona i ne pušta smoke ni `ai:smoke` na produkciju ili zajedničku bazu bez dogovora.
- **Prije koda** agent čita [CLAUDE.md](../CLAUDE.md), [AGENTS.md](../AGENTS.md) (automatski blok `next dev`, ne briše se jer se sam vraća), [ARHITEKTURA.md](ARHITEKTURA.md) i svoj issue.
- Kad je gotov: provjere, rebase na `main`, push, PR s `Closes #N`, a spaja integrator. Radno stablo ukloni s `git worktree remove ../riihack-<zadatak>`.
