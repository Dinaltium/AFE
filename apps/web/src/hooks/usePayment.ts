"use client";

import { processPayment, getAuditLog } from "@/lib/actions";
import { useAFEStore } from "@/lib/store";

export function usePayment() {
  const { addPayment, setAuditLog, isSplitting, setIsSplitting } = useAFEStore();

  async function split(amount: number, source: string, userId: string) {
    if (isSplitting) return;
    setIsSplitting(true);
    try {
      const result = await processPayment({ amount, source, user_id: userId });
      addPayment(result);
      // Refresh Glass Box from DB
      const freshLog = await getAuditLog(userId);
      setAuditLog(freshLog);
      return result;
    } catch (err) {
      console.error("Split failed:", err);
    } finally {
      setIsSplitting(false);
    }
  }

  return { split, isSplitting };
}
