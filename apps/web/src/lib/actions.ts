"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  userProfiles,
  payments,
  auditEvents,
  approvedClients,
  simulationSettings,
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
      ...(data.themeConfig !== undefined && { themeConfig: data.themeConfig }),
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, user.id));
}

export async function deleteAccount() {
  const user = await requireSession();
  await db.delete(users).where(eq(users.id, user.id));
}

// ─── Simulation Settings ──────────────────────────────────────────────────────

export async function getSimulationSettings() {
  const user = await requireSession();
  const [row] = await db
    .select()
    .from(simulationSettings)
    .where(eq(simulationSettings.userId, user.id))
    .limit(1);
  return row ?? null;
}

export async function upsertSimulationSettings(data: {
  simulationEnabled: boolean;
  minIntervalSeconds: number;
  maxIntervalSeconds: number;
}) {
  const user = await requireSession();
  await db
    .insert(simulationSettings)
    .values({ userId: user.id, ...data })
    .onConflictDoUpdate({
      target: simulationSettings.userId,
      set: {
        simulationEnabled: data.simulationEnabled,
        minIntervalSeconds: data.minIntervalSeconds,
        maxIntervalSeconds: data.maxIntervalSeconds,
      },
    });
}

// ─── Approved Clients ─────────────────────────────────────────────────────────

export async function getApprovedClients() {
  const user = await requireSession();
  const rows = await db
    .select()
    .from(approvedClients)
    .where(eq(approvedClients.userId, user.id))
    .orderBy(approvedClients.createdAt);
  return rows;
}

export async function addApprovedClient(name: string, autoApprove: boolean) {
  const user = await requireSession();
  const [row] = await db
    .insert(approvedClients)
    .values({ userId: user.id, name: name.trim(), autoApprove })
    .returning();
  return row;
}

export async function removeApprovedClient(clientId: string) {
  const user = await requireSession();
  await db
    .delete(approvedClients)
    .where(
      and(eq(approvedClients.id, clientId), eq(approvedClients.userId, user.id))
    );
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
