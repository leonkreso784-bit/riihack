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
export type StaffDepartment = "reception" | "housekeeping" | "kitchen" | "maintenance" | "management";
export type StaffShift = "morning" | "afternoon" | "night";

// Sadržaj (src/content/*.json)
export type RoomTemplate = { number: string; floor: number; type: RoomType; beds: number; view: RoomView; basePrice: number; status: RoomStatus; note?: string };
export type StaffMember = { name: string; department: StaffDepartment; role: string; shift: StaffShift; note?: string }; // role = radno mjesto na hrvatskom
export type HotelTemplate = { id: string; place: string; stars: 2 | 3 | 4 | 5; description: string; startMetrics: Metrics; staffCost: number; startCash: number; rooms: RoomTemplate[]; staff: StaffMember[] }; // staffCost € mjesečno
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
// Profesorove situacije (obilazak 1, 24.10.: profesor je glavni; AI glumi likove, mentorira i po želji predlaže situacije)
export type SituationSource = "bank" | "custom" | "ai"; // banka iz sadržaja, profesor napisao, AI predložio pa profesor spremio
export type SituationDraft = Omit<SituationTemplate, "id">; // prije spremanja; rubric 3–5 kriterija, options smiju biti [] (tada samo vlastiti odgovor)
export type SituationSummary = { id: string; title: string; area: string; difficulty: number; source: SituationSource };

export type ChatTurn = { role: "student" | "character"; text: string };
export type Verdict = { criteriaMet: string[]; reasoning: string };

// Pogledi (odgovori API-ja)
export type Room = RoomTemplate & { id: string };
export type AnswerView = { mode: AnswerMode; optionId?: string; text?: string; quality: Quality; copied: boolean; verdict?: Verdict; overridden?: boolean }; // overridden = profesor je promijenio kvalitetu
export type SituationView = {
  id: string; templateId: string; round: number; title: string; text: string; area: string; difficulty: number;
  roomNumber?: string; character: { name: string; role: string }; options: { id: string; text: string }[];
  state: SituationState; transcript: ChatTurn[]; answer?: AnswerView; source?: SituationSource;
};
export type CompanyView = { id: string; hotelName: string; playerName: string; templateId: string; place: string; stars: number; roomsCount: number; startMetrics: Metrics; metrics: Metrics; progress: number; closedRound: number; cash: number; startCash: number };
export type RoundReportView = { round: number; metricsBefore: Metrics; metricsAfter: Metrics; mentorQuestion?: string; reflection?: string; mentorText?: string }; // pitanje stiže iz GET /api/me/report/[round]
export type LeaderboardRow = { companyId: string; hotelName: string; playerName: string; place: string; progress: number; closedRound: number; cash: number; roundGain: number }; // roundGain = napredak u zadnjem zatvorenom krugu
export type ContractView = { id: string; templateId: string; businessName: string; businessKind: BusinessKind; title: string; text: string; monthlyCost: number; nights: number; pricePerNight: number; durationRounds: number; roundOffered: number; status: ContractStatus; activeUntilRound?: number; negotiated?: boolean; counterPricePerNight?: number; counterMonthlyCost?: number }; // L15: pricePerNight/monthlyCost = dogovorene vrijednosti kad postoje; counter* = protuponuda agencije
export type DepartmentInvestments = Partial<Record<StaffDepartment, number>>; // € mjesečno po odjelu, 0–INVEST_MAX; bez ključa = 0
export type RoundPlan = { round: number; price: number; marketing: number; investments?: DepartmentInvestments };
export type RoundFinance = { round: number; nights: number; contractNights: number; capacityNights: number; occupancyPct: number; marketSharePct: number; revenue: number; costs: number; profit: number; cashAfter: number; investments?: number; breakdown?: FinanceBreakdown }; // investments = zbroj ulaganja u odjele (dio costs)
export type FinanceBreakdown = { revenueOwn: number; revenueContracts: number; costStaff: number; costRooms: number; costMarketing: number; costContracts: number; costInvestments: number }; // raspodjela: revenueOwn + revenueContracts = revenue, cost* zbrojeni = costs
export type NewsItem = { at: string; text: string };
export type CityView = { businesses: CityBusiness[]; hotels: LeaderboardRow[]; links: { companyId: string; businessId: string }[] }; // links = aktivni ugovori
export type CompanyPublicView = { companyId: string; hotelName: string; playerName: string; place: string; stars: number; roomsCount: number; price: number; reviews: number; guests: number; occupancyPct?: number; staffByDepartment: Record<StaffDepartment, number>; contracts: { businessId: string; businessName: string; title: string }[] }; // javni podaci hotela (karta, tuđi hotel): bez novca, odgovora i ocjena; occupancyPct = zadnji obračunati mjesec
export type WorldView = { id: string; name: string; round: number; maxRounds: number; status: WorldStatus; roundDeadline: string | null; serverNow: string }; // odbrojavanje = roundDeadline − serverNow
export type DispatchView = { id: string; templateId: string; title: string; round: number; companyIds: string[] | null; status: "scheduled" | "sent" }; // companyIds null = svi studenti

// L15 Pošta i pregovaranje
export type MailKind = "agency" | "hotel" | "system";
export type MailMessage = {
  id: string; kind: MailKind; threadId: string; fromName: string; toName: string; subject: string; body: string;
  at: string; read: boolean; mine: boolean; // mine = poslao ja
  contractId?: string; referralId?: string; // poveznica na ponudu ugovora ili prijedlog suradnje
};
export type CounterOfferRequest = { pricePerNight?: number; monthlyCost?: number; message?: string }; // jedno od dvoje
export type NegotiationOutcome = "accepted" | "countered" | "rejected";
export type NegotiationResult = { outcome: NegotiationOutcome; contract: ContractView; reply: MailMessage };
export type DepartmentView = { department: StaffDepartment; label: string; metric: MetricKey; metricValue: number; staffCount: number; alerts: string[]; investment: number }; // stanje odjela: pokazatelj, ljudi, upozorenja (hrvatski), ulaganje iz plana tekućeg mjeseca
export type MeResponse = { world: WorldView; company: CompanyView; situations: SituationView[]; leaderboard: LeaderboardRow[]; reports: RoundReportView[]; plan: RoundPlan; contracts: ContractView[]; finances: RoundFinance[]; city: CityView; news: NewsItem[]; departments?: DepartmentView[]; mail?: MailMessage[]; unreadMail?: number }; // mail = zadnjih 30, najnovije prvo
export type ProfStateResponse = { world: WorldView & { joinCode: string; maxPlayers: number }; players: LeaderboardRow[]; city: CityView; news: NewsItem[]; bank?: SituationSummary[]; dispatches?: DispatchView[]; autoDraw?: boolean }; // bank = banka + profesorove situacije; autoDraw = slučajno izvlačenje po krugu
export type ProfGameSummary = { worldId: string; name: string; joinCode: string; status: WorldStatus; round: number; maxRounds: number; players: number; createdAt: string }; // igre prijavljenog profesora (L16)
export type LibraryItem = SituationSummary & { createdAt: string }; // situacija u profesorovoj knjižnici (na računu, ne u igri), L17
export type SendMailRequest = { toCompanyId: string; subject: string; body: string }; // poruka drugom hotelu iste igre, L18
export type CompanyDetailResponse = { company: CompanyView; situations: SituationView[]; reports: RoundReportView[] };

// Zahtjevi
export type CreateWorldRequest = { name: string; maxPlayers: number };
export type CreateWorldResponse = { worldId: string; joinCode: string; profCode: string };
export type ProfLoginRequest = { profCode: string };
export type ProfLoginResponse = { worldId: string };
export type OpenRoundRequest = { deadlineMinutes?: number; fromRound?: number }; // fromRound = mjesec koji profesor zatvara; ako je već zatvoren, vrati se stanje (dvoklik)
export type JoinRequest = { joinCode: string; name: string; hotelName: string };
export type JoinResponse = { companyId: string; hotelName: string; place: string; stars: number };
export type AnswerRequest = { optionId: string } | { text: string; pastedChars: number };
export type ChatRequest = { message: string; pastedChars: number };
export type ReflectionRequest = { round: number; text: string };
export type PlanRequest = { price: number; marketing: number; investments?: DepartmentInvestments }; // bez investments = ulaganja ostaju kakva jesu
export type ContractDecisionRequest = { accept: boolean };
export type CreateSituationRequest = SituationDraft;
export type DispatchRequest = { templateId: string; companyIds?: string[]; round?: number; roomNumber?: string }; // bez companyIds = svi; bez round = odmah u tekući krug
export type WorldSettingsRequest = { autoDraw: boolean };
export type QualityOverrideRequest = { quality: Quality };
export type GenerateSituationRequest = { companyId?: string; hint?: string }; // AI predloži SituationDraft iz stanja hotela, profesor ga uredi i spremi
export type Playbook = { version: 1; name: string; settings: WorldSettingsRequest; situations: SituationDraft[] }; // profesorov playbook: izvoz i uvoz situacija i postavki među igrama
export type ApiError = { error: string }; // poruka na hrvatskom

// AI ulazi (Simon implementira, Leon poziva)
export type JudgeInput = { template: SituationTemplate; hotelName: string; text: string; transcript: ChatTurn[] };
export type CharacterInput = { template: SituationTemplate; hotelName: string; roomNumber?: string; transcript: ChatTurn[]; message: string; pasted: boolean; messageNo?: number; maxMessages?: number }; // messageNo = koja je ovo studentova poruka (1..maxMessages), da lik zna kad zaključiti razgovor
export type MentorItem = { title: string; mode: AnswerMode; quality: Quality; answerText?: string; criteriaMissed: string[] };
export type MentorInput = { hotelName: string; round: number; items: MentorItem[]; metricsBefore: Metrics; metricsAfter: Metrics; finance?: RoundFinance }; // finance = obračun mjeseca iz jezgre, da mentor objasni što se dogodilo
export type SituationIdeaInput = { hotelName: string; place: string; stars: number; metrics: Metrics; rooms: Room[]; finance?: RoundFinance; hint?: string };
