"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
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
  accounts,
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
    body: JSON.stringify({ 
      amount: validated.amount,
      source: validated.source,
      user_id: user.id,
      gst_applicable: validated.gstApplicable ?? false
    }),
  });

  const [newPayment] = await db
    .insert(payments)
    .values({
      userId: user.id!,
      amount: String(result.amount),
      source: result.source,
      taxAmount: String(result.split.tax_amount),
      collaboratorAmount: String(result.split.collaborator_amount),
      collaboratorSplits: result.split.collaborator_splits, // NEW: Individual shares
      ownerAmount: String(result.split.owner_amount),
      confidence: String(result.route.confidence),
      routeAction: result.route.action,
      architectReasoning: result.architect_reasoning,
      gstApplicable: validated.gstApplicable ?? false,
      gstAmount: String(result.split.gst_amount),
      tdsDeducted: String(result.split.tds_credit),
    })
    .returning();



  return result;
}

export async function getAuditLog(userId?: string): Promise<AuditEventRead[]> {
  try {
    const session = await auth();
    const targetUser = userId ?? session?.user?.id;

    if (!targetUser) {
      console.log("[AuditLog] No target user, fetching from engine");
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
      timestamp: `${r.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${r.createdAt.toISOString().slice(11, 16)}`,
    }));
  } catch (error) {
    console.error("[AuditLog] Failed to fetch audit log:", error);
    return [];
  }
}

export async function seedHistoricalAuditLog() {
  try {
    const user = await requireSession();
    
    const userPayments = await db.select()
      .from(payments)
      .where(eq(payments.userId, user.id));
    
    if (userPayments.length === 0) return;

    // Fetch existing payment IDs in audit log to avoid duplicates
    const existingEvents = await db.select({ paymentId: auditEvents.paymentId })
      .from(auditEvents)
      .where(eq(auditEvents.userId, user.id));
    
    const seededPaymentIds = new Set(existingEvents.map(e => e.paymentId).filter(Boolean));

    console.log(`[AuditLog] Checking ${userPayments.length} payments for missing audit records...`);

    let seededCount = 0;
    for (const p of userPayments) {
      if (!seededPaymentIds.has(p.id)) {
        await db.insert(auditEvents).values({
          userId: user.id,
          paymentId: p.id,
          eventType: "SplitExecuted",
          description: `Historical Record: Deterministic split executed for ${p.source} (${p.amount} INR). All wallets synchronized.`,
          amount: p.amount,
          createdAt: p.createdAt,
        });
        seededCount++;
      }
    }
    
    if (seededCount > 0) {
      console.log(`[AuditLog] Successfully backfilled ${seededCount} records.`);
    }
  } catch (error) {
    console.error("[AuditLog] Seeding failed:", error);
  }
}

export async function vetDeal(request: DealVetRequest): Promise<DealVetResponse> {
  const user = await requireSession();
  let response: DealVetResponse;
  try {
    const payload: DealVetRequest = {
      deal_description: request.deal_description,
      offered_amount: Number(request.offered_amount),
      user_id: user.id!,
      user_type: request.user_type,
    };
    response = await engineFetch<DealVetResponse>("/vet/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[vetDeal] Engine request failed:", err);
    return {
      score: 0,
      verdict: "fair",
      market_low: 0,
      market_high: 0,
      reasoning:
        "The vetting engine is currently unavailable or returned an error. Your deal details were not analyzed.",
      recommendation: "Please try again in a moment.",
    };
  }

  // Log to audit trail
  await db.insert(auditEvents).values({
    userId: user.id,
    eventType: "DealVetted",
    description: `Analysis completed: ${response.verdict.toUpperCase()} (Score: ${response.score}). Market Range: ${response.market_low} - ${response.market_high}.`,
    amount: String(request.offered_amount),
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/audit");
  return response;
}

export async function getUsers(): Promise<UserProfile[]> {
  return engineFetch<UserProfile[]>("/users/");
}

export async function getPaymentHistory(page = 0, limit = 1000) {
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
    collaboratorSplits: (p.collaboratorSplits as any[] | null) ?? null,
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
  gstEnabled?: boolean;
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
      ...(data.gstEnabled !== undefined && { gstEnabled: data.gstEnabled }),
      ...(data.themeConfig !== undefined && { themeConfig: data.themeConfig }),
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, user.id));

  console.log("[DEBUG] Updated user profile with:", data);
  revalidatePath("/dashboard", "layout");
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

export async function getVettingRequests() {
  const user = await requireSession();
  return db.select()
    .from(inboxEmails)
    .where(
      and(
        eq(inboxEmails.userId, user.id),
        eq(inboxEmails.afeAction, "vet")
      )
    )
    .orderBy(desc(inboxEmails.receivedAt));
}

export async function markVettingAsRead() {
  const user = await requireSession();
  await db.update(inboxEmails)
    .set({ status: "read" })
    .where(
      and(
        eq(inboxEmails.userId, user.id),
        eq(inboxEmails.afeAction, "vet"),
        eq(inboxEmails.status, "unread")
      )
    );
  revalidatePath("/dashboard", "layout");
}

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

export async function updateEmailClassification(
  emailId: string,
  data: {
    category: string;
    reasoning: string;
    confidence: number;
    action: string;
    amount?: number;
    source?: string;
  }
) {
  const user = await requireSession();
  await db
    .update(inboxEmails)
    .set({
      emailCategory: data.category,
      classifierReasoning: data.reasoning,
      classifierConfidence: String(data.confidence),
      afeAction: data.action,
      extractedAmount: data.amount ? String(data.amount) : null,
      extractedSource: data.source,
    })
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

  // 1. Get Google account tokens from NextAuth accounts table
  const [googleAccount] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, user.id),
        eq(accounts.provider, "google")
      )
    )
    .limit(1);

  if (!googleAccount?.access_token) {
    throw new Error("Gmail not connected. Please click 'Connect Gmail' first.");
  }

  // 2. Ensure we have a connector_accounts record to track sync status
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

  if (!connector) {
    await db.insert(connectorAccounts).values({
      userId: user.id!,
      type: "gmail",
      status: "connected",
      lastSyncedAt: new Date(),
    });
  } else if (connector.status !== "connected") {
    await db
      .update(connectorAccounts)
      .set({ status: "connected", lastSyncedAt: new Date() })
      .where(eq(connectorAccounts.id, connector.id));
  }

  const accessToken = googleAccount.access_token;
  const query = encodeURIComponent(
    "subject:(payment OR invoice OR credited OR brand deal OR collaboration OR paid) newer_than:7d"
  );

  // 3. Fetch from Gmail API
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=20`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!listRes.ok) {
    if (listRes.status === 401) throw new Error("Gmail session expired. Please reconnect.");
    throw new Error(`Gmail API error: ${listRes.status}`);
  }
  
  const listData = await listRes.json();
  const messages: { id: string }[] = listData.messages ?? [];

  for (const msg of messages.slice(0, 10)) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
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
      connectorId: connector?.id,
      connectorType: "gmail",
      fromName,
      fromEmail,
      subject,
      bodyPreview,
      bodyFull: bodyPreview,
      status: "unread",
    });

    // 4. AIS-driven classification
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

  if (connector) {
    await db
      .update(connectorAccounts)
      .set({ lastSyncedAt: new Date() })
      .where(eq(connectorAccounts.id, connector.id));
  }
}
