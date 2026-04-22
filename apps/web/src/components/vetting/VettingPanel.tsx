"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  BrainCircuit, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  DollarSign,
  Briefcase,
  ExternalLink
} from "lucide-react";
import { formatINR, cn } from "@/lib/utils";
import { useVetting } from "@/hooks/useVetting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { UserProfile, DealVetResponse } from "@/types";

interface VettingPanelProps {
  activeUser: UserProfile;
  onVetComplete?: (result: DealVetResponse) => void;
  initialData?: {
    subject?: string;
    amount?: number;
    description?: string;
  };
}

const EXAMPLES = [
  {
    title: "SaaS Brand Deal",
    description: "FinTech startup wants 1 YouTube integration (60s) + 1 Twitter thread. Requirements: 2.5k followers min, tech niche.",
    amount: "25000",
  },
  {
    title: "Freelance UI Project",
    description: "E-commerce landing page redesign including mobile responsiveness. Budget covers 1 week of work + 2 revisions.",
    amount: "15000",
  },
  {
    title: "Consulting Retainer",
    description: "Strategy consulting for high-growth DTC brand. 10 hours/week, 3-month contract. Reporting to CMO.",
    amount: "80000",
  },
];

export function VettingPanel({ activeUser, onVetComplete, initialData }: VettingPanelProps) {
  const { vet, result, isVetting } = useVetting();
  const [description, setDescription] = useState(initialData?.description || "");
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : "");

  // Update when initialData changes (from parent)
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description || initialData.subject || "");
      setAmount(initialData.amount ? String(initialData.amount) : "");
    }
  }, [initialData]);

  async function handleVet() {
    if (!description || !amount) return;
    const res = await vet(description, parseFloat(amount), activeUser.id, activeUser.user_type);
    if (res && onVetComplete) onVetComplete(res);
  }

  const fillExample = (ex: typeof EXAMPLES[0]) => {
    setDescription(ex.description);
    setAmount(ex.amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10";
    if (score >= 60) return "text-amber-500 bg-amber-500/10";
    return "text-rose-500 bg-rose-500/10";
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "good": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "fair": return <Info className="w-5 h-5 text-amber-500" />;
      default: return <AlertCircle className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Deal Vetting Agent</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <textarea
                className="w-full min-h-[160px] p-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none text-sm leading-relaxed"
                placeholder="Describe the deal in detail. Mention what you need to deliver, exclusivity terms, and any other requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground font-mono">
                {description.length} chars
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-sm font-medium">₹</span>
                </div>
                <Input
                  className="pl-8 h-12 bg-background border-border rounded-xl focus:ring-primary/20"
                  placeholder="Offer amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button
                size="lg"
                className="h-12 px-8 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={!description || !amount || isVetting}
                onClick={handleVet}
              >
                {isVetting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                    Analysing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Vet Deal
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="w-3 h-3" />
              Quick Templates
            </h3>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.title}
                  onClick={() => fillExample(ex)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary hover:border-primary/30 transition-all text-xs font-medium text-foreground text-left"
                >
                  {ex.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result Column */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!result && !isVetting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full rounded-2xl border border-dashed border-border flex flex-col items-center justify-center p-8 text-center bg-secondary/10"
              >
                <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-medium mb-1">Waiting for details</h4>
                <p className="text-xs text-muted-foreground max-w-[180px]">
                  Input your deal data and click "Vet Deal" to get AI insights.
                </p>
              </motion.div>
            )}

            {isVetting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full rounded-2xl border border-border p-6 space-y-6 bg-background relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div className="space-y-4 pt-2">
                  <div className="h-8 w-2/3 bg-secondary animate-pulse rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-secondary/50 animate-pulse rounded-md" />
                    <div className="h-4 w-full bg-secondary/50 animate-pulse rounded-md" />
                    <div className="h-4 w-5/6 bg-secondary/50 animate-pulse rounded-md" />
                  </div>
                </div>
                <div className="pt-4 space-y-3">
                   <div className="flex items-center gap-3 text-xs text-muted-foreground italic">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                      Benchmarking against market rates...
                   </div>
                </div>
              </motion.div>
            )}

            {result && !isVetting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full rounded-2xl border border-border p-6 space-y-6 bg-background shadow-xl shadow-primary/5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                      VETTING REPORT
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-bold",
                    getScoreColor(result.score)
                  )}>
                    <span className="text-xs opacity-70 mb-[-4px]">SCORE</span>
                    <span className="text-3xl tracking-tight">{result.score}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getVerdictIcon(result.verdict)}
                      <span className="font-bold text-lg capitalize">{result.verdict} Deal</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Estimate: {formatINR(result.market_low)} – {formatINR(result.market_high)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 text-sm leading-relaxed">
                    {result.reasoning}
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0 self-start">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {result.recommendation}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-auto">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground justify-between">
                      Download Full Audit Report
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
