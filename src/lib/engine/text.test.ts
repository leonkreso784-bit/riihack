import { describe, expect, it } from "vitest";
import { renderSituationText } from "./text";

describe("renderSituationText", () => {
  it("zamjenjuje {soba} i {hotel}", () => {
    expect(renderSituationText("Gost u sobi {soba} hotela {hotel}", { soba: "204", hotel: "Vila Mare" })).toBe(
      "Gost u sobi 204 hotela Vila Mare",
    );
  });

  it("zamjenjuje svaku pojavu oznake", () => {
    expect(renderSituationText("{soba} i {soba}, {hotel} i {hotel}", { soba: "7", hotel: "Mare" })).toBe("7 i 7, Mare i Mare");
  });

  it("bez sobe {soba} postaje prazno", () => {
    expect(renderSituationText("Soba [{soba}]", { hotel: "Mare" })).toBe("Soba []");
  });

  it("znak $ u imenu hotela ostaje doslovno (#266, 11)", () => {
    expect(renderSituationText("Recepcija u {hotel}", { hotel: "Hotel $$$" })).toBe("Recepcija u Hotel $$$");
    expect(renderSituationText("Recepcija u {hotel}", { hotel: "Hotel $&" })).toBe("Recepcija u Hotel $&");
    expect(renderSituationText("hotela {hotel}", { hotel: "Hotel $$$" })).toBe("hotela $$$");
    expect(renderSituationText("Soba {soba}", { soba: "$1", hotel: "H" })).toBe("Soba $1");
  });

  it("ispred riječi hotel ime ne ponavlja početno \"Hotel\" (#266, 10)", () => {
    const vars = { soba: "105", hotel: "Hotel Tijek Ana" };
    expect(renderSituationText("recenzija hotela {hotel} s dvije zvjezdice", vars)).toBe("recenzija hotela Tijek Ana s dvije zvjezdice");
    expect(renderSituationText("Na recepciju hotela {hotel} stiže", vars)).toBe("Na recepciju hotela Tijek Ana stiže");
    expect(renderSituationText("u sobi {soba} u hotelu {hotel} otkazao", vars)).toBe("u sobi 105 u hotelu Tijek Ana otkazao");
    expect(renderSituationText("prijavio u hotel {hotel} i", vars)).toBe("prijavio u hotel Tijek Ana i");
    expect(renderSituationText("restoranu hotela {hotel}", { hotel: "HOTEL Mare" })).toBe("restoranu hotela Mare");
  });

  it("bez riječi hotel ispred ime ostaje cijelo", () => {
    expect(renderSituationText("Agent se javlja u {hotel} s upitom", { hotel: "Hotel Tijek Ana" })).toBe("Agent se javlja u Hotel Tijek Ana s upitom");
    expect(renderSituationText("hotela {hotel}", { hotel: "Vila Ana" })).toBe("hotela Vila Ana");
    expect(renderSituationText("hotela {hotel}", { hotel: "Tijek Ana" })).toBe("hotela Tijek Ana");
  });

  it("ime koje je samo \"Hotel\" ili počinje riječju poput Hotelijer ostaje cijelo", () => {
    expect(renderSituationText("hotela {hotel}", { hotel: "Hotel" })).toBe("hotela Hotel");
    expect(renderSituationText("hotela {hotel}", { hotel: "Hotelijer Marko" })).toBe("hotela Hotelijer Marko");
  });

  it("oznaka u imenu hotela se ne zamjenjuje drugi put", () => {
    expect(renderSituationText("{hotel} / {soba}", { soba: "101", hotel: "Hotel {soba}" })).toBe("Hotel {soba} / 101");
  });
});
