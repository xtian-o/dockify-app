import { auth } from "@/lib/auth";
import { db } from "@/db";
import { deployments } from "@/db/schema";
import { getApplicationStatus } from "@/lib/argocd-client";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Get deployment status from ArgoCD
 * GET /api/deployments/[id]/status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: deploymentId } = await params;

    // Get deployment from database
    const [deployment] = await db
      .select()
      .from(deployments)
      .where(eq(deployments.id, deploymentId))
      .limit(1);

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 },
      );
    }

    // Check if user owns this deployment
    if (deployment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get status from ArgoCD
    const argoStatus = await getApplicationStatus(
      deployment.argocdAppName || deployment.containerName,
    );

    if (!argoStatus.success) {
      return NextResponse.json({
        id: deployment.id,
        status: deployment.status,
        health: deployment.healthStatus,
        argocdError: argoStatus.error,
        lastUpdated: deployment.updatedAt,
      });
    }

    // Update deployment status in database
    await db
      .update(deployments)
      .set({
        status: argoStatus.status === "Synced" ? "deployed" : "deploying",
        healthStatus: argoStatus.health,
        lastSyncTime: new Date(),
      })
      .where(eq(deployments.id, deploymentId));

    return NextResponse.json({
      id: deployment.id,
      status: argoStatus.status === "Synced" ? "deployed" : "deploying",
      health: argoStatus.health,
      syncStatus: argoStatus.status,
      lastUpdated: new Date().toISOString(),
      externalUrl: deployment.externalUrl,
      argocdUrl: deployment.argocdUrl,
    });
  } catch (error) {
    console.error("Error getting deployment status:", error);
    return NextResponse.json(
      {
        error: "Failed to get deployment status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
