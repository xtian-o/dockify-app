"use client";

import { useState } from "react";
import { TooltipProvider } from "@/components/dashboard/_components/tooltip-context";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

/**
 * Client-side wrapper for dashboard layout
 * Manages sidebar collapse state
 */
export function DashboardLayoutClient({
  children,
}: DashboardLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-x-visible overflow-y-hidden">
        {/* Sidebar - Full Height */}
        <DashboardSidebar collapsed={sidebarCollapsed} />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <DashboardHeader
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={handleToggleSidebar}
          />

          {/* Page Content - Scrollable */}
          <main className="flex-1 overflow-y-auto p-4">{children}</main>

          {/* Footer - Sticky Bottom */}
          <footer className="border-t px-6 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} Dockify. All rights reserved.</p>
              <p>Built with Next.js 16 & React 19</p>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
