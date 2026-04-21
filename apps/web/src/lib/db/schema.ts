import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  numeric,
  jsonb,
  serial,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const userTypeEnum = pgEnum("user_type", [
  "creator",
  "freelancer",
  "consultant",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  name: text("name"),
  image: text("image"),
  userType: userTypeEnum("user_type"),
  isAdmin: boolean("is_admin").notNull().default(false),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  annualIncomeEstimate: numeric("annual_income_estimate"),
  taxRate: numeric("tax_rate").notNull().default("0.20"),
  collaboratorRate: numeric("collaborator_rate").notNull().default("0.10"),
  collaboratorName: text("collaborator_name").notNull().default("Collaborator"),
  themeConfig: jsonb("theme_config"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  source: text("source").notNull(),
  taxAmount: numeric("tax_amount"),
  collaboratorAmount: numeric("collaborator_amount"),
  ownerAmount: numeric("owner_amount"),
  confidence: numeric("confidence"),
  routeAction: text("route_action"),
  architectReasoning: text("architect_reasoning"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditEvents = pgTable("audit_events", {
  id: serial("id").primaryKey(),
  paymentId: uuid("payment_id"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type"),
  description: text("description"),
  amount: numeric("amount"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const approvedClients = pgTable("approved_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  autoApprove: boolean("auto_approve").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const simulationSettings = pgTable("simulation_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  simulationEnabled: boolean("simulation_enabled").notNull().default(false),
  minIntervalSeconds: integer("min_interval_seconds").notNull().default(5),
  maxIntervalSeconds: integer("max_interval_seconds").notNull().default(180),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// NextAuth adapter tables
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);
