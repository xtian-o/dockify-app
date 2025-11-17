import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

const KUBECONFIG_PATH =
  process.env.KUBECONFIG ||
  "/Users/cristian/GitHub/monday/kubeconfig/main-dockify.yml";

/**
 * Apply Kubernetes manifests using kubectl
 */
export async function applyManifests(
  manifests: unknown[],
): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    // Convert manifests to JSON (kubectl accepts JSON too)
    const manifestsJSON = manifests.map((m) => JSON.stringify(m)).join("\n");

    // Create temp file
    const tmpFile = path.join("/tmp", `k8s-manifest-${Date.now()}.json`);
    await fs.writeFile(tmpFile, manifestsJSON);

    // Apply with kubectl
    const { stdout, stderr } = await execAsync(
      `export KUBECONFIG=${KUBECONFIG_PATH} && kubectl apply -f ${tmpFile}`,
      {
        timeout: 60000, // 60 seconds timeout
      },
    );

    // Clean up temp file
    await fs.unlink(tmpFile).catch(() => {});

    return {
      success: true,
      output: stdout + (stderr || ""),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get deployment status from Kubernetes
 */
export async function getDeploymentStatus(
  name: string,
  namespace: string,
): Promise<{
  success: boolean;
  status?: string;
  availableReplicas?: number;
  error?: string;
}> {
  try {
    const { stdout } = await execAsync(
      `export KUBECONFIG=${KUBECONFIG_PATH} && kubectl get deployment ${name} -n ${namespace} -o json`,
      {
        timeout: 10000,
      },
    );

    const deployment = JSON.parse(stdout);
    const status = deployment.status;

    return {
      success: true,
      status:
        status.availableReplicas === status.replicas ? "running" : "pending",
      availableReplicas: status.availableReplicas || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete all resources in a namespace
 */
export async function deleteNamespace(
  namespace: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execAsync(
      `export KUBECONFIG=${KUBECONFIG_PATH} && kubectl delete namespace ${namespace} --timeout=60s`,
      {
        timeout: 70000,
      },
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
