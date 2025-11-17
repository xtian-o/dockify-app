"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdChevronRight } from "react-icons/md";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: string;
}

interface CollapsedMenuTooltipProps {
  title: string;
  titleIcon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
  openUpwards: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function CollapsedMenuTooltip({
  title,
  titleIcon: TitleIcon,
  items,
  openUpwards,
  onMouseEnter,
  onMouseLeave,
}: CollapsedMenuTooltipProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "absolute left-full ml-6 z-50",
        openUpwards ? "bottom-[-2px]" : "top-[-2px]",
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-card rounded-md border-[0.5px] border-primary/80 shadow-lg p-3 min-w-[250px] relative flex flex-col">
        {/* Triangle arrow pointing to button */}
        <div
          className={cn(
            "absolute -left-1.5",
            openUpwards ? "bottom-[15px]" : "top-[15px]",
          )}
        >
          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-primary/80"></div>
        </div>

        {/* Content - reversed order when opening upwards */}
        {openUpwards ? (
          <>
            {/* Items first when opening upwards */}
            <div className="relative ml-8 mb-2 space-y-2">
              {/* Vertical Line - perfect positioning from External Services */}
              <div
                className="absolute left-[-16px] top-[12px] border-l border-primary/80"
                style={{
                  height: `${(items.length - 1) * 32 + 8 + 12 + 24}px`,
                }}
              />

              {/* Items - normal order for better visual flow */}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href &&
                  (pathname === item.href ||
                    pathname.startsWith(`${item.href}/`));

                const itemContent = (
                  <>
                    {/* Icon Container */}
                    <span className="relative z-10 flex h-full w-7 shrink-0 items-center justify-center bg-primary/80">
                      <Icon className="h-3.5 w-3.5 text-white dark:text-black" />
                    </span>

                    {/* Label */}
                    <span className="relative z-10 flex-1 px-2.5 text-[11px] font-medium text-primary/80">
                      {item.name}
                    </span>

                    {/* Chevron */}
                    <div className="relative z-10 flex h-4 items-center border-l border-primary/80 pl-2 pr-2">
                      <MdChevronRight className="h-3.5 w-3.5 text-primary/80" />
                    </div>
                  </>
                );

                return (
                  <div key={item.id} className="relative">
                    {/* Horizontal Branch Line */}
                    <div className="absolute left-[-16px] top-[12px] h-0 w-4 border-b border-primary/80" />
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex h-7 items-center overflow-hidden rounded-md border-[0.5px] border-primary/80 bg-card shadow-sm transition-colors",
                          isActive && "bg-primary/10",
                        )}
                      >
                        {itemContent}
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          if (item.action === "signout") {
                            window.location.href = "/api/auth/signout";
                          }
                        }}
                        className={cn(
                          "relative flex h-7 w-full items-center overflow-hidden rounded-md border-[0.5px] border-primary/80 bg-card shadow-sm transition-colors",
                          isActive && "bg-primary/10",
                        )}
                      >
                        {itemContent}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Header at bottom when opening upwards */}
            <div className="relative flex h-8 items-center overflow-hidden rounded-md border-[0.5px] border-primary/80 bg-card shadow-sm mt-2">
              {/* Icon Container */}
              <span className="relative z-10 flex h-full w-7 shrink-0 items-center justify-center bg-primary/80">
                <TitleIcon className="h-3.5 w-3.5 text-white dark:text-black" />
              </span>

              {/* Label */}
              <span className="relative z-10 flex-1 px-2.5 text-[11px] font-semibold text-primary/80">
                {title}
              </span>

              {/* Chevron */}
              <div className="relative z-10 flex h-4 items-center border-l border-primary/80 pl-2 pr-2">
                <MdChevronRight className="h-3.5 w-3.5 text-primary/80" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Normal order when opening downwards */}
            <div className="relative flex h-8 items-center overflow-hidden rounded-md border-[0.5px] border-primary/80 bg-card shadow-sm mb-2">
              {/* Icon Container */}
              <span className="relative z-10 flex h-full w-7 shrink-0 items-center justify-center bg-primary/80">
                <TitleIcon className="h-3.5 w-3.5 text-white dark:text-black" />
              </span>

              {/* Label */}
              <span className="relative z-10 flex-1 px-2.5 text-[11px] font-semibold text-primary/80">
                {title}
              </span>

              {/* Chevron */}
              <div className="relative z-10 flex h-4 items-center border-l border-primary/80 pl-2 pr-2">
                <MdChevronRight className="h-3.5 w-3.5 text-primary/80" />
              </div>
            </div>

            <div className="relative ml-8 mt-2 space-y-2">
              {/* Vertical Line */}
              <div
                className="absolute left-[-16px] top-[-17px] border-l border-primary/80"
                style={{
                  height: `${(items.length - 1) * 30 + 30}px`,
                }}
              />

              {/* Items */}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href &&
                  (pathname === item.href ||
                    pathname.startsWith(`${item.href}/`));

                const itemContent = (
                  <>
                    {/* Icon Container */}
                    <span className="relative z-10 flex h-full w-7 shrink-0 items-center justify-center bg-primary/80">
                      <Icon className="h-3.5 w-3.5 text-white dark:text-black" />
                    </span>

                    {/* Label */}
                    <span className="relative z-10 flex-1 px-2.5 text-[11px] font-medium text-primary/80">
                      {item.name}
                    </span>

                    {/* Chevron */}
                    <div className="relative z-10 flex h-4 items-center border-l border-primary/80 pl-2 pr-2">
                      <MdChevronRight className="h-3.5 w-3.5 text-primary/80" />
                    </div>
                  </>
                );

                return (
                  <div key={item.id} className="relative">
                    {/* Horizontal Branch Line */}
                    <div className="absolute left-[-16px] top-[12px] h-0 w-4 border-b border-primary/80" />
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex h-7 items-center overflow-hidden rounded-md border-[0.5px] border-primary/80 bg-card shadow-sm transition-colors",
                          isActive && "bg-primary/10",
                        )}
                      >
                        {itemContent}
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          if (item.action === "signout") {
                            window.location.href = "/api/auth/signout";
                          }
                        }}
                        className={cn(
                          "relative flex h-7 w-full items-center overflow-hidden rounded-md border-[0.5px] border-primary/80 bg-card shadow-sm transition-colors",
                          isActive && "bg-primary/10",
                        )}
                      >
                        {itemContent}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
