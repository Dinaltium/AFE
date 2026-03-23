"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils";
import { DEMO_PAYMENTS } from "@/lib/constants";
import { usePayment } from "@/hooks/usePayment";

interface PaymentPanelProps {
  activeUserId: string;
}

export function PaymentPanel({ activeUserId }: PaymentPanelProps) {
  const { split, isSplitting } = usePayment();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");

  async function handleCustomSplit() {
    if (!amount || !source) return;
    await split(parseFloat(amount), source, activeUserId);
    setAmount("");
    setSource("");
  }

  return (
    <div className="card space-y-5">
      <h2 className="font-medium text-gray-900">Process payment</h2>

      {/* Demo payments */}
      <div>
        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
          Quick demo
        </p>
        <div className="space-y-2">
          {DEMO_PAYMENTS[activeUserId]?.map((p) => (
            <button
              key={p.source}
              type="button"
              onClick={() => split(p.amount, p.source, activeUserId)}
              disabled={isSplitting}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200
                         hover:border-brand-400 hover:bg-brand-50 transition-colors text-left disabled:opacity-50"
            >
              <span className="text-sm text-gray-700">{p.source}</span>
              <span className="text-sm font-semibold text-brand-600">{formatINR(p.amount)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom payment */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Custom</p>
        <input
          className="input"
          placeholder="Payment source e.g. Client invoice #42"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Amount ₹"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary whitespace-nowrap"
            disabled={!amount || !source || isSplitting}
            onClick={handleCustomSplit}
          >
            {isSplitting ? "Processing…" : "Split →"}
          </button>
        </div>
      </div>
    </div>
  );
}
