import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConnectorAccounts } from "@/lib/actions";
import { ConnectorsClient } from "@/components/connectors/ConnectorsClient";

export const metadata = { title: "Connectors" };

export default async function ConnectorsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const connectors = await getConnectorAccounts();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Connectors</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your accounts to let AFE automatically detect payments and
          vet deals
        </p>
      </div>
      <ConnectorsClient
        connectors={connectors as any}
        userId={session.user.id}
      />
    </div>
  );
}
