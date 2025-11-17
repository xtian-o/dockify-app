/**
 * User Roles API Route
 *
 * Returns all roles for the current user
 *
 * GET /api/auth/roles
 */

import { NextResponse } from "next/server";
import { getUserRoles } from "@/db/queries";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { roles: [], error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Get all user roles
    const roles = await getUserRoles(session.user.id);

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Get roles error:", error);
    return NextResponse.json(
      { roles: [], error: "Internal server error" },
      { status: 500 },
    );
  }
}
