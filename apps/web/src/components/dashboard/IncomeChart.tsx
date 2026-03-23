"use client";

import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SplitResponse } from "@/types";

interface IncomeChartProps {
  payments: SplitResponse[];
}

export function IncomeChart({ payments }: IncomeChartProps) {
  const data = payments
    .slice(0, 6)
    .reverse()
    .map((p) => ({
      name: p.source.length > 18 ? `${p.source.slice(0, 18)}…` : p.source,
      Tax: Math.round(p.split.tax_amount),
      Collaborator: Math.round(p.split.collaborator_amount),
      "Take-home": Math.round(p.split.owner_amount),
    }));

  return (
    <div className="card">
      <h2 className="font-medium text-gray-900 mb-4">Income breakdown</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(value)
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Tax" stackId="a" fill="#FCA5A5" />
          <Bar dataKey="Collaborator" stackId="a" fill="#93C5FD" />
          <Bar dataKey="Take-home" stackId="a" fill="#6EE7B7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
