import { COMMISSION_PCT, MATERIALS_PCT, VAT_PCT } from "./rules";
import type { MetricKey } from "./types";

// BUG-072: one place for the "?" explanations, so the same word means the same thing on every page.
export const METRIC_HINTS: Record<MetricKey, string> = {
  guests: "Koliko su gosti zadovoljni boravkom. Raste s dobrim odlukama prema gostima i urednim sobama.",
  reviews: "Ugled hotela na portalima. Dobre recenzije dovode više gostiju i dopuštaju višu cijenu.",
  staff: "Zadovoljstvo i spremnost zaposlenika. Pada kad je ljudi premalo ili su preopterećeni.",
  operations: "Koliko glatko hotel radi: smjene, nabava, održavanje. Loša operativa stvara nove probleme.",
  finance: "Financijsko zdravlje hotela: dobit, rezerva novca i troškovi u odnosu na prihod.",
};

export const HINTS = {
  progress: "Zbroj promjena svih pokazatelja od početka igre. Po njemu se slaže ljestvica razreda.",
  cash: "Novac koji hotel trenutačno ima. Mijenja se kad profesor zatvori mjesec i obračuna prihode i troškove.",
  seasonProfit: "Zbroj dobiti (ili gubitka) svih obračunatih mjeseci: prihodi minus rashodi.",
  profit: "Prihodi minus rashodi u zadnjem obračunatom mjesecu.",
  occupancy: "Koliki je dio mogućih noćenja prodan. 100 % znači da je svaka soba bila puna svaku noć.",
  avgOccupancy: "Prosjek popunjenosti svih obračunatih mjeseci.",
  rank: "Tvoje mjesto u razredu po napretku. Tuđi novac je tajna, pa se rang ne slaže po novcu.",
  nights: "Broj prodanih noćenja: gosti koji su sami rezervirali plus noćenja iz ugovora s agencijama.",
  revenueRooms: "Novac od gostiju koji su sami rezervirali sobu, po tvojoj cijeni noćenja.",
  revenueContracts: "Novac od agencija za noćenja dogovorena ugovorom.",
  revenue: "Sav novac koji je hotel zaradio u mjesecu.",
  costStaff: "Plaće zaposlenika po odjelima.",
  costRooms: "Stalni trošak održavanja svake sobe, bez obzira je li puna.",
  costMarketing: "Iznos koji si u planu odredio za oglašavanje.",
  costContracts: "Mjesečni trošak ugovora s dobavljačima i tvrtkama u gradu.",
  costInvestments: "Dodatna ulaganja u odjele koja si odredio u planu.",
  costVat: `PDV od ${VAT_PCT} % sadržan u onome što gosti plate. Novac koji pripada državi, ne hotelu.`,
  costCommission: `Provizija portala za rezervacije gostiju (${COMMISSION_PCT} % prihoda bez PDV-a). Ugovori s agencijama idu bez portala.`,
  costMaterials: `Hrana, piće, tekstil, sredstva za čišćenje i drugi potrošni materijal: ${MATERIALS_PCT} % prihoda bez PDV-a.`,
  costs: "Svi troškovi hotela u mjesecu.",
  result: "Prihodi minus rashodi. Zeleno je dobit, crveno gubitak.",
  growth: "Koliko su se prihodi promijenili u odnosu na prethodni mjesec.",
  cashAfter: "Stanje računa nakon što je mjesec obračunat.",
  marketShare: "Koliki dio svih turista u gradu je odsjeo u tvom hotelu.",
  revenuePerNight: "Prosječna zarada po prodanom noćenju: ukupni prihodi podijeljeni s noćenjima.",
} as const;
