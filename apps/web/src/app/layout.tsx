import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "AFE — Autonomous Finance Engine",
  description:
    "Agentic AI for the gig economy — auto-splits income, vets deals, logs everything.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking theme init — reads localStorage and applies CSS vars before hydration */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: intentional blocking theme init */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
