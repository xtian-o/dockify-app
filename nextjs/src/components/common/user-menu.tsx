"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaChevronDown,
  FaCog,
  FaShieldAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUser,
} from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getUserAvatarUrl } from "@/lib/gravatar";

/**
 * UserMenu Component
 *
 * Displays authenticated user's avatar and dropdown menu with:
 * - User info (name, email, role)
 * - Navigation links (Dashboard, Profile, Settings)
 * - Sign out button
 *
 * Shows when user is authenticated, hidden otherwise.
 */
export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  // Mount portal on client side only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8, // 8px gap (mt-2)
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" className="h-8 px-4 text-sm" asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button className="h-8 px-4 text-sm" asChild>
          <Link href="/get-started">Get Started</Link>
        </Button>
      </div>
    );
  }

  const { user } = session;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "?";

  // Get avatar URL with Gravatar fallback
  const avatarUrl = getUserAvatarUrl(user, { size: 80 });

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-border bg-background p-1 pr-3 transition-colors hover:bg-muted"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar className="h-7 w-7">
          <AvatarImage src={avatarUrl || undefined} alt={user.name || "User"} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:inline-block">
          {user.name || "User"}
        </span>
        <FaChevronDown
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu - Rendered in Portal */}
      {mounted &&
        isOpen &&
        createPortal(
          <AnimatePresence>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[9998]"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "fixed",
                top: `${position.top}px`,
                right: `${position.right}px`,
              }}
              className="z-[9999] w-64 rounded-lg border border-border bg-background shadow-lg"
            >
              {/* User Info */}
              <div className="border-b border-border p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={avatarUrl || undefined}
                      alt={user.name || "User"}
                    />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">
                      {user.name || "User"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    {user.status && (
                      <div className="flex items-center gap-1">
                        <FaShieldAlt className="h-3 w-3 text-primary" />
                        <span className="text-xs font-medium capitalize text-primary">
                          {user.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <FaTachometerAlt className="h-4 w-4 text-muted-foreground" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <FaUser className="h-4 w-4 text-muted-foreground" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <FaCog className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </div>

              {/* Sign Out */}
              <div className="border-t border-border p-2">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <FaSignOutAlt className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
