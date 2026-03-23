import { create } from "zustand";
import type { AuditEventRead, SplitResponse } from "@/types";

interface AFEStore {
  activeUserId: string;
  setActiveUser: (id: string) => void;

  payments: SplitResponse[];
  addPayment: (p: SplitResponse) => void;

  auditLog: AuditEventRead[];
  setAuditLog: (log: AuditEventRead[]) => void;

  isSplitting: boolean;
  setIsSplitting: (v: boolean) => void;

  isVetting: boolean;
  setIsVetting: (v: boolean) => void;
}

export const useAFEStore = create<AFEStore>((set) => ({
  activeUserId: "aarav",
  setActiveUser: (id) => set({ activeUserId: id }),

  payments: [],
  addPayment: (p) => set((s) => ({ payments: [p, ...s.payments] })),

  auditLog: [],
  setAuditLog: (log) => set({ auditLog: log }),

  isSplitting: false,
  setIsSplitting: (v) => set({ isSplitting: v }),

  isVetting: false,
  setIsVetting: (v) => set({ isVetting: v }),
}));
