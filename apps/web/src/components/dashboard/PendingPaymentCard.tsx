"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Check, X, Zap } from "lucide-react";
import type { PendingPayment } from "@/hooks/useSimulation";
import { useAFEStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const COUNTDOWN_SECONDS = 60;

interface PendingPaymentCardProps {
  payment: PendingPayment;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function PendingPaymentCard({
  payment,
  onAccept,
  onReject,
}: PendingPaymentCardProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const isGlassBoxMode = useAFEStore((s) => s.isGlassBoxMode);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onReject(payment.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [payment.id, onReject]);

  const progress = (secondsLeft / COUNTDOWN_SECONDS) * 100;
  const isUrgent = secondsLeft <= 15;

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className={cn(
        "w-80 bg-card border-border shadow-xl overflow-hidden transition-all duration-500",
        isGlassBoxMode && "glow-primary border-primary/40 ring-1 ring-primary/20"
      )}>
        {/* Countdown bar */}
        <div className="h-0.5 bg-border">
          <motion.div
            className={`h-full transition-colors duration-1000 ${isUrgent ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Badge className="mb-1 text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                <Zap className="w-2.5 h-2.5 mr-1" />
                Requires Approval
              </Badge>
              <p className="text-sm font-medium text-foreground truncate">
                {payment.source}
              </p>
            </div>
            <span
              className={`text-xs tabular-nums shrink-0 mt-0.5 ${isUrgent ? "text-destructive font-semibold" : "text-muted-foreground"}`}
            >
              {secondsLeft}s
            </span>
          </div>

          <p className="text-2xl font-bold text-primary tabular-nums">
            ₹{payment.amount.toLocaleString("en-IN")}
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-8"
              onClick={() => onAccept(payment.id)}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-destructive text-destructive hover:bg-destructive/10 h-8"
              onClick={() => onReject(payment.id)}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface PendingPaymentStackProps {
  payments: PendingPayment[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function PendingPaymentStack({
  payments,
  onAccept,
  onReject,
}: PendingPaymentStackProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {payments.slice(0, 3).map((payment) => (
          <div key={payment.id} className="pointer-events-auto">
            <PendingPaymentCard
              payment={payment}
              onAccept={onAccept}
              onReject={onReject}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
