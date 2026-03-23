import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPaymentHistory } from "@/lib/actions";
import { PaymentsTable } from "@/components/dashboard/PaymentsTable";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const payments = await getPaymentHistory(0, 50);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Payment History
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          All processed payments and their splits
        </p>
      </div>
      <PaymentsTable payments={payments} />
    </div>
  );
}
