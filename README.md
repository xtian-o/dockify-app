# Dockify App - Kubernetes Infrastructure

Production-ready PostgreSQL, PgBouncer, and Redis deployment for Kubernetes managed by ArgoCD.

## Architecture Overview

```
                         ┌──────────────────┐
                         │  External Access │
                         │   via Cilium     │
                         │    NodePort      │
                         └────────┬─────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────┐
│                      Namespace: dockify-app                  │
├─────────────────────────────────┼───────────────────────────┤
│                                 │                            │
│  ┌────────────────┐       ┌────▼────────┐     ┌──────────┐  │
│  │  PostgreSQL    │◄──────│  PgBouncer  │     │  Redis   │  │
│  │   17.7-alpine  │       │   1.25.0    │     │ 7.4-alpine│ │
│  ├────────────────┤       ├─────────────┤     ├──────────┤  │
│  │ 8 CPU / 32GB   │       │ 2 CPU / 1GB │     │8CPU/128GB│  │
│  │ Storage: 100GB │       │ Replicas: 2 │     │Store:50GB│  │
│  │ NodePort:30432 │       │NodePort:30632│    │NP: 30379 │  │
│  └────────────────┘       └─────────────┘     └──────────┘  │
│         │                        │                   │       │
│         └────────────────────────┴───────────────────┘       │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
                        ┌──────▼──────┐
                        │   ArgoCD    │
                        │  GitOps CD  │
                        └─────────────┘
```

## Components Specifications

### PostgreSQL 17.7

- **Image**: `postgres:17.7-alpine`
- **Resources**:
  - Request: 4 CPU, 16Gi RAM
  - Limit: 8 CPU, 32Gi RAM
- **Storage**: 100Gi PVC
- **Port**: 5432 (Internal), 30432 (NodePort)
- **Exposure**: NodePort via Cilium
- **Features**:
  - Optimized for high-performance workloads
  - `max_connections`: 500
  - `shared_buffers`: 8GB
  - `effective_cache_size`: 24GB
  - WAL replication ready
  - Auto-vacuum enabled

### PgBouncer 1.25.0

- **Image**: `pgbouncer/pgbouncer:1.25.0`
- **Resources**:
  - Request: 1 CPU, 512Mi RAM
  - Limit: 2 CPU, 1Gi RAM
- **Replicas**: 2 (High Availability)
- **Port**: 6432 (Internal), 30632 (NodePort)
- **Exposure**: NodePort via Cilium
- **Pool Mode**: Transaction
- **Features**:
  - Connection pooling: 1000 max client connections
  - Default pool size: 25 per user/db
  - LDAP authentication support
  - Direct TLS connections

### Redis 7.4

- **Image**: `redis:7.4-alpine`
- **Resources**:
  - Request: 4 CPU, 64Gi RAM
  - Limit: 8 CPU, 128Gi RAM
- **Storage**: 50Gi PVC
- **Port**: 6379 (Internal), 30379 (NodePort)
- **Exposure**: NodePort via Cilium
- **Features**:
  - `maxmemory`: 100GB
  - Policy: `allkeys-lru`
  - Persistence: RDB + AOF enabled
  - Active defragmentation enabled
  - Optimized for large datasets

## Directory Structure

```
dockify-app/
├── README.md                      # This file
├── argocd/
│   ├── project.yaml              # ArgoCD Project definition
│   ├── repo-secret.yaml          # GitHub repository credentials
│   └── application.yaml          # ArgoCD Application manifest
├── namespace/
│   └── namespace.yaml            # Kubernetes namespace
├── postgresql/
│   ├── pvc.yaml                  # 100Gi Persistent Volume Claim
│   ├── secret.yaml               # Database credentials
│   ├── configmap.yaml            # PostgreSQL configuration
│   ├── deployment.yaml           # PostgreSQL deployment
│   └── service.yaml              # NodePort service (30432) via Cilium
├── pgbouncer/
│   ├── configmap.yaml            # PgBouncer configuration
│   ├── deployment.yaml           # PgBouncer deployment (2 replicas)
│   └── service.yaml              # NodePort service (30632) via Cilium
└── redis/
    ├── pvc.yaml                  # 50Gi Persistent Volume Claim
    ├── configmap.yaml            # Redis configuration
    ├── deployment.yaml           # Redis deployment
    └── service.yaml              # NodePort service (30379) via Cilium
```

## Prerequisites

- Kubernetes cluster (1.25+)
- ArgoCD installed and running
- `kubectl` configured
- Storage class available for PVC provisioning
- Minimum cluster resources:
  - 20 CPU cores available
  - 161Gi RAM available
  - 150Gi storage available

## Deployment Instructions

### Step 1: Apply ArgoCD Repository Secret

This connects ArgoCD to the GitHub repository:

```bash
kubectl apply -f argocd/repo-secret.yaml
```

Verify repository connection:

```bash
kubectl get secrets -n argocd dockify-app-repo
```

### Step 2: Create ArgoCD Project

```bash
kubectl apply -f argocd/project.yaml
```

Verify project creation:

```bash
kubectl get appprojects -n argocd dockify-app
```

### Step 3: Deploy ArgoCD Application

```bash
kubectl apply -f argocd/application.yaml
```

Verify application:

```bash
kubectl get applications -n argocd dockify-app
```

### Step 4: Monitor Deployment

Watch ArgoCD sync the application:

```bash
# Via kubectl
kubectl get applications -n argocd dockify-app -w

# Check pods in dockify-app namespace
kubectl get pods -n dockify-app -w

# Check all resources
kubectl get all -n dockify-app
```

**Via ArgoCD UI:**

1. Open ArgoCD UI in browser
2. Navigate to Applications
3. Click on `dockify-app`
4. Watch the sync process

## Connection Endpoints

Services are exposed via **Cilium NodePort** for both internal and external access.

### External Access (via NodePort)

Get your node IP address:
```bash
kubectl get nodes -o wide
```

**PostgreSQL (Direct Connection)**
```
Host: <NODE_IP>
Port: 30432
Database: dockify
User: postgres
Password: dockify-postgres-secure-2025
```

**Connection String:**
```bash
postgresql://postgres:dockify-postgres-secure-2025@<NODE_IP>:30432/dockify
```

**PgBouncer (Recommended for Applications)**
```
Host: <NODE_IP>
Port: 30632
Database: dockify
User: postgres
Password: dockify-postgres-secure-2025
```

**Connection String:**
```bash
postgresql://postgres:dockify-postgres-secure-2025@<NODE_IP>:30632/dockify
```

**Redis**
```
Host: <NODE_IP>
Port: 30379
```

**Connection String:**
```bash
redis://<NODE_IP>:30379
```

### Internal Access (within cluster)

**PostgreSQL:**
```
postgresql://postgres:dockify-postgres-secure-2025@postgresql-service.dockify-app.svc.cluster.local:5432/dockify
```

**PgBouncer (Recommended):**
```
postgresql://postgres:dockify-postgres-secure-2025@pgbouncer-service.dockify-app.svc.cluster.local:6432/dockify
```

**Redis:**
```
redis://redis-service.dockify-app.svc.cluster.local:6379
```

## Testing Connections

### Get Node IP

First, get your Kubernetes node IP:
```bash
export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "Node IP: $NODE_IP"
```

### Test PostgreSQL (via NodePort)

```bash
# Connect directly via NodePort
psql postgresql://postgres:dockify-postgres-secure-2025@$NODE_IP:30432/dockify
```

### Test PgBouncer (via NodePort - Recommended)

```bash
# Connect via PgBouncer NodePort
psql postgresql://postgres:dockify-postgres-secure-2025@$NODE_IP:30632/dockify

# Test pooler status
psql -h $NODE_IP -p 30632 -U postgres pgbouncer -c "SHOW POOLS;"
```

### Test Redis (via NodePort)

```bash
# Connect via NodePort
redis-cli -h $NODE_IP -p 30379 ping
# Expected output: PONG

# Test SET/GET
redis-cli -h $NODE_IP -p 30379 SET test "Hello Dockify"
redis-cli -h $NODE_IP -p 30379 GET test
```

### Verify Cilium Services

```bash
# Check NodePort services
kubectl get svc -n dockify-app

# Expected output:
# NAME                 TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
# postgresql-service   NodePort   10.x.x.x        <none>        5432:30432/TCP   5m
# pgbouncer-service    NodePort   10.x.x.x        <none>        6432:30632/TCP   5m
# redis-service        NodePort   10.x.x.x        <none>        6379:30379/TCP   5m
```

## Monitoring & Health Checks

### Check Pod Status

```bash
kubectl get pods -n dockify-app
```

Expected output:
```
NAME                          READY   STATUS    RESTARTS   AGE
postgresql-xxxxxxxxxx-xxxxx   1/1     Running   0          5m
pgbouncer-xxxxxxxxxx-xxxxx    1/1     Running   0          5m
pgbouncer-xxxxxxxxxx-xxxxx    1/1     Running   0          5m
redis-xxxxxxxxxx-xxxxx        1/1     Running   0          5m
```

### Check Logs

```bash
# PostgreSQL logs
kubectl logs -n dockify-app deployment/postgresql -f

# PgBouncer logs
kubectl logs -n dockify-app deployment/pgbouncer -f

# Redis logs
kubectl logs -n dockify-app deployment/redis -f
```

### Check PVCs

```bash
kubectl get pvc -n dockify-app
```

Expected output:
```
NAME             STATUS   VOLUME                                     CAPACITY   ACCESS MODES
postgresql-pvc   Bound    pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   100Gi      RWO
redis-pvc        Bound    pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   50Gi       RWO
```

## Maintenance Operations

### Update PostgreSQL Password

1. Edit the secret:
```bash
kubectl edit secret -n dockify-app postgresql-secret
```

2. Update the base64 encoded password
3. Restart PostgreSQL and PgBouncer:
```bash
kubectl rollout restart deployment/postgresql -n dockify-app
kubectl rollout restart deployment/pgbouncer -n dockify-app
```

### Scale PgBouncer

```bash
# Scale to 3 replicas
kubectl scale deployment/pgbouncer -n dockify-app --replicas=3

# Or edit the deployment
kubectl edit deployment/pgbouncer -n dockify-app
```

### Backup PostgreSQL

```bash
# Create a backup
kubectl exec -n dockify-app deployment/postgresql -- \
  pg_dump -U postgres dockify > backup-$(date +%Y%m%d).sql

# Or with port-forward
kubectl port-forward -n dockify-app svc/postgresql-service 5432:5432 &
pg_dump -h localhost -U postgres dockify > backup-$(date +%Y%m%d).sql
```

### Restore PostgreSQL

```bash
# With port-forward
kubectl port-forward -n dockify-app svc/postgresql-service 5432:5432 &
psql -h localhost -U postgres dockify < backup-20250117.sql
```

## Troubleshooting

### PostgreSQL Won't Start

```bash
# Check logs
kubectl logs -n dockify-app deployment/postgresql --tail=100

# Check PVC
kubectl describe pvc -n dockify-app postgresql-pvc

# Check node resources
kubectl top nodes
```

### PgBouncer Connection Issues

```bash
# Verify PostgreSQL is running
kubectl get pods -n dockify-app -l app=postgresql

# Check PgBouncer config
kubectl get configmap -n dockify-app pgbouncer-config -o yaml

# Test PgBouncer admin console
kubectl exec -n dockify-app deployment/pgbouncer -- \
  psql -p 6432 -U postgres pgbouncer -c "SHOW POOLS;"
```

### Redis Memory Issues

```bash
# Check Redis memory usage
kubectl exec -n dockify-app deployment/redis -- redis-cli INFO memory

# Check configured maxmemory
kubectl exec -n dockify-app deployment/redis -- redis-cli CONFIG GET maxmemory
```

### ArgoCD Sync Issues

```bash
# Check application status
kubectl get application -n argocd dockify-app -o yaml

# Force sync
kubectl patch application -n argocd dockify-app \
  --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'
```

## Security Considerations

1. **Change default passwords** in `postgresql/secret.yaml` before production use
2. **Enable Redis password** by uncommenting `requirepass` in `redis/configmap.yaml`
3. **Configure network policies** to restrict inter-pod communication
4. **Enable TLS** for PostgreSQL and Redis in production
5. **Rotate GitHub token** regularly
6. **Use sealed secrets** or external secret managers for production

## Configuration Tuning

### PostgreSQL Performance

Edit [postgresql/configmap.yaml](postgresql/configmap.yaml):

- `max_connections`: Increase for more concurrent connections
- `shared_buffers`: Adjust based on available RAM (25% of RAM)
- `work_mem`: Tune for complex queries
- `effective_cache_size`: Set to 50-75% of RAM

### PgBouncer Pool Sizing

Edit [pgbouncer/configmap.yaml](pgbouncer/configmap.yaml):

- `max_client_conn`: Maximum client connections
- `default_pool_size`: Connections per user/database
- `pool_mode`: `transaction` (default), `session`, or `statement`

### Redis Memory Management

Edit [redis/configmap.yaml](redis/configmap.yaml):

- `maxmemory`: Maximum memory allocation
- `maxmemory-policy`: Eviction policy (allkeys-lru, volatile-lru, etc.)
- `save`: RDB snapshot frequency

## Resource Limits

Current resource allocation:

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit | Storage |
|-----------|-------------|-----------|----------------|--------------|---------|
| PostgreSQL | 4000m | 8000m | 16Gi | 32Gi | 100Gi |
| PgBouncer (×2) | 1000m | 2000m | 512Mi | 1Gi | - |
| Redis | 4000m | 8000m | 64Gi | 128Gi | 50Gi |
| **TOTAL** | **11 CPU** | **20 CPU** | **145Gi** | **293Gi** | **150Gi** |

Adjust in respective `deployment.yaml` files based on cluster capacity.

## GitOps Workflow

1. **Make changes** to manifests in this repository
2. **Commit and push** to the `main` branch
3. **ArgoCD auto-syncs** within seconds (automated sync enabled)
4. **Monitor** deployment in ArgoCD UI or via kubectl
5. **Rollback** if needed via ArgoCD UI or by reverting git commit

### Manual Sync

```bash
# Via kubectl
kubectl patch application -n argocd dockify-app --type merge \
  -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'

# Via ArgoCD CLI
argocd app sync dockify-app
```

## Uninstall

```bash
# Delete ArgoCD application (this will remove all resources)
kubectl delete application -n argocd dockify-app

# Delete ArgoCD project
kubectl delete appproject -n argocd dockify-app

# Delete repository secret
kubectl delete secret -n argocd dockify-app-repo

# Manually delete namespace if needed
kubectl delete namespace dockify-app
```

## Support & Contributions

For issues or improvements:

1. Check existing issues on GitHub
2. Create a new issue with details
3. Submit pull requests for improvements

## License

This infrastructure configuration is provided as-is for the Dockify application.

---

**Deployed with ArgoCD** | **Managed via GitOps** | **Production Ready**
