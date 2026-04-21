"use client";

import { useEffect } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { formatINR, routeDisplay } from "@/lib/utils";
import { GlassBoxFeed } from "@/components/glass-box/GlassBoxFeed";
import { SimulationBanner } from "@/components/dashboard/SimulationBanner";
import { PendingPaymentStack } from "@/components/dashboard/PendingPaymentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GSTReconciliation } from "@/components/dashboard/GSTReconciliation";
import { useAFEStore } from "@/lib/store";
import { useSimulation } from "@/hooks/useSimulation";
import type { AuditEventRead } from "@/types";
import { TrendingUp, Wallet, Users, Banknote, Play } from "lucide-react";

type PaymentRow = {
  id: string;
  amount: number;
  source: string;
  taxAmount: number | null;
  collaboratorAmount: number | null;
  ownerAmount: number | null;
  confidence: number | null;
  routeAction: string | null;
  createdAt: string;
};

interface DashboardOverviewProps {
  payments: PaymentRow[];
  initialAuditLog: AuditEventRead[];
  userType: string;
  simulationEnabled: boolean;
  minIntervalSeconds: number;
  maxIntervalSeconds: number;
  loading?: boolean;
}

export function DashboardOverview({
  payments,
  initialAuditLog,
  userType,
  simulationEnabled,
  minIntervalSeconds,
  maxIntervalSeconds,
  loading = false,
}: DashboardOverviewProps) {
  const { auditLog, setAuditLog } = useAFEStore();

  // Seed store with server-fetched audit log on mount
  useEffect(() => {
    if (initialAuditLog.length > 0) {
      setAuditLog(initialAuditLog);
    }
  }, [initialAuditLog, setAuditLog]);

  const simulation = useSimulation({
    userType,
    minIntervalSeconds,
    maxIntervalSeconds,
    enabled: simulationEnabled,
    autoStart: simulationEnabled,
  });

  const totalProcessed = payments.reduce((s, p) => s + p.amount, 0);
  const totalTax = payments.reduce((s, p) => s + (p.taxAmount ?? 0), 0);
  const totalCollaborator = payments.reduce(
    (s, p) => s + (p.collaboratorAmount ?? 0),
    0
  );
  const totalOwner = payments.reduce((s, p) => s + (p.ownerAmount ?? 0), 0);

  const chartData = payments
    .slice(0, 6)
    .reverse()
    .map((p) => ({
      name:
        p.source.length > 18 ? `${p.source.slice(0, 18)}\u2026` : p.source,
      Tax: Math.round(p.taxAmount ?? 0),
      Collaborator: Math.round(p.collaboratorAmount ?? 0),
      "Take-home": Math.round(p.ownerAmount ?? 0),
    }));

  const stats = [
    {
      label: "Total Processed",
      value: formatINR(totalProcessed),
      icon: TrendingUp,
      color: "text-foreground",
    },
    {
      label: "Tax Reserved",
      value: formatINR(totalTax),
      icon: Banknote,
      color: "text-destructive",
    },
    {
      label: "Collaborator Paid",
      value: formatINR(totalCollaborator),
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Take-home",
      value: formatINR(totalOwner),
      icon: Wallet,
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-0">
      {/* Simulation banner — shown when running */}
      {simulation.isRunning && (
        <SimulationBanner
          nextPaymentIn={simulation.nextPaymentIn}
          processingCount={simulation.processingCount}
          onPause={simulation.pause}
          onStop={simulation.stop}
        />
      )}

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Tabs defaultValue="overview" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="gst">GST Reconciliation</TabsTrigger>
              </TabsList>

              {simulationEnabled && !simulation.isRunning && (
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                  onClick={simulation.start}
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Simulation
                </Button>
              )}
            </div>

            <TabsContent value="overview" className="space-y-6 mt-0">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    {loading ? (
                      <Skeleton className="h-7 w-24 mt-1" />
                    ) : (
                      <p className={`text-lg font-semibold ${color}`}>{value}</p>
                    )}
                  </div>
                  <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left + Centre column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Income chart */}
            {payments.length === 0 && (
              <Card className="bg-card border-border border-dashed">
                <CardContent className="p-12 flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">No payments yet</p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Process your first payment to see your income breakdown, tax split, 
                      and Glass Box audit trail.
                    </p>
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground">
                    Process a payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {chartData.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Income Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                      />
                      <YAxis
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        tickFormatter={(v: number) =>
                          `\u20b9${(v / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                          fontSize: 12,
                        }}
                        formatter={(value: number) =>
                          new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          }).format(value)
                        }
                      />
                      <Legend
                        wrapperStyle={{
                          fontSize: 11,
                          color: "hsl(var(--muted-foreground))",
                        }}
                      />
                      <Bar dataKey="Tax" stackId="a" fill="#FF4C4C" opacity={0.8} />
                      <Bar
                        dataKey="Collaborator"
                        stackId="a"
                        fill="#38BDF8"
                        opacity={0.8}
                      />
                      <Bar
                        dataKey="Take-home"
                        stackId="a"
                        fill="#00FF9C"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {!simulationEnabled && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Simulation Disabled
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Enable payment simulation in Settings to see automated
                    payments flow through AFE.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent splits */}
            {payments.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Recent Splits
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="pl-6 text-muted-foreground">
                          Source
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Amount
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Tax
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Take-home
                        </TableHead>
                        <TableHead className="pr-6 text-muted-foreground">
                          Route
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.slice(0, 6).map((p) => {
                        const { label, color } = routeDisplay(
                          p.routeAction ?? ""
                        );
                        return (
                          <TableRow key={p.id} className="border-border">
                            <TableCell className="pl-6 font-medium text-foreground">
                              <span className="max-w-[160px] truncate block">
                                {p.source}
                              </span>
                            </TableCell>
                            <TableCell className="text-foreground">
                              {formatINR(p.amount)}
                            </TableCell>
                            <TableCell className="text-destructive">
                              {formatINR(p.taxAmount ?? 0)}
                            </TableCell>
                            <TableCell className="text-primary">
                              {formatINR(p.ownerAmount ?? 0)}
                            </TableCell>
                            <TableCell className="pr-6">
                              <Badge className={`text-xs ${color}`}>
                                {label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

            </div>

            {/* Right — Glass Box feed */}
            <div className="lg:col-span-1">
              <Card className="bg-card border-border min-h-[480px] flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col">
                  <GlassBoxFeed events={auditLog} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gst">
          <GSTReconciliation payments={payments} />
        </TabsContent>
      </Tabs>
    </div>

      {/* Pending payment notification stack — fixed bottom-right */}
      <PendingPaymentStack
        payments={simulation.pendingPayments}
        onAccept={simulation.acceptPayment}
        onReject={simulation.rejectPayment}
      />
    </div>
  );
}
