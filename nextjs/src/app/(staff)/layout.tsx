import { StaffLayoutClient } from "@/components/staff/staff-layout-client";
import { requireRole } from "@/lib/auth-helpers";

// Force dynamic rendering for all pages in this route group
export const dynamic = "force-dynamic";

/**
 * Staff Area Layout
 *
 * Protected layout that requires admin role.
 * Separate from dashboard for staff-specific functionality.
 * Used by: /staff and all staff sub-routes
 */
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require admin role - redirect to /unauthorized if not admin
  await requireRole("admin");

  return <StaffLayoutClient>{children}</StaffLayoutClient>;
}
