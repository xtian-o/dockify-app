/**
 * Kubernetes Manifests Generator
 * Generates K8s manifests for PostgreSQL deployments
 */

interface PostgresDeploymentConfig {
  namespace: string;
  name: string;
  image: string;
  tag: string;
  nodePort: number;
  pvcSize: number;
  envVars: {
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_DB: string;
  };
}

/**
 * Generate all Kubernetes manifests for PostgreSQL deployment
 */
export function generatePostgresManifests(config: PostgresDeploymentConfig) {
  const manifests = [];

  // 1. Namespace
  manifests.push({
    apiVersion: "v1",
    kind: "Namespace",
    metadata: {
      name: config.namespace,
      labels: {
        "app.kubernetes.io/name": config.name,
        "app.kubernetes.io/managed-by": "dockify",
      },
    },
  });

  // 2. Secret for PostgreSQL credentials
  manifests.push({
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: `${config.name}-secret`,
      namespace: config.namespace,
      labels: {
        app: config.name,
        "app.kubernetes.io/managed-by": "dockify",
      },
    },
    type: "Opaque",
    stringData: {
      POSTGRES_USER: config.envVars.POSTGRES_USER,
      POSTGRES_PASSWORD: config.envVars.POSTGRES_PASSWORD,
      POSTGRES_DB: config.envVars.POSTGRES_DB,
    },
  });

  // 3. PersistentVolumeClaim
  manifests.push({
    apiVersion: "v1",
    kind: "PersistentVolumeClaim",
    metadata: {
      name: `${config.name}-pvc`,
      namespace: config.namespace,
      labels: {
        app: config.name,
        "app.kubernetes.io/managed-by": "dockify",
      },
    },
    spec: {
      accessModes: ["ReadWriteOnce"],
      resources: {
        requests: {
          storage: `${config.pvcSize}Gi`,
        },
      },
    },
  });

  // 4. Deployment
  manifests.push({
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: config.name,
      namespace: config.namespace,
      labels: {
        app: config.name,
        "app.kubernetes.io/name": "postgres",
        "app.kubernetes.io/managed-by": "dockify",
      },
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: config.name,
        },
      },
      template: {
        metadata: {
          labels: {
            app: config.name,
          },
        },
        spec: {
          containers: [
            {
              name: "postgres",
              image: `${config.image}:${config.tag}`,
              ports: [
                {
                  containerPort: 5432,
                  name: "postgres",
                  protocol: "TCP",
                },
              ],
              env: [
                {
                  name: "POSTGRES_USER",
                  valueFrom: {
                    secretKeyRef: {
                      name: `${config.name}-secret`,
                      key: "POSTGRES_USER",
                    },
                  },
                },
                {
                  name: "POSTGRES_PASSWORD",
                  valueFrom: {
                    secretKeyRef: {
                      name: `${config.name}-secret`,
                      key: "POSTGRES_PASSWORD",
                    },
                  },
                },
                {
                  name: "POSTGRES_DB",
                  valueFrom: {
                    secretKeyRef: {
                      name: `${config.name}-secret`,
                      key: "POSTGRES_DB",
                    },
                  },
                },
                {
                  name: "PGDATA",
                  value: "/var/lib/postgresql/data/pgdata",
                },
              ],
              volumeMounts: [
                {
                  name: "postgres-data",
                  mountPath: "/var/lib/postgresql/data",
                },
              ],
              resources: {
                requests: {
                  memory: "256Mi",
                  cpu: "250m",
                },
                limits: {
                  memory: "1Gi",
                  cpu: "1000m",
                },
              },
              livenessProbe: {
                exec: {
                  command: ["pg_isready", "-U", config.envVars.POSTGRES_USER],
                },
                initialDelaySeconds: 30,
                periodSeconds: 10,
                timeoutSeconds: 5,
                failureThreshold: 3,
              },
              readinessProbe: {
                exec: {
                  command: ["pg_isready", "-U", config.envVars.POSTGRES_USER],
                },
                initialDelaySeconds: 5,
                periodSeconds: 5,
                timeoutSeconds: 3,
                failureThreshold: 3,
              },
            },
          ],
          volumes: [
            {
              name: "postgres-data",
              persistentVolumeClaim: {
                claimName: `${config.name}-pvc`,
              },
            },
          ],
        },
      },
    },
  });

  // 5. Service (NodePort with Cilium)
  manifests.push({
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name: `${config.name}-service`,
      namespace: config.namespace,
      labels: {
        app: config.name,
        "app.kubernetes.io/managed-by": "dockify",
      },
    },
    spec: {
      type: "NodePort",
      selector: {
        app: config.name,
      },
      ports: [
        {
          name: "postgres",
          port: 5432,
          targetPort: 5432,
          nodePort: config.nodePort,
          protocol: "TCP",
        },
      ],
    },
  });

  return manifests;
}

/**
 * Convert manifests array to YAML string
 */
export function manifestsToYAML(manifests: unknown[]): string {
  return manifests
    .map((manifest) => JSON.stringify(manifest, null, 2))
    .join("\n---\n");
}
