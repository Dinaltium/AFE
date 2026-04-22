import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBankAccount, getBankTransactions } from "@/lib/actions";
import { BankClient } from "@/components/connectors/BankClient";

export const metadata = { title: "PaySim Bank Sandbox" };

export default async function PaySimPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const account = await getBankAccount();
  const transactions = await getBankTransactions();

  return (
    <div className="min-h-screen bg-background">
      <BankClient 
        initialAccount={account as any}
        initialTransactions={transactions as any}
        userId={session.user.id}
      />
    </div>
  );
}
