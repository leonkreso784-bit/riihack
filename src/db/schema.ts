// Drizzle shema. Tablice igre i grada piše L1 (plan izvedbe, „L1 · Baza").
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { ChatTurn, Metrics, Verdict } from "@/lib/types";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const worlds = pgTable("worlds", {
  id: id(),
  name: text("name").notNull(),
  maxPlayers: integer("max_players").notNull(),
  joinCode: text("join_code").notNull().unique(),
  profCodeHash: text("prof_code_hash").notNull().unique(),
  round: integer("round").notNull().default(0),
  roundDeadline: timestamp("round_deadline", { withTimezone: true }),
  status: text("status").notNull().default("lobby"),
  seed: integer("seed").notNull(),
  settledRound: integer("settled_round").notNull().default(0),
  createdAt: createdAt(),
});

export const companies = pgTable("companies", {
  id: id(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id),
  kind: text("kind").notNull().default("hotel"),
  name: text("name").notNull(),
  templateId: text("template_id").notNull(),
  startMetrics: jsonb("start_metrics").$type<Metrics>().notNull(),
  metrics: jsonb("metrics").$type<Metrics>().notNull(),
  closedRound: integer("closed_round").notNull().default(0),
  cash: integer("cash").notNull(),
  startCash: integer("start_cash").notNull(),
  joinIndex: integer("join_index").notNull(),
  createdAt: createdAt(),
});

export const players = pgTable("players", {
  id: id(),
  companyId: uuid("company_id")
    .notNull()
    .unique()
    .references(() => companies.id),
  displayName: text("display_name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
});

export const rooms = pgTable(
  "rooms",
  {
    id: id(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    number: text("number").notNull(),
    floor: integer("floor").notNull(),
    type: text("type").notNull(),
    beds: integer("beds").notNull(),
    view: text("view").notNull(),
    basePrice: integer("base_price").notNull(),
    status: text("status").notNull(),
    note: text("note"),
  },
  (t) => [unique().on(t.companyId, t.number)],
);

export const situations = pgTable(
  "situations",
  {
    id: id(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    round: integer("round").notNull(),
    templateId: text("template_id").notNull(),
    roomNumber: text("room_number"),
    state: text("state").notNull().default("open"),
    transcript: jsonb("transcript").$type<ChatTurn[]>().notNull().default([]),
  },
  (t) => [unique().on(t.companyId, t.round, t.templateId)],
);

export const answers = pgTable("answers", {
  id: id(),
  situationId: uuid("situation_id")
    .notNull()
    .unique()
    .references(() => situations.id),
  mode: text("mode").notNull(),
  optionId: text("option_id"),
  text: text("text"),
  pastedChars: integer("pasted_chars").notNull().default(0),
  verdict: jsonb("verdict").$type<Verdict>(),
  quality: integer("quality").notNull(),
  copied: boolean("copied").notNull(),
  createdAt: createdAt(),
});

export const roundReports = pgTable(
  "round_reports",
  {
    id: id(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    round: integer("round").notNull(),
    metricsBefore: jsonb("metrics_before").$type<Metrics>().notNull(),
    metricsAfter: jsonb("metrics_after").$type<Metrics>().notNull(),
    mentorQuestion: text("mentor_question"),
    reflection: text("reflection"),
    mentorText: text("mentor_text"),
  },
  (t) => [unique().on(t.companyId, t.round)],
);

export const events = pgTable("events", {
  id: id(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id),
  companyId: uuid("company_id").references(() => companies.id),
  round: integer("round").notNull(),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<unknown>().notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

export const plans = pgTable(
  "plans",
  {
    id: id(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    round: integer("round").notNull(),
    price: integer("price").notNull(),
    marketing: integer("marketing").notNull(),
  },
  (t) => [unique().on(t.companyId, t.round)],
);

export const finances = pgTable(
  "finances",
  {
    id: id(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    round: integer("round").notNull(),
    nights: integer("nights").notNull(),
    contractNights: integer("contract_nights").notNull(),
    capacityNights: integer("capacity_nights").notNull(),
    occupancyPct: integer("occupancy_pct").notNull(),
    marketSharePct: integer("market_share_pct").notNull(),
    revenue: integer("revenue").notNull(),
    costs: integer("costs").notNull(),
    profit: integer("profit").notNull(),
    cashAfter: integer("cash_after").notNull(),
  },
  (t) => [unique().on(t.companyId, t.round)],
);

export const contracts = pgTable(
  "contracts",
  {
    id: id(),
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    templateId: text("template_id").notNull(),
    roundOffered: integer("round_offered").notNull(),
    status: text("status").notNull().default("offered"),
    activeFrom: integer("active_from"),
    activeTo: integer("active_to"),
  },
  (t) => [unique().on(t.companyId, t.roundOffered)],
);

export type WorldRow = typeof worlds.$inferSelect;
export type CompanyRow = typeof companies.$inferSelect;
export type PlayerRow = typeof players.$inferSelect;
export type RoomRow = typeof rooms.$inferSelect;
export type SituationRow = typeof situations.$inferSelect;
export type AnswerRow = typeof answers.$inferSelect;
export type RoundReportRow = typeof roundReports.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type PlanRow = typeof plans.$inferSelect;
export type FinanceRow = typeof finances.$inferSelect;
export type ContractRow = typeof contracts.$inferSelect;
