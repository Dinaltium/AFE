"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Pause, Square, Activity } from "lucide-react";

interface SimulationBannerProps {
  nextPaymentIn: number;
  processingCount: number;
  onPause: () => void;
  onStop: () => void;
}

export function SimulationBanner({
  nextPaymentIn,
  processingCount,
  onPause,
  onStop,
}: SimulationBannerProps) {
  return (
    <div className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        {/* Pulsing dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>

        <span className="text-sm font-medium text-foreground">
          Simulation active
        </span>

        <span className="text-sm text-muted-foreground">
          — next payment in{" "}
          <span className="font-mono text-primary">{nextPaymentIn}s</span>
        </span>

        {processingCount > 0 && (
          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 gap-1">
            <Activity className="w-2.5 h-2.5" />
            {processingCount} processing
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onPause}
        >
          <Pause className="w-3 h-3 mr-1" />
          Pause
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onStop}
        >
          <Square className="w-3 h-3 mr-1" />
          Stop
        </Button>
      </div>
    </div>
  );
}
