import { describe, expect, it } from "vitest";
import type { AnswerRow, CompanyRow, PlayerRow, RoomRow, RoundReportRow, SituationRow, WorldRow } from "@/db/schema";
import { HOTELS } from "@/content";
import { PRICE_MIN } from "@/lib/rules";
import type { Metrics, SituationTemplate } from "@/lib/types";
import {
  roundGain,
  toCompanyDetail,
  toLeaderboard,
  toMeResponse,
  toProfState,
  toRoom,
  toSituationView,
  type CompanyWithPlayer,
} from "./views";

const NOW = new Date("2026-10-24T14:30:00.000Z");
const hotel = HOTELS[0];
const metrics: Metrics = { guests: 50, reviews: 50, staff: 50, operations: 50, finance: 50 };

const world: WorldRow = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Test L4",
  maxPlayers: 3,
  joinCode: "KVRN26",
  profCodeHash: "x".repeat(64),
  round: 0,
  roundDeadline: null,
  status: "lobby",
  seed: 42,
  settledRound: 0,
  createdAt: NOW,
};

function bundle(id: string, joinIndex: number, cash: number, templateId = hotel.id): CompanyWithPlayer {
  const company: CompanyRow = {
    id,
    worldId: world.id,
    kind: "hotel",
    name: `Hotel ${id}`,
    templateId,
    startMetrics: metrics,
    metrics,
    closedRound: 0,
    cash,
    startCash: 20000,
    joinIndex,
    createdAt: NOW,
  };
  const player: PlayerRow = { id: `p-${id}`, companyId: id, displayName: `Igrač ${id}`, tokenHash: `h-${id}` };
  return { company, player };
}

function room(number: string, basePrice: number, note: string | null = null): RoomRow {
  return {
    id: `r-${number}`,
    companyId: "a",
    number,
    floor: Number(number[0]),
    type: "double",
    beds: 2,
    view: "more",
    basePrice,
    status: "free",
    note,
  };
}

describe("toRoom", () => {
  it("izostavi note kad je null", () => {
    const r = toRoom(room("101", 80));
    expect("note" in r).toBe(false);
    expect(r).toEqual({ id: "r-101", number: "101", floor: 1, type: "double", beds: 2, view: "more", basePrice: 80, status: "free" });
  });

  it("zadrži note kad postoji", () => {
    expect(toRoom(room("204", 180, "Klima ne radi")).note).toBe("Klima ne radi");
  });
});

describe("toLeaderboard", () => {
  it("sortira po napretku, pa novcu, pa redoslijedu ulaska", () => {
    const rows = toLeaderboard([bundle("c", 3, 20000), bundle("a", 1, 20000), bundle("b", 2, 25000)]);
    expect(rows.map((r) => r.companyId)).toEqual(["b", "a", "c"]);
    expect(rows[0]).toEqual({
      companyId: "b",
      hotelName: "Hotel b",
      playerName: "Igrač b",
      place: hotel.place,
      progress: 0,
      closedRound: 0,
      cash: 25000,
      roundGain: 0,
    });
  });
});

describe("toMeResponse", () => {
  const a = bundle("a", 1, 20000);
  const me = toMeResponse({ world, ...a, rooms: [room("101", 70), room("102", 90), room("103", 95)], all: [a, bundle("b", 2, 20000)] }, NOW);

  it("svijet sa serverNow i rokom", () => {
    expect(me.world).toEqual({
      id: world.id,
      name: "Test L4",
      round: 0,
      maxRounds: 4,
      status: "lobby",
      roundDeadline: null,
      serverNow: "2026-10-24T14:30:00.000Z",
    });
    const deadline = new Date("2026-10-24T14:40:00.000Z");
    const running = toMeResponse({ world: { ...world, roundDeadline: deadline }, ...a, rooms: [], all: [a] }, NOW);
    expect(running.world.roundDeadline).toBe("2026-10-24T14:40:00.000Z");
  });

  it("tvrtka iz predloška hotela, napredak 0", () => {
    expect(me.company).toEqual({
      id: "a",
      hotelName: "Hotel a",
      playerName: "Igrač a",
      templateId: hotel.id,
      place: hotel.place,
      stars: hotel.stars,
      roomsCount: 3,
      startMetrics: metrics,
      metrics,
      progress: 0,
      closedRound: 0,
      cash: 20000,
      startCash: 20000,
    });
  });

  it("plan s prosjekom cijene soba (zaokruženo), bez situacija i izvještaja prazno, prazni dijelovi do L11", () => {
    expect(me.plan).toEqual({ round: 0, price: 85, marketing: 0 });
    expect(me.situations).toEqual([]);
    expect(me.reports).toEqual([]);
    expect(me.contracts).toEqual([]);
    expect(me.finances).toEqual([]);
    expect(me.news).toEqual([]);
    expect(me.leaderboard).toHaveLength(2);
    expect(me.city).toEqual({ businesses: [], hotels: me.leaderboard, links: [] });
  });

  it("prosjek se zaokružuje, bez soba najniža cijena", () => {
    const odd = toMeResponse({ world, ...a, rooms: [room("101", 70), room("102", 71)], all: [a] }, NOW);
    expect(odd.plan.price).toBe(71);
    expect(toMeResponse({ world, ...a, rooms: [], all: [a] }, NOW).plan.price).toBe(PRICE_MIN);
  });
});

describe("toProfState", () => {
  it("kod igre i broj mjesta, igrači redom, bez profesorskog koda", () => {
    const s = toProfState({ world, all: [bundle("a", 1, 20000), bundle("b", 2, 20000)] }, NOW);
    expect(s.world).toMatchObject({ id: world.id, joinCode: "KVRN26", maxPlayers: 3, serverNow: NOW.toISOString() });
    expect(s.players.map((p) => p.companyId)).toEqual(["a", "b"]);
    expect(s.city.hotels).toEqual(s.players);
    expect(s.news).toEqual([]);
    expect(JSON.stringify(s)).not.toContain(world.profCodeHash);
  });
});

// ---- L7: situacije, izvještaji, skok kruga ----

const TEMPLATE: SituationTemplate = {
  id: "t-soba",
  title: "Pritužba u {hotel}",
  text: "Gost iz sobe {soba} u hotelu {hotel} se žali.",
  area: "Recepcija",
  difficulty: 2,
  character: { name: "Marko", role: "Gost", personality: "TAJNA-OSOBNOST", goal: "TAJNI-CILJ" },
  rubric: [{ id: "c1", text: "TAJNA-RUBRIKA", skill: "empathy" }],
  options: [
    { id: "o1", text: "Sobu {soba} odmah sredimo.", criteria: ["c1"] },
    { id: "o2", text: "Ništa.", criteria: [] },
  ],
  effects: { guests: 3 },
  room: { type: "double", problemStatus: "cleaning" },
};

function situationRow(id: string, round: number, extra: Partial<SituationRow> = {}): SituationRow {
  return { id, companyId: "a", round, templateId: TEMPLATE.id, roomNumber: "204", state: "open", transcript: [], ...extra };
}

function answerRow(situationId: string, extra: Partial<AnswerRow> = {}): AnswerRow {
  return {
    id: `ans-${situationId}`,
    situationId,
    mode: "own",
    optionId: null,
    text: "Ispričavam se, odmah vam dajem drugu sobu.",
    pastedChars: 0,
    verdict: { criteriaMet: ["c1"], reasoning: "Ispričao se." },
    quality: 4,
    copied: false,
    createdAt: NOW,
    ...extra,
  };
}

function report(companyId: string, round: number, before: Metrics, after: Metrics, extra: Partial<RoundReportRow> = {}): RoundReportRow {
  return { id: `rr-${companyId}-${round}`, companyId, round, metricsBefore: before, metricsAfter: after, mentorQuestion: null, reflection: null, mentorText: null, ...extra };
}

describe("toSituationView", () => {
  it("upiše sobu i hotel, a kriteriji, rubrika, osobnost i cilj lika ne izlaze", () => {
    const v = toSituationView({ situation: situationRow("s1", 1), answer: null }, "Vila Ana", [TEMPLATE])!;
    expect(v).toEqual({
      id: "s1",
      templateId: "t-soba",
      round: 1,
      title: "Pritužba u Vila Ana",
      text: "Gost iz sobe 204 u hotelu Vila Ana se žali.",
      area: "Recepcija",
      difficulty: 2,
      roomNumber: "204",
      character: { name: "Marko", role: "Gost" },
      options: [
        { id: "o1", text: "Sobu 204 odmah sredimo." },
        { id: "o2", text: "Ništa." },
      ],
      state: "open",
      transcript: [],
    });
    const json = JSON.stringify(v);
    for (const secret of ["TAJNA-OSOBNOST", "TAJNI-CILJ", "TAJNA-RUBRIKA", "criteria", "rubric"]) {
      expect(json).not.toContain(secret);
    }
  });

  it("odgovor s presudom; prazna polja izostavljena", () => {
    const own = toSituationView({ situation: situationRow("s1", 1, { state: "answered" }), answer: answerRow("s1") }, "H", [TEMPLATE])!;
    expect(own.answer).toEqual({
      mode: "own",
      text: "Ispričavam se, odmah vam dajem drugu sobu.",
      quality: 4,
      copied: false,
      verdict: { criteriaMet: ["c1"], reasoning: "Ispričao se." },
    });
    const missed = toSituationView(
      { situation: situationRow("s2", 1, { state: "expired", roomNumber: null }), answer: answerRow("s2", { mode: "none", text: null, verdict: null, quality: 1 }) },
      "H",
      [TEMPLATE],
    )!;
    expect(missed.answer).toEqual({ mode: "none", quality: 1, copied: false });
    expect("roomNumber" in missed).toBe(false);
  });

  it("nepoznat predložak → null (bez rušenja)", () => {
    expect(toSituationView({ situation: situationRow("s1", 1, { templateId: "nema" }), answer: null }, "H", [TEMPLATE])).toBeNull();
  });
});

describe("roundGain", () => {
  it("bez zatvorenog kruga 0", () => expect(roundGain(metrics)).toBe(0));
  it("napredak nakon kruga minus napredak prije", () => {
    const before = { ...metrics, guests: 55 }; // napredak 2
    const after = { ...metrics, guests: 55, reviews: 80 }; // napredak 14
    expect(roundGain(metrics, { metricsBefore: before, metricsAfter: after })).toBe(12);
    expect(roundGain(metrics, { metricsBefore: after, metricsAfter: before })).toBe(-12);
  });
});

describe("ljestvica s krugovima", () => {
  it("napredak iz pokazatelja, skok iz zadnjeg zatvorenog kruga", () => {
    const a = bundle("a", 1, 20000);
    a.company.metrics = { ...metrics, guests: 55, reviews: 80 };
    const b = bundle("b", 2, 20000);
    const rows = toLeaderboard(
      [b, a],
      [
        report("a", 2, { ...metrics, guests: 55 }, a.company.metrics),
        report("a", 1, metrics, { ...metrics, guests: 55 }),
        report("b", 1, metrics, metrics),
      ],
    );
    expect(rows.map((r) => [r.companyId, r.progress, r.roundGain])).toEqual([
      ["a", 14, 12],
      ["b", 0, 0],
    ]);
  });
});

describe("toMeResponse s krugovima", () => {
  it("samo situacije tekućeg kruga, samo svoji izvještaji po redu, napredak tvrtke", () => {
    const a = bundle("a", 1, 20000);
    a.company.metrics = { ...metrics, guests: 55 };
    const me = toMeResponse(
      {
        world: { ...world, status: "running", round: 2 },
        ...a,
        rooms: [],
        all: [a, bundle("b", 2, 20000)],
        situations: [
          { situation: situationRow("s1", 1, { state: "answered" }), answer: answerRow("s1") },
          { situation: situationRow("s3", 2), answer: null },
        ],
        reports: [report("b", 1, metrics, metrics), report("a", 1, metrics, { ...metrics, guests: 55 }, { mentorQuestion: "Zašto?" })],
      },
      NOW,
      [TEMPLATE],
    );
    expect(me.situations.map((s) => s.id)).toEqual(["s3"]);
    expect(me.reports).toEqual([{ round: 1, metricsBefore: metrics, metricsAfter: { ...metrics, guests: 55 }, mentorQuestion: "Zašto?" }]);
    expect(me.company.progress).toBe(2);
    expect(me.leaderboard.find((r) => r.companyId === "a")?.roundGain).toBe(2);
  });
});

describe("toCompanyDetail", () => {
  it("sve situacije svih krugova po krugu i izvještaji tvrtke", () => {
    const a = bundle("a", 1, 20000);
    const d = toCompanyDetail(
      {
        ...a,
        roomsCount: 3,
        situations: [
          { situation: situationRow("s3", 2), answer: null },
          { situation: situationRow("s1", 1, { state: "answered" }), answer: answerRow("s1") },
        ],
        reports: [report("a", 1, metrics, metrics)],
      },
      [TEMPLATE],
    );
    expect(d.company.roomsCount).toBe(3);
    expect(d.situations.map((s) => [s.id, s.round])).toEqual([
      ["s1", 1],
      ["s3", 2],
    ]);
    expect(d.situations[0].answer?.verdict?.criteriaMet).toEqual(["c1"]);
    expect(d.reports).toEqual([{ round: 1, metricsBefore: metrics, metricsAfter: metrics }]);
  });
});
