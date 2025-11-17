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
      const obj = manifest as k8s.KubernetesObject;
      try {
        // Try to create the resource
        await client.create(obj);
        results.push(`Created: ${obj.kind}/${obj.metadata?.name}`);
      } catch (error: any) {
        // If resource already exists, try to replace/update it
        if (error?.statusCode === 409) {
          try {
            await client.replace(obj);
            results.push(`Updated: ${obj.kind}/${obj.metadata?.name}`);
          } catch (replaceError) {
            console.error("Failed to update resource:", replaceError);
            throw replaceError;
          }
        } else {
          console.error("Failed to create resource:", error);
          throw error;
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

    const deployment = await appsApi.readNamespacedDeployment({ name, namespace });
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

    await coreApi.deleteNamespace({ name: namespace });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
