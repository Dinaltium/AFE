"use client";

import { eventColor } from "@/lib/utils";
import { EVENT_ICONS } from "@/lib/constants";
import type { AuditEventRead } from "@/types";
import { Dot } from "lucide-react";

interface GlassBoxFeedProps {
  events: AuditEventRead[];
}

export function GlassBoxFeed({ events }: GlassBoxFeedProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
        <h2 className="font-medium text-foreground text-sm">Glass Box</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {events.length} entries
        </span>
      </div>

      {events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
          No events yet &mdash; process a payment to see the audit trail
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-0 font-mono text-xs">
          {events.map((e) => {
            const Icon = EVENT_ICONS[e.event_type];
            return (
              <div
                key={e.id}
                className="flex gap-2 py-2 border-b border-border last:border-0"
              >
                <span className="text-muted-foreground flex-shrink-0 w-14 pt-0.5 tabular-nums">
                  {e.timestamp}
                </span>
                <span className="flex-shrink-0 pt-0.5">
                  {Icon ? (
                    <Icon className={`w-3 h-3 ${eventColor(e.event_type)}`} />
                  ) : (
                    <Dot className="w-3 h-3 text-muted-foreground" />
                  )}
                </span>
                <div className="min-w-0">
                  <span className={`font-medium ${eventColor(e.event_type)}`}>
                    {e.event_type}
                  </span>
                  <p className="text-muted-foreground leading-relaxed break-words mt-0.5">
                    {e.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
