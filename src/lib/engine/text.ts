// Predlošci situacija imaju {soba} i {hotel}; jedan prolaz kroz tekst, pa upisana vrijednost nikad ne postaje nova oznaka.
// Zamjena je funkcija, ne string: u zamjenskom stringu "$" znači poseban slijed, pa bi "Hotel $$$" postao "Hotel $$" (#266, 11).
//
// Predlošci kažu "hotela {hotel}", "u hotelu {hotel}", "prijavio u hotel {hotel}". Ako se hotel zove "Hotel Tijek Ana",
// piše "recenzija hotela Hotel Tijek Ana"; zato se ispred riječi "hotel" (u bilo kojem padežu) ime upiše bez početnog "Hotel"
// ("recenzija hotela Tijek Ana"). Bez te riječi ispred ime ostaje cijelo ("javlja se u Hotel Tijek Ana").
const PLACEHOLDER = /(\b[Hh]otel(?:a|u|om)?\s+)?\{(soba|hotel)\}/gu;
const LEADING_HOTEL = /^hotel\s+(?=\S)/iu;

export function renderSituationText(text: string, vars: { soba?: string; hotel: string }): string {
  const bareHotel = vars.hotel.replace(LEADING_HOTEL, "");
  return text.replace(PLACEHOLDER, (_match, noun: string | undefined, key: string) => {
    if (key === "soba") return (noun ?? "") + (vars.soba ?? "");
    return noun ? noun + bareHotel : vars.hotel;
  });
}
