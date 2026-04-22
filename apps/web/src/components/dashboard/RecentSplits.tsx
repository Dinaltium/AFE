"use client";

import { formatINR, routeDisplay } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { SplitResponse } from "@/types";

interface RecentSplitsProps {
  payments: SplitResponse[];
}

export function RecentSplits({ payments }: RecentSplitsProps) {
  if (payments.length === 0) return null;

  return (
    <div className="card space-y-1">
      <h2 className="font-medium text-gray-900 mb-3">Recent splits</h2>
      {payments.slice(0, 6).map((p) => {
        const { label, color } = routeDisplay(p.route.action);
        return (
          <div
            key={p.payment_id}
            className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0"
          >
            <div className="min-w-0 mr-4">
              <p className="text-sm font-medium text-gray-900 truncate">{p.source}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.architect_reasoning}</p>
              <div className="flex gap-3 mt-1.5 text-xs">
                <span className="text-red-600">Tax {formatINR(p.split.tax_amount)}</span>
                <span className="text-blue-600">Collab {formatINR(p.split.collaborator_amount)}</span>
                <span className="text-green-700">You {formatINR(p.split.owner_amount)}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-gray-900">{formatINR(p.amount)}</p>
              <Badge className={`mt-1 ${color}`}>{label}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Refreshed
