/**
 * Check Permission API Route
 *
 * Returns whether the current user has a specific permission
 *
 * GET /api/auth/check-permission?permission=users:create
 */

import { NextResponse } from "next/server";
import { userHasPermission } from "@/db/queries";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { hasPermission: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Get permission from query params
    const { searchParams } = new URL(request.url);
    const permission = searchParams.get("permission");

    if (!permission) {
      return NextResponse.json(
        { hasPermission: false, error: "Permission parameter required" },
        { status: 400 },
      );
    }

    // Check permission
    const hasPermission = await userHasPermission(session.user.id, permission);

    return NextResponse.json({ hasPermission });
  } catch (error) {
    console.error("Check permission error:", error);
    return NextResponse.json(
      { hasPermission: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
