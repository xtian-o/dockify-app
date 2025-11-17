"use client";

import { useState } from "react";
import { TooltipProvider } from "@/components/dashboard/_components/tooltip-context";
import { StaffHeader } from "@/components/staff/header";
import { StaffSidebar } from "@/components/staff/sidebar";

interface StaffLayoutClientProps {
  children: React.ReactNode;
}

/**
 * Client-side wrapper for staff layout
 * Manages sidebar collapse state
 */
export function StaffLayoutClient({ children }: StaffLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-x-visible overflow-y-hidden bg-background">
        {/* Sidebar - Full Height */}
        <StaffSidebar collapsed={sidebarCollapsed} />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <StaffHeader
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={handleToggleSidebar}
          />

          {/* Page Content - Scrollable */}
          <main className="flex-1 overflow-y-auto p-4">{children}</main>

          {/* Footer - Sticky Bottom */}
          <footer className="border-t px-6 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} Dockify Staff Area</p>
              <p>Admin Tools & Management</p>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
