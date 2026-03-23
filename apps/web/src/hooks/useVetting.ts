"use client";

import { useState } from "react";
import { vetDeal } from "@/lib/actions";
import { useAFEStore } from "@/lib/store";
import type { DealVetResponse, UserType } from "@/types";

export function useVetting() {
  const { isVetting, setIsVetting } = useAFEStore();
  const [result, setResult] = useState<DealVetResponse | null>(null);

  async function vet(
    description: string,
    amount: number,
    userId: string,
    userType: UserType,
  ) {
    if (isVetting) return;
    setIsVetting(true);
    setResult(null);
    try {
      const data = await vetDeal({
        deal_description: description,
        offered_amount: amount,
        user_id: userId,
        user_type: userType,
      });
      setResult(data);
      return data;
    } catch (err) {
      console.error("Vetting failed:", err);
    } finally {
      setIsVetting(false);
    }
  }

  return { vet, result, isVetting };
}
