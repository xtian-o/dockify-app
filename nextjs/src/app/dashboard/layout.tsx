import { DashboardLayoutClient } from "@/components/dashboard";
import { requireAuth } from "@/lib/auth-helpers";

// Force dynamic rendering for all pages in this route group
export const dynamic = "force-dynamic";

/**
 * Dashboard Layout
 *
 * Protected layout that requires authentication.
 * Includes sidebar navigation, header, and footer.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication - redirect to /sign-in if not authenticated
  await requireAuth();

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
