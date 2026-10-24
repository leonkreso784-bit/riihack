import { describe, expect, it } from "vitest";
import type { DispatchRow } from "@/db/schema";
import { HttpError } from "@/lib/http";
import type { SituationTemplate } from "@/lib/types";
import {
  customTemplate,
  dispatchTiming,
  parseDispatchRequest,
  planImmediateRows,
  toDispatchView,
  toSummary,
} from "./situations";

const TEMPLATE: SituationTemplate = {
  id: "custom-abc123",
  title: "Kvar klime",
  text: "Klima u sobi {soba} ne radi, a gost je ljut.",
  area: "Smještaj",
  difficulty: 2,
  character: { name: "Ana", role: "gost", personality: "nestrpljiva", goal: "hladna soba" },
  rubric: [
    { id: "c1", text: "Ispričao se", skill: "empathy" },
    { id: "c2", text: "Ponudio drugu sobu", skill: "problemSolving" },
    { id: "c3", text: "Javio održavanju", skill: "communication" },
  ],
  options: [],
  effects: { guests: 3 },
  room: { type: "double", problemStatus: "broken" },
};

function expectHttp(fn: () => unknown, status: number, message: string) {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(HttpError);
    expect((e as HttpError).status).toBe(status);
    expect((e as HttpError).message).toBe(message);
    return;
  }
  throw new Error("očekivana HttpError");
}

describe("toSummary i customTemplate", () => {
  it("sažetak nosi izvor", () => {
    expect(toSummary(TEMPLATE, "custom")).toEqual({
      id: "custom-abc123",
      title: "Kvar klime",
      area: "Smještaj",
      difficulty: 2,
      source: "custom",
    });
  });
  it("id predloška uvijek iz retka", () => {
    expect(customTemplate({ id: "custom-x", template: { ...TEMPLATE, id: "krivo" } }).id).toBe("custom-x");
  });
});

describe("toDispatchView", () => {
  const row: DispatchRow = {
    id: "d1",
    worldId: "w1",
    templateId: "custom-abc123",
    round: 2,
    companyIds: null,
    roomNumber: null,
    status: "scheduled",
    createdAt: new Date("2026-10-24T16:00:00Z"),
  };
  it("null companyIds = svi studenti", () => {
    expect(toDispatchView(row, "Kvar klime")).toEqual({
      id: "d1",
      templateId: "custom-abc123",
      title: "Kvar klime",
      round: 2,
      companyIds: null,
      status: "scheduled",
    });
  });
  it("sent ostaje sent, popis studenata prolazi", () => {
    const v = toDispatchView({ ...row, status: "sent", companyIds: ["c1"] }, "X");
    expect(v.status).toBe("sent");
    expect(v.companyIds).toEqual(["c1"]);
  });
});

describe("parseDispatchRequest", () => {
  it("najmanji zahtjev: samo situacija", () => {
    expect(parseDispatchRequest({ templateId: "s1" })).toEqual({ templateId: "s1" });
  });
  it("puni zahtjev, duplikati studenata maknuti, soba obrezana", () => {
    expect(parseDispatchRequest({ templateId: "s1", companyIds: ["a", "b", "a"], round: 3, roomNumber: " 204 " })).toEqual({
      templateId: "s1",
      companyIds: ["a", "b"],
      round: 3,
      roomNumber: "204",
    });
  });
  it("neispravan oblik → 400", () => {
    expectHttp(() => parseDispatchRequest({}), 400, "Odaberi situaciju koju šalješ");
    expectHttp(() => parseDispatchRequest({ templateId: "s1", companyIds: [] }), 400, "Odaberi barem jednog studenta");
    expectHttp(() => parseDispatchRequest({ templateId: "s1", companyIds: "a" }), 400, "Neispravan popis studenata");
    expectHttp(() => parseDispatchRequest({ templateId: "s1", round: 1.5 }), 400, "Krug mora biti cijeli broj od 1 do 4");
    expectHttp(() => parseDispatchRequest({ templateId: "s1", roomNumber: 204 }), 400, "Neispravan broj sobe");
  });
});

describe("dispatchTiming", () => {
  it("bez kruga ili tekući krug u igri koja teče → odmah", () => {
    expect(dispatchTiming({ status: "running", round: 2 })).toEqual({ kind: "now", round: 2 });
    expect(dispatchTiming({ status: "running", round: 2 }, 2)).toEqual({ kind: "now", round: 2 });
  });
  it("budući krug do kraja sezone → zakazano (i prije početka igre)", () => {
    expect(dispatchTiming({ status: "running", round: 2 }, 4)).toEqual({ kind: "scheduled", round: 4 });
    expect(dispatchTiming({ status: "lobby", round: 0 }, 1)).toEqual({ kind: "scheduled", round: 1 });
  });
  it("odmah prije početka → 409", () => {
    expectHttp(() => dispatchTiming({ status: "lobby", round: 0 }), 409, "Igra još nije počela");
  });
  it("prošli krug ili iza sezone → 409", () => {
    expectHttp(() => dispatchTiming({ status: "running", round: 3 }, 2), 409, "Krug je izvan sezone");
    expectHttp(() => dispatchTiming({ status: "running", round: 3 }, 5), 409, "Krug je izvan sezone");
    expectHttp(() => dispatchTiming({ status: "lobby", round: 0 }, 0), 409, "Igra još nije počela");
  });
  it("gotova sezona → 409", () => {
    expectHttp(() => dispatchTiming({ status: "finished", round: 4 }), 409, "Sezona je gotova");
  });
});

describe("planImmediateRows", () => {
  const rooms = [
    { companyId: "a", number: "101", type: "single" },
    { companyId: "a", number: "102", type: "double" },
    { companyId: "a", number: "103", type: "double" },
    { companyId: "b", number: "201", type: "suite" },
  ];
  it("soba po vrsti iz predloška, za svaku tvrtku iz njenih soba", () => {
    expect(planImmediateRows(TEMPLATE, ["a", "b"], 2, undefined, rooms, [])).toEqual([
      { companyId: "a", round: 2, templateId: "custom-abc123", roomNumber: "102" },
      { companyId: "b", round: 2, templateId: "custom-abc123", roomNumber: "201" },
    ]);
  });
  it("preskače sobu koja u krugu već ima situaciju", () => {
    const rows = planImmediateRows(TEMPLATE, ["a"], 2, undefined, rooms, [{ companyId: "a", roomNumber: "102" }]);
    expect(rows[0].roomNumber).toBe("103");
  });
  it("profesorova soba ako je hotel ima, inače izbor po vrsti", () => {
    const rows = planImmediateRows(TEMPLATE, ["a", "b"], 2, "101", rooms, []);
    expect(rows.map((r) => r.roomNumber)).toEqual(["101", "201"]);
  });
  it("bez sobe u predlošku i bez profesorove sobe → bez sobe", () => {
    const noRoom = { ...TEMPLATE, room: undefined };
    expect(planImmediateRows(noRoom, ["a"], 1, undefined, rooms, [])[0].roomNumber).toBeNull();
    expect(planImmediateRows(noRoom, ["a"], 1, "103", rooms, [])[0].roomNumber).toBe("103");
  });
});
