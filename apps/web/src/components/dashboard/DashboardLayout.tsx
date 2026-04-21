"use client";

import React, { createContext, useState, useEffect } from "react";
import type { Session } from "next-auth";
import { usePathname } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/providers/ErrorBoundary";
import { useAFEStore } from "@/lib/store";

// Exposes the scrollable main container ref to any descendant
export const ScrollContainerContext = createContext<HTMLElement | null>(null);

const BREADCRUMB_LABELS: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/payments": "Payments",
  "/dashboard/audit": "Audit Log",
  "/dashboard/vetting": "Deal Vetting",
  "/dashboard/settings": "Settings",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  session: Session;
}

export function DashboardLayout({ children, session }: DashboardLayoutProps) {
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);
  const pathname = usePathname();
  const setActiveUser = useAFEStore((s) => s.setActiveUser);

  useEffect(() => {
    if (session.user.id) {
      setActiveUser(session.user.id);
    }
  }, [session.user.id, setActiveUser]);

  const defaultOpen = typeof document !== "undefined"
    ? document.cookie.includes("sidebar_state=true")
    : true;

  return (
    <ThemeProvider userId={session.user.id}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar session={session} />

        {/* Content panel — inset variant makes this a rounded, shadowed card */}
        <SidebarInset className="overflow-hidden bg-background text-foreground">
          {/* Sticky top bar */}
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-20">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-muted-foreground">
                {BREADCRUMB_LABELS[pathname] ?? "Dashboard"}
              </span>
            </div>
          </header>

          {/* Scrollable content area — ref exposed via context */}
          <ScrollContainerContext.Provider value={scrollContainer}>
            <ErrorBoundary>
              <main
                ref={setScrollContainer}
                className="flex flex-1 flex-col overflow-y-auto"
              >
                {children}
              </main>
            </ErrorBoundary>
          </ScrollContainerContext.Provider>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
