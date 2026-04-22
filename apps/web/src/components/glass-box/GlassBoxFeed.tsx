"use client";

import { eventColor } from "@/lib/utils";
import { EVENT_ICONS } from "@/lib/constants";
import type { AuditEventRead } from "@/types";
import { Dot } from "lucide-react";
import { useAFEStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface GlassBoxFeedProps {
  events: AuditEventRead[];
}

export function GlassBoxFeed({ events }: GlassBoxFeedProps) {
  const isGlassBoxMode = useAFEStore((s) => s.isGlassBoxMode);

  return (
    <div className={cn(
      "h-full flex flex-col transition-all duration-500",
      isGlassBoxMode && "shadow-[0_0_25px_rgba(34,197,94,0.15)] bg-primary/5 rounded-lg p-2 -m-2 border border-primary/20"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
        <h2 className="font-medium text-foreground text-sm">Glass Box</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {events.length} entries
        </span>
      </div>

      {events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[10px] text-muted-foreground text-center px-4">
          No events yet &mdash; process a payment to see the audit trail
        </div>
      ) : (
        <div className="max-h-[450px] overflow-y-auto space-y-0 font-mono text-[10px] pr-2 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
          {events.map((e) => {
            const Icon = EVENT_ICONS[e.event_type];
            return (
              <div
                key={e.id}
                className="flex gap-2 py-1.5 border-b border-border last:border-0"
              >
                <span className="text-muted-foreground flex-shrink-0 w-12 pt-0.5 tabular-nums opacity-70">
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
                  <span className={`font-semibold ${eventColor(e.event_type)}`}>
                    {e.event_type}
                  </span>
                  <p className="text-muted-foreground/80 leading-snug break-words mt-0.5 whitespace-pre-wrap">
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
