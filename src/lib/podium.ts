import { plural } from "./format";

// Podij prošlog mjeseca na profesorovoj ploči (#266, 14). Ljestvica se računa iz zadnjeg izvještaja svakog hotela, pa čim
// netko zatvori tekući mjesec (npr. srpanj), njegov skok i napredak vrijede za srpanj, a ostalima još za lipanj:
// "Pokaži podij" za lipanj bi pomiješao mjesece. Gumb smije postojati samo dok nijedan student nije zatvorio tekući mjesec.
// Računalni hoteli (isBot) se ne broje: zatvaraju se tek s mjesecom. Nakon kraja sezone nema tekućeg mjeseca, pa je podij uvijek čist.
export function podiumReplayIsClean(
  world: { status: string; round: number },
  players: { closedRound: number; isBot?: boolean }[],
): boolean {
  if (world.status === "finished") return true;
  return players.every((p) => p.isBot || p.closedRound < world.round);
}

// Potvrda prije "Zatvori X i otvori Y" (#266, 13): zatvaranje se ne može poništiti, a onima koji još igraju
// neodgovorene situacije dobiju najnižu ocjenu. `playing` = broj studenata koji još nisu zatvorili mjesec.
export function closeMonthConfirm(month: string, next: string, playing: number, missedQuality: number): string {
  const head = `Zatvoriti ${month} i otvoriti ${next}?`;
  if (playing <= 0) return `${head} Svi su studenti gotovi.`;
  const who = `${plural(playing, "igra", "igraju", "igra")} ${playing} ${plural(playing, "student", "studenta", "studenata")}`;
  return `${head} Još ${who}. Neodgovorene situacije vrijede ${missedQuality} od 5.`;
}
