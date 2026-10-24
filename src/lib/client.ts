// Browser-side API calls. Until the backend is live every call answers from mock.ts; NEXT_PUBLIC_USE_MOCK=0 switches to the server.
import { useEffect, useEffectEvent, useState } from "react";
import { PASTE_SHARE, POLL_MS } from "./rules";
import { negotiate } from "./engine/negotiate";
import { MOCK_DETAIL, MOCK_SAMPLE_DRAFT, MOCK_ME, MOCK_PROF, MOCK_ROOMS, MOCK_STAFF } from "./mock";
import type {
  CompanyPublicView,
  AnswerRequest,
  AnswerView,
  ApiError,
  ChatRequest,
  CompanyDetailResponse,
  ContractDecisionRequest,
  ContractView,
  CounterOfferRequest,
  MailMessage,
  NegotiationResult,
  CreateWorldRequest,
  CreateWorldResponse,
  DispatchRequest,
  GenerateSituationRequest,
  JoinRequest,
  JoinResponse,
  LibraryItem,
  MeResponse,
  OpenRoundRequest,
  Playbook,
  PlanRequest,
  Quality,
  ProfLoginRequest,
  ProfGameSummary,
  ProfLoginResponse,
  ProfStateResponse,
  ReflectionRequest,
  Room,
  RoundPlan,
  RoundReportView,
  SituationDraft,
  SituationSummary,
  StaffMember,
  WorldSettingsRequest,
} from "./types";

async function send(path: string, method: "GET" | "POST", body?: unknown): Promise<Response> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiError | null;
    throw Object.assign(new Error(err?.error ?? `Greška ${res.status}`), { status: res.status });
  }
  return res;
}

// L17: true when the server answered 401 (no professor account signed in).
export const isUnauthorized = (e: unknown) => (e as { status?: number } | null)?.status === 401;

const get = async <T>(path: string) => (await send(path, "GET")).json() as Promise<T>;
const post = async <T>(path: string, body: unknown = {}) => (await send(path, "POST", body)).json() as Promise<T>;

const realApi = {
  createWorld: (req: CreateWorldRequest) => post<CreateWorldResponse>("/api/worlds", req),
  profLogin: (req: ProfLoginRequest) => post<ProfLoginResponse>("/api/prof/login", req),
  // L16 Moje igre: igre prijavljenog profesorskog računa (401 bez sesije).
  profGames: () => get<ProfGameSummary[]>("/api/prof/games"),
  profState: (worldId: string) => get<ProfStateResponse>(`/api/prof/${worldId}`),
  start: (worldId: string) => post<ProfStateResponse>(`/api/prof/${worldId}/start`),
  openRound: (worldId: string, req: OpenRoundRequest = {}) => post<ProfStateResponse>(`/api/prof/${worldId}/round`, req),
  finish: (worldId: string) => post<ProfStateResponse>(`/api/prof/${worldId}/finish`),
  // R8: the professor changes a student's grade (overridden: true in the answer).
  overrideQuality: (worldId: string, situationId: string, quality: Quality) =>
    post<AnswerView>(`/api/prof/${worldId}/answers/${situationId}/quality`, { quality }),
  companyDetail: (worldId: string, companyId: string) =>
    get<CompanyDetailResponse>(`/api/prof/${worldId}/companies/${companyId}`),
  // L14 javni profili hotela za kartu grada (S10, uz Rinov pregled u #128): igrač ili profesor te igre.
  worldCompanies: (worldId: string) => get<CompanyPublicView[]>(`/api/world/${worldId}/companies`),
  // S8: professor's own situations, sending, settings
  createSituation: (worldId: string, req: SituationDraft, source?: "ai") =>
    post<SituationSummary>(`/api/prof/${worldId}/situations`, source ? { ...req, source } : req),
  exportPlaybook: (worldId: string) => get<Playbook>(`/api/prof/${worldId}/playbook`),
  importPlaybook: (worldId: string, playbook: Playbook) => post<ProfStateResponse>(`/api/prof/${worldId}/playbook`, playbook),
  generateSituation: (worldId: string, req: GenerateSituationRequest) => post<SituationDraft>(`/api/prof/${worldId}/situations/generate`, req),
  dispatch: (worldId: string, req: DispatchRequest) => post<ProfStateResponse>(`/api/prof/${worldId}/dispatch`, req),
  worldSettings: (worldId: string, req: WorldSettingsRequest) => post<ProfStateResponse>(`/api/prof/${worldId}/settings`, req),
  // S12 / L17: professor library (needs a professor account, else 401 → isUnauthorized)
  libraryList: () => get<LibraryItem[]>("/api/prof/library"),
  libraryCopy: (id: string, worldId: string) => post<SituationSummary>(`/api/prof/library/${id}/copy`, { worldId }),
  librarySave: (worldId: string, templateId: string) => post<LibraryItem>(`/api/prof/${worldId}/situations/${templateId}/save`),
  join: (req: JoinRequest) => post<JoinResponse>("/api/join", req),
  me: () => get<MeResponse>("/api/me"),
  rooms: () => get<Room[]>("/api/me/rooms"),
  staff: () => get<StaffMember[]>("/api/me/staff"),
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
  // R13 mail: mark a message read; counter-offer on a contract offer (the engine decides, the agency replies by mail).
  markRead: (mailId: string) => post<{ ok: true }>(`/api/me/mail/${mailId}/read`),
  counter: (contractId: string, req: CounterOfferRequest) => post<NegotiationResult>(`/api/contracts/${contractId}/counter`, req),
  decideContract: (contractId: string, req: ContractDecisionRequest) =>
    post<ContractView>(`/api/contracts/${contractId}/decide`, req),
  // Clears the sp_player / sp_prof cookies (route is Leon's, see TEAM.md "Tko na koga čeka").
  logout: async () => {
    await send("/api/logout", "POST", {});
  },
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
let mockClosedRound = 0; // "Završi mjesec" in the mock
const mockDetail = structuredClone(MOCK_DETAIL); // R8: grade changes stick in the mock
// Mail and contract offers in the mock change when the student reads, accepts, declines or counters (R13).
let mockMail: MailMessage[] = structuredClone(MOCK_ME.mail ?? []);
let mockContracts: ContractView[] = structuredClone(MOCK_ME.contracts);
const AGENCY_REPLY = {
  accepted: "Dogovoreno. Potvrđujem vašu cijenu, grupa stiže početkom mjeseca. Šaljem popis gostiju tjedan dana prije dolaska.",
  countered: "To je iznad našeg budžeta. Možemo se naći na sredini, i to je naša zadnja ponuda.",
  rejected: "Nažalost, uz te uvjete grupu šaljemo u drugi hotel. Hvala na odgovoru.",
};

// Mock professor game: lobby until "Pokreni", students drop in one every 2.5 s so the projector view comes alive.
// After the start the board moves too: "Zatvori mjesec" opens the next month with its deadline, "Završi" ends it.
let mockProfOpenedAt = Date.now();
let mockProfStarted = false;
let mockProf = { round: MOCK_PROF.world.round, deadline: MOCK_DEADLINE as string | null, finished: false };
function mockProfState(): ProfStateResponse {
  const world = { ...MOCK_PROF.world, serverNow: new Date().toISOString() };
  if (mockProfStarted)
    return {
      ...MOCK_PROF,
      world: { ...world, round: mockProf.round, roundDeadline: mockProf.deadline, status: mockProf.finished ? "finished" : "running" },
      // Everyone has closed the months before the current one.
      players: MOCK_PROF.players.map((p) => ({ ...p, closedRound: Math.max(p.closedRound, mockProf.round - 1) })),
    };
  const joined = Math.min(MOCK_PROF.players.length, Math.floor((Date.now() - mockProfOpenedAt) / 2500));
  return { ...MOCK_PROF, world: { ...world, status: "lobby", round: 0, roundDeadline: null }, players: MOCK_PROF.players.slice(0, joined) };
}

// S12: mock library in memory (newest first).
let mockLibrary: LibraryItem[] = [
  { id: "lib-1", title: "Gost se žali na buku iz susjedne sobe", area: "Gosti", difficulty: 2, source: "custom", createdAt: "2026-10-12T09:30:00.000Z" },
  { id: "lib-2", title: "Agencija traži popust za grupu od 30 ljudi", area: "Prodaja", difficulty: 4, source: "ai", createdAt: "2026-10-05T14:10:00.000Z" },
];

const mockApi: Api = {
  createWorld: () => {
    mockProfOpenedAt = Date.now();
    mockProfStarted = false;
    return wait({ worldId: MOCK_PROF.world.id, joinCode: MOCK_PROF.world.joinCode, profCode: "ABCDEFGHJKMN" });
  },
  profLogin: () => wait({ worldId: MOCK_PROF.world.id }),
  profGames: () =>
    wait<ProfGameSummary[]>([
      { worldId: MOCK_PROF.world.id, name: MOCK_PROF.world.name, joinCode: MOCK_PROF.world.joinCode, status: "running", round: 2, maxRounds: MOCK_PROF.world.maxRounds, players: MOCK_PROF.players.length, createdAt: new Date().toISOString() },
      { worldId: "mock-old", name: "Hotelijerstvo 3B, zima", joinCode: "ZIMA42", status: "finished", round: 6, maxRounds: 6, players: 18, createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString() },
    ]),
  profState: () => wait(mockProfState()),
  worldCompanies: () => wait<CompanyPublicView[]>([]),
  start: () => {
    mockProfStarted = true;
    mockProf = { round: 1, deadline: MOCK_DEADLINE, finished: false };
    return wait(mockProfState());
  },
  openRound: (_id, req = {}) => {
    mockProfStarted = true;
    const deadline = req.deadlineMinutes ? new Date(Date.now() + req.deadlineMinutes * 60_000).toISOString() : null;
    mockProf = { round: Math.min(mockProf.round + 1, MOCK_PROF.world.maxRounds), deadline, finished: false };
    return wait(mockProfState());
  },
  finish: () => {
    mockProfStarted = true;
    mockProf = { ...mockProf, deadline: null, finished: true };
    return wait(mockProfState());
  },
  companyDetail: () => wait(mockDetail),
  overrideQuality: (_w, id, quality) => {
    const s = mockDetail.situations.find((x) => x.id === id);
    if (!s?.answer) return Promise.reject(new Error("Na ovu situaciju još nema odgovora"));
    s.answer = { ...s.answer, quality, overridden: true };
    return wait(s.answer);
  },
  // S8: these change MOCK_PROF in memory so the situation list updates in the demo.
  createSituation: (_worldId, draft, source) => {
    const summary: SituationSummary = {
      id: `custom-${Date.now()}`,
      title: draft.title,
      area: draft.area,
      difficulty: draft.difficulty,
      source: source ?? "custom",
    };
    MOCK_PROF.bank = [...(MOCK_PROF.bank ?? []), summary];
    return wait(summary);
  },
  exportPlaybook: (_worldId) => {
    const custom = (MOCK_PROF.bank ?? []).filter((b) => b.source !== "bank");
    const situations = (custom.length ? custom : [{ title: "Uzorak situacije" }]).map((b) => ({ ...MOCK_SAMPLE_DRAFT, title: b.title }));
    return wait({ version: 1 as const, name: MOCK_PROF.world.name, settings: { autoDraw: MOCK_PROF.autoDraw ?? true }, situations });
  },
  importPlaybook: (_worldId, playbook) => {
    const added: SituationSummary[] = playbook.situations.map((d, i) => ({
      id: `custom-${Date.now()}-${i}`,
      title: d.title,
      area: d.area,
      difficulty: d.difficulty,
      source: "custom",
    }));
    MOCK_PROF.bank = [...(MOCK_PROF.bank ?? []), ...added];
    MOCK_PROF.autoDraw = playbook.settings.autoDraw;
    return wait(mockProfState());
  },
  generateSituation: (_worldId, req) =>
    wait({ ...MOCK_SAMPLE_DRAFT, title: req.hint ? `AI: ${req.hint}`.slice(0, 80) : MOCK_SAMPLE_DRAFT.title }, 800),
  dispatch: (_worldId, req) => {
    const title = MOCK_PROF.bank?.find((s) => s.id === req.templateId)?.title ?? req.templateId;
    // Sending now leaves no trace in the list (students get it at once); a later round is scheduled.
    if (req.round !== undefined) {
      MOCK_PROF.dispatches = [
        ...(MOCK_PROF.dispatches ?? []),
        { id: `d-${Date.now()}`, templateId: req.templateId, title, round: req.round, companyIds: req.companyIds ?? null, status: "scheduled" },
      ];
    }
    return wait(mockProfState());
  },
  worldSettings: (_worldId, req) => {
    MOCK_PROF.autoDraw = req.autoDraw;
    return wait(mockProfState());
  },
  libraryList: () => wait(mockLibrary),
  libraryCopy: (id) => {
    const item = mockLibrary.find((l) => l.id === id) ?? mockLibrary[0];
    const summary: SituationSummary = { id: `custom-${Date.now()}`, title: item.title, area: item.area, difficulty: item.difficulty, source: "custom" };
    MOCK_PROF.bank = [...(MOCK_PROF.bank ?? []), summary];
    return wait(summary);
  },
  librarySave: (_worldId, templateId) => {
    const s = MOCK_PROF.bank?.find((b) => b.id === templateId);
    const item: LibraryItem = { id: `lib-${Date.now()}`, title: s?.title ?? templateId, area: s?.area ?? "Gosti", difficulty: s?.difficulty ?? 3, source: s?.source ?? "custom", createdAt: new Date().toISOString() };
    mockLibrary = [item, ...mockLibrary];
    return wait(item);
  },
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
      company: { ...MOCK_ME.company, closedRound: Math.max(MOCK_ME.company.closedRound, mockClosedRound) },
      contracts: mockContracts,
      mail: [...mockMail].sort((a, b) => b.at.localeCompare(a.at)),
      unreadMail: mockMail.filter((m) => !m.read && !m.mine).length,
      world: lobby ? { ...world, status: "lobby", round: 0, roundDeadline: null } : { ...world, roundDeadline: MOCK_DEADLINE },
    });
  },
  rooms: () => wait(MOCK_ROOMS),
  staff: () => wait(MOCK_STAFF),
  answer: (_id, req) =>
    wait(
      "optionId" in req
        ? { mode: "click", optionId: req.optionId, quality: 3, copied: false }
        : {
            // Same paste rule as the server: more than half pasted → copied, capped at 4.
            mode: "own",
            text: req.text,
            quality: 4,
            copied: req.pastedChars / req.text.length > PASTE_SHARE,
            verdict: { criteriaMet: ["c1", "c2", "c3", "c4"], reasoning: "Ponudio si rješenje odmah i pokazao razumijevanje. Nisi pitao gosta što mu najviše treba." },
          },
      1500,
    ),
  chat: async () =>
    wordStream("Drugi apartman? Dobro, ali neka bude odmah, ne za sat vremena. I tko mi nadoknađuje izgubljeno jutro?"),
  closeRound: () => {
    mockClosedRound = MOCK_ME.world.round; // the waiting state shows on the next poll
    return wait({ round: MOCK_ME.world.round, metricsBefore: MOCK_ME.company.metrics, metricsAfter: MOCK_ME.company.metrics });
  },
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
    const c = mockContracts.find((k) => k.id === id) ?? mockContracts[0];
    // Accepting after the agency's counter takes the agency's numbers, like the server.
    const next: ContractView = req.accept
      ? { ...c, status: "accepted", pricePerNight: c.counterPricePerNight ?? c.pricePerNight, monthlyCost: c.counterMonthlyCost ?? c.monthlyCost }
      : { ...c, status: "rejected" };
    mockContracts = mockContracts.map((k) => (k.id === id ? next : k));
    return wait(next);
  },
  markRead: (id) => {
    mockMail = mockMail.map((m) => (m.id === id ? { ...m, read: true } : m));
    return wait({ ok: true as const }, 150);
  },
  counter: (id, req) => {
    const c = mockContracts.find((k) => k.id === id) ?? mockContracts[0];
    const deal = negotiate(c, req);
    const next: ContractView =
      deal.outcome === "accepted"
        ? { ...c, status: "accepted", negotiated: true, pricePerNight: deal.pricePerNight, monthlyCost: deal.monthlyCost }
        : deal.outcome === "countered"
          ? { ...c, negotiated: true, counterPricePerNight: deal.pricePerNight, counterMonthlyCost: deal.monthlyCost }
          : { ...c, status: "expired", negotiated: true };
    mockContracts = mockContracts.map((k) => (k.id === id ? next : k));
    const offerMail = mockMail.find((m) => m.contractId === id);
    const thread = { kind: "agency" as const, threadId: offerMail?.threadId ?? id, subject: `Re: ${offerMail?.subject ?? c.title}`, contractId: id };
    const sent: MailMessage = { ...thread, id: `m-${Date.now()}`, fromName: "Vila Ana", toName: c.businessName, body: req.message || "Predlažemo drugu cijenu.", at: new Date().toISOString(), read: true, mine: true };
    const reply: MailMessage = { ...thread, id: `m-${Date.now()}-r`, fromName: c.businessName, toName: "Vila Ana", body: AGENCY_REPLY[deal.outcome], at: new Date(Date.now() + 1000).toISOString(), read: false, mine: false };
    mockMail = [...mockMail, sent, reply];
    return wait({ outcome: deal.outcome, contract: next, reply }, 1500);
  },
  logout: () => wait(undefined, 200),
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
