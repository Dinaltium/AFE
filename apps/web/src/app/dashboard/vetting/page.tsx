import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserProfile, getVettingRequests } from "@/lib/actions";
import { VettingPageClient } from "@/components/dashboard/VettingPageClient";
import type { UserProfile, UserType } from "@/types";

export default async function VettingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [profile, vettingRequests] = await Promise.all([
    getUserProfile(),
    getVettingRequests(),
  ]);

  // Build a UserProfile from DB profile + session data
  const userProfile: UserProfile = {
    id: session.user.id,
    name: session.user.name ?? "",
    user_type: (session.user.userType ?? "freelancer") as UserType,
    annual_income_estimate: profile?.annualIncomeEstimate
      ? Number(profile.annualIncomeEstimate)
      : 0,
    tax_rate: profile?.taxRate ? Number(profile.taxRate) : 0.2,
    collaborator_rate: profile?.collaboratorRate
      ? Number(profile.collaboratorRate)
      : 0.1,
    collaborator_name: profile?.collaboratorName ?? "Collaborator",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Deal Vetting</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered deal analysis — check if an offer is fair before you accept
        </p>
      </div>
      <VettingPageClient 
        activeUser={userProfile} 
        initialRequests={vettingRequests as any[]} 
      />
    </div>
  );
}
