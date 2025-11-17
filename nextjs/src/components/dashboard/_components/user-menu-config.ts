import type { IconType } from "react-icons";
import {
  MdAdminPanelSettings,
  MdDashboard,
  MdLogout,
  MdPerson,
  MdSettings,
} from "react-icons/md";

/**
 * User Menu Item Configuration
 *
 * Defines the structure for user menu items including:
 * - Navigation links (with href)
 * - Action buttons (with onClick handler name)
 * - Admin-only items
 */
export interface UserMenuItemConfig {
  /** Unique identifier for the menu item */
  id: string;
  /** Display label */
  label: string;
  /** Icon component from react-icons */
  icon: IconType;
  /** Navigation href (for Link items) */
  href?: string;
  /** Action type (for button items) */
  action?: "signout";
  /** Only show for admin users */
  adminOnly?: boolean;
  /** Show only on specific paths */
  showOnPath?: string;
}

/**
 * User Menu Configuration
 *
 * Centralized configuration for all user menu items.
 * Add new items here to automatically include them in the menu.
 */
export const userMenuConfig: UserMenuItemConfig[] = [
  {
    id: "staff-area",
    label: "Staff Area",
    icon: MdAdminPanelSettings,
    href: "/staff",
    adminOnly: true,
    showOnPath: "/dashboard",
  },
  {
    id: "client-area",
    label: "Client Area",
    icon: MdDashboard,
    href: "/dashboard",
    adminOnly: true,
    showOnPath: "/staff",
  },
  {
    id: "profile",
    label: "Profile",
    icon: MdPerson,
    href: "/profile",
  },
  {
    id: "settings",
    label: "Settings",
    icon: MdSettings,
    href: "/settings",
  },
  {
    id: "signout",
    label: "Sign Out",
    icon: MdLogout,
    action: "signout",
  },
];
