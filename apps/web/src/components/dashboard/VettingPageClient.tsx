"use client";

import { useState } from "react";
import { VettingPanel } from "@/components/vetting/VettingPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { formatINR, scoreColor } from "@/lib/utils";
import type { UserProfile, DealVetResponse } from "@/types";

interface VettedDeal {
  id: string;
  timestamp: string;
  verdict: DealVetResponse["verdict"];
  score: number;
  offeredAmount: number;
  marketLow: number;
  marketHigh: number;
  reasoning: string;
}

interface VettingPageClientProps {
  activeUser: UserProfile;
}

const VERDICT_COLORS: Record<DealVetResponse["verdict"], string> = {
  good: "bg-primary/10 text-primary border-primary/20",
  fair: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  underpriced: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  overscoped: "bg-destructive/10 text-destructive border-destructive/20",
};

export function VettingPageClient({ activeUser }: VettingPageClientProps) {
  const [vettedDeals, setVettedDeals] = useState<VettedDeal[]>([]);

  function handleVetComplete(result: DealVetResponse) {
    const deal: VettedDeal = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString("en-IN"),
      verdict: result.verdict,
      score: result.score,
      offeredAmount: 0,
      marketLow: result.market_low,
      marketHigh: result.market_high,
      reasoning: result.reasoning,
    };
    setVettedDeals((prev) => [deal, ...prev]);
  }

  return (
    <div className="space-y-6">
      {/* Vetting Panel */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <VettingPanel
            activeUser={activeUser}
            onVetComplete={handleVetComplete}
          />
        </CardContent>
      </Card>

      {/* Past vetted deals table */}
      {vettedDeals.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Session History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 text-muted-foreground">
                    Time
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Verdict
                  </TableHead>
                  <TableHead className="text-muted-foreground">Score</TableHead>
                  <TableHead className="text-muted-foreground">
                    Market Range
                  </TableHead>
                  <TableHead className="pr-6 text-muted-foreground">
                    Notes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vettedDeals.map((deal) => (
                  <TableRow key={deal.id} className="border-border">
                    <TableCell className="pl-6 text-muted-foreground text-xs font-mono">
                      {deal.timestamp}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs border capitalize ${VERDICT_COLORS[deal.verdict]}`}
                      >
                        {deal.verdict}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-bold ${scoreColor(deal.score)}`}
                      >
                        {deal.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatINR(deal.marketLow)} &ndash;{" "}
                      {formatINR(deal.marketHigh)}
                    </TableCell>
                    <TableCell className="pr-6 text-muted-foreground text-xs max-w-[260px]">
                      <span className="line-clamp-2">{deal.reasoning}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
