// Rang hotela na ljestvici i podiju (ADR-059). Jedno pravilo na jednom mjestu, da poslužitelj, ljestvica, podij,
// financije i karta uvijek kažu isti rang:
//
//   Hotel čiji je račun ispod nule (insolventan, "u blokadi", isti pojam kao na kartici grada) nikad ne stoji iznad hotela koji posluje s računom
//   od nule naviše, bez obzira na napredak. Unutar svake od te dvije skupine redoslijed je kao i prije: veći napredak
//   prvi. Bez toga je hotel koji je bacio novac na ulaganja i marketing (račun −51.600 €) imao napredak 71,7 i vodio
//   ispred solventnog hotela s 35,7 (exploiti-motor.md, F3).
//
// Tuđi račun student ne vidi (ADR-040), pa poslužitelj uz svaki redak šalje samo zastavicu `insolvent` (bez iznosa);
// vlastiti redak i profesorov pogled imaju `cash`, pa i iz njega vrijedi isto pravilo.

export type Rankable = { cash?: number; insolvent?: boolean };

/** Račun ispod nule. Točno nula još nije insolventnost. */
export const isInsolvent = (row: Rankable): boolean => row.insolvent === true || (row.cash ?? 0) < 0;

/**
 * Redci od najboljeg prema najlošijem: prvo solventni, pa insolventni; unutar skupine veći `score` prvi.
 * Sort je stabilan, pa jednaki ostaju u redoslijedu u kojem su došli (poslužitelj ih šalje: novac, pa redoslijed ulaska).
 */
export function rankBy<T extends Rankable>(rows: readonly T[], score: (row: T) => number): T[] {
  return [...rows].sort((a, b) => Number(isInsolvent(a)) - Number(isInsolvent(b)) || score(b) - score(a));
}

/** Rang po ukupnom napretku (ljestvica, rang na financijama i karti, podij sezone). */
export const rankByProgress = <T extends Rankable & { progress: number }>(rows: readonly T[]): T[] => rankBy(rows, (r) => r.progress);
