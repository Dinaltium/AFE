"use client";

import {
  ArrowDownToLine,
  Brain,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import type { AuditEventRead, AuditEventType } from "@/types";

interface AuditTimelineProps {
  events: AuditEventRead[];
}

const EVENT_CONFIG: Record<
  AuditEventType,
  {
    icon: React.ComponentType<{ className?: string }>;
    badgeColor: string;
    dotColor: string;
    label: string;
  }
> = {
  PaymentReceived: {
    icon: ArrowDownToLine,
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dotColor: "bg-blue-500",
    label: "Payment Received",
  },
  ArchitectDecision: {
    icon: Brain,
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotColor: "bg-amber-500",
    label: "Architect Decision",
  },
  SplitExecuted: {
    icon: CheckCircle2,
    badgeColor: "bg-primary/10 text-primary border-primary/20",
    dotColor: "bg-primary",
    label: "Split Executed",
  },
  PaymentFlagged: {
    icon: AlertTriangle,
    badgeColor: "bg-destructive/10 text-destructive border-destructive/20",
    dotColor: "bg-destructive",
    label: "Payment Flagged",
  },
};

export function AuditTimeline({ events }: AuditTimelineProps) {
  if (events.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground text-sm">
            No audit events yet. Process a payment to generate your first entry.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="max-h-[600px] overflow-y-auto pr-4 -mr-4 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
          <div className="relative">
            {/* Vertical line - hidden on small screens or adjusted for smaller icons */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/50" />

            <div className="space-y-4">
              {events.map((event, i) => {
                const config = EVENT_CONFIG[event.event_type];
                const Icon = config?.icon ?? CheckCircle2;
                const dotColor = config?.dotColor ?? "bg-muted-foreground";
                const badgeColor =
                  config?.badgeColor ??
                  "bg-muted text-muted-foreground border-border";
                const label = config?.label ?? event.event_type;

                return (
                  <div key={event.id ?? i} className="flex gap-3 items-start">
                    {/* Compact Dot + icon */}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${dotColor}/10 border border-current/10`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${badgeColor.split(" ")[1]}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono opacity-70">
                          {event.timestamp}
                        </span>
                        <span className={`text-[11px] font-semibold uppercase tracking-wider ${badgeColor.split(" ")[1]}`}>
                          {label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {event.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Refreshed
