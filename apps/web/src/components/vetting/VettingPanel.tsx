"use client";

import { useState } from "react";
import { formatINR, scoreColor } from "@/lib/utils";
import { useVetting } from "@/hooks/useVetting";
import type { UserProfile, DealVetResponse } from "@/types";

interface VettingPanelProps {
  activeUser: UserProfile;
  onVetComplete?: (result: DealVetResponse) => void;
}

export function VettingPanel({ activeUser, onVetComplete }: VettingPanelProps) {
  const { vet, result, isVetting } = useVetting();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  async function handleVet() {
    if (!description || !amount) return;
    const res = await vet(description, parseFloat(amount), activeUser.id, activeUser.user_type);
    if (res && onVetComplete) onVetComplete(res);
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-medium text-gray-900">Deal vetting agent</h2>

      <textarea
        className="input h-24 resize-none"
        placeholder="Paste deal details e.g. Brand wants 2 Instagram reels + 1 YouTube integration, 30-day exclusivity..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex gap-2">
        <input
          className="input"
          placeholder="Offered amount ₹"
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          type="button"
          className="btn-primary whitespace-nowrap"
          disabled={!description || !amount || isVetting}
          onClick={handleVet}
        >
          {isVetting ? "Analysing…" : "Vet deal →"}
        </button>
      </div>

      {result && (
        <div className="rounded-lg border border-gray-200 p-4 space-y-3 bg-gray-50">
          <div className="flex items-center gap-4">
            <span className={`text-4xl font-bold ${scoreColor(result.score)}`}>
              {result.score}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 capitalize">{result.verdict}</p>
              <p className="text-xs text-gray-500">
                Market range: {formatINR(result.market_low)} – {formatINR(result.market_high)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700">{result.reasoning}</p>
          <p className="text-sm font-medium text-brand-600">{result.recommendation}</p>
        </div>
      )}
    </div>
  );
}
