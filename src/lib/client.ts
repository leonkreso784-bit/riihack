// Browser-side API calls. Until the backend is live every call answers from mock.ts; NEXT_PUBLIC_USE_MOCK=0 switches to the server.
import { useEffect, useEffectEvent, useState } from "react";
import { POLL_MS } from "./rules";
import { MOCK_DETAIL, MOCK_ME, MOCK_PROF, MOCK_ROOMS } from "./mock";
import type {
  AnswerRequest,
  AnswerView,
  ApiError,
  ChatRequest,
  CompanyDetailResponse,
  ContractDecisionRequest,
  ContractView,
  CreateWorldRequest,
  CreateWorldResponse,
  JoinRequest,
  JoinResponse,
  MeResponse,
  OpenRoundRequest,
  PlanRequest,
  ProfLoginRequest,
  ProfLoginResponse,
  ProfStateResponse,
  ReflectionRequest,
  Room,
  RoundPlan,
  RoundReportView,
} from "./types";

async function send(path: string, method: "GET" | "POST", body?: unknown): Promise<Response> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(err?.error ?? `Greška ${res.status}`);
  }
  return res;
}

const get = async <T>(path: string) => (await send(path, "GET")).json() as Promise<T>;
const post = async <T>(path: string, body: unknown = {}) => (await send(path, "POST", body)).json() as Promise<T>;

const realApi = {
  createWorld: (req: CreateWorldRequest) => post<CreateWorldResponse>("/api/worlds", req),
  profLogin: (req: ProfLoginRequest) => post<ProfLoginResponse>("/api/prof/login", req),
  profState: (worldId: string) => get<ProfStateResponse>(`/api/prof/${worldId}`),
  start: (worldId: string) => post<ProfStateResponse>(`/api/prof/${worldId}/start`),
  openRound: (worldId: string, req: OpenRoundRequest = {}) => post<ProfStateResponse>(`/api/prof/${worldId}/round`, req),
  finish: (worldId: string) => post<ProfStateResponse>(`/api/prof/${worldId}/finish`),
  companyDetail: (worldId: string, companyId: string) =>
    get<CompanyDetailResponse>(`/api/prof/${worldId}/companies/${companyId}`),
  join: (req: JoinRequest) => post<JoinResponse>("/api/join", req),
  me: () => get<MeResponse>("/api/me"),
  rooms: () => get<Room[]>("/api/me/rooms"),
  answer: (situationId: string, req: AnswerRequest) => post<AnswerView>(`/api/situations/${situationId}/answer`, req),
  // Character reply arrives as a text stream; read it chunk by chunk.
  chat: async (situationId: string, req: ChatRequest): Promise<ReadableStream<string>> => {
    const res = await send(`/api/situations/${situationId}/chat`, "POST", req);
    return res.body!.pipeThrough(new TextDecoderStream());
  },
  closeRound: () => post<RoundReportView>("/api/me/close-round"),
  report: (round: number) => get<RoundReportView>(`/api/me/report/${round}`),
  reflection: (req: ReflectionRequest) => post<RoundReportView>("/api/me/reflection", req),
  plan: (req: PlanRequest) => post<RoundPlan>("/api/me/plan", req),
  decideContract: (contractId: string, req: ContractDecisionRequest) =>
    post<ContractView>(`/api/contracts/${contractId}/decide`, req),
};

type Api = typeof realApi;

// ponytail: mock answers are static (nothing is saved between calls); enough to build and demo screens.
const wait = <T>(value: T, ms = 400) => new Promise<T>((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));

function wordStream(text: string, ms = 40): ReadableStream<string> {
  const words = text.split(" ");
  let i = 0;
  let timer: ReturnType<typeof setInterval>;
  return new ReadableStream<string>({
    start(controller) {
      timer = setInterval(() => {
        if (i >= words.length) {
          clearInterval(timer);
          controller.close();
          return;
        }
        controller.enqueue((i ? " " : "") + words[i++]);
      }, ms);
    },
    cancel() {
      clearInterval(timer);
    },
  });
}

const mockReport = MOCK_ME.reports[0];
// Mock round ends 10 minutes after the page loads; serverNow moves with the clock like the real API.
const MOCK_DEADLINE = new Date(Date.now() + 10 * 60_000).toISOString();
// After a mock join the "professor" starts the game 8 s later, so the waiting room can be seen in the demo.
let mockLobbyUntil = 0;

// Mock professor game: lobby until "Pokreni", students drop in one every 2.5 s so the projector view comes alive.
let mockProfOpenedAt = Date.now();
let mockProfStarted = false;
function mockProfState(): ProfStateResponse {
  const world = { ...MOCK_PROF.world, serverNow: new Date().toISOString() };
  if (mockProfStarted) return { ...MOCK_PROF, world: { ...world, roundDeadline: MOCK_DEADLINE } };
  const joined = Math.min(MOCK_PROF.players.length, Math.floor((Date.now() - mockProfOpenedAt) / 2500));
  return { ...MOCK_PROF, world: { ...world, status: "lobby", round: 0, roundDeadline: null }, players: MOCK_PROF.players.slice(0, joined) };
}

const mockApi: Api = {
  createWorld: () => {
    mockProfOpenedAt = Date.now();
    mockProfStarted = false;
    return wait({ worldId: MOCK_PROF.world.id, joinCode: MOCK_PROF.world.joinCode, profCode: "ABCDEFGHJKMN" });
  },
  profLogin: () => wait({ worldId: MOCK_PROF.world.id }),
  profState: () => wait(mockProfState()),
  start: () => {
    mockProfStarted = true;
    return wait(mockProfState());
  },
  openRound: () => wait(MOCK_PROF),
  finish: () => wait({ ...MOCK_PROF, world: { ...MOCK_PROF.world, status: "finished" } }),
  companyDetail: () => wait(MOCK_DETAIL),
  join: () => {
    mockLobbyUntil = Date.now() + 8000;
    const c = MOCK_ME.company;
    return wait({ companyId: c.id, hotelName: c.hotelName, place: c.place, stars: c.stars });
  },
  me: () => {
    const lobby = Date.now() < mockLobbyUntil;
    const world = { ...MOCK_ME.world, serverNow: new Date().toISOString() };
    return wait({
      ...MOCK_ME,
      world: lobby ? { ...world, status: "lobby", round: 0, roundDeadline: null } : { ...world, roundDeadline: MOCK_DEADLINE },
    });
  },
  rooms: () => wait(MOCK_ROOMS),
  answer: (_id, req) =>
    wait(
      "optionId" in req
        ? { mode: "click", optionId: req.optionId, quality: 3, copied: false }
        : {
            mode: "own",
            text: req.text,
            quality: 4,
            copied: false,
            verdict: { criteriaMet: ["c1", "c2", "c3", "c4"], reasoning: "Ponudio si rješenje odmah i pokazao razumijevanje. Nisi pitao gosta što mu najviše treba." },
          },
      1500,
    ),
  chat: async () =>
    wordStream("Drugi apartman? Dobro, ali neka bude odmah, ne za sat vremena. I tko mi nadoknađuje izgubljeno jutro?"),
  closeRound: () => wait({ round: 2, metricsBefore: MOCK_ME.company.metrics, metricsAfter: MOCK_ME.company.metrics }),
  report: () => wait(mockReport, 1200),
  reflection: (req) =>
    wait(
      {
        ...mockReport,
        reflection: req.text,
        mentorText:
          "Dobro si primijetio da su ljudi umorni. Gostima si dao sve, ali nisi pitao tim koliko mogu. Sljedeći put prije velike odluke pitaj one koji je moraju provesti.",
      },
      1500,
    ),
  plan: (req) => wait({ round: MOCK_ME.world.round, ...req }),
  decideContract: (id, req) => {
    const c = MOCK_ME.contracts.find((k) => k.id === id) ?? MOCK_ME.contracts[0];
    return wait({ ...c, status: req.accept ? "accepted" : "rejected" });
  },
};

// ponytail: mock is the default so Vercel (no env var set) shows a working demo; set NEXT_PUBLIC_USE_MOCK=0 once L4/L7 routes exist.
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "0";
export const api: Api = USE_MOCK ? mockApi : realApi;

// Polls fn every ms (default POLL_MS) without overlapping requests. refresh() fetches right away, e.g. after a click.
export function usePoll<T>(fn: () => Promise<T>, ms = POLL_MS) {
  const [data, setData] = useState<T>();
  const [syncedAt, setSyncedAt] = useState(0); // client clock when data arrived, for countdowns
  const [error, setError] = useState<Error>();
  const [nonce, setNonce] = useState(0);
  // Always calls the newest fn, so callers can pass an inline arrow without restarting the poll.
  const load = useEffectEvent(fn);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const next = await load();
        if (alive) {
          setData(next);
          setSyncedAt(Date.now());
          setError(undefined);
        }
      } catch (e) {
        if (alive) setError(e as Error);
      } finally {
        if (alive) timer = setTimeout(tick, ms);
      }
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [ms, nonce]);

  return { data, error, syncedAt, refresh: () => setNonce((n) => n + 1) };
}
