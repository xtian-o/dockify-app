"use client";

import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MdArrowBack,
  MdCheckCircle,
  MdContentCopy,
  MdInfo,
  MdKey,
  MdRefresh,
  MdOpenInNew,
  MdLink,
} from "react-icons/md";
import { SiPostgresql, SiRedis } from "react-icons/si";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DockerTag {
  name: string;
  lastUpdated: string;
  digest: string;
  size: number;
}

interface TagsResponse {
  image: string;
  count: number;
  tags: DockerTag[];
}

export default function DeployAppPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;

  // App-specific configuration
  const appConfig = {
    postgres: {
      name: "PostgreSQL",
      icon: SiPostgresql,
      color: "bg-blue-500/80",
      defaultPort: "30432",
      internalPort: 5432,
      defaultEnvVars: {
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "",
        POSTGRES_DB: "postgres",
      },
    },
    redis: {
      name: "Redis",
      icon: SiRedis,
      color: "bg-red-500/80",
      defaultPort: "30379",
      internalPort: 6379,
      defaultEnvVars: {
        REDIS_PASSWORD: "",
      },
    },
  };

  const currentApp = appConfig[appId as keyof typeof appConfig] || appConfig.postgres;

  const [tags, setTags] = useState<DockerTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<{
    success: boolean;
    message?: string;
    deployment?: {
      id: string;
      name: string;
      image: string;
      namespace: string;
      nodePort: number;
      externalUrl: string;
      argocdUrl: string;
      status: string;
    };
    credentials?: {
      user?: string;
      password: string;
      database?: string;
    };
  } | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [containerName, setContainerName] = useState("");

  // Initialize port and envVars based on appId to prevent hydration mismatch
  const [port, setPort] = useState(() => {
    const config = appConfig[appId as keyof typeof appConfig] || appConfig.postgres;
    return config.defaultPort;
  });
  const [pvcSize, setPvcSize] = useState("10");
  const [envVars, setEnvVars] = useState<Record<string, string>>(() => {
    const config = appConfig[appId as keyof typeof appConfig] || appConfig.postgres;
    return config.defaultEnvVars;
  });

  const generatePassword = () => {
    // Generate strong password (32 chars, alphanumeric + special)
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
    const length = 32;
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));

    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }

    // Set password based on app type
    if (appId === "postgres") {
      setEnvVars({ ...envVars, POSTGRES_PASSWORD: password });
    } else if (appId === "redis") {
      setEnvVars({ ...envVars, REDIS_PASSWORD: password });
    }
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
    console.log(`Copied ${label || "text"} to clipboard`);
  };

  // Helper function to extract hostname from externalUrl
  const getHostFromUrl = (url: string): string => {
    try {
      // Remove protocol if present
      const withoutProtocol = url.replace(/^https?:\/\//, '');
      // Remove port if present (split on first colon)
      const hostname = withoutProtocol.split(':')[0];
      return hostname;
    } catch {
      return url;
    }
  };

  // Helper function to URL encode password for connection string
  const urlEncodePassword = (password: string): string => {
    return encodeURIComponent(password);
  };

  useEffect(() => {
    fetchTags();
  }, [appId]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/docker/tags?image=${appId}&limit=20`);
      const data: TagsResponse = await response.json();

      if (data.tags) {
        setTags(data.tags);
        // Auto-select the latest version
        if (data.tags.length > 0) {
          setSelectedTag(data.tags[0].name);
        }
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    try {
      setDeploying(true);
      setDeploymentResult(null);

      const response = await fetch(`/api/deploy/${appId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: appId,
          tag: selectedTag,
          containerName: containerName || `${appId}-${selectedTag.replace(/\./g, "-")}`,
          port,
          pvcSize,
          envVars,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Deployment failed");
      }

      setDeploymentResult({
        success: true,
        message: data.message,
        deployment: data.deployment,
        credentials: data.credentials,
      });

      // Open the dialog
      setShowDialog(true);

      console.log("Deployment successful:", data);
    } catch (error) {
      console.error("Deployment error:", error);
      setDeploymentResult({
        success: false,
        message: error instanceof Error ? error.message : "Deployment failed",
      });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <motion.button
          onClick={() => router.back()}
          className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm transition-colors isolate"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MdArrowBack className="h-5 w-5 text-primary/80" />
        </motion.button>

        <div className="flex items-center gap-3">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-md border border-primary/80", currentApp.color)}>
            <currentApp.icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary/80">
              Deploy {currentApp.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure and deploy your {appId === "postgres" ? "database" : "cache"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Version Selection */}
          <div className="rounded-md border border-primary/80 border-r-[3px] border-b-[3px] bg-card shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary/80">
                Select Version
              </h2>
              <motion.button
                onClick={fetchTags}
                disabled={loading}
                className="relative flex h-8 items-center gap-2 overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm transition-colors isolate px-3 text-xs font-medium text-primary/80 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MdRefresh
                  className={cn("h-4 w-4", loading && "animate-spin")}
                />
                Refresh
              </motion.button>
            </div>

            {loading ? (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 rounded-md border border-primary/80 bg-primary/5 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {tags.map((tag) => (
                  <motion.button
                    key={tag.name}
                    onClick={() => setSelectedTag(tag.name)}
                    className={cn(
                      "relative flex items-center justify-center h-10 overflow-hidden rounded-md border border-primary/80 bg-card shadow-sm transition-colors isolate",
                      selectedTag === tag.name && "bg-primary/10 border-r-[3px]",
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-xs font-semibold text-primary/80">
                      {tag.name}
                    </span>
                    {selectedTag === tag.name && (
                      <MdCheckCircle className="absolute top-0.5 right-0.5 h-3.5 w-3.5 text-green-500" />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Container Configuration */}
          <div className="rounded-md border border-primary/80 border-r-[3px] border-b-[3px] bg-card shadow-sm p-4">
            <h2 className="text-lg font-semibold text-primary/80 mb-4">
              Container Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Container Name */}
              <div>
                <label className="block text-xs font-medium text-primary/80 mb-2">
                  Container Name
                </label>
                <input
                  type="text"
                  value={containerName}
                  onChange={(e) => setContainerName(e.target.value)}
                  placeholder={`my-${appId}`}
                  autoComplete="off"
                  className="w-full h-9 px-3 text-xs rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm text-primary/80 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-xs font-medium text-primary/80 mb-2">
                  Port
                </label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full h-9 px-3 text-xs rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* PVC Size */}
              <div>
                <label className="block text-xs font-medium text-primary/80 mb-2">
                  Storage Size (GB)
                </label>
                <input
                  type="number"
                  value={pvcSize}
                  onChange={(e) => setPvcSize(e.target.value)}
                  min="1"
                  max="1000"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full h-9 px-3 text-xs rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="rounded-md border border-primary/80 border-r-[3px] border-b-[3px] bg-card shadow-sm p-4">
            <h2 className="text-lg font-semibold text-primary/80 mb-4">
              Environment Variables
            </h2>

            {appId === "postgres" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-2">
                    POSTGRES_USER
                  </label>
                  <input
                    type="text"
                    value={envVars.POSTGRES_USER || ""}
                    onChange={(e) =>
                      setEnvVars({ ...envVars, POSTGRES_USER: e.target.value })
                    }
                    autoComplete="off"
                    className="w-full h-9 px-3 text-xs rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-2">
                    POSTGRES_PASSWORD *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={envVars.POSTGRES_PASSWORD || ""}
                      readOnly
                      placeholder="Click generate button"
                      autoComplete="new-password"
                      className="flex-1 h-9 px-3 text-xs rounded-md border border-primary/80 border-r-[3px] bg-muted/30 shadow-sm text-primary/80 placeholder:text-muted-foreground cursor-not-allowed"
                    />
                    <motion.button
                      type="button"
                      onClick={generatePassword}
                      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-green-500/80 shadow-sm transition-colors isolate"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Generate Password"
                    >
                      <MdKey className="h-4 w-4 text-white" />
                    </motion.button>
                    {envVars.POSTGRES_PASSWORD && (
                      <motion.button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(envVars.POSTGRES_PASSWORD || "")
                        }
                        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-blue-500/80 shadow-sm transition-colors isolate"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Copy Password"
                      >
                        <MdContentCopy className="h-4 w-4 text-white" />
                      </motion.button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-2">
                    POSTGRES_DB
                  </label>
                  <input
                    type="text"
                    value={envVars.POSTGRES_DB || ""}
                    onChange={(e) =>
                      setEnvVars({ ...envVars, POSTGRES_DB: e.target.value })
                    }
                    autoComplete="off"
                    className="w-full h-9 px-3 text-xs rounded-md border border-primary/80 border-r-[3px] bg-card shadow-sm text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            ) : appId === "redis" ? (
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-2">
                    REDIS_PASSWORD *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={envVars.REDIS_PASSWORD || ""}
                      readOnly
                      placeholder="Click generate button"
                      autoComplete="new-password"
                      className="flex-1 h-9 px-3 text-xs rounded-md border border-primary/80 border-r-[3px] bg-muted/30 shadow-sm text-primary/80 placeholder:text-muted-foreground cursor-not-allowed"
                    />
                    <motion.button
                      type="button"
                      onClick={generatePassword}
                      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-green-500/80 shadow-sm transition-colors isolate"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Generate Password"
                    >
                      <MdKey className="h-4 w-4 text-white" />
                    </motion.button>
                    {envVars.REDIS_PASSWORD && (
                      <motion.button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(envVars.REDIS_PASSWORD || "")
                        }
                        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-blue-500/80 shadow-sm transition-colors isolate"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Copy Password"
                      >
                        <MdContentCopy className="h-4 w-4 text-white" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          {/* Deployment Summary */}
          <div className="rounded-md border border-primary/80 border-r-[3px] border-b-[3px] bg-card shadow-sm p-4">
            <h2 className="text-lg font-semibold text-primary/80 mb-4">
              Deployment Summary
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Image:</span>
                <p className="font-mono text-primary/80 mt-1">
                  {appId}:{selectedTag || "latest"}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground">Docker Hub:</span>
                <a
                  href={`https://hub.docker.com/_/${appId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono text-primary/80 hover:text-primary mt-1 underline underline-offset-2 text-[10px]"
                >
                  hub.docker.com/_/{appId}
                </a>
              </div>

              <div>
                <span className="text-muted-foreground">Port:</span>
                <p className="font-mono text-primary/80 mt-1">{port}:{currentApp.internalPort}</p>
              </div>

              <div>
                <span className="text-muted-foreground">Storage:</span>
                <p className="font-mono text-primary/80 mt-1">{pvcSize} GB</p>
              </div>

              {containerName && (
                <div>
                  <span className="text-muted-foreground">Container:</span>
                  <p className="font-mono text-primary/80 mt-1">
                    {containerName}
                  </p>
                </div>
              )}

              {selectedTag && tags.find((t) => t.name === selectedTag) && (
                <div>
                  <span className="text-muted-foreground">Image Size:</span>
                  <p className="font-mono text-primary/80 mt-1">
                    {tags
                      .find((t) => t.name === selectedTag)
                      ?.size.toFixed(2)}{" "}
                    MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-md border border-blue-500/80 border-r-[3px] border-b-[3px] bg-blue-500/5 shadow-sm p-4">
            <div className="flex items-start gap-2">
              <MdInfo className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-primary/80 mb-1">
                  Important Notes:
                </p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Password is required for deployment</li>
                  <li>Data will persist in Docker volumes</li>
                  <li>Default port can be changed if needed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Deploy Button */}
          <motion.button
            onClick={handleDeploy}
            disabled={
              !selectedTag ||
              (appId === "postgres" && !envVars.POSTGRES_PASSWORD) ||
              (appId === "redis" && !envVars.REDIS_PASSWORD) ||
              deploying
            }
            className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] border-b-[3px] bg-primary/80 shadow-sm transition-colors isolate font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {deploying ? "Deploying..." : `Deploy ${currentApp.name}`}
          </motion.button>

          {/* Deployment Result Dialog */}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MdCheckCircle className="h-6 w-6 text-green-500" />
                  Deployment Successful!
                </DialogTitle>
                <DialogDescription>
                  Your {currentApp.name} {appId === "postgres" ? "database" : "cache"} has been deployed successfully. Here are your connection details.
                </DialogDescription>
              </DialogHeader>

              {deploymentResult && deploymentResult.success && deploymentResult.deployment && (
            <div className="space-y-4 mt-4">
              {/* External URL */}
              <div className="rounded-md border border-primary/80 border-r-[3px] border-b-[3px] bg-card shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MdLink className="h-4 w-4 text-primary/80" />
                  <h3 className="text-sm font-semibold text-primary/80">External URL</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={deploymentResult.deployment.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-md border border-primary/80 bg-primary/5 text-blue-600 hover:text-blue-700 hover:bg-primary/10 transition-colors truncate"
                  >
                    {deploymentResult.deployment.externalUrl}
                  </a>
                  <motion.button
                    onClick={() => copyToClipboard(deploymentResult.deployment!.externalUrl, "External URL")}
                    className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-blue-500/80 shadow-sm transition-colors isolate"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Copy URL"
                  >
                    <MdContentCopy className="h-3.5 w-3.5 text-white" />
                  </motion.button>
                  <a
                    href={deploymentResult.deployment.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-green-500/80 shadow-sm transition-colors isolate"
                    title="Open in new tab"
                  >
                    <MdOpenInNew className="h-3.5 w-3.5 text-white" />
                  </a>
                </div>
              </div>

              {/* Credentials */}
              {deploymentResult.credentials && (
                <div className="rounded-md border border-primary/80 border-r-[3px] border-b-[3px] bg-card shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-primary/80 mb-3">
                    {appId === "postgres" ? "Database" : "Cache"} Credentials
                  </h3>

                  <div className="space-y-2">
                    {/* PostgreSQL: User, Password, Database */}
                    {appId === "postgres" && deploymentResult.credentials.user && (
                      <>
                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-1">Username</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={deploymentResult.credentials.user}
                              readOnly
                              className="flex-1 px-3 py-1.5 text-xs font-mono rounded-md border border-primary/80 bg-muted/30 text-primary/80"
                            />
                            <motion.button
                              onClick={() => copyToClipboard(deploymentResult.credentials!.user || "", "Username")}
                              className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-blue-500/80 shadow-sm transition-colors isolate"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <MdContentCopy className="h-3 w-3 text-white" />
                            </motion.button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Password (for both PostgreSQL and Redis) */}
                    <div>
                      <label className="block text-[10px] text-muted-foreground mb-1">Password</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value={deploymentResult.credentials.password}
                          readOnly
                          className="flex-1 px-3 py-1.5 text-xs font-mono rounded-md border border-primary/80 bg-muted/30 text-primary/80"
                        />
                        <motion.button
                          onClick={() => copyToClipboard(deploymentResult.credentials!.password, "Password")}
                          className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-blue-500/80 shadow-sm transition-colors isolate"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <MdContentCopy className="h-3 w-3 text-white" />
                        </motion.button>
                      </div>
                    </div>

                    {appId === "postgres" && deploymentResult.credentials.database && (
                      <div>
                        <label className="block text-[10px] text-muted-foreground mb-1">Database</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={deploymentResult.credentials.database}
                            readOnly
                            className="flex-1 px-3 py-1.5 text-xs font-mono rounded-md border border-primary/80 bg-muted/30 text-primary/80"
                          />
                          <motion.button
                            onClick={() => copyToClipboard(deploymentResult.credentials!.database || "", "Database")}
                            className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-blue-500/80 shadow-sm transition-colors isolate"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <MdContentCopy className="h-3 w-3 text-white" />
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connection String */}
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <label className="block text-[10px] text-muted-foreground mb-1">Connection String (URL Encoded)</label>
                    <div className="flex items-start gap-2">
                      <code className="flex-1 px-3 py-2 text-[10px] font-mono rounded-md border border-primary/80 bg-muted/30 text-primary/80 break-all">
                        {appId === "postgres"
                          ? `postgresql://${deploymentResult.credentials.user}:${urlEncodePassword(deploymentResult.credentials.password)}@${getHostFromUrl(deploymentResult.deployment.externalUrl)}:${deploymentResult.deployment.nodePort}/${deploymentResult.credentials.database}`
                          : `redis://:${urlEncodePassword(deploymentResult.credentials.password)}@${getHostFromUrl(deploymentResult.deployment.externalUrl)}:${deploymentResult.deployment.nodePort}`
                        }
                      </code>
                      <motion.button
                        onClick={() => copyToClipboard(
                          appId === "postgres"
                            ? `postgresql://${deploymentResult.credentials!.user}:${urlEncodePassword(deploymentResult.credentials!.password)}@${getHostFromUrl(deploymentResult.deployment!.externalUrl)}:${deploymentResult.deployment!.nodePort}/${deploymentResult.credentials!.database}`
                            : `redis://:${urlEncodePassword(deploymentResult.credentials!.password)}@${getHostFromUrl(deploymentResult.deployment!.externalUrl)}:${deploymentResult.deployment!.nodePort}`,
                          "Connection String"
                        )}
                        className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-blue-500/80 shadow-sm transition-colors isolate"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MdContentCopy className="h-3 w-3 text-white" />
                      </motion.button>
                    </div>
                  </div>

                  {/* CLI Command */}
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <label className="block text-[10px] text-muted-foreground mb-1">
                      {appId === "postgres" ? "PSQL Command" : "Redis CLI Command"}
                    </label>
                    <div className="flex items-start gap-2">
                      <code className="flex-1 px-3 py-2 text-[10px] font-mono rounded-md border border-primary/80 bg-muted/30 text-primary/80 break-all">
                        {appId === "postgres"
                          ? `PGPASSWORD='${deploymentResult.credentials.password}' psql -h ${getHostFromUrl(deploymentResult.deployment.externalUrl)} -p ${deploymentResult.deployment.nodePort} -U ${deploymentResult.credentials.user} -d ${deploymentResult.credentials.database}`
                          : `redis-cli -h ${getHostFromUrl(deploymentResult.deployment.externalUrl)} -p ${deploymentResult.deployment.nodePort} -a '${deploymentResult.credentials.password}' ping`
                        }
                      </code>
                      <motion.button
                        onClick={() => copyToClipboard(
                          appId === "postgres"
                            ? `PGPASSWORD='${deploymentResult.credentials!.password}' psql -h ${getHostFromUrl(deploymentResult.deployment!.externalUrl)} -p ${deploymentResult.deployment!.nodePort} -U ${deploymentResult.credentials!.user} -d ${deploymentResult.credentials!.database}`
                            : `redis-cli -h ${getHostFromUrl(deploymentResult.deployment!.externalUrl)} -p ${deploymentResult.deployment!.nodePort} -a '${deploymentResult.credentials!.password}' ping`,
                          appId === "postgres" ? "PSQL Command" : "Redis CLI Command"
                        )}
                        className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-primary/80 border-r-[3px] bg-blue-500/80 shadow-sm transition-colors isolate"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MdContentCopy className="h-3 w-3 text-white" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* Deployment Info */}
              <div className="rounded-md border border-primary/80 border-r-[3px] border-b-[3px] bg-card shadow-sm p-4">
                <h3 className="text-sm font-semibold text-primary/80 mb-3">Deployment Details</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-mono text-primary/80 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                        {deploymentResult.deployment.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Namespace:</span>
                    <p className="font-mono text-primary/80 mt-1 text-[10px] truncate" title={deploymentResult.deployment.namespace}>
                      {deploymentResult.deployment.namespace}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">NodePort:</span>
                    <p className="font-mono text-primary/80 mt-1">
                      {deploymentResult.deployment.nodePort}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Image:</span>
                    <p className="font-mono text-primary/80 mt-1 text-[10px] truncate">
                      {deploymentResult.deployment.image}
                    </p>
                  </div>
                </div>

                {/* ArgoCD Link */}
                {deploymentResult.deployment.argocdUrl && (
                  <a
                    href={deploymentResult.deployment.argocdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 h-9 w-full rounded-md border border-primary/80 border-r-[3px] bg-primary/5 hover:bg-primary/10 transition-colors text-xs font-medium text-primary/80"
                  >
                    <MdOpenInNew className="h-3.5 w-3.5" />
                    View in ArgoCD
                  </a>
                )}
              </div>
            </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Error Result */}
          {deploymentResult && !deploymentResult.success && (
            <div className="rounded-md border border-red-500/80 border-r-[3px] border-b-[3px] bg-red-500/5 shadow-sm p-4">
              <div className="flex items-start gap-2">
                <MdCheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
                <div className="text-xs">
                  <p className="font-semibold mb-1 text-red-600 dark:text-red-400">
                    Deployment Failed
                  </p>
                  <p className="text-muted-foreground">
                    {deploymentResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
