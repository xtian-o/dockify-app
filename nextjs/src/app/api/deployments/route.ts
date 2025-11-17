import { auth } from "@/lib/auth";
import { db } from "@/db";
import { deployments, deploymentEnvVars } from "@/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * API Route to list user's deployments
 * GET /api/deployments
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all deployments for the user (excluding deleted ones)
    const userDeployments = await db
      .select()
      .from(deployments)
      .where(
        and(
          eq(deployments.userId, session.user.id),
          isNull(deployments.deletedAt)
        )
      )
      .orderBy(desc(deployments.createdAt));

    // Get environment variables for each deployment
    const deploymentsWithEnvVars = await Promise.all(
      userDeployments.map(async (deployment) => {
        const envVars = await db
          .select()
          .from(deploymentEnvVars)
          .where(eq(deploymentEnvVars.deploymentId, deployment.id));

        return {
          ...deployment,
          envVars: envVars.map((env) => ({
            key: env.key,
            value: env.isSecret ? "***HIDDEN***" : env.value,
            isSecret: env.isSecret,
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      deployments: deploymentsWithEnvVars,
      count: deploymentsWithEnvVars.length,
    });
  } catch (error) {
    console.error("Error fetching deployments:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch deployments",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
