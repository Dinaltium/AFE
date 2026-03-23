import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function routeDisplay(action: string) {
  switch (action) {
    case "auto_execute":
      return { label: "Auto executed", color: "text-green-700 bg-green-50 border-green-200" };
    case "pending_approval":
      return { label: "Pending approval", color: "text-amber-700 bg-amber-50 border-amber-200" };
    case "flagged":
      return { label: "Flagged", color: "text-red-700 bg-red-50 border-red-200" };
    default:
      return { label: action, color: "text-gray-700 bg-gray-50 border-gray-200" };
  }
}

export function eventColor(eventType: string): string {
  switch (eventType) {
    case "PaymentReceived":
      return "text-blue-600";
    case "ArchitectDecision":
      return "text-amber-600";
    case "SplitExecuted":
      return "text-green-600";
    case "PaymentFlagged":
      return "text-red-600";
    default:
      return "text-gray-500";
  }
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-green-700";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export function userIcon(type: string): "video" | "pen-line" | "briefcase" | "user" {
  switch (type) {
    case "creator":
      return "video";
    case "freelancer":
      return "pen-line";
    case "consultant":
      return "briefcase";
    default:
      return "user";
  }
}
