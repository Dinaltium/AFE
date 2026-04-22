import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInboxEmails } from "@/lib/actions";
import { InboxClient } from "@/components/connectors/InboxClient";

export const metadata = { title: "InboxAI Sandbox" };

export default async function InboxAIPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  
  const emails = await getInboxEmails();
  
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      <InboxClient 
        initialEmails={emails as any} 
        userId={session.user.id} 
      />
    </div>
  );
}
