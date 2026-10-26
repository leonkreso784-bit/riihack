// Vlastita situacija po id-u: najprije tekući mjesec, zatim prošli (#239). Stranice odgovora i toka tako rade i nakon
// zatvaranja mjeseca. Poslužitelj u oba popisa šalje samo situacije ovog studenta.
import type { MeResponse, SituationView } from "./types";

export function findSituation(me: Pick<MeResponse, "situations" | "pastSituations">, id: string): SituationView | undefined {
  return me.situations.find((s) => s.id === id) ?? me.pastSituations?.find((s) => s.id === id);
}
