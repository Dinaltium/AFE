import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserProfile, getSimulationSettings, getApprovedClients } from "@/lib/actions";
import { SettingsClient } from "@/components/dashboard/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [profile, simSettings, approvedClients] = await Promise.all([
    getUserProfile(),
    getSimulationSettings(),
    getApprovedClients(),
  ]);

  return (
    <div className="p-6 w-full space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile, appearance, and account preferences
        </p>
      </div>
      <SettingsClient
        session={{
          id: session.user.id,
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          image: session.user.image ?? null,
          userType: session.user.userType,
          isAdmin: session.user.isAdmin,
        }}
        profile={
          profile
            ? {
                annualIncomeEstimate: profile.annualIncomeEstimate
                  ? String(profile.annualIncomeEstimate)
                  : "",
                taxRate: profile.taxRate ? String(profile.taxRate) : "0.20",
                collaboratorName: profile.collaboratorName ?? "Collaborator",
                collaboratorRate: profile.collaboratorRate
                  ? String(profile.collaboratorRate)
                  : "0.10",
                themeConfig: profile.themeConfig as Record<
                  string,
                  unknown
                > | null,
              }
            : null
        }
        simulationSettings={
          simSettings
            ? {
                simulationEnabled: simSettings.simulationEnabled,
                minIntervalSeconds: simSettings.minIntervalSeconds,
                maxIntervalSeconds: simSettings.maxIntervalSeconds,
              }
            : null
        }
        approvedClients={approvedClients.map((c) => ({
          id: c.id,
          name: c.name,
          autoApprove: c.autoApprove,
        }))}
      />
    </div>
  );
}
