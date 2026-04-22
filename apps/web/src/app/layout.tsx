import Script from "next/script";
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "AFE — Autonomous Finance Engine",
  description:
    "Agentic AI for the gig economy — auto-splits income, vets deals, logs everything.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="antialiased">
        <SessionProvider session={session}>
          <ThemeProvider userId={session?.user?.id}>
            {children}
          </ThemeProvider>
        </SessionProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}

