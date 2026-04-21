"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/utils";
import { FileText, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GSTReconciliationProps {
  payments: any[];
}

export function GSTReconciliation({ payments }: GSTReconciliationProps) {
  const gstPayments = payments.filter((p) => p.gstApplicable);
  const totalGst = gstPayments.reduce((s, p) => s + Number(p.gstAmount || 0), 0);
  const totalTds = gstPayments.reduce((s, p) => s + Number(p.tdsDeducted || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total GST Payable (Q3)</p>
              <p className="text-2xl font-bold text-foreground">{formatINR(totalGst)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">TDS Credit Balance</p>
              <p className="text-2xl font-bold text-blue-400">{formatINR(totalTds)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Reconciliation Table
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export for CA
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="pl-6">Invoice #</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Base Amount</TableHead>
                <TableHead>GST (18%)</TableHead>
                <TableHead className="pr-6">TDS (10%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gstPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No GST payments logged for reconciliation.
                  </TableCell>
                </TableRow>
              ) : (
                gstPayments.map((p) => (
                  <TableRow key={p.id} className="border-border">
                    <TableCell className="pl-6 font-mono text-xs">
                      {p.invoiceNumber || "PROV-"+p.id.slice(0,5)}
                    </TableCell>
                    <TableCell className="font-medium">{p.source}</TableCell>
                    <TableCell>{formatINR(p.amount)}</TableCell>
                    <TableCell className="text-primary">{formatINR(p.gstAmount || 0)}</TableCell>
                    <TableCell className="pr-6 text-blue-400">{formatINR(p.tdsDeducted || 0)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
