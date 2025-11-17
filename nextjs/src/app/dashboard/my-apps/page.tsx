"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MdApps,
  MdRefresh,
  MdOpenInNew,
  MdContentCopy,
  MdCheckCircle,
  MdError,
  MdAccessTime,
  MdDelete,
  MdWarning,
} from "react-icons/md";
import { SiPostgresql } from "react-icons/si";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Deployment {
  id: string;
  name: string;
  type: string;
  image: string;
  tag: string;
  status: string;
  externalUrl: string;
  nodePort: number;
  namespace: string;
  createdAt: string;
  deployedAt: string | null;
  argocdUrl: string | null;
  envVars: Array<{
    key: string;
    value: string;
    isSecret: boolean;
  }>;
}

export default function MyAppsPage() {
  const router = useRouter();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deploymentToDelete, setDeploymentToDelete] = useState<Deployment | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/deployments");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch deployments");
      }

      setDeployments(data.deployments || []);
    } catch (error) {
      console.error("Error fetching deployments:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch deployments");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    console.log(`Copied ${label || "text"} to clipboard`);
  };

  const handleDeleteClick = (deployment: Deployment) => {
    setDeploymentToDelete(deployment);
    setConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deploymentToDelete || confirmText !== "confirm") {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/deployments/${deploymentToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete deployment");
      }

      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        console.warn("Delete warnings:", data.warnings);
      }

      // Close dialog and refresh deployments
      setDeleteDialogOpen(false);
      setDeploymentToDelete(null);
      setConfirmText("");
      await fetchDeployments();
    } catch (error) {
      console.error("Error deleting deployment:", error);
      alert(error instanceof Error ? error.message : "Failed to delete deployment");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed":
        return "text-green-500";
      case "deploying":
        return "text-blue-500";
      case "failed":
        return "text-red-500";
      case "pending":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed":
        return MdCheckCircle;
      case "failed":
        return MdError;
      default:
        return MdAccessTime;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "postgres":
        return SiPostgresql;
      default:
        return MdApps;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-primary/80 bg-primary/10">
            <MdApps className="h-6 w-6 text-primary/80" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary/80">
              My Apps
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your deployed applications
            </p>
          </div>
        </div>

        <motion.button
          onClick={fetchDeployments}
          disabled={loading}
          className="relative flex h-9 items-center gap-2 overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm transition-colors isolate px-4 text-xs font-medium text-primary/80 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MdRefresh className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </motion.button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-md border border-primary/80 bg-primary/5 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-md border border-red-500/80 border-r-[3px] border-b-[3px] bg-red-500/5 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <MdError className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-600 dark:text-red-400 mb-1">
                Error loading deployments
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <motion.button
                onClick={fetchDeployments}
                className="mt-3 flex items-center gap-2 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MdRefresh className="h-3.5 w-3.5" />
                Try Again
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && deployments.length === 0 && (
        <div className="rounded-md border border-primary/80 border-r-[3px] border-b-[3px] bg-card shadow-sm p-12 text-center">
          <MdApps className="h-16 w-16 text-primary/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary/80 mb-2">
            No deployments yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Deploy your first application from the App Catalog
          </p>
          <motion.button
            onClick={() => router.push("/dashboard/apps")}
            className="relative flex h-10 items-center gap-2 overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-primary/80 shadow-sm transition-colors isolate px-6 text-sm font-medium text-white mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Browse App Catalog
          </motion.button>
        </div>
      )}

      {/* Deployments Grid */}
      {!loading && !error && deployments.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {deployments.map((deployment) => {
            const StatusIcon = getStatusIcon(deployment.status);
            const TypeIcon = getTypeIcon(deployment.type);

            return (
              <motion.div
                key={deployment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md border border-primary/80 border-r-[3px] border-b-[3px] bg-card shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div className="bg-primary/5 border-b border-primary/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/80 bg-blue-500/80">
                        <TypeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-primary/80 truncate">
                          {deployment.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {deployment.image}:{deployment.tag}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-3 flex items-center gap-2">
                    <StatusIcon className={cn("h-4 w-4", getStatusColor(deployment.status))} />
                    <span className={cn("text-xs font-medium capitalize", getStatusColor(deployment.status))}>
                      {deployment.status}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {/* External URL */}
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">
                      External URL
                    </label>
                    <div className="flex items-center gap-2">
                      <a
                        href={deployment.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-2 py-1.5 text-[10px] font-mono rounded-md border border-primary/80 bg-primary/5 text-blue-600 hover:text-blue-700 hover:bg-primary/10 transition-colors truncate"
                      >
                        {deployment.externalUrl}
                      </a>
                      <motion.button
                        onClick={() => copyToClipboard(deployment.externalUrl, "URL")}
                        className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-blue-500/80 shadow-sm transition-colors isolate"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MdContentCopy className="h-3 w-3 text-white" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-muted-foreground">NodePort:</span>
                      <p className="font-mono text-primary/80 mt-0.5">
                        {deployment.nodePort}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-mono text-primary/80 mt-0.5 capitalize">
                        {deployment.type}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Namespace:</span>
                      <p className="font-mono text-primary/80 mt-0.5 truncate" title={deployment.namespace}>
                        {deployment.namespace}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Created:</span>
                      <p className="text-primary/80 mt-0.5">
                        {new Date(deployment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-primary/80 p-3 bg-primary/5 flex items-center gap-2">
                  {deployment.argocdUrl && (
                    <a
                      href={deployment.argocdUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 h-8 rounded-md border border-primary/80 border-r-[3px] bg-card hover:bg-primary/5 transition-colors text-xs font-medium text-primary/80"
                    >
                      <MdOpenInNew className="h-3 w-3" />
                      ArgoCD
                    </a>
                  )}
                  <motion.button
                    onClick={() => handleDeleteClick(deployment)}
                    className="flex items-center justify-center gap-2 h-8 px-3 rounded-md border border-red-500/80 border-r-[3px] bg-card hover:bg-red-500/5 transition-colors text-xs font-medium text-red-600"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Delete deployment"
                  >
                    <MdDelete className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <MdWarning className="h-6 w-6" />
              Delete Deployment
            </DialogTitle>
            <DialogDescription>
              This action will permanently delete this deployment from both Kubernetes and ArgoCD.
            </DialogDescription>
          </DialogHeader>

          {deploymentToDelete && (
            <div className="space-y-4 mt-4">
              {/* Deployment Info */}
              <div className="rounded-md border border-red-500/80 bg-red-500/5 p-3">
                <p className="text-sm font-semibold text-primary/80 mb-1">
                  {deploymentToDelete.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {deploymentToDelete.image}:{deploymentToDelete.tag}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Namespace: {deploymentToDelete.namespace}
                </p>
              </div>

              {/* Warning */}
              <div className="rounded-md border border-yellow-500/80 bg-yellow-500/5 p-3">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  <strong>Warning:</strong> This will delete:
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 ml-4 list-disc space-y-1">
                  <li>The Kubernetes namespace and all resources</li>
                  <li>Persistent Volume Claims (PVC) and all data</li>
                  <li>The ArgoCD application</li>
                </ul>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                  The deployment record will be kept in the database for audit purposes.
                </p>
              </div>

              {/* Confirmation Input */}
              <div>
                <label className="block text-sm font-medium text-primary/80 mb-2">
                  Type <span className="font-mono font-bold text-red-600">confirm</span> to delete:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="confirm"
                  className="w-full px-3 py-2 text-sm rounded-md border border-primary/80 bg-background text-primary/80 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={deleting}
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <motion.button
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setConfirmText("");
                  }}
                  disabled={deleting}
                  className="px-4 py-2 text-sm rounded-md border border-primary/80 bg-card hover:bg-primary/5 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDeleteConfirm}
                  disabled={confirmText !== "confirm" || deleting}
                  className="px-4 py-2 text-sm rounded-md border border-red-500/80 border-r-[3px] bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {deleting ? "Deleting..." : "Delete Permanently"}
                </motion.button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
