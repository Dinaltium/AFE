import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAuditLog, getPaymentHistory, getSimulationSettings } from "@/lib/actions";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

async function DashboardContent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [paymentHistory, auditLog, simSettings] = await Promise.all([
    getPaymentHistory(),
    getAuditLog(),
    getSimulationSettings(),
  ]);

  return (
    <DashboardOverview
      payments={paymentHistory}
      initialAuditLog={auditLog}
      userType={session.user.userType ?? "freelancer"}
      simulationEnabled={simSettings?.simulationEnabled ?? false}
      minIntervalSeconds={simSettings?.minIntervalSeconds ?? 5}
      maxIntervalSeconds={simSettings?.maxIntervalSeconds ?? 180}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
