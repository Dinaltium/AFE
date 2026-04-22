"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  userProfiles,
  payments,
  auditEvents,
  connectorAccounts,
  inboxEmails,
  bankTransactions,
  bankAccounts,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import type {
  AuditEventRead,
  DealVetRequest,
  DealVetResponse,
  IncomingPayment,
  SplitResponse,
  UserProfile,
} from "@/types";

const ENGINE = process.env.ENGINE_URL ?? "http://localhost:8000";

// Simple in-memory rate limiter for server actions
const lastRequestTime = new Map<string, number>();

const paymentSchema = z.object({
  amount: z.number().positive(),
  source: z.string().min(1),
  gstApplicable: z.boolean().optional(),
});

async function engineFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ENGINE}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Engine ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");
  return session.user;
}

export async function processPayment(payment: IncomingPayment): Promise<SplitResponse> {
  const user = await requireSession();

  // Rate limiting: Max 2 requests per second
  const now = Date.now();
  const last = lastRequestTime.get(user.id!) ?? 0;
  if (now - last < 500) {
    throw new Error("Rate limit exceeded. Please wait a moment.");
  }
  lastRequestTime.set(user.id!, now);

  // Input validation
  const validated = paymentSchema.parse(payment);

  const result = await engineFetch<SplitResponse>("/split/", {
    method: "POST",
    body: JSON.stringify({ ...validated, user_id: user.id }),
  });

  await db.transaction(async (tx) => {
    const [newPayment] = await tx
      .insert(payments)
      .values({
        userId: user.id!,
        amount: String(result.amount),
        source: result.source,
        taxAmount: String(result.split.tax_amount),
        collaboratorAmount: String(result.split.collaborator_amount),
        ownerAmount: String(result.split.owner_amount),
        confidence: String(result.route.confidence),
        routeAction: result.route.action,
        architectReasoning: result.architect_reasoning,
        gstApplicable: result.gst_applicable,
        gstAmount: String(result.split.gst_amount),
        tdsDeducted: String(result.split.tds_credit),
      })
      .returning();

    await tx.insert(auditEvents).values({
      paymentId: newPayment.id,
      userId: user.id!,
      eventType: "PAYMENT_SPLIT",
      description: `Split processed for ${result.source}: Tax ${result.split.tax_amount}, Collaborator ${result.split.collaborator_amount}, Owner ${result.split.owner_amount}`,
      amount: String(result.amount),
    });
  });

  return result;
}

export async function getAuditLog(userId?: string): Promise<AuditEventRead[]> {
  const session = await auth();
  const targetUser = userId ?? session?.user?.id;

  if (!targetUser) {
    return engineFetch<AuditEventRead[]>("/audit/?limit=50");
  }

  const rows = await db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.userId, targetUser))
    .orderBy(desc(auditEvents.createdAt))
    .limit(50);

  return rows.map((r) => ({
    id: r.id,
    payment_id: r.paymentId ?? "",
    user_id: r.userId ?? "",
    event_type: (r.eventType ?? "SplitExecuted") as AuditEventRead["event_type"],
    description: r.description ?? "",
    amount: r.amount ? Number(r.amount) : null,
    timestamp: r.createdAt.toISOString().slice(11, 19),
  }));
}

export async function vetDeal(request: DealVetRequest): Promise<DealVetResponse> {
  const user = await requireSession();
  return engineFetch<DealVetResponse>("/vet/", {
    method: "POST",
    body: JSON.stringify({ ...request, user_id: user.id }),
  });
}

export async function getUsers(): Promise<UserProfile[]> {
  return engineFetch<UserProfile[]>("/users/");
}

export async function getPaymentHistory(page = 0, limit = 20) {
  const user = await requireSession();

  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, user.id))
    .orderBy(desc(payments.createdAt))
    .limit(limit)
    .offset(page * limit);

  return rows.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    source: p.source,
    taxAmount: p.taxAmount ? Number(p.taxAmount) : null,
    collaboratorAmount: p.collaboratorAmount ? Number(p.collaboratorAmount) : null,
    ownerAmount: p.ownerAmount ? Number(p.ownerAmount) : null,
    confidence: p.confidence ? Number(p.confidence) : null,
    routeAction: p.routeAction,
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function getUserProfile() {
  const user = await requireSession();

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  return profile ?? null;
}

export async function updateUserProfile(data: {
  annualIncomeEstimate?: string;
  taxRate?: string;
  collaboratorName?: string;
  collaboratorRate?: string;
  collaborators?: any[];
  themeConfig?: Record<string, unknown>;
}) {
  const user = await requireSession();

  await db
    .update(userProfiles)
    .set({
      ...(data.annualIncomeEstimate !== undefined && {
        annualIncomeEstimate: data.annualIncomeEstimate,
      }),
      ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
      ...(data.collaboratorName !== undefined && {
        collaboratorName: data.collaboratorName,
      }),
      ...(data.collaboratorRate !== undefined && {
        collaboratorRate: data.collaboratorRate,
      }),
      ...(data.collaborators !== undefined && {
        collaborators: data.collaborators,
      }),
      ...(data.themeConfig !== undefined && { themeConfig: data.themeConfig }),
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, user.id));
}

export async function deleteAccount() {
  const user = await requireSession();
  await db.delete(users).where(eq(users.id, user.id));
}

export async function logRejection(source: string, amount: number) {
  const user = await requireSession();
  await db.insert(auditEvents).values({
    userId: user.id,
    eventType: "PaymentFlagged",
    description: `Payment from "${source}" rejected by user`,
    amount: String(amount),
  });
}

// ─── Connector Account Actions ───────────────────────────────────────────────

export async function getConnectorAccounts() {
  const user = await requireSession();
  return db
    .select()
    .from(connectorAccounts)
    .where(eq(connectorAccounts.userId, user.id));
}

export async function upsertConnectorAccount(data: {
  type: string;
  status: string;
  config?: Record<string, unknown>;
}) {
  const user = await requireSession();
  const existing = await db
    .select()
    .from(connectorAccounts)
    .where(
      and(
        eq(connectorAccounts.userId, user.id),
        eq(connectorAccounts.type, data.type)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(connectorAccounts)
      .set({
        status: data.status,
        config: data.config ?? existing[0].config,
        lastSyncedAt: new Date(),
      })
      .where(eq(connectorAccounts.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await db
    .insert(connectorAccounts)
    .values({ userId: user.id! as any, ...data })
    .returning();
  return row.id;
}

// ─── InboxAI Email Actions ────────────────────────────────────────────────────

export async function getInboxEmails(limit = 50) {
  const user = await requireSession();
  return db
    .select()
    .from(inboxEmails)
    .where(eq(inboxEmails.userId, user.id))
    .orderBy(desc(inboxEmails.receivedAt))
    .limit(limit);
}

export async function saveInboxEmail(data: {
  connectorId?: string;
  connectorType: string;
  fromName?: string;
  fromEmail: string;
  subject: string;
  bodyPreview?: string;
  bodyFull?: string;
  emailCategory?: string;
  status?: string;
  extractedAmount?: string;
  extractedSource?: string;
  afeAction?: string;
  classifierReasoning?: string;
  classifierConfidence?: string;
}) {
  const user = await requireSession();
  const [row] = await db
    .insert(inboxEmails)
    .values({ userId: user.id! as any, ...data })
    .returning();
  return row;
}

export async function updateEmailStatus(
  emailId: string,
  status: string,
  afeAction?: string,
  afeActionId?: string
) {
  const user = await requireSession();
  await db
    .update(inboxEmails)
    .set({ status, afeAction, afeActionId, processedAt: new Date() })
    .where(
      and(eq(inboxEmails.id, emailId), eq(inboxEmails.userId, user.id))
    );
}

// ─── PaySim Bank Actions ──────────────────────────────────────────────────────

export async function getBankAccount() {
  const user = await requireSession();
  const [account] = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.userId, user.id))
    .limit(1);

  if (!account) {
    const hex = Math.random().toString(36).slice(2, 10).toUpperCase();
    const accountNumber = `PAYSIM-${hex}`;
    const [newAccount] = await db
      .insert(bankAccounts)
      .values({ userId: user.id! as any, accountNumber, balance: "50000" })
      .returning();
    return newAccount;
  }
  return account;
}

export async function getBankTransactions(limit = 50) {
  const user = await requireSession();
  return db
    .select()
    .from(bankTransactions)
    .where(eq(bankTransactions.userId, user.id))
    .orderBy(desc(bankTransactions.transactedAt))
    .limit(limit);
}

export async function saveBankTransaction(data: {
  connectorId?: string;
  type: string;
  amount: string;
  description: string;
  referenceId?: string;
  fromEntity?: string;
  status?: string;
}) {
  const user = await requireSession();
  const [row] = await db
    .insert(bankTransactions)
    .values({ userId: user.id! as any, ...data })
    .returning();
  return row;
}

export async function updateBankTransaction(
  transactionId: string,
  data: {
    status?: string;
    paymentId?: string;
    splitTaxAmount?: string;
    splitCollaboratorAmount?: string;
    splitOwnerAmount?: string;
    afeConfidence?: string;
    processedAt?: Date;
  }
) {
  const user = await requireSession();
  await db
    .update(bankTransactions)
    .set(data)
    .where(
      and(
        eq(bankTransactions.id, transactionId),
        eq(bankTransactions.userId, user.id)
      )
    );
}

export async function updateBankBalance(delta: number) {
  const user = await requireSession();
  const account = await getBankAccount();
  const current = Number(account.balance);
  const newBalance = String(Math.max(0, current + delta));
  await db
    .update(bankAccounts)
    .set({
      balance: newBalance,
      totalCredits:
        delta > 0
          ? String(Number(account.totalCredits) + delta)
          : account.totalCredits,
      totalDebits:
        delta < 0
          ? String(Number(account.totalDebits) + Math.abs(delta))
          : account.totalDebits,
      updatedAt: new Date(),
    })
    .where(eq(bankAccounts.userId, user.id));
}

export async function syncGmailEmails() {
  const user = await requireSession();

  const [connector] = await db
    .select()
    .from(connectorAccounts)
    .where(
      and(
        eq(connectorAccounts.userId, user.id),
        eq(connectorAccounts.type, "gmail")
      )
    )
    .limit(1);

  if (!connector || connector.status !== "connected") {
    throw new Error("Gmail not connected");
  }

  const config = connector.config as { accessToken?: string } | null;
  if (!config?.accessToken) throw new Error("No Gmail access token stored");

  const query = encodeURIComponent(
    "subject:(payment OR invoice OR credited OR brand deal OR collaboration OR paid) newer_than:7d"
  );

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=20`,
    { headers: { Authorization: `Bearer ${config.accessToken}` } }
  );

  if (!listRes.ok) throw new Error(`Gmail API error: ${listRes.status}`);
  const listData = await listRes.json();
  const messages: { id: string }[] = listData.messages ?? [];

  for (const msg of messages.slice(0, 10)) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
      { headers: { Authorization: `Bearer ${config.accessToken}` } }
    );
    if (!msgRes.ok) continue;
    const msgData = await msgRes.json();

    const headers: { name: string; value: string }[] =
      msgData.payload?.headers ?? [];
    const subject =
      headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
    const fromRaw =
      headers.find((h) => h.name === "From")?.value ?? "";
    const fromEmail = fromRaw.match(/<(.+)>/)?.[1] ?? fromRaw;
    const fromName = fromRaw.replace(/<.+>/, "").trim();
    const bodyPreview: string = msgData.snippet ?? "";

    // Skip if already saved
    const existing = await db
      .select({ id: inboxEmails.id })
      .from(inboxEmails)
      .where(
        and(
          eq(inboxEmails.userId, user.id),
          eq(inboxEmails.fromEmail, fromEmail),
          eq(inboxEmails.subject, subject)
        )
      )
      .limit(1);

    if (existing.length > 0) continue;

    const saved = await saveInboxEmail({
      connectorId: connector.id,
      connectorType: "gmail",
      fromName,
      fromEmail,
      subject,
      bodyPreview,
      bodyFull: bodyPreview,
      status: "unread",
    });

    const classification = await engineFetch<{
      category: string;
      extracted_amount?: number;
      extracted_source?: string;
      deal_description?: string;
      recommended_action: string;
      reasoning: string;
      confidence: number;
    }>("/connectors/classify-email", {
      method: "POST",
      body: JSON.stringify({
        email_id: saved.id,
        from_email: fromEmail,
        subject,
        body: bodyPreview,
      }),
    });

    if (
      classification.recommended_action === "split" &&
      classification.extracted_amount
    ) {
      const result = await processPayment({
        amount: classification.extracted_amount,
        source: classification.extracted_source ?? subject,
        user_id: user.id!,
      });
      await updateEmailStatus(saved.id, "processed", "split", result.payment_id);
    } else if (
      classification.recommended_action === "vet" &&
      classification.deal_description
    ) {
      await vetDeal({
        deal_description: classification.deal_description,
        offered_amount: classification.extracted_amount ?? 0,
        user_id: user.id!,
        user_type: "freelancer",
      });
      await updateEmailStatus(saved.id, "flagged", "vet");
    } else {
      await updateEmailStatus(saved.id, "ignored", "ignore");
    }
  }

  await db
    .update(connectorAccounts)
    .set({ lastSyncedAt: new Date() })
    .where(eq(connectorAccounts.id, connector.id));
}
