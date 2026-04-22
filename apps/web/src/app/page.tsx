import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function Home() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <SmoothScroll>
      <LandingPage />
    </SmoothScroll>
  );
}
