import * as k8s from "@kubernetes/client-node";

// Initialize Kubernetes client
// This works both locally (with KUBECONFIG) and in-cluster (with service account)
function getKubeConfig() {
  const kc = new k8s.KubeConfig();

  try {
    // Try to load from default kubeconfig (works locally)
    if (process.env.KUBECONFIG) {
      kc.loadFromFile(process.env.KUBECONFIG);
    } else {
      kc.loadFromDefault();
    }
  } catch (error) {
    try {
      // If not found, try in-cluster config (works in production pods)
      kc.loadFromCluster();
    } catch (clusterError) {
      console.error("Failed to load kubeconfig:", error);
      console.error("Failed to load in-cluster config:", clusterError);
      throw new Error("Could not load Kubernetes configuration");
    }
  }

  return kc;
}

/**
 * Apply Kubernetes manifests using the Kubernetes client
 */
export async function applyManifests(
  manifests: unknown[],
): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const kc = getKubeConfig();
    const client = kc.makeApiClient(k8s.KubernetesObjectApi);

    const results: string[] = [];

    for (const manifest of manifests) {
      try {
        // Apply each manifest
        const response = await client.patch(
          manifest as k8s.KubernetesObject,
          undefined,
          undefined,
          undefined,
          undefined,
          {
            headers: {
              "Content-Type": "application/apply-patch+yaml",
            },
          }
        );

        results.push(`Applied: ${response.body.kind}/${response.body.metadata?.name}`);
      } catch (error) {
        // If resource doesn't exist, create it
        try {
          const response = await client.create(manifest as k8s.KubernetesObject);
          results.push(`Created: ${response.body.kind}/${response.body.metadata?.name}`);
        } catch (createError) {
          console.error("Failed to create resource:", createError);
          throw createError;
        }
      }
    }

    return {
      success: true,
      output: results.join("\n"),
    };
  } catch (error) {
    console.error("Error applying manifests:", error);
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
    const kc = getKubeConfig();
    const appsApi = kc.makeApiClient(k8s.AppsV1Api);

    const response = await appsApi.readNamespacedDeployment(name, namespace);
    const deployment = response.body;
    const status = deployment.status;

    return {
      success: true,
      status:
        status?.availableReplicas === deployment.spec?.replicas
          ? "running"
          : "pending",
      availableReplicas: status?.availableReplicas || 0,
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
    const kc = getKubeConfig();
    const coreApi = kc.makeApiClient(k8s.CoreV1Api);

    await coreApi.deleteNamespace(namespace);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
