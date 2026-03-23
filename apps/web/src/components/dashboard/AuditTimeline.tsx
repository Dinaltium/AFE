"use client";

import {
  ArrowDownToLine,
  Brain,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
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
      <CardContent className="p-6">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-5">
            {events.map((event, i) => {
              const config = EVENT_CONFIG[event.event_type];
              const Icon = config?.icon ?? CheckCircle2;
              const dotColor = config?.dotColor ?? "bg-muted-foreground";
              const badgeColor =
                config?.badgeColor ??
                "bg-muted text-muted-foreground border-border";
              const label = config?.label ?? event.event_type;

              return (
                <div key={event.id ?? i} className="flex gap-4 items-start">
                  {/* Dot + icon */}
                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${dotColor}/10 border border-current/10`}
                  >
                    <Icon className={`w-4 h-4 ${badgeColor.split(" ")[1]}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge
                        className={`text-xs border ${badgeColor} px-2 py-0.5`}
                      >
                        {label}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {event.timestamp}
                      </span>
                      {event.amount !== null && (
                        <span className="text-xs font-medium text-foreground">
                          {formatINR(event.amount)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
