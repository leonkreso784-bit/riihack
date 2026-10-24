# Sesije: kako Leonove tri Claude sesije rade zajedno

Odluka: [ADR-015](../records/DECISIONS.md#adr-015). Simon i Rino rade po pravilima iz [TEAM.md](../../TEAM.md).

## Uloge

| Sesija | Radi | Radno stablo | Ne radi |
| --- | --- | --- | --- |
| **Graditelj** | L-zadaci iz [plana](../superpowers/plans/2026-10-24-simpolis.md) s agentima (jedan zadatak = jedan agent = jedna grana) | `Documents/riihack` (+ stabla po zadatku) | ne spaja sam |
| **Integrator** | pregledava i spaja PR-ove, čuva zeleni `main` | `Documents/riihack-integracija` | ne piše značajke |
| **Dokumentarist** | vodi `docs/` (PRD, ADR, dnevnik, bugovi) | `Documents/riihack-docs`, grana `leon/docs-struktura` | ne piše kod, ne otvara PR prema `main`-u |

Svaka sesija radi **samo u svom radnom stablu**. Odluke donosi Leon s timom; sesije ih bilježe, ne donose.

## Poruke

Jedan redak, s oznakom na početku:

| Oznaka | Tko šalje | Kome | Primjer |
| --- | --- | --- | --- |
| `[GRADITELJ]` | graditelj | integratoru, dokumentaristu | `[GRADITELJ] PR #60 (L1 shema) spreman, CI zelen` |
| `[INTEGRATOR]` | integrator | svima | `[INTEGRATOR] spojeno #60, main zelen` |
| `[DOKUMENTACIJA]` | dokumentarist | kome treba | `[DOKUMENTACIJA] trebam izvor za odluku o #42` |
| `[ODLUKA]` | bilo tko | dokumentaristu | `[ODLUKA] #42 prihvaćen, messageNo neobavezno (Leon)` |
| `[BUG]` | bilo tko | dokumentaristu | `[BUG] /profesor pada kad nema igre, #63` |

`[ODLUKA]` postaje ADR u [DECISIONS.md](../records/DECISIONS.md), `[BUG]` unos u [BUGS.md](../records/BUGS.md).

## Grane

**Na `main` od dokumenata ide samo `TEAM.md`** (zajednička ploča). Ostala dokumentacija ostaje na grani
`leon/docs-struktura` i ne spaja se (Leon, 24.10.; #58 vraćen s #60).

`leon/<zadatak>` za graditelja, `leon/docs-<opis>` za dokumentarista. Nikad `git push --force` na `main`
([CLAUDE.md](../../CLAUDE.md)).
