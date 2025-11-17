"use client";

import { motion } from "framer-motion";
import { FaUser } from "react-icons/fa";
import { MdMenu, MdMenuOpen, MdNotifications } from "react-icons/md";
import { ModeToggle } from "@/components/common/theme-selector/mode-toggle";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

/**
 * Dashboard Header
 *
 * Top navigation bar for the dashboard.
 * Features:
 * - Sidebar toggle
 * - Notifications
 * - Theme toggle
 * - User menu
 */
export function DashboardHeader({
  sidebarCollapsed = false,
  onToggleSidebar,
}: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      {/* Left side - Sidebar Toggle */}
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle Button */}
        <motion.button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm transition-colors hover:bg-primary/5"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle sidebar"
        >
          <motion.div
            initial={false}
            animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {sidebarCollapsed ? (
              <MdMenu className="h-5 w-5 text-primary/80" />
            ) : (
              <MdMenuOpen className="h-5 w-5 text-primary/80" />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <MdNotifications className="h-5 w-5" />
        </Button>

        {/* Theme toggle */}
        <ModeToggle />

        {/* User menu */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="User menu"
        >
          <FaUser className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
