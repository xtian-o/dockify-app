"use client";

import { useState } from "react";
import { BiLogoPostgresql } from "react-icons/bi";
import { SiNextdotjs, SiRedis } from "react-icons/si";
import { cn } from "@/lib/utils";

type ServiceStatus = "operational" | "degraded" | "down";

interface Service {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  status: ServiceStatus;
}

// PostgreSQL icon wrapper (scaled larger)
const PostgreSQLIcon = ({ className }: { className?: string }) => (
  <BiLogoPostgresql className={cn(className, "scale-125")} />
);

// NATS icon (simplified to use currentColor)
const NATSIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      fill="currentColor"
      d="M12 0.25h11.349775v9.20115H12V0.25Z"
      strokeWidth="0.25"
    />
    <path
      fill="currentColor"
      d="M0.6501475 0.25H11.999925v9.20115H0.6501475V0.25Z"
      strokeWidth="0.25"
    />
    <path
      fill="currentColor"
      d="M23.34965 9.4596V18.66075H15.88425v5.089275L10.33155 18.6776l1.668325 -0.067425V9.4596h11.349775Z"
      strokeWidth="0.25"
    />
    <path
      fill="currentColor"
      d="M11.999925 9.4596v10.70045l-1.66835 -1.48245H0.6501475v-9.218H11.999925Z"
      strokeWidth="0.25"
    />
    <path
      className="fill-white dark:fill-black"
      d="M16.701725 12.14745V4.5304h2.71315v9.84995H15.303025L7.00345 6.62845v7.760325H4.28185V4.5304h4.255125l8.16475 7.61705Z"
      strokeWidth="0.25"
    />
  </svg>
);

const services: Service[] = [
  {
    id: "app",
    name: "Nextjs",
    icon: SiNextdotjs,
    status: "operational",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    icon: PostgreSQLIcon,
    status: "operational",
  },
  {
    id: "redis",
    name: "Redis",
    icon: SiRedis,
    status: "operational",
  },
  {
    id: "nats",
    name: "NATS",
    icon: NATSIcon,
    status: "operational",
  },
];

const statusColors = {
  operational: "text-green-500",
  degraded: "text-orange-500",
  down: "text-red-500",
};

/**
 * Platform Status Component
 *
 * Displays service status icons with tooltips in a horizontal line
 */
export function PlatformStatus() {
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  return (
    <div className="relative">
      {/* Separator - doesn't touch edges */}
      <div className="w-full px-4">
        <div className="border-t border-border" />
      </div>

      {/* Icons container */}
      <div className="flex h-10 items-center justify-between px-4">
        {services.map((service) => {
          const Icon = service.icon;
          const isHovered = hoveredService === service.id;

          return (
            <div key={service.id} className="relative">
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <div className="relative rounded-md bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-lg border border-border">
                    {service.name}
                    {/* Arrow pointing to icon */}
                    <div className="absolute left-1/2 top-full -translate-x-1/2">
                      <div className="border-[10px] border-transparent border-t-popover" />
                      <div className="absolute left-1/2 top-[1px] -translate-x-1/2 border-[9px] border-transparent border-t-border" />
                    </div>
                  </div>
                </div>
              )}

              {/* Service Icon */}
              <button
                type="button"
                onMouseEnter={() => setHoveredService(service.id)}
                onMouseLeave={() => setHoveredService(null)}
                className={cn(
                  "flex h-5 w-5 items-center justify-center transition-colors",
                  statusColors[service.status],
                  "hover:opacity-80",
                )}
              >
                <Icon className="h-full w-full" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
