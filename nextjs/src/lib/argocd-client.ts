/**
 * ArgoCD API Client
 *
 * Documentation: https://argo-cd.readthedocs.io/en/stable/developer-guide/api-docs/
 */

const ARGOCD_URL = process.env.ARGOCD_URL || "https://argocd.dockify.app";
const ARGOCD_TOKEN = process.env.ARGOCD_TOKEN;

interface ArgoApplication {
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    project: string;
    source: {
      repoURL: string;
      path?: string;
      targetRevision: string;
    };
    destination: {
      server: string;
      namespace: string;
    };
    syncPolicy?: {
      automated?: {
        prune: boolean;
        selfHeal: boolean;
      };
    };
  };
  status?: {
    health?: {
      status: string; // Healthy, Progressing, Degraded, Suspended, Missing, Unknown
    };
    sync?: {
      status: string; // Synced, OutOfSync, Unknown
    };
  };
}

/**
 * Get ArgoCD Application status
 */
export async function getApplicationStatus(
  appName: string,
): Promise<{ success: boolean; status?: string; health?: string; error?: string }> {
  if (!ARGOCD_TOKEN) {
    return { success: false, error: "ArgoCD token not configured" };
  }

  try {
    const response = await fetch(`${ARGOCD_URL}/api/v1/applications/${appName}`, {
      headers: {
        Authorization: `Bearer ${ARGOCD_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Application not found in ArgoCD" };
      }
      return { success: false, error: `ArgoCD API error: ${response.status}` };
    }

    const app: ArgoApplication = await response.json();

    return {
      success: true,
      status: app.status?.sync?.status || "Unknown",
      health: app.status?.health?.status || "Unknown",
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get application status: ${error}`,
    };
  }
}

/**
 * Create ArgoCD Application
 */
export async function createApplication(
  appName: string,
  namespace: string,
  manifests: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  if (!ARGOCD_TOKEN) {
    return { success: false, error: "ArgoCD token not configured" };
  }

  // For now, we're not creating ArgoCD apps directly
  // Instead, we'll apply manifests via kubectl
  // TODO: Implement Git-based workflow with ArgoCD

  return {
    success: true,
  };
}

/**
 * Sync ArgoCD Application (trigger deployment)
 */
export async function syncApplication(
  appName: string,
): Promise<{ success: boolean; error?: string }> {
  if (!ARGOCD_TOKEN) {
    return { success: false, error: "ArgoCD token not configured" };
  }

  try {
    const response = await fetch(
      `${ARGOCD_URL}/api/v1/applications/${appName}/sync`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ARGOCD_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prune: false,
          dryRun: false,
          strategy: {
            hook: {
              force: false,
            },
          },
        }),
      },
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to sync application: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Sync error: ${error}` };
  }
}

/**
 * Delete ArgoCD Application
 */
export async function deleteApplication(
  appName: string,
): Promise<{ success: boolean; error?: string }> {
  if (!ARGOCD_TOKEN) {
    return { success: false, error: "ArgoCD token not configured" };
  }

  try {
    const response = await fetch(
      `${ARGOCD_URL}/api/v1/applications/${appName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${ARGOCD_TOKEN}`,
        },
      },
    );

    if (!response.ok && response.status !== 404) {
      return {
        success: false,
        error: `Failed to delete application: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Delete error: ${error}` };
  }
}
