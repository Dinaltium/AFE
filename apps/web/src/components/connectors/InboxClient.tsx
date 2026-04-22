"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Inbox, 
  CheckCircle2, 
  Target, 
  AlertCircle, 
  Mail, 
  Trash2, 
  MoreVertical, 
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
  ChevronRight,
  User,
  ShieldCheck,
  Flag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  saveInboxEmail, 
  updateEmailStatus, 
  updateEmailClassification,
  processPayment 
} from "@/lib/actions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Email {
  id: string;
  fromName: string | null;
  fromEmail: string;
  subject: string;
  bodyPreview: string | null;
  bodyFull: string | null;
  status: string;
  emailCategory: string | null;
  afeAction: string | null;
  classifierReasoning: string | null;
  extractedAmount: string | null;
  extractedSource: string | null;
  receivedAt: Date;
}

interface InboxClientProps {
  initialEmails: Email[];
  userId: string;
}

export function InboxClient({ initialEmails, userId }: InboxClientProps) {
  const router = useRouter();
  const [emails, setEmails] = useState<Email[]>(initialEmails);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [intervalTime, setIntervalTime] = useState(30);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-generator logic
  useEffect(() => {
    if (autoGenerate) {
      timerRef.current = setInterval(() => {
        generateAndProcessEmail();
      }, intervalTime * 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoGenerate, intervalTime]);

  // Keep state in sync with server updates (e.g. after router.refresh)
  useEffect(() => {
    setEmails(initialEmails);
  }, [initialEmails]);

  const generateAndProcessEmail = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      // 1. Call engine to generate
      const res = await fetch("/api/proxy/connectors/generate-email", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const generated = await res.json();

      // 2. Save to DB as unread
      const saved = await saveInboxEmail({
        connectorType: "inboxai",
        fromName: generated.from_name,
        fromEmail: generated.from_email,
        subject: generated.subject,
        bodyPreview: generated.body.slice(0, 120),
        bodyFull: generated.body,
        status: "unread",
      });

      const newEmail: Email = {
        ...saved,
        receivedAt: new Date(saved.receivedAt),
      } as any;

      // 3. Add to local state
      setEmails((prev) => [newEmail, ...prev]);

      // 4. Classify (AI or Fast-path)
      await new Promise((r) => setTimeout(r, 1500));
      setEmails((prev) => 
        prev.map((e) => (e.id === saved.id ? { ...e, status: "processing" } : e))
      );

      let classification: any;
      
      const gateways = ["razorpay", "paytm", "phonepe", "gpay", "googlepay", "stripe", "paypal"];
      const isTrusted = gateways.some(g => 
        generated.from_email.toLowerCase().includes(g) || 
        generated.subject.toLowerCase().includes(g)
      );

      if (isTrusted) {
        console.log("FRONTEND FAST-PATH: Trusted Gateway detected, bypassing AI filter.");
        classification = {
          category: "payment",
          extracted_amount: generated.suggested_amount || 0,
          extracted_source: "Trusted Gateway",
          confidence: 1.0,
          reasoning: "FRONTEND FORCED ACCEPT: Trusted Gateway match. Zero-latency processing.",
          recommended_action: "split"
        };
      } else {
        const classRes = await fetch("/api/proxy/connectors/classify-email-v2", {
          method: "POST",
          body: JSON.stringify({
            email_id: saved.id,
            from_email: generated.from_email,
            subject: generated.subject,
            body: generated.body,
          }),
        });
        console.log("Classification request sent:", { from: generated.from_email, subject: generated.subject });
        if (!classRes.ok) throw new Error("Classification failed");
        classification = await classRes.json();
      }

      // Persist classification results to DB
      await updateEmailClassification(saved.id, {
        category: classification.category,
        reasoning: classification.reasoning,
        confidence: classification.confidence,
        action: classification.recommended_action,
        amount: classification.extracted_amount,
        source: classification.extracted_source
      });

      // 5. Route based on classification
      let finalStatus = "ignored";
      let afeAction = "ignore";
      let afeActionId: string | undefined;

      if (classification.recommended_action === "split" && classification.extracted_amount) {
        const result = await processPayment({
          amount: classification.extracted_amount,
          source: classification.extracted_source ?? generated.subject,
          user_id: userId,
        });
        afeAction = "split";
        afeActionId = result.payment_id;
        finalStatus = "processed";
        toast.success(`Payment split: ₹${classification.extracted_amount.toLocaleString()}`);
        router.refresh();
      } else if (classification.recommended_action === "vet") {
        afeAction = "vet";
        finalStatus = "flagged";
        toast.info(`Deal flagged for review from ${generated.from_name}`);
        router.refresh();
      } else {
        finalStatus = "ignored";
        if (classification.category === "spam") {
          toast.warning("Spam email filtered", {
            description: classification.reasoning
          });
        } else {
          toast.info("Email ignored", {
            description: classification.reasoning
          });
        }
      }

      // 6. Update DB and local state
      await updateEmailStatus(saved.id, finalStatus, afeAction, afeActionId);
      setEmails((prev) =>
        prev.map((e) =>
          e.id === saved.id
            ? { 
                ...e, 
                status: finalStatus, 
                afeAction, 
                classifierReasoning: classification.reasoning,
                emailCategory: classification.category,
                extractedAmount: classification.extracted_amount ? String(classification.extracted_amount) : null,
                extractedSource: classification.extracted_source
              }
            : e
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Simulation error");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredEmails = emails.filter((e) => {
    if (activeFolder === "inbox") {
      // Primary view includes everything relevant to the main flow
      return e.status === "unread" || e.status === "processing" || e.status === "processed" || e.status === "flagged";
    }
    if (activeFolder === "processed") return e.status === "processed";
    if (activeFolder === "deals") return e.emailCategory === "deal" || e.afeAction === "vet";
    if (activeFolder === "spam") return e.status === "ignored" || e.emailCategory === "spam";
    return true;
  });

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
            <Inbox className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">InboxAI</span>
          <Badge variant="outline" className="ml-auto text-[10px] bg-violet-500/10 text-violet-500 border-violet-500/20">
            Sandbox
          </Badge>
        </div>

        <div className="flex-1 space-y-1 px-3">
          {[
            { id: "inbox", label: "Inbox", icon: Inbox },
            { id: "processed", label: "Processed", icon: CheckCircle2 },
            { id: "deals", label: "Deals", icon: Target },
            { id: "spam", label: "Spam", icon: Trash2 },
            { id: "all", label: "All Mail", icon: Mail },
          ].map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeFolder === folder.id 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <folder.icon className="w-4 h-4" />
              {folder.label}
              {folder.id === "inbox" && emails.filter(e => e.status === "unread").length > 0 && (
                <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[20px]">
                  {emails.filter(e => e.status === "unread").length}
                </span>
              )}
            </button>
          ))}

          <div className="pt-8 pb-4">
            <Separator className="bg-border/50" />
            <div className="mt-6 flex items-center gap-2 px-3 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">AI Generator</span>
            </div>
            
            <div className="px-3 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${autoGenerate ? "bg-green-500 animate-pulse" : "bg-muted"}`} />
                  <span className="text-xs font-medium">Auto-generate</span>
                </div>
                <Switch 
                  checked={autoGenerate} 
                  onCheckedChange={setAutoGenerate} 
                  className="scale-75"
                />
              </div>

              {autoGenerate && (
                <div className="space-y-2">
                  <span className="text-[10px] text-muted-foreground">Interval</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[10, 30, 60].map((t) => (
                      <button
                        key={t}
                        onClick={() => setIntervalTime(t)}
                        className={`text-[10px] py-1 rounded border transition-all ${
                          intervalTime === t 
                            ? "bg-violet-500 border-violet-500 text-white" 
                            : "bg-transparent border-border text-muted-foreground hover:border-muted-foreground"
                        }`}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={generateAndProcessEmail} 
                disabled={isGenerating}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs h-8"
              >
                {isGenerating ? (
                   <RotateCcw className="w-3 h-3 animate-spin mr-2" />
                ) : (
                  <Zap className="w-3 h-3 mr-2" />
                )}
                Generate Email
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="w-96 border-r border-border bg-background flex flex-col overflow-hidden">
        <div className="h-14 border-b border-border flex items-center px-4 justify-between bg-card/30">
          <span className="font-medium text-sm">Inbox</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/50">
            <AnimatePresence initial={false}>
              {filteredEmails.map((email) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 cursor-pointer hover:bg-muted/30 transition-colors relative group ${
                    selectedEmail?.id === email.id ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {email.status === "unread" ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      ) : (
                        <div className="w-2.5 h-2.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-sm truncate ${email.status === "unread" ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                          {email.fromName || email.fromEmail.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 uppercase" suppressHydrationWarning>
                          {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: false })}
                        </span>
                      </div>
                      <h4 className={`text-[13px] truncate mb-0.5 ${email.status === "unread" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {email.subject}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate leading-relaxed">
                        {email.bodyPreview}
                      </p>
                      
                      <div className="mt-3 flex items-center gap-2">
                        {email.status === "processing" ? (
                          <Badge variant="outline" className="text-[9px] h-4 bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse">
                            Processing...
                          </Badge>
                        ) : email.status === "processed" ? (
                          <Badge variant="outline" className="text-[9px] h-4 bg-green-500/10 text-green-500 border-green-500/20">
                            Split ✓
                          </Badge>
                        ) : email.status === "flagged" ? (
                          <Badge variant="outline" className="text-[9px] h-4 bg-blue-500/10 text-blue-500 border-blue-500/20">
                            Vetted
                          </Badge>
                        ) : email.status === "ignored" ? (
                          <Badge variant="outline" className="text-[9px] h-4 bg-muted text-muted-foreground text-opacity-50">
                            Spam
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Email Detail */}
      <div className="flex-1 bg-background flex flex-col overflow-hidden">
        {selectedEmail ? (
          <>
            <div className="h-14 border-b border-border flex items-center px-6 justify-between shrink-0">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-8">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-semibold mb-8 tracking-tight">{selectedEmail.subject}</h1>
                
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{selectedEmail.fromName}</span>
                        <span className="text-xs text-muted-foreground">
                          &lt;{selectedEmail.fromEmail}&gt;
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(selectedEmail.receivedAt).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">to me</span>
                  </div>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none mb-12">
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {selectedEmail.bodyFull || selectedEmail.bodyPreview}
                  </p>
                </div>

                <Separator className="mb-8 bg-border/50" />

                {/* AFE Action Panel */}
                {selectedEmail.classifierReasoning && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <ShieldCheck className="w-24 h-24 text-primary" />
                    </div>

                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                       <span className="text-[11px] font-bold uppercase tracking-wider text-primary">AFE Intelligent Classification</span>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Category</span>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary text-primary-foreground">
                              {selectedEmail.emailCategory?.toUpperCase() || "PAYMENT"}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Confidence</span>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: '94%' }} />
                            </div>
                            <span className="text-xs font-black">94%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Reasoning</span>
                        <p className="text-xs text-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-3">
                          "{selectedEmail.classifierReasoning}"
                        </p>
                      </div>
                    </div>

                    {selectedEmail.afeAction === "split" && selectedEmail.extractedAmount && (
                      <div className="mt-8 pt-8 border-t border-primary/10">
                        <div className="flex items-center justify-between mb-6">
                           <div>
                             <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Execution Action</span>
                             <span className="text-sm font-bold flex items-center gap-2 text-green-500">
                               <CheckCircle2 className="w-4 h-4" />
                               Automatic Split Executed
                             </span>
                           </div>
                           <div className="text-right">
                             <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Total Amount</span>
                             <span className="text-xl font-black tabular-nums">₹{Number(selectedEmail.extractedAmount).toLocaleString()}</span>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                             <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Tax (20%)</span>
                             <span className="text-sm font-semibold tabular-nums text-red-400">
                               -₹{(Number(selectedEmail.extractedAmount) * 0.2).toLocaleString()}
                             </span>
                          </div>
                          <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                             <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Collab (10%)</span>
                             <span className="text-sm font-semibold tabular-nums text-amber-400">
                               -₹{(Number(selectedEmail.extractedAmount) * 0.1).toLocaleString()}
                             </span>
                          </div>
                          <div className="bg-card/30 p-3 rounded-lg border border-primary/20">
                             <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Your Split</span>
                             <span className="text-sm font-black tabular-nums text-green-400">
                               +₹{(Number(selectedEmail.extractedAmount) * 0.7).toLocaleString()}
                             </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedEmail.afeAction === "vet" && (
                       <div className="mt-8 pt-8 border-t border-primary/10 flex items-center justify-between">
                         <div>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Execution Action</span>
                            <span className="text-sm font-bold flex items-center gap-2 text-blue-500">
                              <Target className="w-4 h-4" />
                              Deal Vetted & Flagged
                            </span>
                         </div>
                         <Button variant="outline" size="sm" className="gap-2 border-primary/30 hover:bg-primary/10">
                           View Vetting Result
                           <ChevronRight className="w-3 h-3" />
                         </Button>
                       </div>
                    )}
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-30 select-none">
            <Mail className="w-16 h-16 mb-4 stroke-[1px]" />
            <p className="text-sm font-medium">Select an email to view</p>
          </div>
        )}
      </div>

      {/* Watermark */}
      <div className="fixed bottom-6 right-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30 select-none pointer-events-none flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border border-border/50">
        <ShieldCheck className="w-3 h-3" />
        Sandbox Environment
      </div>
    </div>
  );
}
