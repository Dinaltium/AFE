"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { generateRandomPayment, getRandomInterval } from "@/lib/simulation";
import {
  processPayment,
  getApprovedClients,
  logRejection,
} from "@/lib/actions";

export interface PendingPayment {
  id: string;
  source: string;
  amount: number;
  arrivedAt: Date;
  status: "pending" | "processing" | "accepted" | "rejected";
}

interface ApprovedClient {
  id: string;
  name: string;
  autoApprove: boolean;
}

interface UseSimulationOptions {
  userType: string;
  minIntervalSeconds: number;
  maxIntervalSeconds: number;
  enabled: boolean;
  autoStart?: boolean;
}

export function useSimulation({
  userType,
  minIntervalSeconds,
  maxIntervalSeconds,
  enabled,
  autoStart = false,
}: UseSimulationOptions) {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [nextPaymentIn, setNextPaymentIn] = useState(0);

  const isRunningRef = useRef(false);
  const approvedClientsRef = useRef<ApprovedClient[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minRef = useRef(minIntervalSeconds);
  const maxRef = useRef(maxIntervalSeconds);
  const userTypeRef = useRef(userType);

  // Keep refs in sync with props
  useEffect(() => { minRef.current = minIntervalSeconds; }, [minIntervalSeconds]);
  useEffect(() => { maxRef.current = maxIntervalSeconds; }, [maxIntervalSeconds]);
  useEffect(() => { userTypeRef.current = userType; }, [userType]);

  // Fetch approved clients when simulation is enabled
  useEffect(() => {
    if (!enabled) return;
    getApprovedClients()
      .then((rows) => { approvedClientsRef.current = rows; })
      .catch(() => null);
  }, [enabled]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  // Mutable schedule function — always reads latest refs so no stale closure
  const scheduleRef = useRef<(() => void) | null>(null);
  scheduleRef.current = () => {
    if (!isRunningRef.current) return;
    clearTimers();

    const intervalMs = getRandomInterval(minRef.current, maxRef.current);
    let remaining = Math.round(intervalMs / 1000);
    setNextPaymentIn(remaining);

    countdownRef.current = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      setNextPaymentIn(remaining);
    }, 1000);

    timeoutRef.current = setTimeout(async () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (!isRunningRef.current) return;

      const payment = generateRandomPayment(userTypeRef.current);
      const client = approvedClientsRef.current.find(
        (c) => c.name.toLowerCase() === payment.source.toLowerCase()
      );
      const pendingId = `sim-${Date.now()}-${Math.random()}`;
      const isAutoApprove = !!(client?.autoApprove);

      const newPayment: PendingPayment = {
        id: pendingId,
        source: payment.source,
        amount: payment.amount,
        arrivedAt: new Date(),
        status: isAutoApprove ? "processing" : "pending",
      };
      setPendingPayments((prev) => [...prev.slice(-2), newPayment]); // keep max 3

      if (isAutoApprove) {
        // 1.5s simulated arrival delay before processing
        setTimeout(async () => {
          try {
            await processPayment({
              amount: payment.amount,
              source: payment.source,
              user_id: "",
            });
            setPendingPayments((prev) => prev.filter((p) => p.id !== pendingId));
            toast.success(`Auto-processed: ${payment.source}`, {
              description: `₹${payment.amount.toLocaleString("en-IN")}`,
            });
          } catch {
            setPendingPayments((prev) =>
              prev.map((p) =>
                p.id === pendingId ? { ...p, status: "rejected" as const } : p
              )
            );
          }
        }, 1500);
      }

      scheduleRef.current?.();
    }, intervalMs);
  };

  const start = useCallback(() => {
    if (!enabled) return;
    isRunningRef.current = true;
    setIsRunning(true);
    scheduleRef.current?.();
  }, [enabled]);

  const pause = useCallback(() => {
    isRunningRef.current = false;
    setIsRunning(false);
    clearTimers();
    setNextPaymentIn(0);
  }, [clearTimers]);

  const stop = pause;

  const acceptPayment = useCallback(async (id: string) => {
    const payment = pendingPayments.find((p) => p.id === id);
    if (!payment) return;
    setPendingPayments((prev) =>
      prev.map((p) => p.id === id ? { ...p, status: "processing" as const } : p)
    );
    try {
      await processPayment({
        amount: payment.amount,
        source: payment.source,
        user_id: "",
      });
      setPendingPayments((prev) => prev.filter((p) => p.id !== id));
      toast.success(`Accepted: ${payment.source}`, {
        description: `₹${payment.amount.toLocaleString("en-IN")}`,
      });
    } catch {
      setPendingPayments((prev) =>
        prev.map((p) => p.id === id ? { ...p, status: "rejected" as const } : p)
      );
      toast.error("Failed to process payment");
    }
  }, [pendingPayments]);

  const rejectPayment = useCallback(async (id: string) => {
    const payment = pendingPayments.find((p) => p.id === id);
    if (!payment) return;
    setPendingPayments((prev) => prev.filter((p) => p.id !== id));
    await logRejection(payment.source, payment.amount).catch(() => null);
    toast.info(`Rejected: ${payment.source}`);
  }, [pendingPayments]);

  const refreshClients = useCallback(() => {
    getApprovedClients()
      .then((rows) => { approvedClientsRef.current = rows; })
      .catch(() => null);
  }, []);

  // Auto-start when enabled + autoStart
  useEffect(() => {
    if (enabled && autoStart) {
      start();
    }
    return () => {
      isRunningRef.current = false;
      clearTimers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only on mount

  return {
    pendingPayments: pendingPayments.filter((p) => p.status === "pending"),
    processingCount: pendingPayments.filter((p) => p.status === "processing").length,
    isRunning,
    nextPaymentIn,
    start,
    pause,
    stop,
    acceptPayment,
    rejectPayment,
    refreshClients,
  };
}
