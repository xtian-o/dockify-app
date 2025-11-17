"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GrVirtualMachine } from "react-icons/gr";
import { MdChevronRight, MdMonitor } from "react-icons/md";
import { SiKubernetes } from "react-icons/si";
import { cn } from "@/lib/utils";
import { CollapsedMenuTooltip } from "./collapsed-menu-tooltip";
import { useTooltip } from "./tooltip-context";

interface MenuItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const menuItems: MenuItem[] = [
  {
    id: "k3s-clusters",
    name: "K3s Clusters",
    icon: SiKubernetes,
    href: "/staff/k3s-clusters",
  },
  {
    id: "monitoring-servers",
    name: "Monitoring servers",
    icon: MdMonitor,
    href: "/staff/monitoring-servers",
  },
];

/** Internal reusable item for menu */
function DockifyMenuItem({ item }: { item: MenuItem }) {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const Icon = item.icon;

  // Check if current page matches this item
  const isActive = item.href
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : false;

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
      <span className="relative z-10 flex h-full w-8 shrink-0 items-center justify-center bg-primary/80">
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
          <Icon className="h-[15px] w-[15px] text-white dark:text-black" />
        </motion.div>
      </span>

      {/* Label */}
      <span className="relative z-10 flex-1 px-3 text-xs font-medium text-primary/80">
        {item.name}
      </span>

      {/* Chevron */}
      <div className="relative z-10 flex h-5 items-center border-l border-primary/80 pl-2.5 pr-2.5">
        <MdChevronRight className="h-4 w-4 text-primary/80" />
      </div>

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

  const containerClass = cn(
    "relative flex h-7 w-full items-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm transition-colors isolate group",
  );

  return (
    <motion.div initial="rest" whileHover="hover" animate="rest">
      <Link
        href={item.href}
        className={containerClass}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
      </Link>
    </motion.div>
  );
}

interface DockifyInfrastructureProps {
  isOpen?: boolean;
  onToggle?: () => void;
  collapsed?: boolean;
}

/**
 * Dockify Infrastructure Component
 *
 * Main infrastructure management with Dockify logo.
 */
export function DockifyInfrastructure({
  isOpen = false,
  onToggle,
  collapsed = false,
}: DockifyInfrastructureProps) {
  const { activeTooltip, showTooltip, hideTooltip } = useTooltip();
  const [openUpwards, setOpenUpwards] = useState(false);
  const pathname = usePathname();
  const isMenuOpen = isOpen;
  const buttonRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const tooltipId = "dockify-infrastructure";
  const isTooltipVisible = activeTooltip === tooltipId;

  // Check if any menu item is active
  const isAnyItemActive = menuItems.some(
    (item) =>
      item.href &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  // Infrastructure should always open downwards (it only has 1 item)
  useEffect(() => {
    // Always open downwards for Infrastructure
    setOpenUpwards(false);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isTooltipVisible &&
        buttonRef.current &&
        tooltipRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        hideTooltip(tooltipId);
      }
    };

    if (isTooltipVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isTooltipVisible, hideTooltip]);

  return (
    <div className="mt-auto">
      {/* Separator */}
      <div
        className={cn(
          "mb-4 border-t border-primary/80",
          collapsed ? "mx-3.5" : "mx-4",
        )}
      />

      <div className={cn("mb-4", collapsed ? "px-3.5" : "px-4")}>
        {/* Main Button */}
        <div className="relative" ref={buttonRef}>
          <motion.div initial="rest" whileHover="hover" animate="rest">
            <div
              role="button"
              tabIndex={0}
              onClick={() => !collapsed && onToggle?.()}
              onKeyDown={(e) => {
                if (!collapsed && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onToggle?.();
                }
              }}
              onMouseEnter={() => collapsed && showTooltip(tooltipId)}
              onMouseLeave={() => collapsed && hideTooltip(tooltipId)}
              className={cn(
                "relative flex h-9 w-full items-center overflow-hidden rounded-md border border-primary/80 bg-card shadow-sm transition-colors isolate group",
                !collapsed && "cursor-pointer border-r-[3px]",
              )}
            >
              {/* Active State Background */}
              {isAnyItemActive && (
                <div className="absolute inset-0 bg-primary/10" />
              )}

              {/* Background Overlay on Hover */}
              <motion.div
                className="absolute inset-0 bg-primary/5"
                variants={{
                  rest: { opacity: 0 },
                  hover: { opacity: 1 },
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />

              {/* Icon Container - Dockify Logo */}
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
                  <GrVirtualMachine className="h-[17px] w-[17px] text-white dark:text-black" />
                </motion.div>
              </span>

              {/* Label - Hidden when collapsed */}
              {!collapsed && (
                <>
                  <div className="relative z-10 flex flex-1 items-center px-3">
                    <p className="text-xs font-medium text-primary/80">
                      Infrastructure
                    </p>
                  </div>

                  {/* Chevron */}
                  <div className="relative z-10 flex h-5 items-center border-l border-primary/80 pl-2.5 pr-2.5">
                    <MdChevronRight
                      className={cn(
                        "h-4 w-4 text-primary/80 transition-transform duration-300",
                        isMenuOpen && "rotate-90",
                      )}
                    />
                  </div>
                </>
              )}

              {/* Shimmer Effect */}
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 z-50 transition-all duration-500 ease-out bg-gradient-to-r from-transparent via-primary/20 to-transparent",
                  isTooltipVisible
                    ? "translate-x-full opacity-100"
                    : "-translate-x-full opacity-0",
                )}
              />
            </div>
          </motion.div>

          {/* Custom Popover - Shows on hover when collapsed */}
          {collapsed && isTooltipVisible && (
            <div ref={tooltipRef}>
              <CollapsedMenuTooltip
                title="Infrastructure"
                titleIcon={GrVirtualMachine}
                items={menuItems}
                openUpwards={openUpwards}
                onMouseEnter={() => showTooltip(tooltipId)}
                onMouseLeave={() => hideTooltip(tooltipId)}
              />
            </div>
          )}
        </div>

        {/* Submenu - Hidden when collapsed */}
        {!collapsed && (
          <div
            className={cn(
              "relative overflow-hidden transition-all duration-300 ease-in-out",
              isMenuOpen ? "opacity-100" : "max-h-0 opacity-0",
            )}
            style={{
              maxHeight: isMenuOpen ? `${menuItems.length * 40 + 8}px` : "0px",
            }}
          >
            <div className="relative ml-10 mt-4 space-y-2">
              {/* Vertical Line - Stops at last horizontal line */}
              <div
                className="absolute left-[-20px] top-[-16px] border-l border-primary/80"
                style={{
                  height: `${(menuItems.length - 1) * 36 + 30}px`,
                }}
              />

              {/* Menu Items */}
              {menuItems.map((item) => (
                <div key={item.id} className="relative">
                  {/* Horizontal Branch Line */}
                  <div className="absolute left-[-20px] top-[14px] h-0 w-5 border-b border-primary/80" />
                  <DockifyMenuItem item={item} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
