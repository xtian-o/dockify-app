"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type React from "react";
import { memo } from "react";
import { GrVirtualMachine } from "react-icons/gr";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LogoProps {
  variant?: "full" | "small" | "xsmall" | "collapsed";
  href?: string;
  asLink?: boolean;
}

const LogoComponent: React.FC<LogoProps> = ({
  variant = "full",
  href = "/",
  asLink = true,
}) => {
  // Wrapper component to conditionally render Link
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    asLink ? <Link href={href}>{children}</Link> : children;

  if (variant === "collapsed") {
    return (
      <div className="flex w-full items-center justify-center">
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Wrapper>
                <motion.div
                  className="flex items-center font-semibold tracking-wide"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <motion.div
                    className="flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-sm"
                    transition={{ duration: 0.2 }}
                  >
                    <span className="relative flex h-10 w-10 items-center justify-center bg-primary/80">
                      <motion.div
                        whileHover={{ rotate: 12, scale: 1.1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 15,
                        }}
                      >
                        <GrVirtualMachine className="size-6 text-white dark:text-black" />
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 bg-primary/10"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    </span>
                  </motion.div>
                </motion.div>
              </Wrapper>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={24}>
              <div className="font-semibold">DOCKIFY</div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  }

  if (variant === "xsmall") {
    return (
      <div className="flex items-center">
        <div className="relative">
          <Wrapper>
            <motion.div
              className="flex items-center font-semibold tracking-wide"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div
                className="flex items-center overflow-hidden rounded-md border border-border bg-card shadow-sm"
                transition={{ duration: 0.2 }}
              >
                <span className="relative flex h-6 w-6 items-center justify-center bg-primary/80">
                  <motion.div
                    whileHover={{ rotate: 12 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <GrVirtualMachine className="size-4 text-white dark:text-black" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 bg-primary/10"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </span>
              </motion.div>
            </motion.div>
          </Wrapper>
        </div>
      </div>
    );
  }

  if (variant === "small") {
    return (
      <div className="flex w-full items-center justify-between">
        <div className="relative">
          <Wrapper>
            <motion.div
              className="flex items-center font-semibold tracking-wide"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div
                className="flex items-center overflow-hidden rounded-md border border-border bg-card shadow-sm"
                transition={{ duration: 0.2 }}
              >
                <span className="relative flex h-8 w-8 items-center justify-center bg-primary/80">
                  <motion.div
                    whileHover={{ rotate: 12 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <GrVirtualMachine className="size-5 text-white dark:text-black" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 bg-primary/10"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </span>
              </motion.div>
            </motion.div>
          </Wrapper>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Wrapper>
        <motion.div
          className="relative flex items-center font-semibold tracking-wide"
          whileHover="hover"
          initial="rest"
          animate="rest"
        >
          <motion.div
            className="flex items-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm"
            variants={{
              rest: {
                scale: 1,
                boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
              },
              hover: {
                scale: 1.05,
                boxShadow:
                  "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
              },
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <span className="relative flex h-8 w-9 items-center justify-center bg-primary/80">
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
                <GrVirtualMachine
                  aria-hidden="true"
                  className="size-[18px] text-white dark:text-black"
                />
              </motion.div>
            </span>
            <span className="flex items-center h-8 pl-2 pr-1 text-xs font-extrabold tracking-[0.25em] uppercase text-primary/80 scale-y-[0.96]">
              DOCKIFY
            </span>
          </motion.div>
        </motion.div>
      </Wrapper>
    </div>
  );
};

// Memoized to prevent unnecessary re-renders
const Logo = memo(LogoComponent);
Logo.displayName = "Logo";

export default Logo;
