"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { History, Clock, TrendingUp, Info, Mail } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
  initialRequests?: any[];
}

const VERDICT_COLORS: Record<DealVetResponse["verdict"], string> = {
  good: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  fair: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  underpriced: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  overscoped: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20",
};

export function VettingPageClient({ activeUser, initialRequests = [] }: VettingPageClientProps) {
  const [vettedDeals, setVettedDeals] = useState<VettedDeal[]>([]);
  const [inboxRequests, setInboxRequests] = useState(initialRequests);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);

  useEffect(() => {
    markVettingAsRead();
  }, []);

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
    // If we just vetted an inbox request, remove it from the list
    if (activeRequest) {
      setInboxRequests(prev => prev.filter(r => r.id !== activeRequest.id));
      setActiveRequest(null);
    }
  }

  return (
    <div className="space-y-10">
      {/* Incoming Requests Section */}
      {inboxRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Mail className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Incoming Requests ({inboxRequests.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inboxRequests.map((req) => (
              <Card key={req.id} className="bg-card/40 border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm truncate">{req.subject}</h4>
                    <p className="text-[10px] text-muted-foreground">From: {req.fromEmail}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">
                      Amount: {req.extractedAmount ? formatINR(Number(req.extractedAmount)) : "Unknown"}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-[10px] border-primary/50 text-primary hover:bg-primary/10"
                      onClick={() => setActiveRequest(req)}
                    >
                      Vet Deal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Vetting Panel Section */}
      <section>
        <Card className="bg-background/50 backdrop-blur-sm border-border shadow-sm overflow-hidden">
          <CardContent className="p-8">
            <VettingPanel
              activeUser={activeUser}
              onVetComplete={handleVetComplete}
              initialData={activeRequest ? {
                subject: activeRequest.subject,
                amount: activeRequest.extractedAmount ? Number(activeRequest.extractedAmount) : 0,
                description: activeRequest.bodyPreview || activeRequest.subject
              } : undefined}
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

// Refreshed
