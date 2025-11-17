"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  MdChevronRight,
  MdDashboard,
  MdPeople,
  MdSecurity,
  MdTerminal,
} from "react-icons/md";
import Logo from "@/components/common/logo";
import {
  DockifyInfrastructure,
  InfrastructureProvider,
  OurInfrastructure,
  UserMenu,
} from "@/components/dashboard/_components";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Overview",
    href: "/staff",
    icon: MdDashboard,
  },
  {
    name: "Users",
    href: "/staff/users",
    icon: MdPeople,
  },
  {
    name: "SSH Access",
    href: "/staff/ssh",
    icon: MdTerminal,
  },
];

/**
 * Navigation Item Component
 *
 * Similar style to UserMenuItem with shimmer effects
 */
function NavigationItem({
  item,
  isActive,
  collapsed = false,
}: {
  item: (typeof navigation)[0];
  isActive: boolean;
  collapsed?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;

  return (
    <motion.div initial="rest" whileHover="hover" animate="rest">
      <Link
        href={item.href}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative flex h-9 w-full items-center overflow-hidden rounded-md border border-primary/80 bg-card shadow-sm transition-colors isolate group",
          !collapsed && "border-r-[3px]",
        )}
        title={collapsed ? item.name : undefined}
      >
        {/* Active State Background */}
        {isActive && <div className="absolute inset-0 bg-primary/10" />}

        {/* Background Overlay on Hover */}
        <motion.div
          className="absolute inset-0 bg-primary/5"
          variants={{
            rest: { opacity: 0 },
            hover: { opacity: 1 },
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        {/* Icon Container */}
        <span
          className={cn(
            "relative z-10 flex h-full shrink-0 items-center justify-center bg-primary/80",
            collapsed ? "w-full" : "w-8",
          )}
        >
          <motion.div
            className="absolute inset-0 bg-primary/15"
            variants={{
              rest: { opacity: 0 },
              hover: { opacity: 1 },
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          <motion.div
            className="relative z-10"
            variants={{
              rest: { rotate: 0, scale: 1 },
              hover: { rotate: 12, scale: 1.1 },
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Icon className="h-4 w-4 text-white dark:text-black" />
          </motion.div>
        </span>

        {/* Label - Hidden when collapsed */}
        {!collapsed && (
          <>
            <span className="relative z-10 flex-1 px-3 text-xs font-medium text-primary/80">
              {item.name}
            </span>

            {/* Chevron */}
            <div className="relative z-10 flex h-5 items-center border-l border-primary/80 pl-2.5 pr-2.5">
              <MdChevronRight className="h-4 w-4 text-primary/80" />
            </div>
          </>
        )}

        {/* Shimmer Effect */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-50 transition-all duration-500 ease-out bg-gradient-to-r from-transparent via-primary/20 to-transparent",
            isHovered
              ? "translate-x-full opacity-100"
              : "-translate-x-full opacity-0",
          )}
        />
      </Link>
    </motion.div>
  );
}

interface StaffSidebarProps {
  collapsed?: boolean;
}

/**
 * Staff Area Sidebar
 *
 * Navigation sidebar for staff/admin area.
 * Features:
 * - Staff-specific navigation
 * - Active state highlighting
 * - Admin badge display
 * - Collapsible design
 */
export function StaffSidebar({ collapsed = false }: StaffSidebarProps) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<
    "dockify" | "provider" | "infrastructure" | "user" | null
  >(null);

  const handleToggleDockify = () => {
    setOpenMenu(openMenu === "dockify" ? null : "dockify");
  };

  const handleToggleProvider = () => {
    setOpenMenu(openMenu === "provider" ? null : "provider");
  };

  const handleToggleInfrastructure = () => {
    setOpenMenu(openMenu === "infrastructure" ? null : "infrastructure");
  };

  const handleToggleUser = () => {
    setOpenMenu(openMenu === "user" ? null : "user");
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex h-full flex-col border-r overflow-visible"
    >
      {/* Logo + Staff Badge */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b",
          collapsed ? "justify-center px-0" : "justify-between px-4",
        )}
      >
        <Logo
          asLink={true}
          href="/staff"
          variant={collapsed ? "collapsed" : "full"}
        />
        {!collapsed && (
          <div className="flex items-center h-5 overflow-hidden rounded-sm border border-red-500/80 border-l-[3px] border-r-[3px] bg-card shadow-sm">
            <span className="flex items-center px-1.5 text-[9px] font-extrabold tracking-wider uppercase text-primary/80">
              STAFF
            </span>
            <div className="flex h-full w-5 items-center justify-center bg-red-500/90">
              <MdSecurity className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn("flex-1 space-y-4", collapsed ? "px-3.5 py-4" : "p-4")}
      >
        {navigation.map((item) => {
          // Exact match for Overview, prefix match for others
          const isActive =
            item.href === "/staff"
              ? pathname === "/staff"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <NavigationItem
              key={item.name}
              item={item}
              isActive={isActive}
              collapsed={collapsed}
            />
          );
        })}
      </nav>

      {/* Dockify Infrastructure */}
      <DockifyInfrastructure
        isOpen={openMenu === "dockify"}
        onToggle={handleToggleDockify}
        collapsed={collapsed}
      />

      {/* Infrastructure Provider */}
      <InfrastructureProvider
        isOpen={openMenu === "provider"}
        onToggle={handleToggleProvider}
        collapsed={collapsed}
      />

      {/* Our Infrastructure */}
      <OurInfrastructure
        isOpen={openMenu === "infrastructure"}
        onToggle={handleToggleInfrastructure}
        collapsed={collapsed}
      />

      {/* User Menu - Bottom (has its own separator) */}
      <UserMenu
        isOpen={openMenu === "user"}
        onToggle={handleToggleUser}
        collapsed={collapsed}
      />
    </motion.aside>
  );
}
