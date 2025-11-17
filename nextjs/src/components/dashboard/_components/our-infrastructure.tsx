"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MdChevronRight, MdHub } from "react-icons/md";
import { SiCloudflare, SiHetzner, SiWasabi } from "react-icons/si";
import { cn } from "@/lib/utils";
import { CollapsedMenuTooltip } from "./collapsed-menu-tooltip";
import { useTooltip } from "./tooltip-context";

// Infisical icon (infinity symbol)
const InfisicalIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 10.48 12h.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34L9.22 8.2C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.5.01-.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.9 0-1.76-.35-2.44-1.03l-1.14-1.01-1.51 1.34 1.27 1.12c1.02 1.01 2.37 1.57 3.82 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.37-5.4-5.37z" />
  </svg>
);

// Resend icon (official logo)
const ResendIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1800 1800"
    fill="currentColor"
    className={className}
  >
    <path d="M1000.46 450C1174.77 450 1278.43 553.669 1278.43 691.282C1278.43 828.896 1174.77 932.563 1000.46 932.563H912.382L1350 1350H1040.82L707.794 1033.48C683.944 1011.47 672.936 985.781 672.935 963.765C672.935 932.572 694.959 905.049 737.161 893.122L908.712 847.244C973.85 829.812 1018.81 779.353 1018.81 713.298C1018.8 632.567 952.745 585.78 871.095 585.78H450V450H1000.46Z" />
  </svg>
);

type ServiceStatus = "operational" | "degraded" | "down";

interface Service {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  status: ServiceStatus;
  description: string;
  href?: string;
}

const services: Service[] = [
  {
    id: "hetzner",
    name: "Hetzner",
    icon: SiHetzner,
    status: "operational",
    description: "Cloud Hosting",
    href: "/staff/hetzner-services",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    icon: SiCloudflare,
    status: "operational",
    description: "CDN & Security",
    href: "/staff/cloudflare",
  },
  {
    id: "wasabi",
    name: "Wasabi",
    icon: SiWasabi,
    status: "operational",
    description: "S3 Storage Provider",
    href: "/staff/wasabi",
  },
  {
    id: "infisical",
    name: "Infisical",
    icon: InfisicalIcon,
    status: "operational",
    description: "Secret Management",
    href: "/staff/infisical",
  },
  {
    id: "resend",
    name: "Resend",
    icon: ResendIcon,
    status: "operational",
    description: "Email Provider",
    href: "/staff/resend",
  },
];

const _statusColors = {
  operational: "text-green-500",
  degraded: "text-orange-500",
  down: "text-red-500",
};

/** Internal reusable item for service */
function ServiceItem({ service }: { service: Service }) {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const Icon = service.icon;

  // Check if current page matches this service
  const isActive = service.href
    ? pathname === service.href || pathname.startsWith(`${service.href}/`)
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
          <Icon
            className={cn(
              "text-white dark:text-black",
              service.id === "wasabi" && "h-4 w-4",
              service.id === "hetzner" && "h-4 w-4",
              service.id === "infisical" && "h-4 w-4",
              service.id === "resend" && "h-7 w-7",
              service.id === "cloudflare" && "h-5 w-5",
            )}
          />
        </motion.div>
      </span>

      {/* Label */}
      <span className="relative z-10 flex-1 px-3 text-xs font-medium text-primary/80">
        {service.name}
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

  if (service.href) {
    return (
      <motion.div initial="rest" whileHover="hover" animate="rest">
        <Link
          href={service.href}
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

interface OurInfrastructureProps {
  isOpen?: boolean;
  onToggle?: () => void;
  collapsed?: boolean;
}

/**
 * Our Infrastructure Component
 *
 * Expandable infrastructure status menu with service details.
 */
export function OurInfrastructure({
  isOpen = false,
  onToggle,
  collapsed = false,
}: OurInfrastructureProps) {
  const { activeTooltip, showTooltip, hideTooltip } = useTooltip();
  const [openUpwards, setOpenUpwards] = useState(false);
  const pathname = usePathname();
  const isMenuOpen = isOpen;
  const buttonRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const tooltipId = "our-infrastructure";
  const isTooltipVisible = activeTooltip === tooltipId;

  // Check if any service page is active
  const isAnyServiceActive = services.some(
    (service) =>
      service.href &&
      (pathname === service.href || pathname.startsWith(`${service.href}/`)),
  );

  // Check if tooltip should open upwards
  useEffect(() => {
    if (
      collapsed &&
      isTooltipVisible &&
      buttonRef.current &&
      tooltipRef.current
    ) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;

      // Use actual tooltip height instead of fixed value
      const tooltipHeight = tooltipRect.height || 200;

      setOpenUpwards(spaceBelow < tooltipHeight + 20); // Add 20px margin
    }
  }, [collapsed, isTooltipVisible]);

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
              {isAnyServiceActive && (
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
                  <MdHub className="h-4 w-4 text-white dark:text-black" />
                </motion.div>
              </span>

              {/* Label - Hidden when collapsed */}
              {!collapsed && (
                <>
                  <div className="relative z-10 flex flex-1 items-center px-3">
                    <p className="text-xs font-medium text-primary/80">
                      External Services
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
                title="External Services"
                titleIcon={MdHub}
                items={services.map((s) => ({
                  id: s.id,
                  name: s.name,
                  icon: s.icon,
                  href: s.href || "",
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
              maxHeight: isMenuOpen ? `${services.length * 40 + 8}px` : "0px",
            }}
          >
            <div className="relative ml-10 mt-4 space-y-2">
              {/* Vertical Line - Stops at last horizontal line */}
              <div
                className="absolute left-[-20px] top-[-16px] border-l border-primary/80"
                style={{
                  height: `${(services.length - 1) * 36 + 30}px`,
                }}
              />

              {/* Service Items */}
              {services.map((service) => (
                <div key={service.id} className="relative">
                  {/* Horizontal Branch Line */}
                  <div className="absolute left-[-20px] top-[14px] h-0 w-5 border-b border-primary/80" />
                  <ServiceItem service={service} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
