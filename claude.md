# Dockify App - Documentation for Claude AI

This document provides context and guidelines for Claude AI when working with this project.

## Project Overview

**dockify-app** is a production-ready Kubernetes infrastructure deployment managed by ArgoCD, containing:
- PostgreSQL 17.7 (database server)
- PgBouncer 1.25.0 (connection pooler)
- Redis 7.4 (cache & data store)

All services are exposed via **Cilium NodePort** for external access.

## Architecture

```
External Access (NodePort via Cilium)
    │
    ├─> PostgreSQL :30432  (Direct DB access)
    ├─> PgBouncer :30632   (Pooled access - RECOMMENDED)
    └─> Redis     :30379   (Cache/Data store)
```

## Technology Stack

- **Kubernetes**: Container orchestration
- **ArgoCD**: GitOps continuous deployment
- **Cilium**: CNI for networking and NodePort exposure
- **PostgreSQL 17.7**: Main database (Alpine image)
- **PgBouncer 1.25.0**: Connection pooler for PostgreSQL
- **Redis 7.4**: In-memory data store (Alpine image)

## Repository Structure

```
dockify-app/
├── README.md                  # Main documentation
├── claude.md                  # This file
├── .gitignore                 # Git ignore rules
├── argocd/                    # ArgoCD configuration
│   ├── README.md              # ArgoCD deployment guide
│   ├── project.yaml           # ArgoCD Project
│   ├── repo-secret.yaml       # GitHub credentials
│   └── application.yaml       # ArgoCD Application
├── namespace/
│   └── namespace.yaml         # Kubernetes namespace
├── postgresql/
│   ├── README.md              # PostgreSQL guide & connection strings
│   ├── pvc.yaml               # 100Gi storage
│   ├── secret.yaml            # DB credentials
│   ├── configmap.yaml         # PostgreSQL config
│   ├── deployment.yaml        # Deployment spec
│   └── service.yaml           # NodePort service (30432)
├── pgbouncer/
│   ├── README.md              # PgBouncer guide & connection strings
│   ├── configmap.yaml         # Pooler configuration
│   ├── deployment.yaml        # 2 replicas
│   └── service.yaml           # NodePort service (30632)
└── redis/
    ├── README.md              # Redis guide & connection strings
    ├── pvc.yaml               # 50Gi storage
    ├── configmap.yaml         # Redis config
    ├── deployment.yaml        # Deployment spec
    └── service.yaml           # NodePort service (30379)
```

## Key Information

### Credentials

**PostgreSQL & PgBouncer:**
- User: `postgres`
- Password: `dockify-postgres-secure-2025`
- Database: `dockify`

**Security Note**: Password is stored in `postgresql/secret.yaml` and should be changed for production.

### Resource Allocation

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit | Storage |
|-----------|-------------|-----------|----------------|--------------|---------|
| PostgreSQL | 4 cores | 8 cores | 16Gi | 32Gi | 100Gi |
| PgBouncer (×2) | 1 core | 2 cores | 512Mi | 1Gi | - |
| Redis | 4 cores | 8 cores | 64Gi | 128Gi | 50Gi |

### External Access (NodePort)

Services are exposed on all cluster nodes via Cilium NodePort:
- **PostgreSQL**: `<NODE_IP>:30432`
- **PgBouncer**: `<NODE_IP>:30632` (recommended for applications)
- **Redis**: `<NODE_IP>:30379`

Get node IP:
```bash
kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}'
```

### Internal Access (within cluster)

- PostgreSQL: `postgresql-service.dockify-app.svc.cluster.local:5432`
- PgBouncer: `pgbouncer-service.dockify-app.svc.cluster.local:6432`
- Redis: `redis-service.dockify-app.svc.cluster.local:6379`

## ArgoCD Configuration

### Auto-Sync Settings

The ArgoCD Application is configured with:
- **Auto-sync**: Enabled (syncs automatically on git push)
- **Self-heal**: Enabled (reverts manual changes)
- **Prune**: Enabled (deletes removed resources)

### Deployment Flow

1. Push changes to GitHub main branch
2. ArgoCD detects changes within seconds
3. Auto-sync applies changes to cluster
4. Health checks validate deployment

## Development Guidelines

### When Modifying Manifests

1. **Always test locally first** with `kubectl apply --dry-run=client`
2. **Validate YAML syntax** before committing
3. **Check resource limits** don't exceed cluster capacity
4. **Update README.md** if changing ports, credentials, or architecture
5. **Update component README** files with new connection strings

### When Adding New Services

1. Create new folder: `service-name/`
2. Add manifests: `deployment.yaml`, `service.yaml`, etc.
3. Add `service-name/README.md` with connection strings
4. Update main `README.md` with new service details
5. Update ArgoCD Application if needed

### Configuration Changes

**PostgreSQL tuning**: Edit `postgresql/configmap.yaml`
- Connection limits, memory settings, WAL configuration

**PgBouncer tuning**: Edit `pgbouncer/configmap.yaml`
- Pool sizes, timeouts, pool mode

**Redis tuning**: Edit `redis/configmap.yaml`
- Memory limits, eviction policy, persistence

After config changes:
```bash
kubectl apply -f <component>/configmap.yaml
kubectl rollout restart deployment/<component> -n dockify-app
```

## Common Tasks

### View Deployment Status

```bash
# ArgoCD application
kubectl get application -n argocd dockify-app

# All resources
kubectl get all -n dockify-app

# Specific component
kubectl get pods -n dockify-app -l app=postgresql
```

### Check Logs

```bash
kubectl logs -n dockify-app deployment/postgresql -f
kubectl logs -n dockify-app deployment/pgbouncer -f
kubectl logs -n dockify-app deployment/redis -f
```

### Test Connections

```bash
# Get node IP
export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Test PostgreSQL via PgBouncer
psql postgresql://postgres:dockify-postgres-secure-2025@$NODE_IP:30632/dockify

# Test Redis
redis-cli -h $NODE_IP -p 30379 ping
```

### Scale Deployments

```bash
# Scale PgBouncer replicas
kubectl scale deployment/pgbouncer -n dockify-app --replicas=3

# PostgreSQL and Redis should remain at 1 replica (stateful)
```

## Troubleshooting

### ArgoCD Sync Issues

```bash
# Check application status
kubectl describe application -n argocd dockify-app

# Force sync
kubectl patch application -n argocd dockify-app --type merge \
  -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'
```

### Pod Crashes

```bash
# Check pod events
kubectl describe pod -n dockify-app <pod-name>

# Check logs
kubectl logs -n dockify-app <pod-name> --previous

# Check resource constraints
kubectl top nodes
kubectl top pods -n dockify-app
```

### Connection Refused

```bash
# Verify service endpoints
kubectl get endpoints -n dockify-app

# Check NodePort is exposed
kubectl get svc -n dockify-app

# Test from within cluster
kubectl run -it --rm test-pod --image=alpine --restart=Never -- sh
```

## Security Considerations

1. **GitHub Token**: Stored in `argocd/repo-secret.yaml` - rotate regularly
2. **PostgreSQL Password**: Change default password in `postgresql/secret.yaml`
3. **Redis Password**: Uncomment `requirepass` in `redis/configmap.yaml` for production
4. **Network Policies**: Consider adding NetworkPolicies to restrict inter-pod communication
5. **TLS**: Enable TLS for PostgreSQL and Redis in production

## Backup & Recovery

### PostgreSQL Backup

```bash
export NODE_IP=<node-ip>
pg_dump -h $NODE_IP -p 30632 -U postgres dockify > backup-$(date +%Y%m%d).sql
```

### Redis Backup

```bash
# Force RDB snapshot
redis-cli -h $NODE_IP -p 30379 BGSAVE

# Copy from pod
kubectl cp dockify-app/<redis-pod>:/data/dump.rdb ./redis-backup.rdb
```

## Monitoring Recommendations

Consider adding:
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Loki**: Log aggregation
- **AlertManager**: Alerting on issues

## Performance Tuning

### PostgreSQL
- Increase `max_connections` if hitting limits
- Tune `shared_buffers` based on available RAM
- Adjust `work_mem` for complex queries

### PgBouncer
- Increase `default_pool_size` if clients are waiting
- Adjust `max_client_conn` based on application load
- Consider `pool_mode=session` for prepared statements

### Redis
- Increase `maxmemory` if evictions are high
- Tune eviction policy based on use case
- Enable/disable persistence based on data importance

## Contact & Support

For issues or questions:
- Check component README files first
- Review ArgoCD logs
- Check Kubernetes events and pod logs

## Important Notes for Claude AI

1. **Never expose sensitive data** in commits or logs
2. **Always validate YAML** before suggesting changes
3. **Consider resource limits** when modifying specs
4. **Preserve existing configurations** unless explicitly asked to change
5. **Update documentation** when making changes
6. **Follow GitOps principles** - all changes via Git, not kubectl direct edits
7. **Test connection strings** are examples - replace NODE_IP with actual values

## Version History

- **2025-01-17**: Initial deployment
  - PostgreSQL 17.7 with 100GB storage
  - PgBouncer 1.25.0 with 2 replicas
  - Redis 7.4 with 50GB storage
  - NodePort exposure via Cilium
  - ArgoCD auto-sync enabled
