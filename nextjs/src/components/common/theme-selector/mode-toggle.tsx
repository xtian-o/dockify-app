"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import * as React from "react";
import { Button } from "@/components/ui/button";

interface ModeToggleProps {
  size?: "default" | "sm" | "xs";
}

export function ModeToggle({ size = "default" }: ModeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = () => {
    // Cycle: light → dark → system → light
    const newTheme =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as any).startViewTransition(() => {
        setTheme(newTheme);
      });
    } else {
      setTheme(newTheme);
    }
  };

  const buttonSize = size === "xs" ? "h-7 w-7" : size === "sm" ? "h-8 w-8" : "";
  const iconSize =
    size === "xs" ? "size-3" : size === "sm" ? "size-3.5" : "size-4";
  const moonSize =
    size === "xs"
      ? "size-[13px]"
      : size === "sm"
        ? "size-[15px]"
        : "size-[17px]";

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={size !== "default" ? buttonSize : ""}
      >
        <div className={iconSize} />
      </Button>
    );
  }

  const getIcon = () => {
    switch (theme) {
      case "dark":
        return "sun";
      case "system":
        return "monitor";
      default:
        return "moon";
    }
  };

  const currentIcon = getIcon();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleThemeChange}
      className={`relative overflow-hidden ${size !== "default" ? buttonSize : ""}`}
      aria-label={`Current theme: ${theme}. Click to switch.`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {currentIcon === "sun" && (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 90, scale: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`${iconSize} text-black dark:text-white`}
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          </motion.div>
        )}

        {currentIcon === "moon" && (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: -90, scale: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`${moonSize} text-black dark:text-white`}
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </motion.div>
        )}

        {currentIcon === "monitor" && (
          <motion.div
            key="monitor"
            initial={{ y: -10, scale: 0 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 10, scale: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`${iconSize} text-black dark:text-white`}
            >
              <rect width="20" height="14" x="2" y="3" rx="2" />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only">Toggle theme: {theme}</span>
    </Button>
  );
}
