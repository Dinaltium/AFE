"use client";

import { useEffect, useState } from "react";
import { useAFEStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import { Header } from "@/components/dashboard/Header";
import { PaymentPanel } from "@/components/dashboard/PaymentPanel";
import { RecentSplits } from "@/components/dashboard/RecentSplits";
import { IncomeChart } from "@/components/dashboard/IncomeChart";
import { VettingPanel } from "@/components/vetting/VettingPanel";
import { GlassBoxFeed } from "@/components/glass-box/GlassBoxFeed";
import { StatCard } from "@/components/ui/StatCard";
import type { AuditEventRead, UserProfile } from "@/types";

interface DashboardClientProps {
  users: UserProfile[];
  initialAuditLog: AuditEventRead[];
}

export function DashboardClient({ users, initialAuditLog }: DashboardClientProps) {
  const { activeUserId, setActiveUser, payments, auditLog, setAuditLog } = useAFEStore();
  const [tab, setTab] = useState<"split" | "vet">("split");

  // Seed audit log once on mount
  useEffect(() => {
    if (initialAuditLog.length > 0) setAuditLog(initialAuditLog);
  }, [initialAuditLog, setAuditLog]);

  const activeUser = users.find((u) => u.id === activeUserId) ?? users[0];
  const userPayments = payments.filter((p) => p.user_id === activeUserId);

  const totalProcessed = userPayments.reduce((s, p) => s + p.amount, 0);
  const totalTax = userPayments.reduce((s, p) => s + p.split.tax_amount, 0);
  const totalCollaborator = userPayments.reduce((s, p) => s + p.split.collaborator_amount, 0);
  const totalOwner = userPayments.reduce((s, p) => s + p.split.owner_amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        users={users}
        activeUserId={activeUserId}
        onUserChange={setActiveUser}
      />

      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">
        {/* ── Left + centre ─────────────────────────────────────────────── */}
        <div className="col-span-2 space-y-6">

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total processed" value={formatINR(totalProcessed)} />
            <StatCard label="Tax reserved" value={formatINR(totalTax)} valueClassName="text-red-600" />
            <StatCard label="Collaborator paid" value={formatINR(totalCollaborator)} valueClassName="text-blue-600" />
            <StatCard label="Take-home" value={formatINR(totalOwner)} valueClassName="text-green-700" />
          </div>

          {/* Chart — only shows once there's data */}
          {userPayments.length > 0 && <IncomeChart payments={userPayments} />}

          {/* Tab switcher */}
          <div className="card space-y-5">
            <div className="flex gap-1 border-b border-gray-100 pb-3">
              {(["split", "vet"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={[
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    tab === t ? "bg-brand-600 text-white" : "text-gray-500 hover:text-gray-700",
                  ].join(" ")}
                >
                  {t === "split" ? "💸 Process payment" : "🔍 Vet a deal"}
                </button>
              ))}
            </div>

            {tab === "split" && <PaymentPanel activeUserId={activeUserId} />}
            {tab === "vet" && activeUser && <VettingPanel activeUser={activeUser} />}
          </div>

          {/* Recent splits */}
          <RecentSplits payments={userPayments} />
        </div>

        {/* ── Right — Glass Box ─────────────────────────────────────────── */}
        <div className="col-span-1 min-h-[600px]">
          <GlassBoxFeed events={auditLog} />
        </div>
      </main>
    </div>
  );
}
