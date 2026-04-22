import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAuditLog, getPaymentHistory } from "@/lib/actions";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

async function DashboardContent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [paymentHistory, auditLog] = await Promise.all([
    getPaymentHistory(),
    getAuditLog(),
  ]);

  return (
    <DashboardOverview
      payments={paymentHistory}
      initialAuditLog={auditLog}
      userType={session.user.userType ?? "freelancer"}
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
