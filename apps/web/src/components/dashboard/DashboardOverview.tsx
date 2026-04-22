"use client";
// Refreshed dashboard overview

import { useEffect } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { formatINR, routeDisplay } from "@/lib/utils";
import { GlassBoxFeed } from "@/components/glass-box/GlassBoxFeed";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GSTReconciliation } from "@/components/dashboard/GSTReconciliation";
import { useAFEStore } from "@/lib/store";
import type { AuditEventRead } from "@/types";
import { TrendingUp, Wallet, Users, Banknote } from "lucide-react";

type PaymentRow = {
  id: string;
  amount: number;
  source: string;
  taxAmount: number | null;
  taxRate?: number | null;
  collaboratorAmount: number | null;
  collaboratorSplits: any[] | null;
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
  loading = false,
}: Omit<DashboardOverviewProps, "simulationEnabled" | "minIntervalSeconds" | "maxIntervalSeconds">) {
  const { auditLog, setAuditLog } = useAFEStore();

  // Seed store with server-fetched audit log on mount
  useEffect(() => {
    if (initialAuditLog.length > 0) {
      setAuditLog(initialAuditLog);
    }
  }, [initialAuditLog, setAuditLog]);

  const totalProcessed = payments.reduce((s, p) => s + p.amount, 0);
  const totalTax = payments.reduce((s, p) => s + (p.taxAmount ?? 0), 0);
  const totalOwner = payments.reduce((s, p) => s + (p.ownerAmount ?? 0), 0);

  const collaboratorTotals = payments.reduce((acc, p) => {
    const splits = (p.collaboratorSplits as any[]) || [];
    splits.forEach((s) => {
      acc[s.name] = (acc[s.name] || 0) + Number(s.amount);
    });
    return acc;
  }, {} as Record<string, number>);

  // Get all unique collaborator names for chart bars
  const collaboratorNames = Array.from(
    new Set(
      payments.flatMap((p) => (p.collaboratorSplits as any[] || []).map((s) => s.name))
    )
  );

  const chartData = payments
    .slice(0, 6)
    .reverse()
    .map((p) => {
      const d: any = {
        name: p.source.length > 18 ? `${p.source.slice(0, 18)}\u2026` : p.source,
        Tax: Math.round(p.taxAmount ?? 0),
        "Take-home": Math.round(p.ownerAmount ?? 0),
      };
      // Add individual collaborator amounts to the data object
      const splits = (p.collaboratorSplits as any[]) || [];
      splits.forEach((s) => {
        d[s.name] = Math.round(s.amount);
      });
      return d;
    });

  const stats = [
    {
      label: "Total Processed",
      value: formatINR(totalProcessed),
      icon: TrendingUp,
      color: "text-foreground",
      tooltip: "Gross revenue before any splits or taxes.",
    },
    {
      label: "Tax Reserved",
      value: formatINR(totalTax),
      icon: Banknote,
      color: "text-destructive",
      tooltip: "Estimated tax to be reserved based on your current income slab.",
    },
    {
      label: "Take-home",
      value: formatINR(totalOwner),
      icon: Wallet,
      color: "text-primary",
      tooltip: "Net amount remaining for you after all splits and tax reservations.",
    },
    ...Object.entries(collaboratorTotals).map(([name, total]) => ({
      label: `Paid: ${name}`,
      value: formatINR(total),
      icon: Users,
      color: "text-blue-500",
      tooltip: `Total amount distributed to ${name}.`,
    })),
  ];

  return (
    <div className="space-y-0">
      <div className="p-6 space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="gst">GST Reconciliation</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6 mt-0">

        {/* Stat cards */}
        <TooltipProvider>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, color, tooltip }) => (
              <Tooltip key={label}>
                <TooltipTrigger asChild>
                  <Card className="bg-card border-border cursor-help">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {label}
                          </p>
                          {loading ? (
                            <Skeleton className="h-7 w-24 mt-1" />
                          ) : (
                            <p className={`text-lg font-semibold ${color}`}>
                              {value}
                            </p>
                          )}
                        </div>
                        <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

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
                      <RechartsTooltip
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
                      <Bar
                        dataKey="Take-home"
                        stackId="a"
                        fill="hsl(var(--primary))"
                        radius={[0, 0, 0, 0]}
                      />
                      {collaboratorNames.map((name, i) => (
                        <Bar
                          key={name}
                          dataKey={name}
                          stackId="a"
                          fill={["#3b82f6", "#60a5fa", "#93c5fd", "#2563eb", "#1d4ed8"][i % 5]}
                          radius={[0, 0, 0, 0]}
                        />
                      ))}
                      <Bar
                        dataKey="Tax"
                        stackId="a"
                        fill="hsl(var(--destructive))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
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
                        <TableHead className="text-muted-foreground">
                          Collaborators
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
                        // @ts-ignore - dynamic column added via migration
                        const splits = p.collaboratorSplits as any[] | null;
                        
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
                              <div className="flex flex-col">
                                <span>{formatINR(p.taxAmount ?? 0)}</span>
                                {p.amount > 0 && (
                                  <span className="text-[10px] opacity-70">
                                    {Math.round(((p.taxAmount ?? 0) / p.amount) * 100)}% tax
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-primary font-medium">
                              {formatINR(p.ownerAmount ?? 0)}
                            </TableCell>
                             <TableCell className="text-sky-400">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium text-foreground">{formatINR(p.collaboratorAmount ?? 0)}</span>
                                    <div className="flex flex-wrap gap-1">
                                      {splits && splits.map((s, idx) => (
                                        <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 whitespace-nowrap">
                                          {s.name}: {formatINR(s.amount)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                             </TableCell>
                            <TableCell className="pr-6">
                              <Badge className={`text-[10px] py-0 h-5 ${color}`}>
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

    </div>
  );
}
