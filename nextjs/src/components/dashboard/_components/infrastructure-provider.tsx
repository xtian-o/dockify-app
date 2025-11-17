"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaServer } from "react-icons/fa";
import { MdChevronRight } from "react-icons/md";
import { SiHetzner } from "react-icons/si";
import { cn } from "@/lib/utils";
import { CollapsedMenuTooltip } from "./collapsed-menu-tooltip";
import { useTooltip } from "./tooltip-context";

interface Provider {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  href?: string;
}

const providers: Provider[] = [
  {
    id: "hetzner",
    name: "Hetzner",
    icon: SiHetzner,
    description: "Cloud Hosting",
    href: "/staff/hetzner",
  },
];

/** Internal reusable item for provider */
function ProviderItem({ provider }: { provider: Provider }) {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const Icon = provider.icon;

  // Check if current page matches this provider
  const isActive = provider.href
    ? pathname === provider.href || pathname.startsWith(`${provider.href}/`)
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
          <Icon className="h-4 w-4 text-white dark:text-black" />
        </motion.div>
      </span>

      {/* Label */}
      <span className="relative z-10 flex-1 px-3 text-xs font-medium text-primary/80">
        {provider.name}
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

  if (provider.href) {
    return (
      <motion.div initial="rest" whileHover="hover" animate="rest">
        <Link
          href={provider.href}
          className={containerClass}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial="rest" whileHover="hover" animate="rest">
      <div
        className={containerClass}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
      </div>
    </motion.div>
  );
}

interface InfrastructureProviderProps {
  isOpen?: boolean;
  onToggle?: () => void;
  collapsed?: boolean;
}

/**
 * Infrastructure Provider Component
 *
 * Expandable menu for infrastructure providers (Hetzner, etc.)
 */
export function InfrastructureProvider({
  isOpen = false,
  onToggle,
  collapsed = false,
}: InfrastructureProviderProps) {
  const { activeTooltip, showTooltip, hideTooltip } = useTooltip();
  const tooltipId = "infrastructure-provider";
  const isTooltipVisible = activeTooltip === tooltipId;
  const [openUpwards, setOpenUpwards] = useState(false);
  const pathname = usePathname();
  const isMenuOpen = isOpen;
  const buttonRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if any provider page is active
  const isAnyProviderActive = providers.some(
    (provider) =>
      provider.href &&
      (pathname === provider.href || pathname.startsWith(`${provider.href}/`)),
  );

  // Providers should always open downwards (it only has 1 item)
  useEffect(() => {
    // Always open downwards for Providers
    setOpenUpwards(false);
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

  return (
    <div className="mb-4">
      <div className={cn(collapsed ? "px-3.5" : "px-4")}>
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
              {isAnyProviderActive && (
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
                  <FaServer className="h-4 w-4 text-white dark:text-black" />
                </motion.div>
              </span>

              {/* Label - Hidden when collapsed */}
              {!collapsed && (
                <>
                  <div className="relative z-10 flex flex-1 items-center px-3">
                    <p className="text-xs font-medium text-primary/80">
                      Providers
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
                title="Providers"
                titleIcon={FaServer}
                items={providers.map((p) => ({
                  id: p.id,
                  name: p.name,
                  icon: p.icon,
                  href: p.href || "",
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
              maxHeight: isMenuOpen ? `${providers.length * 40 + 8}px` : "0px",
            }}
          >
            <div className="relative ml-10 mt-4 space-y-2">
              {/* Vertical Line - Stops at last horizontal line */}
              <div
                className="absolute left-[-20px] top-[-16px] border-l border-primary/80"
                style={{
                  height: `${(providers.length - 1) * 36 + 30}px`,
                }}
              />

              {/* Menu Items */}
              {providers.map((provider) => (
                <div key={provider.id} className="relative">
                  {/* Horizontal Branch Line */}
                  <div className="absolute left-[-20px] top-[14px] h-0 w-5 border-b border-primary/80" />
                  <ProviderItem provider={provider} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
