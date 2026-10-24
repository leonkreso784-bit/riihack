# Sesije: kako Leonove tri Claude sesije rade zajedno

Odluka: [ADR-015](../records/DECISIONS.md#adr-015). Simon i Rino rade po pravilima iz [TEAM.md](../../TEAM.md).

## Uloge

| Sesija | Radi | Radno stablo | Ne radi |
| --- | --- | --- | --- |
| **Graditelj** | L-zadaci iz [plana](../superpowers/plans/2026-10-24-simpolis.md) s agentima (jedan zadatak = jedan agent = jedna grana) | `Documents/riihack` (+ stabla po zadatku) | ne spaja sam |
| **Integrator** | pregledava i spaja PR-ove, čuva zeleni `main` | `Documents/riihack-integracija` | ne piše značajke |
| **Dokumentarist** | vodi `docs/` (PRD, ADR, dnevnik, bugovi) | `Documents/riihack-docs` | ne piše kod, ne spaja sam |

Svaka sesija radi **samo u svom radnom stablu**. Odluke donosi Leon s timom; sesije ih bilježe, ne donose.

## Poruke

Jedan redak, s oznakom na početku:

| Oznaka | Tko šalje | Kome | Primjer |
| --- | --- | --- | --- |
| `[GRADITELJ]` | graditelj | integratoru, dokumentaristu | `[GRADITELJ] PR #N (L5 motor B) spreman, CI zelen` |
| `[INTEGRATOR]` | integrator | svima | `[INTEGRATOR] spojeno #N, main zelen` |
| `[DOKUMENTACIJA]` | dokumentarist | kome treba | `[DOKUMENTACIJA] trebam izvor za odluku o #N` |
| `[ODLUKA]` | bilo tko | dokumentaristu | `[ODLUKA] novo polje X neobavezno (Leon)` |
| `[BUG]` | bilo tko | dokumentaristu | `[BUG] /stranica pada kad …, issue #N` |

`[ODLUKA]` postaje ADR u [DECISIONS.md](../records/DECISIONS.md), `[BUG]` unos u [BUGS.md](../records/BUGS.md).

## Grane

Dokumentacija ide na `main` preko PR-a kao i kod, jer po njoj grade ljudi i agenti; spaja integrator.

`leon/<zadatak>` za graditelja, `leon/docs-<opis>` za dokumentarista. Nikad `git push --force` na `main`
([CLAUDE.md](../../CLAUDE.md)).
