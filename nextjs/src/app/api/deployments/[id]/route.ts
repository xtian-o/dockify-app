import { auth } from "@/lib/auth";
import { db } from "@/db";
import { deployments } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { deleteNamespace } from "@/lib/kubectl";

export const dynamic = "force-dynamic";

/**
 * Delete a deployment (soft delete in DB, hard delete from K8s and ArgoCD)
 * DELETE /api/deployments/[id]
 */
export async function DELETE(
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
      .where(
        and(
          eq(deployments.id, deploymentId),
          isNull(deployments.deletedAt)
        )
      )
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

    const errors: string[] = [];

    // Delete from Kubernetes (namespace and all resources including PVC)
    if (deployment.namespace) {
      try {
        const result = await deleteNamespace(deployment.namespace);
        if (result.success) {
          console.log(`Deleted namespace ${deployment.namespace} from Kubernetes`);
        } else {
          const errorMsg = `Failed to delete namespace from Kubernetes: ${result.error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Failed to delete namespace from Kubernetes: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Delete from ArgoCD
    if (deployment.argocdAppName) {
      try {
        const argocdUrl = process.env.ARGOCD_URL;
        const argocdToken = process.env.ARGOCD_TOKEN;

        if (argocdUrl && argocdToken) {
          const deleteResponse = await fetch(
            `${argocdUrl}/api/v1/applications/${deployment.argocdAppName}?cascade=true`,
            {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${argocdToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (deleteResponse.ok) {
            console.log(`Deleted application ${deployment.argocdAppName} from ArgoCD`);
          } else {
            const errorText = await deleteResponse.text();
            const errorMsg = `Failed to delete from ArgoCD: ${deleteResponse.status} ${errorText}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        } else {
          errors.push("ArgoCD credentials not configured");
        }
      } catch (error) {
        const errorMsg = `Failed to delete from ArgoCD: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Soft delete from database (mark as deleted)
    await db
      .update(deployments)
      .set({
        deletedAt: new Date(),
        status: "deleted",
        metadata: {
          ...(deployment.metadata && typeof deployment.metadata === 'object' ? deployment.metadata : {}),
          deletedBy: session.user.id,
          deletedAt: new Date().toISOString(),
          deleteErrors: errors.length > 0 ? errors : undefined,
        },
      })
      .where(eq(deployments.id, deploymentId));

    return NextResponse.json({
      success: true,
      message: errors.length > 0
        ? "Deployment marked as deleted, but some cleanup operations failed"
        : "Deployment deleted successfully",
      warnings: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error deleting deployment:", error);
    return NextResponse.json(
      {
        error: "Failed to delete deployment",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
