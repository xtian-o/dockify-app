"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { FaUser } from "react-icons/fa";
import { MdChevronRight } from "react-icons/md";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRole } from "@/hooks/use-rbac";
import { formatDisplayName } from "@/lib/format-name";
import { getUserAvatarUrl } from "@/lib/gravatar";
import { cn } from "@/lib/utils";
import { CollapsedMenuTooltip } from "./collapsed-menu-tooltip";
import { useTooltip } from "./tooltip-context";
import { type UserMenuItemConfig, userMenuConfig } from "./user-menu-config";

/**
 * Menu Item Actions Handler
 * Maps action types to their corresponding handlers
 */
const menuActions = {
  signout: () => {
    window.location.href = "/api/auth/signout";
  },
};

/** Internal reusable item for both Link and Button */
function UserMenuItem({ item }: { item: UserMenuItemConfig }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;

  const containerClass = cn(
    "relative flex h-7 w-full items-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm transition-colors isolate group",
  );

  const content = (
    <>
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
          <Icon className="h-4 w-4 text-white dark:text-black" />
        </motion.div>
      </span>

      {/* Label */}
      <span className="relative z-10 flex-1 px-3 text-xs font-medium text-primary/80">
        {item.label}
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

  // Navigation item (Link)
  if (item.href) {
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

  // Action item (Div with button role - required for shimmer to work)
  if (item.action) {
    const action = item.action;

    return (
      <motion.div initial="rest" whileHover="hover" animate="rest">
        <div
          role="button"
          tabIndex={0}
          onClick={() => menuActions[action]?.()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              menuActions[action]?.();
            }
          }}
          className={cn(containerClass, "cursor-pointer")}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {content}
        </div>
      </motion.div>
    );
  }

  return null;
}

interface UserMenuProps {
  isOpen?: boolean;
  onToggle?: () => void;
  collapsed?: boolean;
}

/**
 * User Menu Component
 *
 * Expandable user menu with profile, settings, and sign out options.
 */
export function UserMenu({
  isOpen = false,
  onToggle,
  collapsed = false,
}: UserMenuProps) {
  const { data: session, status } = useSession();
  const [savedName, setSavedName] = useState<string | null>(null);
  const { activeTooltip, showTooltip, hideTooltip } = useTooltip();
  const [openUpwards, setOpenUpwards] = useState(false);
  const isMenuOpen = isOpen;
  const buttonRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { hasRole } = useRole("admin");

  const tooltipId = "user-menu";
  const isTooltipVisible = activeTooltip === tooltipId;

  // Filter menu items based on current path and user role
  const filteredMenuItems = userMenuConfig.filter((item) => {
    // If item requires admin role and user is not admin, hide it
    if (item.adminOnly && !hasRole) {
      return false;
    }
    // If item has showOnPath specified, only show on that path
    if (item.showOnPath) {
      return pathname.startsWith(item.showOnPath);
    }
    // Show all other items
    return true;
  });

  useEffect(() => {
    const name = localStorage.getItem("signup_name");
    if (name) setSavedName(name);
  }, []);

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <div
        className={cn("relative border-t", collapsed ? "px-2 py-1.5" : "p-3")}
      >
        <div className="flex items-center justify-center h-9">
          <div className="animate-pulse bg-muted h-6 w-6 rounded-full" />
        </div>
      </div>
    );
  }

  const user = session?.user;
  const userName = user?.name || savedName || "User";
  const displayName = formatDisplayName(userName);
  const avatarUrl = user ? getUserAvatarUrl(user, { size: 80 }) : null;
  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    user?.email?.[0]?.toUpperCase() ||
    "?";

  // User menu should always open upwards (at the bottom of sidebar)
  useEffect(() => {
    setOpenUpwards(true);
  }, []);

  // Click outside handler
  useEffect(() => {
    if (collapsed && isTooltipVisible) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node) &&
          tooltipRef.current &&
          !tooltipRef.current.contains(event.target as Node)
        ) {
          hideTooltip(tooltipId);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [collapsed, isTooltipVisible, hideTooltip]);

  if (!user) return null;

  return (
    <div className="mt-auto mb-4">
      {/* Separator */}
      <div
        className={cn(
          "mb-4 border-t border-border",
          collapsed ? "mx-3.5" : "mx-4",
        )}
      />

      <div className={collapsed ? "px-3.5" : "px-4"}>
        {/* Main Button */}
        <div ref={buttonRef} className="relative">
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
              {/* Background Overlay on Hover */}
              <motion.div
                className="absolute inset-0 bg-primary/5"
                variants={{
                  rest: { opacity: 0 },
                  hover: { opacity: 1 },
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />

              {/* Avatar */}
              <Avatar
                className={cn(
                  "relative z-10 h-full shrink-0 rounded-none",
                  collapsed ? "w-full" : "w-9",
                )}
              >
                <AvatarImage
                  src={avatarUrl || undefined}
                  alt={displayName}
                  className="rounded-none"
                />
                <AvatarFallback className="rounded-none text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Info - Hidden when collapsed */}
              {!collapsed && (
                <>
                  <div className="relative z-10 flex flex-1 flex-col items-start justify-center overflow-hidden px-3 text-left">
                    <p className="truncate text-xs font-medium leading-tight text-primary/80">
                      {displayName}
                    </p>
                    <p className="truncate text-[10px] text-primary/80 leading-tight">
                      {user.email}
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
                title={displayName}
                titleIcon={FaUser}
                items={filteredMenuItems.map((item) => ({
                  id: item.id,
                  name: item.label,
                  icon: item.icon,
                  href: item.href || "",
                  action: item.action,
                }))}
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
              maxHeight: isMenuOpen
                ? `${filteredMenuItems.length * 40 + 8}px`
                : "0px",
            }}
          >
            <div className="relative ml-10 mt-4 mb-2 space-y-2">
              {/* Vertical Line - Stops at last horizontal line */}
              <div
                className="absolute left-[-20px] top-[-16px] border-l border-primary/80"
                style={{
                  height: `${(filteredMenuItems.length - 1) * 36 + 30}px`,
                }}
              />

              {/* Menu Items from Config */}
              {filteredMenuItems.map((item) => (
                <div key={item.id} className="relative">
                  {/* Horizontal Branch Line */}
                  <div className="absolute left-[-20px] top-[14px] h-0 w-5 border-b border-primary/80" />
                  <UserMenuItem item={item} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
