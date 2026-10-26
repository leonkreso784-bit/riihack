# AI potrošnja i izbor davatelja

**Ukratko.** Svaki zahtjev prema AI modelu upisuje se u zapisnik (tko, što, koliko tokena, koliko košta, koliko je trajalo,
je li uspio). Uz to se pojedini posao (lik, sudac, mentor) može prebaciti s Claudea na Groq ili Mistral samo varijablama
okoline. **Dok varijable nisu postavljene, sve radi točno kao prije** (Claude, isti modeli, ista logika rezerve).

## Što se zapisuje

Jedan redak po **zahtjevu prema davatelju** (ponovni pokušaj nakon greške 429 ili 5xx je zaseban redak). Samo metapodaci:

| Polje | Značenje |
|---|---|
| `created_at` | kad je zahtjev završio |
| `job`, `action` | posao (`character`, `judge`, `mentor`) i akcija (tablica niže) |
| `provider`, `model` | davatelj i model koji je odgovarao |
| `input_tokens` | **ukupan** ulaz; `cached_input_tokens` (čitanje iz cachea) i `cache_write_tokens` (pisanje u cache) njegovi su dijelovi |
| `output_tokens` | izlaz (uključuje tokene razmišljanja) |
| `cost_usd` | trošak koji stvarno plaćamo (0 na Groq besplatnom planu) |
| `list_cost_usd` | isti poziv po cjeniku, da se vidi što bi koštalo |
| `duration_ms`, `ok`, `error` | trajanje, uspjeh, kratak uzrok (HTTP status ili klasa greške, nikad poruka) |
| `fallback_used` | akcija je na kraju igraču dala fiksni rezervni tekst (greška, istek 20 s, ili dva odbijena odgovora) |
| `world_id`, `company_id` | igra i hotel, kad ih mjesto poziva ima (inače prazno) |

**Nikad se ne zapisuju** upiti, odgovori studenata, tekst razgovora ni imena. Samo brojevi i oznake.

| Akcija | Funkcija | Posao |
|---|---|---|
| `lik` | `streamCharacterReply` | character |
| `agencija` | `agencyReply` (odgovor gradske tvrtke na protuponudu) | character |
| `sudac` | `judge` | judge |
| `mentor-pitanje` | `mentorQuestion` | mentor |
| `mentor-razgovor` | `mentorDebrief` (nakon studentove refleksije) | mentor |
| `mentor-osvrt` | `mentorReview` (osvrt nakon obračuna mjeseca) | mentor |
| `prijedlog` | `proposeSituation` (AI prijedlog situacije) | mentor |

Zapis nastaje u `modelFor` (`src/lib/ai/client.ts`) preko middlewarea AI SDK-a (`src/lib/ai/usage.ts`), pa nijedan poziv
iz aplikacije ne zaobilazi zapisnik (osim izravno predanog modela u testovima i skripte `ai:smoke`, koja ne upisuje u
bazu). Model koji test preda izravno nije omotan.

## Varijable okoline

Sve su opcionalne. Prazno ili neprisutno znači zadano. Postavlja se na Vercelu (i u `.env.local`).

| Varijabla | Zadano | Značenje |
|---|---|---|
| `AI_PROVIDER` | `anthropic` | davatelj za sve poslove: `anthropic`, `groq` ili `mistral` |
| `AI_PROVIDER_CHARACTER`, `AI_PROVIDER_JUDGE`, `AI_PROVIDER_MENTOR` | `AI_PROVIDER` | davatelj samo za taj posao |
| `AI_MODEL_CHARACTER`, `AI_MODEL_JUDGE`, `AI_MODEL_MENTOR` | model davatelja | točan id modela za taj posao |
| `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY` | | ključ svakog davatelja koji se koristi |
| `AI_GROQ_FREE` | | `1` = Groq besplatni plan: `cost_usd` je 0, a `list_cost_usd` čuva cijenu po cjeniku |

Nepoznata vrijednost za davatelja (npr. tipfeler) zanemaruje se uz jedno upozorenje u logu i vrijedi zadano.

**Zadani modeli** (`src/lib/ai/providers.ts`):

| Davatelj | character (lik, agencija) | judge (sudac) | mentor (mentor, prijedlog) |
|---|---|---|---|
| anthropic | `claude-haiku-5-5` | `claude-sonnet-5-5` | `claude-sonnet-5-5` |
| groq | `openai/gpt-oss-120b` | `openai/gpt-oss-120b` | `openai/gpt-oss-120b` |
| mistral | `mistral-small-latest` | `mistral-medium-latest` | `mistral-medium-latest` |

Mistral id-evi su uzeti iz `GET https://api.mistral.ai/v1/models` (26.10.2026): `mistral-small-latest` je Mistral Small 4
(`mistral-small-2603`), `mistral-medium-latest` je Medium 3.5 (`mistral-medium-2604`).

**Podaci kod davatelja.** Promjenom davatelja upiti (odgovori studenata, razgovor s likom) odlaze tom davatelju. Prije
prave igre provjeri njegove uvjete obrade podataka (DPA, zadržavanje podataka). Groq (SAD) i Mistral (EU) su ovdje za
razvoj i probe. Zapisnik potrošnje je i dalje čist: u njemu su samo brojevi i oznake.

Primjeri:

```
# sve na Groq, dok razvijamo
AI_PROVIDER=groq
AI_GROQ_FREE=1
GROQ_API_KEY=...

# lik na Groq, sudac i mentor ostaju na Claudeu
AI_PROVIDER_CHARACTER=groq
GROQ_API_KEY=...
```

**Ključevi.** `aiEnabled()` je istinit samo kad postoji ključ **svakog** davatelja koji je namješten za neki posao. Mjesta
poziva pitaju po poslu (`aiEnabled("character")`): ako nedostaje ključ drugog posla, taj posao svejedno radi. Bez ključa
posla igra dobiva rezervni tekst, kao i prije.

**Claude-only postavke.** `cacheControl`, `thinking` i `effort` šalju se kroz `providerOptions` pod ključem `anthropic`, a
AI SDK svakom davatelju daje samo njegov ključ, pa na Groqu i Mistralu ne šalju ništa (provjereno testom na stvarnom
tijelu zahtjeva). Caching ostaje na Claudeu. Groq dobiva `reasoningEffort: "low"` u svim pozivima, jer `gpt-oss` zadano
razmišlja, a razmišljanje se računa u budžet izlaza. Lik, agencija i mentor ga dobivaju zajedno s Claudeovim
`thinking`/`effort` (`NO_THINKING`, `LOW_EFFORT`), a sudac i prijedlog situacije samo ključ `groq` (`GROQ_LOW_EFFORT`), pa
se njihov Claude zahtjev ne mijenja. Prijedlog situacije je na Groqu bez toga u 4 od 10 pokušaja pao s 400
`json_validate_failed` (razmišljanje je pojelo ograničenje od 1500 tokena); s niskim naporom stao je u 590 do 700 tokena.

`AI_MODEL_*` za Groq mora biti model koji podržava `reasoning_effort` (`gpt-oss-20b`, `gpt-oss-120b`, `qwen3.8-27b`);
drugi modeli odbijaju zahtjev s 400, a igra tada dobiva rezervni tekst.

## Koji model za koji posao (test 26. 10. 2026.)

Test na stvarnim produkcijskim promptovima (5 ocijenjenih odgovora puta 3 ponavljanja za suca, 6 odgovora lika, 4 teksta mentora). Hrvatski je ocijenjen strogo, od 1 do 5.

| Model | Hrvatski (lik) | Sudac: točno od 15 | Napomena |
| --- | --- | --- | --- |
| Claude Sonnet 5.5 | **4,0** | 12, najstabilniji (5 od 5 isto u 3 ponavljanja) | jedini s 4 od 4 čista teksta mentora |
| Claude Haiku 5.5 | 3,0 | 13 | najjeftiniji |
| Groq gpt-oss-120b | 2,3 do 2,7 | 13 (srednje razmišljanje) | besplatni plan: oko 5 studentskih sezona dnevno |
| Mistral Ministral 14B | 2,7 | 6 (prestrog) | Small i Medium nedostupni na besplatnom ključu |
| Groq Qwen3.8-27B (preview) | 1,3 | 11 | iskrivljen hrvatski, nije za studente |

Trošak jedne studentske sezone (24 poruke s likom, 8 presuda, 4 teksta mentora): 0,0073 $ sve na Haiku, 0,0646 $ sadašnja kombinacija (lik Haiku, sudac i mentor Sonnet), 0,149 $ sve na Sonnet. Razred od 25 studenata: 0,69 $ do 3,73 $ po sezoni.

**Preporuka:** sva tri posla ostaju na Claudeu.
- Razvoj i testiranje: lik i sudac na Haiku, mentor na Sonnet, ili sve na Groq (besplatno) kad se ne smije trošiti.
- Pilot s razredom: sve na Sonnet (bolji hrvatski za 3,73 $ po razredu i sezoni).
- Veći broj fakulteta: lik i sudac na Haiku, mentor na Sonnet, nakon provjere suca na barem 30 stvarnih odgovora iz pilota.

**Podaci studenata:** Mistral na besplatnom planu smije koristiti ulaz i izlaz za treniranje (može se isključiti), pa tamo ne šaljemo tekst studenata. Groq po ugovoru ne trenira na podacima kupaca i po zadanom ih ne čuva, ali podaci su u SAD-u, a preview modeli nisu pokriveni ugovorom o obradi podataka.

## Cijene

Jedna tablica: `PRICES` u `src/lib/ai/pricing.ts`, USD po milijun tokena.

| Model | ulaz | pisanje cachea | čitanje cachea | izlaz |
|---|---|---|---|---|
| `claude-haiku-5-5` | 0,10 | 0,125 | 0,01 | 0,50 |
| `claude-sonnet-5-5` | 2,00 | 2,50 | 0,10 | 10,00 |
| `openai/gpt-oss-120b` (Groq) | 0,15 | | 0,075 | 0,60 |
| `mistral-small-latest` | 0,15 | | 0,015 | 0,60 |
| `mistral-medium-latest` | 1,50 | | 0,15 | 7,50 |

Cache hit na Sonnetu 5.5 košta 0,05 puta cijenu ulaza (0,10 USD), a na Haikuu 5.5 0,1 puta (0,01 USD), kako stoji na
Anthropicovoj stranici s cijenama. Mistral cijene su sa stranice docs.mistral.ai/inference/pricing (provjereno
26.10.2026); popis `/v1/models` ih ne sadrži. Mistral naplaćuje cache ulaz po 10% cijene ulaza. **Model bez cijene u tablici** (npr. ako
postaviš `AI_MODEL_JUDGE=mistral-large-latest`) zapisuje se s troškom `NULL`, a izvještaj upozori koliko je takvih poziva
izostavljeno iz zbroja. Cijena se ne pogađa: dodaj redak u `PRICES`.

Račun: obični ulaz = ukupan ulaz minus čitanje cachea minus pisanje cachea; svaki dio ide po svojoj cijeni. Neuspio poziv
nema tokena pa ni troška (`NULL`; uz `AI_GROQ_FREE=1` trošak je 0, a cijena po cjeniku `NULL`).

## Zapisnik u logu i u bazi

1. **Log (odmah, bez ičega).** Svaki poziv ispiše jednu liniju `[ai-usage] {json}` preko `console.info`. Vidi se u
   Vercel Runtime Logs i prije nego što tablica postoji. Filtriraj po `[ai-usage]`.
2. **Baza (tablica `ai_calls`).** Upis ide poslije odgovora (`after()` iz `next/server`), jednom naredbom po akciji. Izvan
   zahtjeva (skripte) čeka najviše 2 s. Upis **nikad ne smije usporiti ni srušiti igru**: greška daje jedno
   `console.warn` sa šifrom greške (bez poruke), a bez `DATABASE_URL` ili bez tablice preskače se tiho (nakon "tablica
   ne postoji" ponovno se pokušava tek za minutu, pa se SQL može primijeniti bez novog deploya).

### SQL koji treba primijeniti

Po [ADR-026](records/DECISIONS.md#adr-026) nitko ne pokreće `db:push`. Tablicu pravi Leon ručno, **aditivnim** SQL-om
iz datoteke [`scripts/sql/2026-10-26-ai-calls.sql`](../scripts/sql/2026-10-26-ai-calls.sql) (Neon SQL editor ili `psql`).
`CREATE TABLE IF NOT EXISTS` i `CREATE INDEX IF NOT EXISTS` u jednoj transakciji: ne dira nijednu postojeću tablicu i
može se pokrenuti više puta. Tablica ima indekse na `created_at` i `world_id`. `world_id` i `company_id` namjerno nisu
strani ključevi, da brisanje igre ne briše povijest troška.

## Izvještaj

```
npm run ai:potrosnja            # zadnjih 7 dana
npm run ai:potrosnja -- 14      # zadnjih 14 dana (i --days 14)
```

Skripta `scripts/ai-potrosnja.ts` **samo čita** `ai_calls` (i imena igara iz `worlds`), traži `DATABASE_URL` u `.env.local`
i ispisuje zbroj te raspodjelu po danu (zagrebačko vrijeme), akciji, modelu i najskuplje igre. Igre se rangiraju po cijeni
iz cjenika, pa i igre na besplatnom Groqu imaju smislen poredak. Ako tablice još nema, ispiše upozorenje s putem do SQL-a.
Izračun je čista funkcija u `src/lib/ai/report.ts`.

Primjer izgleda (brojevi su izmišljeni):

```
AI potrošnja, zadnjih 7 dana (od 2026-10-19)
Ukupno: 205 poziva (1 neuspjelih, 1 s rezervnim tekstom)
Tokeni: ulaz 259.500 (od toga cache čitanje 155.700, cache pisanje 0), izlaz 21.300
Trošak: 0.2559 USD stvarno, 0.2613 USD po cjeniku

Po akciji
akcija        pozivi  greške  rezerva     ulaz   cache  izlaz  ms/poziv     USD  cjenik USD
sudac             40       0        0   96.000  57.600  7.200      1200  0.1680      0.1680
mentor-osvrt      15       1        1   27.000  16.200  4.800      1200  0.0735      0.0735
lik              150       0        0  136.500  81.900  9.300      1200  0.0144      0.0198
```

## Groq besplatni plan: ograničenja

Besplatni (Free) plan, za `gpt-oss-120b`: **30 zahtjeva u minuti, 1000 zahtjeva na dan, 8000 tokena u minuti i 200 000
tokena na dan** (po organizaciji). Plaćeni Developer plan ima puno veće granice. Zato:

- Groq je za **razvoj i probe**, ne za igru s cijelim razredom: 30 studenata koji istodobno razgovaraju s likom prelaze
  granicu u sekundama.
- Izlaz je ograničen: `lik` 300, `mentor` 1200, `agencija` 1500 tokena, a sudac i prijedlog situacije na Groqu i Mistralu
  dobivaju gornju granicu od 1500 (`NON_CLAUDE_MAX_OUTPUT_TOKENS` u `src/lib/ai/client.ts`). Na Claudeu se ništa ne mijenja
  (sudac i prijedlog ostaju bez ograničenja, kao prije).
- Jedan zahtjev čiji ulaz plus najveći izlaz prelazi 8000 tokena odmah pada s **413** i ne ponavlja se (u zapisniku
  `error=413`).
- Dnevne granice (1000 zahtjeva, 200 000 tokena) razred na probi dosegne prije minutnih.
- Kad Groq odgovori s **429**, vrijedi postojeća rezerva: AI SDK pokuša još dvaput s odgodom, a ako ne uspije ili prođe
  rok od 20 s, `withAi` vraća rezervni tekst. Svaki zahtjev je redak u zapisniku (`ok=false`, `error=429`), a akcija
  dobiva `fallback_used=true`. Igra ne staje.
- Zadano razmišljanje `gpt-oss` troši budžet izlaza, pa se šalje `reasoningEffort: "low"` u svim pozivima (vidi gore).

## Napomene

- Zahtjev koji `withAi` prekine zbog roka od 20 s **ne prekida se kod davatelja** (isto kao prije), nego se dovrši u
  pozadini. Njegov redak se zapiše **odmah** kad akcija završi: `ok=false`, `error=timeout`, `fallback_used=true`, bez
  tokena i troška (na Vercelu se funkcija može zamrznuti prije nego zahtjev završi, pa čekanje ne bi donijelo ništa).
  Kad takav zahtjev kasnije ipak završi, u log ide samo linija `[ai-usage-late]` sa stvarnim tokenima i troškom, a u
  bazi ne nastaje drugi redak (jedan zahtjev, jedan redak). Stvarni trošak poziva kojima je istekao rok zato se vidi
  samo u logu, i to samo ako je funkcija još živa.
- `fallback_used` označava da je akcija igraču dala fiksni rezervni tekst. Ne označava rezervu unutar suda
  (`rubricReasoning`), jer ona čuva kriterije koje je model označio.
- Provjereno stvarnim pozivom: Claude (Haiku) i Groq (`gpt-oss-120b`), jedan mali poziv svaki, 26.10. Mistral ključ tima
  je istog dana na probi vratio 429 uz `x-ratelimit-limit-req-minute=0` (račun nema kvote za zahtjeve), pa je zapis
  uspješnog Mistral poziva provjeren samo testom na obliku odgovora, a zapis neuspjelog stvarnim pozivom. Prije prave
  igre na Groqu ili Mistralu isprobaj sudca (strogi JSON schema) i mentora (hrvatski tekst, pravila duljine):
  `npm run ai:smoke` prati varijable za lika i mentora, ali sudac je u toj skripti učvršćen na Claudeu.
