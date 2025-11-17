/**
 * User Permissions API Route
 *
 * Returns all permissions for the current user
 *
 * GET /api/auth/permissions
 */

import { NextResponse } from "next/server";
import { getUserPermissions } from "@/db/queries";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { permissions: [], error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Get all user permissions
    const permissions = await getUserPermissions(session.user.id);

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Get permissions error:", error);
    return NextResponse.json(
      { permissions: [], error: "Internal server error" },
      { status: 500 },
    );
  }
}
