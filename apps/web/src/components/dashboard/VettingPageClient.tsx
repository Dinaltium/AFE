"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { History, Clock, TrendingUp, Info } from "lucide-react";
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
import { formatINR, scoreColor, cn } from "@/lib/utils";
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
  good: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  fair: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  underpriced: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  overscoped: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20",
};

export function VettingPageClient({ activeUser }: VettingPageClientProps) {
  const [vettedDeals, setVettedDeals] = useState<VettedDeal[]>([]);

  function handleVetComplete(result: DealVetResponse) {
    const deal: VettedDeal = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString("en-IN", { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
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
    <div className="space-y-10">
      {/* Vetting Panel Section */}
      <section>
        <Card className="bg-background/50 backdrop-blur-sm border-border shadow-sm overflow-hidden">
          <CardContent className="p-8">
            <VettingPanel
              activeUser={activeUser}
              onVetComplete={handleVetComplete}
            />
          </CardContent>
        </Card>
      </section>

      {/* Session History Section */}
      <AnimatePresence>
        {vettedDeals.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 px-1">
              <History className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                Recent Analysis
              </h3>
            </div>
            
            <Card className="bg-background/50 border-border overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent bg-secondary/30">
                      <TableHead className="pl-6 h-12 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Time
                      </TableHead>
                      <TableHead className="h-12 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Verdict
                      </TableHead>
                      <TableHead className="h-12 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                        Score
                      </TableHead>
                      <TableHead className="h-12 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Market Range
                        </div>
                      </TableHead>
                      <TableHead className="pr-6 h-12 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Reasoning
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vettedDeals.map((deal) => (
                      <TableRow key={deal.id} className="border-border group hover:bg-secondary/20 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                            <Clock className="w-3 h-3 opacity-50" />
                            {deal.timestamp}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-tight",
                              VERDICT_COLORS[deal.verdict]
                            )}
                          >
                            {deal.verdict}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span
                            className={cn(
                              "text-sm font-black italic",
                              scoreColor(deal.score)
                            )}
                          >
                            {deal.score}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-xs font-semibold text-foreground">
                            {formatINR(deal.marketLow)} – {formatINR(deal.marketHigh)}
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 py-4 max-w-[320px]">
                          <div className="flex items-start gap-2">
                             <Info className="w-3 h-3 text-muted-foreground/30 mt-0.5 shrink-0" />
                             <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                                "{deal.reasoning}"
                             </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
