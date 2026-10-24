import { describe, expect, it } from "vitest";
import { renderSituationText } from "./text";

describe("renderSituationText", () => {
  it("zamjenjuje {soba} i {hotel}", () => {
    expect(renderSituationText("Gost u sobi {soba} hotela {hotel}", { soba: "204", hotel: "Vila Mare" })).toBe(
      "Gost u sobi 204 hotela Vila Mare",
    );
  });
});
