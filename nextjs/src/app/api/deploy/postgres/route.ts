import { auth } from "@/lib/auth";
import { db } from "@/db";
import { deployments, deploymentEnvVars } from "@/db/schema";
import {
  generateStrongPassword,
  getNextAvailableNodePort,
  generateExternalUrl,
  getExternalHost,
} from "@/lib/deployment-utils";
import { generatePostgresManifests } from "@/lib/k8s-manifests";
import { applyManifests } from "@/lib/kubectl";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DeployRequest {
  image: string;
  tag: string;
  containerName?: string;
  port?: string;
  pvcSize?: string;
  envVars?: {
    POSTGRES_USER?: string;
    POSTGRES_PASSWORD?: string;
    POSTGRES_DB?: string;
  };
}

/**
 * API Route to deploy PostgreSQL
 * POST /api/deploy/postgres
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: DeployRequest = await request.json();

    // Validate required fields
    if (!body.image || !body.tag) {
      return NextResponse.json(
        { error: "Image and tag are required" },
        { status: 400 },
      );
    }

    // Generate deployment configuration
    const containerName =
      body.containerName || `${body.image}-${body.tag.replace(/\./g, "-")}`;

    // Allocate NodePort
    const nodePort = await getNextAvailableNodePort();

    // Generate external URL
    const externalHost = getExternalHost();
    const externalUrl = generateExternalUrl(externalHost, nodePort);

    // Generate strong password if not provided
    const postgresPassword =
      body.envVars?.POSTGRES_PASSWORD || generateStrongPassword(32);

    // Prepare environment variables
    const envVarsConfig = {
      POSTGRES_USER: body.envVars?.POSTGRES_USER || "postgres",
      POSTGRES_PASSWORD: postgresPassword,
      POSTGRES_DB: body.envVars?.POSTGRES_DB || "postgres",
    };

    // Create deployment record in database
    const [deployment] = await db
      .insert(deployments)
      .values({
        userId: session.user.id,
        name: containerName,
        type: "postgres",
        image: body.image,
        tag: body.tag,
        containerName,
        // namespace will be auto-generated UUID
        port: 5432, // Internal container port
        nodePort,
        pvcSize: parseInt(body.pvcSize || "10"),
        externalUrl,
        externalHost,
        argocdAppName: containerName,
        argocdUrl: `${process.env.ARGOCD_URL || "https://argocd.dockify.app"}/applications/${containerName}`,
        status: "pending",
        metadata: {
          requestedAt: new Date().toISOString(),
          requestBody: body,
        },
      })
      .returning();

    // Save environment variables
    const envVarRecords = Object.entries(envVarsConfig).map(([key, value]) => ({
      deploymentId: deployment.id,
      key,
      value,
      isSecret: key === "POSTGRES_PASSWORD", // Mark password as secret
    }));

    await db.insert(deploymentEnvVars).values(envVarRecords);

    // Generate Kubernetes manifests
    const manifests = generatePostgresManifests({
      namespace: deployment.namespace!,
      name: containerName,
      image: body.image,
      tag: body.tag,
      nodePort,
      pvcSize: parseInt(body.pvcSize || "10"),
      envVars: envVarsConfig,
    });

    // Update status to deploying
    await db
      .update(deployments)
      .set({ status: "deploying" })
      .where(eq(deployments.id, deployment.id));

    // Apply manifests to Kubernetes cluster
    const k8sResult = await applyManifests(manifests);

    if (!k8sResult.success) {
      // Update status to failed
      await db
        .update(deployments)
        .set({
          status: "failed",
          errorMessage: "Failed to apply Kubernetes manifests",
          errorDetails: { error: k8sResult.error },
        })
        .where(eq(deployments.id, deployment.id));

      return NextResponse.json(
        {
          error: "Failed to deploy to Kubernetes",
          details: k8sResult.error,
        },
        { status: 500 },
      );
    }

    // Update status to deployed
    await db
      .update(deployments)
      .set({
        status: "deployed",
        deployedAt: new Date(),
        metadata: {
          ...(deployment.metadata && typeof deployment.metadata === 'object' ? deployment.metadata : {}),
          k8sOutput: k8sResult.output,
          deployedAt: new Date().toISOString(),
        },
      })
      .where(eq(deployments.id, deployment.id));

    return NextResponse.json({
      success: true,
      message: "Deployment configuration created successfully",
      deployment: {
        id: deployment.id,
        name: deployment.name,
        image: `${deployment.image}:${deployment.tag}`,
        namespace: deployment.namespace,
        nodePort: deployment.nodePort,
        externalUrl: deployment.externalUrl,
        argocdUrl: deployment.argocdUrl,
        status: deployment.status,
      },
      credentials: {
        user: envVarsConfig.POSTGRES_USER,
        password: postgresPassword,
        database: envVarsConfig.POSTGRES_DB,
      },
    });
  } catch (error) {
    console.error("Error deploying PostgreSQL:", error);
    return NextResponse.json(
      {
        error: "Failed to deploy PostgreSQL",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
