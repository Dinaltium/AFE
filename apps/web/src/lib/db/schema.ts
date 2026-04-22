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
  collaborators: jsonb("collaborators"),
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
  collaboratorSplits: jsonb("collaborator_splits"),
  ownerAmount: numeric("owner_amount"),
  confidence: numeric("confidence"),
  routeAction: text("route_action"),
  architectReasoning: text("architect_reasoning"),
  gstApplicable: boolean("gst_applicable").notNull().default(false),
  gstAmount: numeric("gst_amount"),
  tdsDeducted: numeric("tds_deducted"),
  invoiceNumber: text("invoice_number"),
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

// Tracks which connectors a user has configured
export const connectorAccounts = pgTable("connector_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "gmail" | "inboxai" | "paysim"
  status: text("status").notNull().default("disconnected"),
  // gmail: { accessToken, refreshToken, email }
  // inboxai/paysim: { generationInterval, lastGeneratedAt }
  config: jsonb("config"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Emails from InboxAI (fake) or Gmail (real)
export const inboxEmails = pgTable("inbox_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  connectorId: uuid("connector_id")
    .references(() => connectorAccounts.id, { onDelete: "set null" }),
  connectorType: text("connector_type").notNull(), // "gmail" | "inboxai"
  fromName: text("from_name"),
  fromEmail: text("from_email").notNull(),
  subject: text("subject").notNull(),
  bodyPreview: text("body_preview"),
  bodyFull: text("body_full"),
  // "payment" | "deal" | "spam" | "newsletter" | "unknown"
  emailCategory: text("email_category"),
  // "unread" | "read" | "processed" | "flagged" | "ignored"
  status: text("status").notNull().default("unread"),
  extractedAmount: numeric("extracted_amount"),
  extractedSource: text("extracted_source"),
  // "split" | "vet" | "ignore"
  afeAction: text("afe_action"),
  // payment_id or vet result reference
  afeActionId: text("afe_action_id"),
  classifierReasoning: text("classifier_reasoning"),
  classifierConfidence: numeric("classifier_confidence"),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// PaySim bank transactions
export const bankTransactions = pgTable("bank_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  connectorId: uuid("connector_id")
    .references(() => connectorAccounts.id, { onDelete: "set null" }),
  type: text("type").notNull(), // "credit" | "debit"
  amount: numeric("amount").notNull(),
  description: text("description").notNull(),
  referenceId: text("reference_id"),
  fromEntity: text("from_entity"),
  // "pending" | "split" | "ignored" | "failed"
  status: text("status").notNull().default("pending"),
  // FK to payments table if a split was executed
  paymentId: uuid("payment_id"),
  splitTaxAmount: numeric("split_tax_amount"),
  splitCollaboratorAmount: numeric("split_collaborator_amount"),
  splitOwnerAmount: numeric("split_owner_amount"),
  afeConfidence: numeric("afe_confidence"),
  transactedAt: timestamp("transacted_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// PaySim account balance
export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  accountNumber: text("account_number").notNull(),
  bankName: text("bank_name").notNull().default("PaySim Bank"),
  // Starter balance of ₹50,000 for demo
  balance: numeric("balance").notNull().default("50000"),
  totalCredits: numeric("total_credits").notNull().default("0"),
  totalDebits: numeric("total_debits").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
