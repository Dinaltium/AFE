import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAuditLog } from "@/lib/actions";
import { AuditTimeline } from "@/components/dashboard/AuditTimeline";

export default async function AuditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const events = await getAuditLog();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete transparent record of all system decisions and events
        </p>
      </div>
      <AuditTimeline events={events} />
    </div>
  );
}
