# PgBouncer 1.25.0 - Connection Pooler

PgBouncer este un connection pooler lightweight pentru PostgreSQL, folosit pentru a optimiza conexiunile la baza de date.

## Specificații

- **Version**: PgBouncer 1.25.0
- **CPU**: 1-2 cores (request: 1, limit: 2)
- **Memory**: 512MB - 1GB (request: 512Mi, limit: 1Gi)
- **Replicas**: 2 (High Availability)
- **Port Internal**: 6432
- **NodePort**: 30632

## De ce PgBouncer?

### Avantaje

1. **Connection Pooling**: Reduce overhead-ul de creare/închidere conexiuni
2. **Resource Efficiency**: Menține un număr mic de conexiuni active la PostgreSQL
3. **High Availability**: 2 replicas pentru failover automat
4. **Performance**: Reduce latența pentru aplicații cu multe conexiuni scurte

### Când să folosești PgBouncer

✅ **DA** - Recomandări:
- Aplicații web cu multe conexiuni concurente scurte
- Microservices care se conectează la aceeași bază de date
- Load balancing între multiple aplicații
- Limitarea numărului de conexiuni directe la PostgreSQL

❌ **NU** - Evită pentru:
- Conexiuni long-running (>1 oră)
- Tranzacții foarte complexe cu prepared statements
- Debugging unde ai nevoie de conexiune directă

## Configurare

### Pool Settings

- **Pool Mode**: `transaction` (recomandat pentru aplicații web)
- **Max Client Connections**: 1000
- **Default Pool Size**: 25 per user/database
- **Max DB Connections**: 100

### Pool Modes

```
session    - O conexiune client = o conexiune server (până la disconnect)
transaction - O conexiune client = o conexiune server per transaction (RECOMANDAT)
statement  - O conexiune client = o conexiune server per query (nu recomandată)
```

## Connection Strings

### Acces Extern (NodePort via Cilium) - **RECOMANDAT**

Obține IP-ul nodului:
```bash
export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "PgBouncer available at: $NODE_IP:30632"
```

**Connection String:**
```bash
postgresql://postgres:dockify-postgres-secure-2025@$NODE_IP:30632/dockify
```

**Conectare cu psql:**
```bash
psql -h $NODE_IP -p 30632 -U postgres -d dockify
# Introdu parola: dockify-postgres-secure-2025
```

**Conectare fără prompt parolă:**
```bash
export PGPASSWORD=dockify-postgres-secure-2025
psql -h $NODE_IP -p 30632 -U postgres -d dockify
```

### Acces Intern (din cluster)

**Connection String:**
```
postgresql://postgres:dockify-postgres-secure-2025@pgbouncer-service.dockify-app.svc.cluster.local:6432/dockify
```

**Conectare din alt pod:**
```bash
kubectl run -it --rm psql-client --image=postgres:17.7-alpine --restart=Never -- \
  psql postgresql://postgres:dockify-postgres-secure-2025@pgbouncer-service.dockify-app.svc.cluster.local:6432/dockify
```

## Testing & Verification

### Verifică deployment-ul

```bash
# Check pod status (ar trebui să vezi 2 replicas)
kubectl get pods -n dockify-app -l app=pgbouncer

# Check logs
kubectl logs -n dockify-app deployment/pgbouncer -f

# Check service
kubectl get svc -n dockify-app pgbouncer-service
```

### Test conexiune

```bash
# Get node IP
export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Test connection
psql -h $NODE_IP -p 30632 -U postgres -d dockify -c "SELECT version();"
```

### Verifică Pool Status

```bash
# Connect to PgBouncer admin console
psql -h $NODE_IP -p 30632 -U postgres pgbouncer

# In psql:
pgbouncer=# SHOW POOLS;
pgbouncer=# SHOW CLIENTS;
pgbouncer=# SHOW SERVERS;
pgbouncer=# SHOW STATS;
```

**Sau direct cu -c:**
```bash
# Show active pools
psql -h $NODE_IP -p 30632 -U postgres pgbouncer -c "SHOW POOLS;"

# Show connected clients
psql -h $NODE_IP -p 30632 -U postgres pgbouncer -c "SHOW CLIENTS;"

# Show server connections
psql -h $NODE_IP -p 30632 -U postgres pgbouncer -c "SHOW SERVERS;"

# Show statistics
psql -h $NODE_IP -p 30632 -U postgres pgbouncer -c "SHOW STATS;"
```

## Aplicații - Exemple de Conectare

### Python (psycopg2)

```python
import psycopg2
import os

# Folosește PgBouncer pentru connection pooling
conn = psycopg2.connect(
    host=os.getenv('NODE_IP', 'localhost'),
    port=30632,  # PgBouncer port
    database='dockify',
    user='postgres',
    password='dockify-postgres-secure-2025'
)

cur = conn.cursor()
cur.execute('SELECT version()')
print(cur.fetchone())
conn.close()
```

### Node.js (pg)

```javascript
const { Pool } = require('pg');

// Pool configuration pentru PgBouncer
const pool = new Pool({
  host: process.env.NODE_IP || 'localhost',
  port: 30632,  // PgBouncer port
  database: 'dockify',
  user: 'postgres',
  password: 'dockify-postgres-secure-2025',
  max: 20,  // Client-side pool (PgBouncer face pooling la server-side)
  idleTimeoutMillis: 30000,
});

const client = await pool.connect();
try {
  const res = await client.query('SELECT NOW()');
  console.log(res.rows[0]);
} finally {
  client.release();
}
```

### Go (pgx)

```go
package main

import (
    "context"
    "fmt"
    "github.com/jackc/pgx/v5/pgxpool"
)

func main() {
    // PgBouncer connection string
    connStr := "postgres://postgres:dockify-postgres-secure-2025@NODE_IP:30632/dockify"

    pool, err := pgxpool.New(context.Background(), connStr)
    if err != nil {
        panic(err)
    }
    defer pool.Close()

    var version string
    err = pool.QueryRow(context.Background(), "SELECT version()").Scan(&version)
    if err != nil {
        panic(err)
    }
    fmt.Println(version)
}
```

### Java (HikariCP + JDBC)

```java
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.sql.*;

public class PgBouncerConnect {
    public static void main(String[] args) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://NODE_IP:30632/dockify");
        config.setUsername("postgres");
        config.setPassword("dockify-postgres-secure-2025");
        config.setMaximumPoolSize(20);

        try (HikariDataSource ds = new HikariDataSource(config);
             Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT version()")) {

            if (rs.next()) {
                System.out.println(rs.getString(1));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

### Django (Python)

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'dockify',
        'USER': 'postgres',
        'PASSWORD': 'dockify-postgres-secure-2025',
        'HOST': os.getenv('NODE_IP', 'localhost'),
        'PORT': '30632',  # PgBouncer port
        'CONN_MAX_AGE': 600,  # Keep connections open for 10 minutes
    }
}
```

## Monitoring

### Pool Statistics

```bash
export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Show pool statistics
psql -h $NODE_IP -p 30632 -U postgres pgbouncer -c "
SELECT
    database,
    user,
    cl_active,
    cl_waiting,
    sv_active,
    sv_idle,
    sv_used,
    sv_tested,
    maxwait
FROM pgbouncer.pools;
"
```

### Client Connections

```bash
# Show active client connections
psql -h $NODE_IP -p 30632 -U postgres pgbouncer -c "
SELECT
    COUNT(*) as total_clients,
    SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN state = 'waiting' THEN 1 ELSE 0 END) as waiting
FROM pgbouncer.clients;
"
```

### Server Connections

```bash
# Show PostgreSQL server connections
psql -h $NODE_IP -p 30632 -U postgres pgbouncer -c "
SELECT
    COUNT(*) as total_servers,
    SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) as idle,
    SUM(CASE WHEN state = 'used' THEN 1 ELSE 0 END) as used
FROM pgbouncer.servers;
"
```

## Admin Commands

Conectează-te la PgBouncer admin console:
```bash
psql -h $NODE_IP -p 30632 -U postgres pgbouncer
```

Comenzi disponibile:

```sql
-- Show all pools
SHOW POOLS;

-- Show all databases
SHOW DATABASES;

-- Show all clients
SHOW CLIENTS;

-- Show all servers
SHOW SERVERS;

-- Show statistics
SHOW STATS;

-- Show configuration
SHOW CONFIG;

-- Reload configuration (după modificarea configmap)
RELOAD;

-- Pause all activity
PAUSE;

-- Resume activity
RESUME;

-- Close all connections (DANGEROUS!)
SHUTDOWN;
```

## Configuration Tuning

Editează [configmap.yaml](configmap.yaml) pentru a ajusta:

### Pool Size

```ini
default_pool_size = 25      # Conexiuni per user/database
min_pool_size = 10          # Minimum idle connections
reserve_pool_size = 5       # Emergency pool
max_db_connections = 100    # Total connections la PostgreSQL
```

### Timeouts

```ini
server_idle_timeout = 600       # 10 minute
server_lifetime = 3600          # 1 oră
query_timeout = 0               # No limit (setat la 0)
query_wait_timeout = 120        # 2 minute wait for server
```

După modificare:
```bash
# Apply changes
kubectl apply -f pgbouncer/configmap.yaml

# Reload PgBouncer (fără restart)
psql -h $NODE_IP -p 30632 -U postgres pgbouncer -c "RELOAD;"

# SAU restart deployment
kubectl rollout restart deployment/pgbouncer -n dockify-app
```

## Troubleshooting

### Prea multe conexiuni în așteptare

```bash
# Check waiting clients
psql -h $NODE_IP -p 30632 -U postgres pgbouncer -c "SHOW CLIENTS;" | grep waiting

# Solution: Increase pool size
# Edit configmap.yaml: default_pool_size = 50
kubectl apply -f pgbouncer/configmap.yaml
kubectl rollout restart deployment/pgbouncer -n dockify-app
```

### Connection refused

```bash
# Check pod status
kubectl get pods -n dockify-app -l app=pgbouncer

# Check logs
kubectl logs -n dockify-app deployment/pgbouncer --tail=50

# Check service
kubectl describe svc -n dockify-app pgbouncer-service
```

### PgBouncer nu se conectează la PostgreSQL

```bash
# Verify PostgreSQL is running
kubectl get pods -n dockify-app -l app=postgresql

# Test PostgreSQL from PgBouncer pod
kubectl exec -it -n dockify-app deployment/pgbouncer -- \
  psql -h postgresql-service.dockify-app.svc.cluster.local -p 5432 -U postgres -d dockify
```

## High Availability

PgBouncer rulează cu **2 replicas** pentru HA:

```bash
# Check replicas
kubectl get pods -n dockify-app -l app=pgbouncer

# Scale replicas (dacă e necesar)
kubectl scale deployment/pgbouncer -n dockify-app --replicas=3
```

Load balancing se face automat prin Cilium NodePort service.

## Best Practices

1. ✅ **Folosește PgBouncer** pentru toate aplicațiile care se conectează la PostgreSQL
2. ✅ **Pool Mode**: `transaction` pentru majoritatea aplicațiilor web
3. ✅ **Monitor pools**: Verifică regular `SHOW POOLS` și `SHOW STATS`
4. ✅ **Client pool size**: Limitează pool-ul client-side (20-50 conexiuni)
5. ❌ **Nu folosi** pentru long-running queries sau prepared statements complexe

## Files în acest folder

- `configmap.yaml`: PgBouncer configuration (pool settings, timeouts)
- `deployment.yaml`: Deployment manifest (2 replicas)
- `service.yaml`: NodePort service (30632)
