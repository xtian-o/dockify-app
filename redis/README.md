# Redis 7.4 - Dockify App

Redis production deployment cu configurații optimizate pentru cache și persistent storage.

## Specificații

- **Version**: Redis 7.4 Alpine
- **CPU**: 4-8 cores (request: 4, limit: 8)
- **Memory**: 64-128 GB (request: 64Gi, limit: 128Gi)
- **Storage**: 50 GB PVC
- **Port Internal**: 6379
- **NodePort**: 30379

## Configurare Optimizată

### Memory Management

- **maxmemory**: 100GB (din 128GB RAM disponibil)
- **maxmemory-policy**: `allkeys-lru` (eviction policy)
- **Lazy freeing**: Enabled pentru performanță

### Persistence

Dual persistence mode pentru siguranță maximă:

**RDB (Snapshots)**:
- Save every 15 minutes if ≥1 key changed
- Save every 5 minutes if ≥10 keys changed
- Save every 1 minute if ≥10000 keys changed

**AOF (Append Only File)**:
- `appendfsync everysec` - sincronizare la fiecare secundă
- AOF rewrite automat la 100% growth
- RDB+AOF hybrid mode enabled

### Performance Features

- **Active defragmentation**: Enabled
- **Lazy freeing**: Da
- **Multi-threading**: Optimizat pentru 8 CPU cores
- **Client output buffers**: Tuned pentru high-traffic

## Connection Strings

### Acces Extern (NodePort via Cilium)

Obține IP-ul nodului:
```bash
export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "Redis available at: $NODE_IP:30379"
```

**Connection String:**
```bash
redis://$NODE_IP:30379
```

**Conectare cu redis-cli:**
```bash
redis-cli -h $NODE_IP -p 30379
```

### Acces Intern (din cluster)

**Connection String:**
```
redis://redis-service.dockify-app.svc.cluster.local:6379
```

**Conectare din alt pod:**
```bash
kubectl run -it --rm redis-client --image=redis:7.4-alpine --restart=Never -- \
  redis-cli -h redis-service.dockify-app.svc.cluster.local -p 6379
```

## Testing & Verification

### Verifică deployment-ul

```bash
# Check pod status
kubectl get pods -n dockify-app -l app=redis

# Check logs
kubectl logs -n dockify-app deployment/redis -f

# Check service
kubectl get svc -n dockify-app redis-service
```

### Test conexiune

```bash
# Get node IP
export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Test ping
redis-cli -h $NODE_IP -p 30379 ping
# Expected: PONG

# Test set/get
redis-cli -h $NODE_IP -p 30379 SET test "Hello Dockify"
redis-cli -h $NODE_IP -p 30379 GET test
# Expected: "Hello Dockify"
```

### Performance test

```bash
# Check memory usage
redis-cli -h $NODE_IP -p 30379 INFO memory

# Check maxmemory setting
redis-cli -h $NODE_IP -p 30379 CONFIG GET maxmemory

# Check eviction policy
redis-cli -h $NODE_IP -p 30379 CONFIG GET maxmemory-policy

# Check persistence
redis-cli -h $NODE_IP -p 30379 INFO persistence
```

## Comenzi Redis Utile

### Basic Operations

```bash
export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# SET/GET
redis-cli -h $NODE_IP -p 30379 SET mykey "myvalue"
redis-cli -h $NODE_IP -p 30379 GET mykey

# SET with expiration (10 seconds)
redis-cli -h $NODE_IP -p 30379 SETEX tempkey 10 "temporary"

# DELETE
redis-cli -h $NODE_IP -p 30379 DEL mykey

# CHECK if key exists
redis-cli -h $NODE_IP -p 30379 EXISTS mykey

# GET all keys
redis-cli -h $NODE_IP -p 30379 KEYS '*'

# TTL (Time To Live)
redis-cli -h $NODE_IP -p 30379 TTL tempkey
```

### Lists

```bash
# PUSH to list
redis-cli -h $NODE_IP -p 30379 LPUSH mylist "item1"
redis-cli -h $NODE_IP -p 30379 LPUSH mylist "item2"

# GET from list
redis-cli -h $NODE_IP -p 30379 LRANGE mylist 0 -1

# List length
redis-cli -h $NODE_IP -p 30379 LLEN mylist
```

### Hashes

```bash
# SET hash field
redis-cli -h $NODE_IP -p 30379 HSET user:1000 name "John Doe"
redis-cli -h $NODE_IP -p 30379 HSET user:1000 email "john@example.com"

# GET hash field
redis-cli -h $NODE_IP -p 30379 HGET user:1000 name

# GET all hash fields
redis-cli -h $NODE_IP -p 30379 HGETALL user:1000
```

### Sets

```bash
# ADD to set
redis-cli -h $NODE_IP -p 30379 SADD myset "member1"
redis-cli -h $NODE_IP -p 30379 SADD myset "member2"

# GET all set members
redis-cli -h $NODE_IP -p 30379 SMEMBERS myset

# Check membership
redis-cli -h $NODE_IP -p 30379 SISMEMBER myset "member1"
```

## Aplicații - Exemple de Conectare

### Python (redis-py)

```python
import redis
import os

# Connect to Redis
r = redis.Redis(
    host=os.getenv('NODE_IP', 'localhost'),
    port=30379,
    decode_responses=True
)

# Test connection
print(r.ping())  # True

# Set/Get
r.set('mykey', 'myvalue')
print(r.get('mykey'))  # 'myvalue'

# Set with expiration
r.setex('tempkey', 60, 'expires in 60 seconds')

# Hash operations
r.hset('user:1000', mapping={'name': 'John', 'email': 'john@example.com'})
print(r.hgetall('user:1000'))

# List operations
r.lpush('mylist', 'item1', 'item2', 'item3')
print(r.lrange('mylist', 0, -1))
```

### Node.js (ioredis)

```javascript
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.NODE_IP || 'localhost',
  port: 30379,
});

// Test connection
redis.ping().then((result) => {
  console.log(result);  // PONG
});

// Set/Get
await redis.set('mykey', 'myvalue');
const value = await redis.get('mykey');
console.log(value);  // myvalue

// Set with expiration
await redis.setex('tempkey', 60, 'expires in 60 seconds');

// Hash operations
await redis.hset('user:1000', 'name', 'John', 'email', 'john@example.com');
const user = await redis.hgetall('user:1000');
console.log(user);

// Pipeline for multiple operations
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.get('key1');
await pipeline.exec();
```

### Go (go-redis)

```go
package main

import (
    "context"
    "fmt"
    "github.com/redis/go-redis/v9"
)

func main() {
    ctx := context.Background()

    rdb := redis.NewClient(&redis.Options{
        Addr: "NODE_IP:30379",
    })

    // Test connection
    pong, err := rdb.Ping(ctx).Result()
    fmt.Println(pong, err)  // PONG <nil>

    // Set/Get
    err = rdb.Set(ctx, "mykey", "myvalue", 0).Err()
    if err != nil {
        panic(err)
    }

    val, err := rdb.Get(ctx, "mykey").Result()
    fmt.Println(val)  // myvalue

    // Hash operations
    rdb.HSet(ctx, "user:1000", "name", "John", "email", "john@example.com")
    user := rdb.HGetAll(ctx, "user:1000").Val()
    fmt.Println(user)
}
```

### Java (Jedis)

```java
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

public class RedisConnect {
    public static void main(String[] args) {
        try (JedisPool pool = new JedisPool("NODE_IP", 30379);
             Jedis jedis = pool.getResource()) {

            // Test connection
            String pong = jedis.ping();
            System.out.println(pong);  // PONG

            // Set/Get
            jedis.set("mykey", "myvalue");
            String value = jedis.get("mykey");
            System.out.println(value);  // myvalue

            // Hash operations
            jedis.hset("user:1000", "name", "John");
            jedis.hset("user:1000", "email", "john@example.com");
            Map<String, String> user = jedis.hgetAll("user:1000");
            System.out.println(user);
        }
    }
}
```

### Django Cache (Python)

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{os.getenv("NODE_IP", "localhost")}:30379/0',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Usage in views
from django.core.cache import cache

# Set cache
cache.set('my_key', 'my_value', timeout=300)  # 5 minutes

# Get cache
value = cache.get('my_key')

# Delete cache
cache.delete('my_key')

# Clear all cache
cache.clear()
```

## Monitoring

### Memory Usage

```bash
export NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Detailed memory info
redis-cli -h $NODE_IP -p 30379 INFO memory

# Memory stats
redis-cli -h $NODE_IP -p 30379 --csv INFO memory | grep -E "used_memory_human|maxmemory_human|mem_fragmentation_ratio"
```

### Key Statistics

```bash
# Total keys
redis-cli -h $NODE_IP -p 30379 DBSIZE

# Key samples
redis-cli -h $NODE_IP -p 30379 --scan --pattern '*' | head -20

# Memory usage per key
redis-cli -h $NODE_IP -p 30379 MEMORY USAGE mykey
```

### Performance Stats

```bash
# General stats
redis-cli -h $NODE_IP -p 30379 INFO stats

# Hit rate
redis-cli -h $NODE_IP -p 30379 INFO stats | grep -E "keyspace_hits|keyspace_misses"

# Connected clients
redis-cli -h $NODE_IP -p 30379 CLIENT LIST

# Slow log
redis-cli -h $NODE_IP -p 30379 SLOWLOG GET 10
```

### Persistence Status

```bash
# Check RDB status
redis-cli -h $NODE_IP -p 30379 INFO persistence | grep rdb

# Check AOF status
redis-cli -h $NODE_IP -p 30379 INFO persistence | grep aof

# Force save RDB
redis-cli -h $NODE_IP -p 30379 BGSAVE

# Force AOF rewrite
redis-cli -h $NODE_IP -p 30379 BGREWRITEAOF
```

## Backup & Restore

### Manual Backup

```bash
# Force RDB snapshot
redis-cli -h $NODE_IP -p 30379 BGSAVE

# Wait for completion
redis-cli -h $NODE_IP -p 30379 LASTSAVE

# Copy RDB file from pod
kubectl cp dockify-app/redis-xxx:/data/dump.rdb ./redis-backup-$(date +%Y%m%d-%H%M%S).rdb
```

### Restore from Backup

```bash
# Stop Redis
kubectl scale deployment/redis -n dockify-app --replicas=0

# Copy backup to PVC (sau folosește un init container)
kubectl cp ./redis-backup-20250117.rdb dockify-app/redis-xxx:/data/dump.rdb

# Start Redis
kubectl scale deployment/redis -n dockify-app --replicas=1
```

## Admin Operations

### Flush Data

```bash
# Flush current database (DB 0)
redis-cli -h $NODE_IP -p 30379 FLUSHDB

# Flush ALL databases (DANGEROUS!)
redis-cli -h $NODE_IP -p 30379 FLUSHALL
```

### Configuration

```bash
# Get all config
redis-cli -h $NODE_IP -p 30379 CONFIG GET '*'

# Get specific config
redis-cli -h $NODE_IP -p 30379 CONFIG GET maxmemory

# Set config runtime (not persistent)
redis-cli -h $NODE_IP -p 30379 CONFIG SET maxmemory 50gb

# Make persistent (save to redis.conf)
redis-cli -h $NODE_IP -p 30379 CONFIG REWRITE
```

## Troubleshooting

### Out of Memory

```bash
# Check memory usage
redis-cli -h $NODE_IP -p 30379 INFO memory | grep used_memory_human

# Check eviction stats
redis-cli -h $NODE_IP -p 30379 INFO stats | grep evicted_keys

# Solution: Increase maxmemory in configmap.yaml
# sau: Clean old keys
redis-cli -h $NODE_IP -p 30379 FLUSHDB
```

### Connection Refused

```bash
# Check pod status
kubectl get pods -n dockify-app -l app=redis

# Check logs
kubectl logs -n dockify-app deployment/redis --tail=50

# Check service
kubectl describe svc -n dockify-app redis-service
```

### High Memory Fragmentation

```bash
# Check fragmentation ratio
redis-cli -h $NODE_IP -p 30379 INFO memory | grep mem_fragmentation_ratio

# If > 1.5, restart Redis to defragment
kubectl rollout restart deployment/redis -n dockify-app
```

## Security

### Enable Password Protection

Edit [configmap.yaml](configmap.yaml):

```ini
# Uncomment this line:
requirepass your-strong-password-here
```

Apply changes:
```bash
kubectl apply -f redis/configmap.yaml
kubectl rollout restart deployment/redis -n dockify-app
```

Connect with password:
```bash
redis-cli -h $NODE_IP -p 30379 -a your-strong-password-here
```

## Best Practices

1. ✅ **Monitor memory usage** - set alerts at 80% maxmemory
2. ✅ **Use appropriate eviction policy** - allkeys-lru pentru cache
3. ✅ **Enable persistence** - RDB + AOF pentru date importante
4. ✅ **Set password** în producție (requirepass)
5. ✅ **Monitor hit rate** - optimizează dacă < 90%
6. ❌ **Nu folosi KEYS*** în producție (folosește SCAN)
7. ❌ **Nu expune** Redis direct pe internet

## Use Cases

### Cache Layer

```python
# Cache database queries
import redis
import json

r = redis.Redis(host=NODE_IP, port=30379)

def get_user(user_id):
    # Try cache first
    cached = r.get(f'user:{user_id}')
    if cached:
        return json.loads(cached)

    # Fetch from database
    user = database.query(f'SELECT * FROM users WHERE id={user_id}')

    # Cache for 5 minutes
    r.setex(f'user:{user_id}', 300, json.dumps(user))

    return user
```

### Session Store

```python
# Store user sessions
session_id = generate_session_id()
session_data = {'user_id': 1000, 'logged_in': True}

r.setex(f'session:{session_id}', 3600, json.dumps(session_data))  # 1 hour
```

### Rate Limiting

```python
def rate_limit(user_id, max_requests=100, window=60):
    key = f'rate_limit:{user_id}'
    current = r.get(key)

    if current and int(current) >= max_requests:
        return False  # Rate limit exceeded

    pipe = r.pipeline()
    pipe.incr(key)
    pipe.expire(key, window)
    pipe.execute()

    return True
```

## Files în acest folder

- `pvc.yaml`: Persistent Volume Claim (50Gi)
- `configmap.yaml`: Redis configuration (memory, persistence, performance)
- `deployment.yaml`: Deployment manifest
- `service.yaml`: NodePort service (30379)
