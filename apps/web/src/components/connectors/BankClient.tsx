"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  User,
  Clock, 
  ChevronDown, 
  ChevronUp,
  CreditCard,
  ShieldCheck,
  Zap,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  saveBankTransaction, 
  updateBankBalance, 
  processPayment, 
  updateBankTransaction 
} from "@/lib/actions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface BankAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  balance: string;
  totalCredits: string;
  totalDebits: string;
}

interface BankTransaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  referenceId: string | null;
  fromEntity: string | null;
  status: string;
  paymentId: string | null;
  splitTaxAmount: string | null;
  splitCollaboratorAmount: string | null;
  splitOwnerAmount: string | null;
  transactedAt: Date;
}

interface BankClientProps {
  initialAccount: BankAccount;
  initialTransactions: BankTransaction[];
  userId: string;
}

export function BankClient({ initialAccount, initialTransactions, userId }: BankClientProps) {
  const [account, setAccount] = useState<BankAccount>(initialAccount);
  const [transactions, setTransactions] = useState<BankTransaction[]>(initialTransactions);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoGenerate) {
      timerRef.current = setInterval(() => {
        generateAndProcessTransaction();
      }, 45000); // 45s for bank transactions
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoGenerate]);

  const generateAndProcessTransaction = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      // 1. Generate via Proxy
      const res = await fetch("/api/proxy/connectors/generate-transaction", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const generated = await res.json();

      // 2. Save to DB
      const saved = await saveBankTransaction({
        type: generated.type,
        amount: String(generated.amount),
        description: generated.description,
        referenceId: generated.reference_id,
        fromEntity: generated.from_entity,
        status: "pending",
      });

      const newTx: BankTransaction = {
        ...saved,
        transactedAt: new Date(saved.transactedAt),
      } as any;

      // 3. Update balance in DB & local
      const delta = generated.type === "credit" ? generated.amount : -generated.amount;
      await updateBankBalance(delta);

      setTransactions(prev => [newTx, ...prev]);
      setAccount(prev => ({
        ...prev!,
        balance: String(Number(prev!.balance) + delta),
        totalCredits: generated.type === "credit" ? String(Number(prev!.totalCredits) + delta) : prev!.totalCredits,
        totalDebits: generated.type === "debit" ? String(Number(prev!.totalDebits) + generated.amount) : prev!.totalDebits,
      }));

      // 4. If credit, run AFE split
      if (generated.type === "credit") {
        await new Promise(r => setTimeout(r, 1000));
        const splitResult = await processPayment({
          amount: generated.amount,
          source: generated.description,
          user_id: userId,
        });

        await updateBankTransaction(saved.id, {
          status: "split",
          paymentId: splitResult.payment_id,
          splitTaxAmount: String(splitResult.split.tax_amount),
          splitCollaboratorAmount: String(splitResult.split.collaborator_amount),
          splitOwnerAmount: String(splitResult.split.owner_amount),
          afeConfidence: String(splitResult.route.confidence),
          processedAt: new Date(),
        });

        setTransactions(prev => prev.map(t => 
          t.id === saved.id ? {
            ...t,
            status: "split",
            paymentId: splitResult.payment_id,
            splitTaxAmount: String(splitResult.split.tax_amount),
            splitCollaboratorAmount: String(splitResult.split.collaborator_amount),
            splitOwnerAmount: String(splitResult.split.owner_amount),
          } : t
        ));

        toast.success(`AFE Split Executed: ₹${generated.amount.toLocaleString()}`);
      } else {
        await updateBankTransaction(saved.id, {
          status: "ignored",
          processedAt: new Date(),
        });
        setTransactions(prev => prev.map(t => t.id === saved.id ? { ...t, status: "ignored" } : t));
        toast.info(`Business expense logged: ₹${generated.amount.toLocaleString()}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Bank simulation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatINR = (val: string | number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(val));
  };

  // Stats calculation
  const splitTransactions = transactions.filter(t => t.status === "split");
  const taxReserved = splitTransactions.reduce((acc, t) => acc + Number(t.splitTaxAmount || 0), 0);
  const collabPaid = splitTransactions.reduce((acc, t) => acc + Number(t.splitCollaboratorAmount || 0), 0);
  const takeHome = splitTransactions.reduce((acc, t) => acc + Number(t.splitOwnerAmount || 0), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 relative">
      {/* Header */}
      <div className="flex items-center justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PaySim Bank</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-mono">
              <span>Account: {account.accountNumber}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>IFSC: PAYSIM0001</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/20 px-3 py-1">
             Sandbox Environment
           </Badge>
        </div>
      </div>

      {/* Main Balance & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <CreditCard className="w-48 h-48 -rotate-12" />
          </div>
          <CardContent className="p-10 space-y-12 relative">
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                 <span className="text-sm font-medium text-zinc-400">Available Balance</span>
                 <h2 className="text-5xl font-black tabular-nums tracking-tighter">
                   {formatINR(account.balance)}
                 </h2>
               </div>
               <div className="text-right space-y-1">
                 <span className="text-sm font-medium text-zinc-400 block">Account Holder</span>
                 <span className="text-lg font-bold tracking-tight">Aarav Mehta</span>
               </div>
            </div>

            <div className="flex gap-12">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                   <ArrowUpRight className="w-5 h-5 text-green-400" />
                 </div>
                 <div>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Total Credits</span>
                   <span className="text-lg font-bold text-green-400 tabular-nums">{formatINR(account.totalCredits)}</span>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                   <ArrowDownRight className="w-5 h-5 text-red-400" />
                 </div>
                 <div>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Total Debits</span>
                   <span className="text-lg font-bold text-red-400 tabular-nums">{formatINR(account.totalDebits)}</span>
                 </div>
               </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button 
                onClick={generateAndProcessTransaction} 
                disabled={isGenerating}
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-teal-500/20"
              >
                {isGenerating ? (
                  <RotateCcw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Generate Transaction
              </Button>
              <div className="flex items-center gap-3 px-4 h-12 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                <span className="text-xs font-medium text-zinc-400">Auto-sim</span>
                <Switch 
                  checked={autoGenerate} 
                  onCheckedChange={setAutoGenerate} 
                  className="scale-90 data-[state=checked]:bg-teal-500" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
               <RotateCcw className="w-5 h-5 text-primary" />
            </div>
            <div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Processed</span>
               <span className="text-xl font-bold">{splitTransactions.length} Splits</span>
            </div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
               <ShieldCheck className="w-5 h-5 text-red-500" />
            </div>
            <div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Tax Reserved</span>
               <span className="text-xl font-bold text-red-500">{formatINR(taxReserved)}</span>
            </div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
               <User className="w-5 h-5 text-amber-500" />
            </div>
            <div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Collab Paid</span>
               <span className="text-xl font-bold text-amber-500">{formatINR(collabPaid)}</span>
            </div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 border-primary/20 bg-primary/5">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
               <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">Take-home</span>
               <span className="text-xl font-bold text-green-500">{formatINR(takeHome)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
           <h3 className="font-bold tracking-tight">Recent Activity</h3>
           <div className="flex gap-2">
             <Badge variant="outline" className="text-[10px] font-bold">ALL</Badge>
             <Badge variant="secondary" className="text-[10px] font-bold bg-muted/50 text-muted-foreground">CREDITS</Badge>
             <Badge variant="secondary" className="text-[10px] font-bold bg-muted/50 text-muted-foreground">DEBITS</Badge>
           </div>
        </div>
        
        <div className="divide-y divide-border/50">
          <AnimatePresence initial={false}>
            {transactions.map((tx) => (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <div 
                  onClick={() => tx.status === "split" && setExpandedId(expandedId === tx.id ? null : tx.id)}
                  className={`p-6 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer ${tx.status === "split" ? "hover:bg-primary/[0.02]" : ""}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === "credit" ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                      {tx.type === "credit" ? (
                        <TrendingUp className={`w-5 h-5 text-green-500`} />
                      ) : (
                        <TrendingDown className={`w-5 h-5 text-red-500`} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {tx.description}
                      </h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{tx.fromEntity}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{tx.referenceId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                     <div className="text-right">
                        <span className={`text-sm font-black tabular-nums ${
                          tx.type === "credit" ? "text-green-500" : "text-red-500"
                        }`}>
                          {tx.type === "credit" ? "+" : "-"}{tx.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {formatDistanceToNow(new Date(tx.transactedAt), { addSuffix: true })}
                        </span>
                     </div>
                     {tx.status === "split" && (
                       <div className="w-5 h-5 text-muted-foreground">
                         {expandedId === tx.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                       </div>
                     )}
                     {tx.status === "pending" && (
                       <div className="w-5 h-5 animate-spin">
                         <RotateCcw className="w-4 h-4 text-amber-500" />
                       </div>
                     )}
                  </div>
                </div>

                {/* Expanded Split View */}
                {expandedId === tx.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-primary/[0.03] border-y border-primary/10"
                  >
                    <div className="p-8 grid grid-cols-4 gap-8">
                      <div className="space-y-1 border-l-2 border-primary/20 pl-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">AFE Split Logic</span>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-bold">Auto Executed</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Tax Reserved</span>
                        <span className="text-sm font-bold text-red-500">-{formatINR(tx.splitTaxAmount || 0)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Collaborator</span>
                        <span className="text-sm font-bold text-amber-500">-{formatINR(tx.splitCollaboratorAmount || 0)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block text-primary">Your Take-home</span>
                        <span className="text-sm font-black text-green-500">+{formatINR(tx.splitOwnerAmount || 0)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Watermark */}
      <div className="fixed bottom-6 right-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30 select-none pointer-events-none flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border border-border/50">
        <ShieldCheck className="w-3 h-3" />
        Sandbox Environment
      </div>
    </div>
  );
}
