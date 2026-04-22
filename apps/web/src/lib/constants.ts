import {
  ArrowDownToLine,
  Brain,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Demo payments shown in the UI per user
// These simulate the "One Chaotic Month" scenario

export const DEMO_PAYMENTS: Record<string, { amount: number; source: string }[]> = {
  aarav: [
    { amount: 50000, source: "Nike India brand deal" },
    { amount: 12400, source: "YouTube AdSense — March" },
    { amount: 8000, source: "Twitch subscription payout" },
  ],
  priya: [
    { amount: 80000, source: "Razorpay client — UI redesign" },
    { amount: 45000, source: "Upwork project — mobile screens" },
    { amount: 20000, source: "Direct client — brand kit" },
  ],
  rohan: [
    { amount: 120000, source: "Startup retainer — month 3 of 6" },
    { amount: 60000, source: "Workshop facilitation — 2 days" },
    { amount: 35000, source: "Strategy deck — one-time project" },
  ],
};

export const EVENT_ICONS: Record<string, LucideIcon> = {
  PaymentReceived: ArrowDownToLine,
  ArchitectDecision: Brain,
  SplitExecuted: CheckCircle2,
  PaymentFlagged: TriangleAlert,
};
