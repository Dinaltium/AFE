"use client";

import { formatINR, routeDisplay } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type PaymentRow = {
  id: string;
  amount: number;
  source: string;
  taxAmount: number | null;
  collaboratorAmount: number | null;
  collaboratorSplits: any[] | null;
  ownerAmount: number | null;
  confidence: number | null;
  routeAction: string | null;
  createdAt: string;
};

interface PaymentsTableProps {
  payments: PaymentRow[];
  loading?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (confidence === null) return <span className="text-muted-foreground">—</span>;
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 80
      ? "text-primary"
      : pct >= 60
      ? "text-amber-400"
      : "text-destructive";
  return <span className={`text-sm font-medium ${color}`}>{pct}%</span>;
}

export function PaymentsTable({ payments, loading = false }: PaymentsTableProps) {
  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground text-sm">
            No payments yet. Process a payment from the Dashboard to see it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="pl-6 text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Source</TableHead>
              <TableHead className="text-muted-foreground">Amount</TableHead>
              <TableHead className="text-muted-foreground">Tax</TableHead>
              <TableHead className="text-muted-foreground">
                Collaborator
              </TableHead>
              <TableHead className="text-muted-foreground">Take-home</TableHead>
              <TableHead className="text-muted-foreground">Route</TableHead>
              <TableHead className="pr-6 text-muted-foreground">
                Confidence
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => {
              const { label, color } = routeDisplay(p.routeAction ?? "");
              const splits = (p.collaboratorSplits as any[]) || [];
              return (
                <TableRow key={p.id} className="border-border">
                  <TableCell className="pl-6 text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(p.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground max-w-[180px]">
                    <span className="truncate block">{p.source}</span>
                  </TableCell>
                  <TableCell className="text-foreground font-medium">
                    {formatINR(p.amount)}
                  </TableCell>
                  <TableCell className="text-destructive">
                    <div className="flex flex-col">
                      <span>{formatINR(p.taxAmount ?? 0)}</span>
                      {p.amount > 0 && (
                        <span className="text-[10px] opacity-70">
                          {Math.round(((p.taxAmount ?? 0) / p.amount) * 100)}%
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-blue-400">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium text-foreground">{formatINR(p.collaboratorAmount ?? 0)}</span>
                                    <div className="flex flex-wrap gap-1">
                                      {splits.map((s: any, idx: number) => (
                                        <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 whitespace-nowrap">
                                          {s.name}: {formatINR(s.amount)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                  </TableCell>
                  <TableCell className="text-primary font-medium">
                    {formatINR(p.ownerAmount ?? 0)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${color}`}>{label}</Badge>
                  </TableCell>
                  <TableCell className="pr-6">
                    <ConfidenceBadge confidence={p.confidence} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Refreshed
