/**
 * Check Role API Route
 *
 * Returns whether the current user has a specific role
 *
 * GET /api/auth/check-role?role=admin
 */

import { NextResponse } from "next/server";
import { userHasRole } from "@/db/queries";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { hasRole: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Get role from query params
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    if (!role) {
      return NextResponse.json(
        { hasRole: false, error: "Role parameter required" },
        { status: 400 },
      );
    }

    // Check role
    const hasRole = await userHasRole(session.user.id, role);

    return NextResponse.json({ hasRole });
  } catch (error) {
    console.error("Check role error:", error);
    return NextResponse.json(
      { hasRole: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
