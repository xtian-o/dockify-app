"use client";

import { motion } from "framer-motion";
import {
  MdMenu,
  MdMenuOpen,
  MdNotifications,
  MdShield,
} from "react-icons/md";
import { ModeToggle } from "@/components/common/theme-selector/mode-toggle";
import { UserMenu } from "@/components/common/user-menu";
import { Button } from "@/components/ui/button";

interface StaffHeaderProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

/**
 * Staff Area Header
 *
 * Top navigation bar for the staff area.
 * Features:
 * - Sidebar toggle
 * - Notifications
 * - Theme toggle
 * - User menu
 * - Staff badge indicator
 */
export function StaffHeader({
  sidebarCollapsed = false,
  onToggleSidebar,
}: StaffHeaderProps) {
  return (
    <header>
      <div className="flex items-center justify-between px-4 py-[17px]">
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

          {/* Staff Badge */}
          <div className="hidden h-10 items-center gap-2 rounded-md bg-primary/10 px-3 text-sm font-medium text-primary md:flex">
            <MdShield className="h-4 w-4" />
            <span>Staff Area</span>
          </div>
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
          <UserMenu />
        </div>
      </div>

      {/* Separator with margins */}
      <div className="px-4">
        <div className="border-t border-border" />
      </div>
    </header>
  );
}
