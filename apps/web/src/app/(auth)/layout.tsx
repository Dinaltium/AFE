import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "AFE — Auth",
};

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      {children}
    </div>
  );
}

