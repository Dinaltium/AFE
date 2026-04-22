import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAuditLog, getPaymentHistory, seedHistoricalAuditLog } from "@/lib/actions";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { db } from "@/lib/db";

async function DashboardContent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Ensure Glass Box has data even for historical payments
  await seedHistoricalAuditLog();

  const [paymentHistory, auditLog, profile] = await Promise.all([
    getPaymentHistory(),
    getAuditLog(),
    db.query.userProfiles.findFirst({
      where: (up, { eq }) => eq(up.userId, session.user.id),
    }),
  ]);

  return (
    <DashboardOverview
      payments={paymentHistory}
      initialAuditLog={auditLog}
      userType={session.user.userType ?? "freelancer"}
      profile={profile}
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
