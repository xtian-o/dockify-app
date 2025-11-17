# PostgreSQL 17.7 - Dockify App

PostgreSQL production deployment cu configurații optimizate pentru performanță.

## Specificații

- **Version**: PostgreSQL 17.7 Alpine
- **CPU**: 4-8 cores (request: 4, limit: 8)
- **Memory**: 16-32 GB (request: 16Gi, limit: 32Gi)
- **Storage**: 100 GB PVC
- **Port Internal**: 5432
- **NodePort**: 30432

## Configurare Optimizată

### Memory Settings
- `shared_buffers`: 8GB
- `effective_cache_size`: 24GB
- `work_mem`: 64MB
- `maintenance_work_mem`: 2GB

### Connections
- `max_connections`: 500
- Optimizat pentru high-traffic applications

### Performance
- Parallel workers: 8
- Checkpoint tuning pentru write-heavy workloads
- Autovacuum enabled

## Credențiale

```
Database: dockify
User: postgres
Password: dockify-postgres-secure-2025
```

**IMPORTANT**: Schimbă parola în producție editând [secret.yaml](secret.yaml)

## Connection Strings

### Acces Extern (NodePort via Cilium)

Obține IP-ul nodului:
```bash
export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "PostgreSQL available at: $NODE_IP:30432"
```

**Connection String:**
```bash
postgresql://postgres:dockify-postgres-secure-2025@$NODE_IP:30432/dockify
```

**Conectare cu psql:**
```bash
psql -h $NODE_IP -p 30432 -U postgres -d dockify
# Introdu parola: dockify-postgres-secure-2025
```

**Conectare fără prompt parolă:**
```bash
export PGPASSWORD=dockify-postgres-secure-2025
psql -h $NODE_IP -p 30432 -U postgres -d dockify
```

### Acces Intern (din cluster)

**Connection String:**
```
postgresql://postgres:dockify-postgres-secure-2025@postgresql-service.dockify-app.svc.cluster.local:5432/dockify
```

**Conectare din alt pod:**
```bash
kubectl run -it --rm psql-client --image=postgres:17.7-alpine --restart=Never -- \
  psql postgresql://postgres:dockify-postgres-secure-2025@postgresql-service.dockify-app.svc.cluster.local:5432/dockify
```

## Testing & Verification

### Verifică deployment-ul

```bash
# Check pod status
kubectl get pods -n dockify-app -l app=postgresql

# Check logs
kubectl logs -n dockify-app deployment/postgresql -f

# Check service
kubectl get svc -n dockify-app postgresql-service
```

### Test conexiune

```bash
# Get node IP
export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Test connection
psql -h $NODE_IP -p 30432 -U postgres -d dockify -c "SELECT version();"

# Expected output:
# PostgreSQL 17.7 on x86_64-pc-linux-musl, compiled by gcc ...
```

### Performance test

```bash
# Test max connections
psql -h $NODE_IP -p 30432 -U postgres -d dockify -c "SHOW max_connections;"

# Test shared buffers
psql -h $NODE_IP -p 30432 -U postgres -d dockify -c "SHOW shared_buffers;"

# Check current connections
psql -h $NODE_IP -p 30432 -U postgres -d dockify -c "SELECT count(*) FROM pg_stat_activity;"
```

## Aplicații - Exemple de Conectare

### Python (psycopg2)

```python
import psycopg2
import os

conn = psycopg2.connect(
    host=os.getenv('NODE_IP', 'localhost'),
    port=30432,
    database='dockify',
    user='postgres',
    password='dockify-postgres-secure-2025'
)

cur = conn.cursor()
cur.execute('SELECT version()')
print(cur.fetchone())
```

### Node.js (pg)

```javascript
const { Client } = require('pg');

const client = new Client({
  host: process.env.NODE_IP || 'localhost',
  port: 30632,  // Folosește PgBouncer pentru production!
  database: 'dockify',
  user: 'postgres',
  password: 'dockify-postgres-secure-2025',
});

await client.connect();
const res = await client.query('SELECT NOW()');
console.log(res.rows[0]);
```

### Go (pq)

```go
package main

import (
    "database/sql"
    "fmt"
    _ "github.com/lib/pq"
)

func main() {
    connStr := "host=NODE_IP port=30432 user=postgres password=dockify-postgres-secure-2025 dbname=dockify sslmode=disable"
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        panic(err)
    }
    defer db.Close()

    var version string
    err = db.QueryRow("SELECT version()").Scan(&version)
    fmt.Println(version)
}
```

### Java (JDBC)

```java
import java.sql.*;

public class PostgresConnect {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://NODE_IP:30432/dockify";
        String user = "postgres";
        String password = "dockify-postgres-secure-2025";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT version()");
            if (rs.next()) {
                System.out.println(rs.getString(1));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

## Backup & Restore

### Backup Database

```bash
# Get node IP
export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Full database backup
pg_dump -h $NODE_IP -p 30432 -U postgres dockify > backup-$(date +%Y%m%d-%H%M%S).sql

# Compressed backup
pg_dump -h $NODE_IP -p 30432 -U postgres dockify | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz
```

### Restore Database

```bash
# Restore from backup
psql -h $NODE_IP -p 30432 -U postgres dockify < backup-20250117-120000.sql

# Restore from compressed backup
gunzip -c backup-20250117-120000.sql.gz | psql -h $NODE_IP -p 30432 -U postgres dockify
```

## Monitoring

### Check Database Size

```bash
psql -h $NODE_IP -p 30432 -U postgres -d dockify -c "
SELECT
    pg_size_pretty(pg_database_size('dockify')) as db_size;
"
```

### Active Connections

```bash
psql -h $NODE_IP -p 30432 -U postgres -d dockify -c "
SELECT
    count(*) as active_connections,
    max_conn,
    max_conn - count(*) as available_connections
FROM pg_stat_activity
CROSS JOIN (SELECT setting::int as max_conn FROM pg_settings WHERE name='max_connections') s
GROUP BY max_conn;
"
```

### Slow Queries

```bash
psql -h $NODE_IP -p 30432 -U postgres -d dockify -c "
SELECT
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
ORDER BY duration DESC;
"
```

## Troubleshooting

### Pod nu pornește

```bash
# Check events
kubectl describe pod -n dockify-app -l app=postgresql

# Check logs
kubectl logs -n dockify-app deployment/postgresql --tail=100

# Check PVC
kubectl get pvc -n dockify-app postgresql-pvc
```

### Conexiune refuzată

```bash
# Verify service
kubectl get svc -n dockify-app postgresql-service

# Verify NodePort is exposed
kubectl get svc -n dockify-app postgresql-service -o yaml | grep nodePort

# Test from within cluster
kubectl run -it --rm psql-test --image=postgres:17.7-alpine --restart=Never -- \
  psql -h postgresql-service.dockify-app.svc.cluster.local -p 5432 -U postgres -d dockify
```

## Best Practices

1. **Pentru aplicații**, folosește **PgBouncer** în loc de conexiune directă la PostgreSQL
2. **Nu expune** PostgreSQL direct pe internet - folosește VPN sau whitelist IP
3. **Schimbă parola** default înainte de production
4. **Backups regulate** - configurează cronjob pentru backup automat
5. **Monitorizare** - folosește Prometheus + Grafana pentru metrici PostgreSQL

## Files în acest folder

- `pvc.yaml`: Persistent Volume Claim (100Gi)
- `secret.yaml`: Database credentials
- `configmap.yaml`: PostgreSQL configuration
- `deployment.yaml`: Deployment manifest
- `service.yaml`: NodePort service (30432)
