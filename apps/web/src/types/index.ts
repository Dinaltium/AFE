// Mirrors services/engine/src/models/schemas.py — keep in sync

export type UserType = "creator" | "freelancer" | "consultant";

export interface UserProfile {
  id: string;
  name: string;
  user_type: UserType;
  annual_income_estimate: number;
  tax_rate: number;
  collaborator_rate: number;
  collaborator_name: string;
}

export interface SplitResult {
  tax_amount: number;
  collaborator_amount: number;
  owner_amount: number;
  tax_rate: number;
  collaborator_rate: number;
  owner_rate: number;
}

export type RouteAction = "auto_execute" | "pending_approval" | "flagged";

export interface ConfidenceRoute {
  action: RouteAction;
  confidence: number;
  requires_approval: boolean;
  reason: string;
}

export interface SplitResponse {
  payment_id: string;
  user_id: string;
  amount: number;
  source: string;
  split: SplitResult;
  route: ConfidenceRoute;
  architect_reasoning: string;
  timestamp: string;
}

export type AuditEventType =
  | "PaymentReceived"
  | "ArchitectDecision"
  | "SplitExecuted"
  | "PaymentFlagged";

export interface AuditEventRead {
  id: number;
  payment_id: string;
  user_id: string;
  event_type: AuditEventType;
  description: string;
  amount: number | null;
  timestamp: string;
}

export interface DealVetRequest {
  deal_description: string;
  offered_amount: number;
  user_id: string;
  user_type: UserType;
}

export interface DealVetResponse {
  score: number;
  verdict: "good" | "fair" | "underpriced" | "overscoped";
  market_low: number;
  market_high: number;
  reasoning: string;
  recommendation: string;
}

export interface IncomingPayment {
  amount: number;
  source: string;
  user_id: string;
  currency?: string;
}
