// Ugovor između sučelja i backenda. Mijenja ga samo Leon, uz najavu timu.
export type MetricKey = "guests" | "reviews" | "staff" | "operations" | "finance";
export type Metrics = Record<MetricKey, number>; // 0–100
export type Quality = 1 | 2 | 3 | 4 | 5;
export type Skill = "empathy" | "communication" | "finance" | "problemSolving" | "ethics";
export type RoomType = "single" | "double" | "suite" | "family";
export type RoomView = "more" | "park" | "ulica";
export type RoomStatus = "free" | "occupied" | "cleaning" | "broken";
export type WorldStatus = "lobby" | "running" | "finished";
export type SituationState = "open" | "answered" | "expired";
export type AnswerMode = "click" | "own" | "none";

// Sadržaj (src/content/*.json)
export type RoomTemplate = { number: string; floor: number; type: RoomType; beds: number; view: RoomView; basePrice: number; status: RoomStatus; note?: string };
export type HotelTemplate = { id: string; place: string; stars: 2 | 3 | 4 | 5; description: string; startMetrics: Metrics; staffCost: number; startCash: number; rooms: RoomTemplate[] }; // staffCost € mjesečno
export type BusinessKind = "agency" | "laundry" | "bakery" | "security" | "supplier";
export type CityBusiness = { id: string; name: string; kind: BusinessKind; description: string };
export type ContractTemplate = { id: string; businessId: string; title: string; text: string; durationRounds: 1 | 2 | 3; monthlyCost: number; nights: number; pricePerNight: number; effects: Partial<Record<MetricKey, number>> };
export type ContractStatus = "offered" | "accepted" | "rejected" | "expired";
export type Character = { name: string; role: string; personality: string; goal: string };
export type RubricCriterion = { id: string; text: string; skill: Skill };
export type SituationOption = { id: string; text: string; criteria: string[] };
export type SituationTemplate = {
  id: string; title: string; text: string; area: string; difficulty: 1 | 2 | 3 | 4 | 5;
  character: Character; rubric: RubricCriterion[]; options: SituationOption[];
  effects: Partial<Record<MetricKey, number>>;
  room?: { type: RoomType; problemStatus: RoomStatus };
};

export type ChatTurn = { role: "student" | "character"; text: string };
export type Verdict = { criteriaMet: string[]; reasoning: string };

// Pogledi (odgovori API-ja)
export type Room = RoomTemplate & { id: string };
export type AnswerView = { mode: AnswerMode; optionId?: string; text?: string; quality: Quality; copied: boolean; verdict?: Verdict };
export type SituationView = {
  id: string; templateId: string; round: number; title: string; text: string; area: string; difficulty: number;
  roomNumber?: string; character: { name: string; role: string }; options: { id: string; text: string }[];
  state: SituationState; transcript: ChatTurn[]; answer?: AnswerView;
};
export type CompanyView = { id: string; hotelName: string; playerName: string; templateId: string; place: string; stars: number; roomsCount: number; startMetrics: Metrics; metrics: Metrics; progress: number; closedRound: number; cash: number; startCash: number };
export type RoundReportView = { round: number; metricsBefore: Metrics; metricsAfter: Metrics; mentorQuestion?: string; reflection?: string; mentorText?: string }; // pitanje stiže iz GET /api/me/report/[round]
export type LeaderboardRow = { companyId: string; hotelName: string; playerName: string; place: string; progress: number; closedRound: number; cash: number };
export type ContractView = { id: string; templateId: string; businessName: string; businessKind: BusinessKind; title: string; text: string; monthlyCost: number; nights: number; pricePerNight: number; durationRounds: number; roundOffered: number; status: ContractStatus; activeUntilRound?: number };
export type RoundPlan = { round: number; price: number; marketing: number };
export type RoundFinance = { round: number; nights: number; contractNights: number; capacityNights: number; occupancyPct: number; marketSharePct: number; revenue: number; costs: number; profit: number; cashAfter: number };
export type NewsItem = { at: string; text: string };
export type CityView = { businesses: CityBusiness[]; hotels: LeaderboardRow[]; links: { companyId: string; businessId: string }[] }; // links = aktivni ugovori
export type WorldView = { id: string; name: string; round: number; maxRounds: number; status: WorldStatus; roundDeadline: string | null; serverNow: string }; // odbrojavanje = roundDeadline − serverNow

export type MeResponse = { world: WorldView; company: CompanyView; situations: SituationView[]; leaderboard: LeaderboardRow[]; reports: RoundReportView[]; plan: RoundPlan; contracts: ContractView[]; finances: RoundFinance[]; city: CityView; news: NewsItem[] };
export type ProfStateResponse = { world: WorldView & { joinCode: string; maxPlayers: number }; players: LeaderboardRow[]; city: CityView; news: NewsItem[] };
export type CompanyDetailResponse = { company: CompanyView; situations: SituationView[]; reports: RoundReportView[] };

// Zahtjevi
export type CreateWorldRequest = { name: string; maxPlayers: number };
export type CreateWorldResponse = { worldId: string; joinCode: string; profCode: string };
export type ProfLoginRequest = { profCode: string };
export type ProfLoginResponse = { worldId: string };
export type OpenRoundRequest = { deadlineMinutes?: number };
export type JoinRequest = { joinCode: string; name: string; hotelName: string };
export type JoinResponse = { companyId: string; hotelName: string; place: string; stars: number };
export type AnswerRequest = { optionId: string } | { text: string; pastedChars: number };
export type ChatRequest = { message: string; pastedChars: number };
export type ReflectionRequest = { round: number; text: string };
export type PlanRequest = { price: number; marketing: number };
export type ContractDecisionRequest = { accept: boolean };
export type ApiError = { error: string }; // poruka na hrvatskom

// AI ulazi (Simon implementira, Leon poziva)
export type JudgeInput = { template: SituationTemplate; hotelName: string; text: string; transcript: ChatTurn[] };
export type CharacterInput = { template: SituationTemplate; hotelName: string; roomNumber?: string; transcript: ChatTurn[]; message: string; pasted: boolean };
export type MentorItem = { title: string; mode: AnswerMode; quality: Quality; answerText?: string; criteriaMissed: string[] };
export type MentorInput = { hotelName: string; round: number; items: MentorItem[]; metricsBefore: Metrics; metricsAfter: Metrics };
