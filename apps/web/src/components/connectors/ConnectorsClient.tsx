"use client";

import { useTransition } from "react";
import { Mail, Inbox, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { upsertConnectorAccount } from "@/lib/actions";
import { toast } from "sonner";

interface ConnectorAccount {
  id: string;
  type: string;
  status: string;
  config: any;
}

interface ConnectorsClientProps {
  connectors: ConnectorAccount[];
  userId: string;
}

export function ConnectorsClient({ connectors, userId }: ConnectorsClientProps) {
  const [isPending, startTransition] = useTransition();

  const gmail = connectors.find((c) => c.type === "gmail");
  const isGmailConnected = gmail?.status === "connected";

  const handleConnectGmail = () => {
    startTransition(async () => {
      try {
        await upsertConnectorAccount({
          type: "gmail",
          status: "connected",
          config: { email: "demo@gmail.com" },
        });
        toast.success("Gmail connected successfully");
      } catch (err) {
        toast.error("Failed to connect Gmail");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Gmail Connector */}
      <Card className="flex flex-col h-full bg-card border-border shadow-none overflow-hidden group">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-red-500" />
            </div>
            {isGmailConnected ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground gap-1">
                <AlertCircle className="w-3 h-3" />
                Disconnected
              </Badge>
            )}
          </div>
          <CardTitle className="mt-4">Gmail</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Connect your Gmail to automatically detect payment confirmations and brand deal offers in your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between pt-0">
          <div className="space-y-4">
            <Button
              className="w-full"
              variant={isGmailConnected ? "outline" : "default"}
              onClick={isGmailConnected ? undefined : handleConnectGmail}
              disabled={isPending}
            >
              {isGmailConnected ? "Sync Now" : "Connect Gmail"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Reads financial emails only. AFE never stores full email content.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* InboxAI Sidebar Connector */}
      <Card className="flex flex-col h-full bg-card border-border shadow-none overflow-hidden group">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-violet-500" />
            </div>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/20">
              Sandbox
            </Badge>
          </div>
          <CardTitle className="mt-4">InboxAI Sandbox</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            AI-generated email simulation for testing AFE's email classification pipeline end-to-end.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between pt-0">
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground italic">
                Available via direct URL · Internal sandbox only
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Not for production use. Sandbox environment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PaySim Bank Connector */}
      <Card className="flex flex-col h-full bg-card border-border shadow-none overflow-hidden group">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-500" />
            </div>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/20">
              Sandbox
            </Badge>
          </div>
          <CardTitle className="mt-4">PaySim Sandbox</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Simulated bank account with AI-generated transactions for testing the full income split pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between pt-0">
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground italic">
                Available via direct URL · Internal sandbox only
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Not for production use. Sandbox environment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
