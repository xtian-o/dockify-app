"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  MdChevronRight,
  MdDashboard,
  MdNewReleases,
  MdStorefront,
  MdApps,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import Logo from "@/components/common/logo";
import { UserMenu } from "@/components/dashboard/_components";
import { TooltipProvider } from "@/components/dashboard/_components/tooltip-context";
import { useRole } from "@/hooks/use-rbac";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: MdDashboard,
    adminOnly: false,
    iconSize: "h-4 w-4",
  },
  {
    name: "App Catalog",
    href: "/dashboard/apps",
    icon: MdStorefront,
    adminOnly: false,
    iconSize: "h-4 w-4",
    children: [
      {
        name: "My Apps",
        href: "/dashboard/my-apps",
        icon: MdApps,
        iconSize: "h-4 w-4",
      },
    ],
  },
  {
    name: "Git Connect",
    href: "/dashboard/git-connect",
    icon: FaGithub,
    adminOnly: false,
    iconSize: "h-4 w-4",
  },
];

// Type definitions for navigation items
type NavigationItem = (typeof navigation)[number];
type NavigationItemWithChildren = NavigationItem & { children: NonNullable<NavigationItem["children"]> };
type ChildNavigationItem = NonNullable<NavigationItemWithChildren["children"]>[number];
type NavigationItemType = NavigationItem | ChildNavigationItem;

/**
 * Navigation Item Component
 *
 * Similar style to UserMenuItem with shimmer effects
 */
function NavigationItem({
  item,
  isActive,
  collapsed = false,
  onClick,
}: {
  item: NavigationItemType;
  isActive: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;
  const hasChildren = "children" in item && item.children && item.children.length > 0;

  const content = (
    <>
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
          <Icon className={cn(item.iconSize || "h-4 w-4", "text-white dark:text-black")} />
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
    </>
  );

  return (
    <motion.div initial="rest" whileHover="hover" animate="rest">
      {hasChildren || onClick ? (
        <button
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "relative flex h-9 w-full items-center overflow-hidden rounded-md border border-primary/80 bg-card shadow-sm transition-colors isolate group",
            !collapsed && "border-r-[3px]",
          )}
          title={collapsed ? item.name : undefined}
        >
          {content}
        </button>
      ) : (
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
          {content}
        </Link>
      )}
    </motion.div>
  );
}

/**
 * Navigation Item with Submenu
 */
function NavigationItemWithSubmenu({
  item,
  isActive,
  collapsed = false,
  pathname,
}: {
  item: (typeof navigation)[0];
  isActive: boolean;
  collapsed?: boolean;
  pathname: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  // Auto-expand if a child is active
  const hasActiveChild = item.children?.some((child) => pathname === child.href);
  const shouldExpand = isExpanded || hasActiveChild;

  return (
    <div>
      {/* Parent Item */}
      <motion.div
        initial="rest"
        whileHover="hover"
        animate="rest"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative flex h-9 w-full items-center overflow-hidden rounded-md border border-primary/80 bg-card shadow-sm transition-colors isolate group",
          !collapsed && "border-r-[3px]",
        )}
      >
        {/* Active State Background */}
        {(isActive || hasActiveChild) && <div className="absolute inset-0 bg-primary/10" />}

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
            <Icon className={cn(item.iconSize || "h-4 w-4", "text-white dark:text-black")} />
          </motion.div>
        </span>

        {/* Label and Chevron - Hidden when collapsed */}
        {!collapsed && (
          <>
            {/* Main clickable area - navigates to parent page */}
            <Link
              href={item.href}
              className="relative z-10 flex-1 px-3 text-xs font-medium text-primary/80"
            >
              {item.name}
            </Link>

            {/* Expand/Collapse Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="relative z-10 flex h-full items-center border-l border-primary/80 pl-2.5 pr-2.5 hover:bg-primary/5 transition-colors"
              aria-label={shouldExpand ? "Collapse menu" : "Expand menu"}
            >
              {shouldExpand ? (
                <MdExpandLess className="h-4 w-4 text-primary/80" />
              ) : (
                <MdExpandMore className="h-4 w-4 text-primary/80" />
              )}
            </button>
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
      </motion.div>

      {/* Submenu */}
      {hasChildren && !collapsed && (
        <motion.div
          initial={false}
          animate={{
            height: shouldExpand ? "auto" : 0,
            opacity: shouldExpand ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="mt-2 ml-4 space-y-2 border-l-2 border-primary/20 pl-2">
            {item.children?.map((child) => {
              const isChildActive = pathname === child.href;
              return (
                <NavigationItem
                  key={child.name}
                  item={child}
                  isActive={isChildActive}
                  collapsed={false}
                />
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface DashboardSidebarProps {
  collapsed?: boolean;
}

/**
 * Dashboard Sidebar
 *
 * Main navigation sidebar for the dashboard.
 * Features:
 * - Logo at the top
 * - Navigation links with icons
 * - Active state highlighting
 * - Collapsible design
 * - Responsive design
 */
export function DashboardSidebar({ collapsed = false }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { hasRole } = useRole("admin");
  const [openMenu, setOpenMenu] = useState<"user" | null>(null);

  const handleToggleUser = () => {
    setOpenMenu(openMenu === "user" ? null : "user");
  };

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 260 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex h-full flex-col border-r overflow-visible"
      >
      {/* Logo + Beta Badge */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b",
          collapsed ? "justify-center px-0" : "justify-between px-4",
        )}
      >
        <Logo asLink={true} variant={collapsed ? "collapsed" : "full"} />
        {!collapsed && (
          <div className="flex items-center h-5 overflow-hidden rounded-sm border border-orange-500/80 border-l-[3px] border-r-[3px] bg-card shadow-sm">
            <span className="flex items-center px-1.5 text-[9px] font-extrabold tracking-wider uppercase text-primary/80">
              BETA
            </span>
            <div className="flex h-full w-6 items-center justify-center bg-orange-500/90">
              <MdNewReleases className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn("flex-1 space-y-4", collapsed ? "px-3.5 py-4" : "p-4")}
      >
        {navigation.map((item) => {
          // Hide admin-only items for non-admins
          if (item.adminOnly && !hasRole) {
            return null;
          }

          const isActive = pathname === item.href;
          const hasChildren = item.children && item.children.length > 0;

          if (hasChildren) {
            return (
              <NavigationItemWithSubmenu
                key={item.name}
                item={item}
                isActive={isActive}
                collapsed={collapsed}
                pathname={pathname}
              />
            );
          }

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

      {/* User Menu - Bottom (has its own separator) */}
      <UserMenu
        isOpen={openMenu === "user"}
        onToggle={handleToggleUser}
        collapsed={collapsed}
      />
    </motion.aside>
    </TooltipProvider>
  );
}
