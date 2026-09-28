from typing import List, Dict, Any

SEED_HISTORICAL_INCIDENTS: List[Dict[str, Any]] = [
    # 1. Database - Connection Pool Exhaustion (Key Anchor for Demo)
    {
        "id": "INC-104",
        "title": "Database Connection Timeout on Checkout Gateway",
        "service": "Payment API",
        "severity": "Critical",
        "description": "Users encountering 503 Service Unavailable during checkout. Database connections timing out after 30s threshold.",
        "error_logs": "ERROR 2026-08-12 14:22:01 [pool-manager] connection pool exhausted (max=50, in_use=50, waiting=142)\nFATAL [checkout-svc] database timeout after 30000ms executing SQL: SELECT * FROM payment_methods WHERE customer_id = ?\nHTTP/1.1 503 Service Unavailable",
        "status": "Resolved",
        "root_cause": "PostgreSQL connection pool saturation due to unclosed connection leak in async retry loop under high traffic.",
        "fix_applied": "Increased max connection pool size from 50 -> 100 in database.yaml and deployed patch closing leaked sessions in retry middleware.",
        "outcome": "Resolved",
        "resolution_time_minutes": 14,
        "lessons_learned": [
            "Always inspect connection pool saturation metrics before restarting PostgreSQL instances.",
            "Connection pool exhaustion typically mimics database crash but is purely client pool constraint.",
            "Increasing pool size from 50 to 100 instantly restored 99.9% checkout availability."
        ],
        "symptoms": ["connection pool exhausted", "database timeout", "HTTP 503", "payment timeout"],
        "tags": ["database", "postgres", "pool-exhaustion", "payment-api", "503"]
    },
    
    # 2. Database - Connection Saturation & Pool Restart
    {
        "id": "INC-118",
        "title": "Payment API 503 - DB Connection Saturation",
        "service": "Payment API",
        "severity": "Critical",
        "description": "Payment microservice returning intermittent 503 errors and DB pool queue backlog.",
        "error_logs": "WARN [db-client] Pool size 50 reached 100% capacity\nERROR [api-gateway] Upstream service returned 503 for /v2/charge\nSocketTimeoutException: Read timed out to db-master.internal:5432",
        "status": "Resolved",
        "root_cause": "Database connection saturation caused by sudden burst of webhook callbacks holding connections open.",
        "fix_applied": "Restarted connection pool supervisor and increased pool capacity from 75 -> 120 with aggressive 5s query timeout.",
        "outcome": "Resolved",
        "resolution_time_minutes": 9,
        "lessons_learned": [
            "Payment API 503s with 'Read timed out' are 90% correlated with DB connection pool exhaustion rather than DB engine crashes.",
            "Adjusting pool size + timeout limits avoids full service restarts."
        ],
        "symptoms": ["HTTP 503", "pool capacity 100%", "Read timed out", "connection saturation"],
        "tags": ["database", "payment-api", "pool", "saturation", "503"]
    },

    # 3. Database - Transaction Deadlock in Order Placement
    {
        "id": "INC-125",
        "title": "PostgreSQL Deadlock Detected on Order Processing",
        "service": "Order Service",
        "severity": "High",
        "description": "Order placement requests failing with 500 Internal Server Error. Deadlock detected in database transaction logs.",
        "error_logs": "ERROR: deadlock detected\nDETAIL: Process 4120 waits for ShareLock on transaction 88102; blocked by process 4118.\nHINT: See server log for query details.\nSQLState: 40P01",
        "status": "Resolved",
        "root_cause": "Conflicting lock acquisition order between inventory deduction and order status update queries in concurrent workers.",
        "fix_applied": "Normalized row-locking sequence in inventory_service.py using SELECT FOR UPDATE in strictly ascending SKU order.",
        "outcome": "Resolved",
        "resolution_time_minutes": 22,
        "lessons_learned": [
            "Ensure all multi-row locking transactions acquire row locks in deterministic alphabetical or ID order.",
            "Deadlock 40P01 errors cannot be resolved by scaling hardware; code-level ordering is required."
        ],
        "symptoms": ["deadlock detected", "SQLState 40P01", "ShareLock wait", "HTTP 500"],
        "tags": ["database", "postgres", "deadlock", "orders", "locking"]
    },

    # 4. Database - Slow Query & Read Replica Replication Lag
    {
        "id": "INC-131",
        "title": "Read Replica Lag Causing Stale User Dashboard",
        "service": "User Service",
        "severity": "Medium",
        "description": "User profile and dashboard updates not reflecting immediately. Read replicas lagging by 480 seconds.",
        "error_logs": "WARN [replica-monitor] Replication lag on db-read-02 exceeded SLA (current: 485s, threshold: 30s)\nQuery duration: 42000ms for SELECT * FROM user_activity_log WHERE org_id = ?",
        "status": "Resolved",
        "root_cause": "Unindexed table scan on user_activity_log table locking replica CPU during heavy read bursts.",
        "fix_applied": "Created composite B-tree index (org_id, created_at DESC) concurrently on master; replica lag dropped to 200ms within 4 minutes.",
        "outcome": "Resolved",
        "resolution_time_minutes": 18,
        "lessons_learned": [
            "Replication lag spikes are almost always triggered by long-running sequential table scans on read replicas.",
            "Use CREATE INDEX CONCURRENTLY to avoid blocking read traffic."
        ],
        "symptoms": ["replication lag", "stale data", "table scan", "replica CPU spike"],
        "tags": ["database", "replica", "indexing", "performance", "user-service"]
    },

    # 5. API - Auth Service JWT Key Rotation Mismatch
    {
        "id": "INC-142",
        "title": "Authentication Failures After JWKS Key Rotation",
        "service": "Auth Service",
        "severity": "Critical",
        "description": "All downstream services rejecting incoming user requests with 401 Unauthorized following scheduled key rotation.",
        "error_logs": "ERROR [jwt-validator] Invalid signature for token with kid 'auth-key-2026-b'\nJWKS cache missing key id 'auth-key-2026-b'. Available keys: ['auth-key-2025-a']\nHTTP 401 Unauthorized for 100% of gateway traffic",
        "status": "Resolved",
        "root_cause": "API gateway cached JWKS public keys with TTL of 24 hours without cache invalidation hook on key rollover.",
        "fix_applied": "Flushed Redis JWKS cache on API gateway and patched JWKS client to refresh on unknown kid receipt.",
        "outcome": "Resolved",
        "resolution_time_minutes": 8,
        "lessons_learned": [
            "JWKS key rotation requires dual-key coexistence (grace period) for 48 hours before retiring old keys.",
            "Always implement on-demand JWKS cache busting when encountering unknown 'kid' headers."
        ],
        "symptoms": ["HTTP 401 Unauthorized", "Invalid signature", "kid missing in JWKS", "key rotation"],
        "tags": ["api", "auth", "jwt", "security", "jwks", "401"]
    },

    # 6. API - Rate Limiter Redis Connection Saturation (429 Spike)
    {
        "id": "INC-149",
        "title": "Cascading 429 Too Many Requests Due to Redis Cluster Freeze",
        "service": "API Gateway",
        "severity": "High",
        "description": "Legitimate traffic getting throttled globally. Rate limit token bucket checks timing out.",
        "error_logs": "ERROR [rate-limiter] Redis connection timeout to redis-sentinel.internal:6379\nFallback to strict-block mode triggered\nHTTP 429 Too Many Requests returned to 45,000 clients",
        "status": "Resolved",
        "root_cause": "Redis rate limiter sentinel ran out of available file descriptors (maxclients reached 10,000).",
        "fix_applied": "Increased Redis maxclients to 50,000, set fallback mode to 'fail-open' in gateway configuration, and deployed connection pooling for Redis clients.",
        "outcome": "Resolved",
        "resolution_time_minutes": 11,
        "lessons_learned": [
            "Rate limiters should ALWAYS fail-open in production rather than fail-closed during Redis outages.",
            "Tune OS ulimit and Redis maxclients on edge ingress infrastructure."
        ],
        "symptoms": ["HTTP 429", "Redis connection timeout", "maxclients reached", "rate limiter freeze"],
        "tags": ["api", "rate-limiting", "redis", "gateway", "429"]
    },

    # 7. Infrastructure - Kubernetes Pod OOMKilled CrashLoop
    {
        "id": "INC-155",
        "title": "Inventory Service CrashLoopBackOff - OOMKilled",
        "service": "Inventory Service",
        "severity": "Critical",
        "description": "Kubernetes pods for inventory-service terminating with Exit Code 137 (OOMKilled) under catalog refresh load.",
        "error_logs": "State: Waiting\n  Reason: CrashLoopBackOff\nLast State: Terminated\n  Reason: OOMKilled\n  Exit Code: 137\nContainer inventory-app exceeded memory limit: 512Mi (used: 518Mi)",
        "status": "Resolved",
        "root_cause": "JVM heap memory limit (-Xmx) was configured higher than Kubernetes pod cgroup memory limit (512Mi vs 768Mi heap).",
        "fix_applied": "Updated Kubernetes resource limits to 1536Mi memory and configured Java container support flags `-XX:MaxRAMPercentage=75.0`.",
        "outcome": "Resolved",
        "resolution_time_minutes": 12,
        "lessons_learned": [
            "Exit Code 137 is always Linux kernel OOM killer terminating the container.",
            "Container memory limits in Helm/K8s manifests must be at least 30% higher than JVM heap allocations to allow off-heap metaspace.",
            "Setting MaxRAMPercentage prevents manual heap/cgroup mismatches."
        ],
        "symptoms": ["OOMKilled", "Exit Code 137", "CrashLoopBackOff", "memory limit exceeded"],
        "tags": ["infrastructure", "kubernetes", "oom", "memory", "jvm", "inventory-service"]
    },

    # 8. Infrastructure - Disk Space 100% on Log Partition
    {
        "id": "INC-162",
        "title": "Disk Full /var/log Freezing Message Ingestion",
        "service": "Kafka Ingest",
        "severity": "High",
        "description": "Kafka broker node refusing writes. Local disk utilization reached 100% on /var/log/journal.",
        "error_logs": "FATAL [kafka-broker-3] No space left on device: '/data/kafka-logs/events-0/00000000.log'\nERROR: write /var/log/app.log: no space left on device\nSystemd-journald: Corrupted log rotation file",
        "status": "Resolved",
        "root_cause": "Debug level logging left enabled during staging load test saturated 100GB NVMe partition due to broken logrotate cron.",
        "fix_applied": "Purged uncompressed old logs, corrected logrotate configuration with hourly rotation and 7-day gzip retention, switched logger to INFO level.",
        "outcome": "Resolved",
        "resolution_time_minutes": 15,
        "lessons_learned": [
            "Check disk partition utilization with `df -h` immediately when I/O operations fail with 'No space left on device'.",
            "Ensure logrotate daemon has active systemd timer monitoring."
        ],
        "symptoms": ["No space left on device", "disk full", "write failure", "Kafka write rejection"],
        "tags": ["infrastructure", "disk-space", "kafka", "logging", "storage"]
    },

    # 9. Infrastructure - CoreDNS Pod Latency Causing Microservice Timeouts
    {
        "id": "INC-168",
        "title": "Intermittent DNS Resolution Failures Across EKS Cluster",
        "service": "CoreDNS",
        "severity": "Critical",
        "description": "Cross-service HTTP and gRPC calls failing intermittently with 'Could not resolve host: service.namespace.svc.cluster.local'.",
        "error_logs": "ERROR [client] dial tcp: lookup auth-service.prod.svc.cluster.local: i/o timeout\nCoreDNS error: 2026-07-19 [ERROR] plugin/errors: 2 auth-service.prod.svc.cluster.local. A: read udp 10.0.12.4:53: i/o timeout\nCoreDNS CPU throttling at 99.8%",
        "status": "Resolved",
        "root_cause": "CoreDNS deployment was underscaled (only 2 replicas) handling 40,000 queries/sec with strict 100m CPU limit causing kernel CFS throttling.",
        "fix_applied": "Scaled CoreDNS deployment from 2 -> 8 replicas and enabled NodeLocal DNSCache daemonset across all worker nodes.",
        "outcome": "Resolved",
        "resolution_time_minutes": 16,
        "lessons_learned": [
            "Cluster-wide random connection timeouts are frequently CoreDNS CPU starvation rather than target service failure.",
            "Deploy NodeLocal DNSCache for any cluster exceeding 50 worker nodes."
        ],
        "symptoms": ["lookup timeout", "dial tcp lookup i/o timeout", "CoreDNS CPU throttling", "DNS failure"],
        "tags": ["infrastructure", "kubernetes", "dns", "coredns", "networking"]
    },

    # 10. Deployment - Incompatible Database Schema Migration
    {
        "id": "INC-173",
        "title": "500 Errors Post-Release: Column 'currency_code' Does Not Exist",
        "service": "Billing Service",
        "severity": "Critical",
        "description": "Immediately following v2.41 release, 100% of billing invoice generation endpoints throwing 500 exceptions.",
        "error_logs": "ERROR [invoice-generator] column invoices.currency_code does not exist\nLINE 1: SELECT id, amount, currency_code FROM invoices WHERE id = $1\nRelease tag: release-v2.41.0 deployed at 18:00:00 UTC",
        "status": "Resolved",
        "root_cause": "Blue/green deployment activated new v2.41 application pods before Flyway DB migration step finished executing on RDS.",
        "fix_applied": "Manually triggered Flyway migration step `V2_41__add_currency_code.sql` and updated CI/CD pipeline gate to verify migration health before pod rollout.",
        "outcome": "Resolved",
        "resolution_time_minutes": 7,
        "lessons_learned": [
            "Never perform destructive or non-backwards-compatible schema changes in single deployment steps.",
            "Use Expand-and-Contract database migration pattern: (1) Add nullable column, (2) Deploy code reading column, (3) Apply NOT NULL constraint."
        ],
        "symptoms": ["column does not exist", "post-release 500", "migration missing", "Flyway"],
        "tags": ["deployment", "schema-migration", "billing", "flyway", "release"]
    },

    # 11. Deployment - Misconfigured Environment Variable Port Typo
    {
        "id": "INC-179",
        "title": "Notification Service Crash On Boot (Connection Refused)",
        "service": "Notification Service",
        "severity": "High",
        "description": "Newly deployed notification service pods entering CrashLoopBackOff immediately after deployment.",
        "error_logs": "FATAL [main] Failed to connect to Redis queue broker at redis-cluster.internal:63799\nError: dial tcp: connection refused on port 63799\nConfig dump: REDIS_PORT=63799 (Expected: 6379)",
        "status": "Resolved",
        "root_cause": "Typo in Helm values.yaml configmap: `REDIS_PORT: 63799` instead of standard `6379`.",
        "fix_applied": "Corrected REDIS_PORT value to 6379 in Kubernetes ConfigMap and performed rolling restart.",
        "outcome": "Resolved",
        "resolution_time_minutes": 5,
        "lessons_learned": [
            "Connection refused on non-standard ports indicates environment variable config typo.",
            "Implement ConfigMap schema validation in CI pre-commit checks."
        ],
        "symptoms": ["connection refused", "CrashLoopBackOff", "port typo", "config error"],
        "tags": ["deployment", "config", "kubernetes", "notification-service", "redis"]
    },

    # 12. API - GraphQL Query Depth Bomb Causing Thread Starvation
    {
        "id": "INC-185",
        "title": "GraphQL Gateway Latency Surge (Thread Pool Starvation)",
        "service": "GraphQL Gateway",
        "severity": "High",
        "description": "GraphQL gateway response time spiked from 45ms to 12,000ms. Worker threads exhausted.",
        "error_logs": "WARN [thread-pool] Active worker threads: 200/200 (queue backlog: 1,420)\nNested query detected: depth 14 on query { user { friends { friends { orders { items ... } } } } }\nMemory utilization: 94%",
        "status": "Resolved",
        "root_cause": "Malicious or unoptimized deeply nested circular GraphQL query executed without depth and complexity limiting.",
        "fix_applied": "Configured GraphQL max query depth limit = 6 and cost analysis limiter in Apollo Gateway middleware.",
        "outcome": "Resolved",
        "resolution_time_minutes": 13,
        "lessons_learned": [
            "All public GraphQL endpoints must enforce strict query depth (max 6) and query complexity analysis limits.",
            "Thread starvation with high queue backlog is typically caused by unconstrained recursive resolver queries."
        ],
        "symptoms": ["thread pool starvation", "latency surge", "nested query depth", "HTTP 504"],
        "tags": ["api", "graphql", "performance", "gateway", "thread-exhaustion"]
    },

    # 13. Infrastructure - Kafka Consumer Group Rebalance Storm
    {
        "id": "INC-192",
        "title": "Kafka Consumer Group Rebalance Storm on Order Processing",
        "service": "Order Processing",
        "severity": "High",
        "description": "Order processing lag increasing exponentially. Consumers constantly leaving and re-joining consumer group.",
        "error_logs": "WARN [consumer-coordinator] Revoking previously assigned partitions for group order-processors\nHeartbeat timeout expired (max.poll.interval.ms: 30000 exceeded, elapsed: 48200ms)\nInitiating rebalance (generation 412 -> 413)",
        "status": "Resolved",
        "root_cause": "Heavy third-party fraud check API call inside consumer loop blocked message processing beyond max.poll.interval.ms.",
        "fix_applied": "Increased max.poll.interval.ms to 300000ms and offloaded fraud check to asynchronous background thread pool.",
        "outcome": "Resolved",
        "resolution_time_minutes": 17,
        "lessons_learned": [
            "Consumer group rebalance storms occur when message processing exceeds `max.poll.interval.ms`.",
            "Never perform synchronous blocking I/O calls directly within the Kafka consumer poll loop."
        ],
        "symptoms": ["Kafka rebalance", "Heartbeat timeout", "consumer lag spike", "max.poll.interval.ms exceeded"],
        "tags": ["infrastructure", "kafka", "streaming", "consumer-group", "orders"]
    },

    # 14. Infrastructure - AWS EC2 Metadata Service IMDSv2 Token Expiration
    {
        "id": "INC-198",
        "title": "AWS SDK Metadata Token Expiration Failures (IAM Role Access)",
        "service": "Storage Service",
        "severity": "High",
        "description": "S3 upload operations failing with 403 Forbidden across all worker nodes simultaneously.",
        "error_logs": "ERROR [aws-sdk] Unable to load credentials from EC2 Metadata Service: HTTP 401 Unauthorized\nPUT http://169.254.169.254/latest/api/token - Hop limit exceeded\nS3 Upload failed: CredentialsProviderError",
        "status": "Resolved",
        "root_cause": "Containerized workloads in bridge networking required IMDSv2 metadata hop limit = 2 (was set to default 1).",
        "fix_applied": "Updated EC2 Launch Template `HttpPutResponseHopLimit` from 1 -> 2 via AWS CLI and refreshed instance metadata.",
        "outcome": "Resolved",
        "resolution_time_minutes": 10,
        "lessons_learned": [
            "Docker and Kubernetes pods using host networking can access IMDSv2 with hop limit 1, but bridge networking requires hop limit 2.",
            "S3 403 / CredentialsProviderError on EC2 is usually IMDS hop limit exhaustion."
        ],
        "symptoms": ["IMDSv2 401", "Hop limit exceeded", "CredentialsProviderError", "S3 403"],
        "tags": ["infrastructure", "aws", "security", "s3", "cloud"]
    },

    # 15. Database - Redis Hot Key CPU Throttling
    {
        "id": "INC-203",
        "title": "Redis Master 100% CPU on Flash Sale Product Cache Key",
        "service": "Catalog Service",
        "severity": "Critical",
        "description": "Redis single-threaded master pinned at 100% CPU. Catalog page load latency escalated to 8.5s.",
        "error_logs": "WARN [redis-monitor] Engine CPU: 99.9%\nHot key detected: 'product:sku:99812-flash-sale' requested 180,000 ops/sec\nCommand: MGET product:sku:99812-flash-sale:details product:sku:99812-flash-sale:inventory",
        "status": "Resolved",
        "root_cause": "Single Redis key receiving 180,000 reads/sec without local in-memory L1 cache on frontend instances.",
        "fix_applied": "Enabled in-process L1 Caffeine cache with 5-second TTL on catalog microservices and replicated hot key across Redis read replicas.",
        "outcome": "Resolved",
        "resolution_time_minutes": 14,
        "lessons_learned": [
            "Redis single-threaded architecture cannot handle >100k requests/sec to a single hot key.",
            "Use client-side L1 micro-caching (5-10s TTL) to absorb flash sale hot key spikes."
        ],
        "symptoms": ["Redis 100% CPU", "Hot key", "Catalog latency spike", "MGET saturation"],
        "tags": ["database", "redis", "caching", "catalog", "performance"]
    }
]

def seed_hindsight_memories(hindsight_svc) -> int:
    """
    Populate Hindsight with rich historical incident, operational, and learning memories.
    """
    count = 0
    for inc in SEED_HISTORICAL_INCIDENTS:
        # 1. Retain structured Incident Memory
        hindsight_svc.retain(
            incident_id=inc["id"],
            title=inc["title"],
            service=inc["service"],
            memory_type="Incident",
            content=f"Incident {inc['id']}: {inc['title']}\nDescription: {inc['description']}\nLogs excerpt: {inc['error_logs']}\nRoot Cause: {inc['root_cause']}\nResolution Fix: {inc['fix_applied']}\nOutcome: {inc['outcome']}",
            symptoms=inc["symptoms"],
            root_cause=inc["root_cause"],
            fix_applied=inc["fix_applied"],
            outcome=inc["outcome"],
            resolution_time_minutes=inc["resolution_time_minutes"],
            lesson="; ".join(inc["lessons_learned"]),
            tags=inc["tags"]
        )
        count += 1
        
        # 2. Retain Operational Memory
        hindsight_svc.retain(
            incident_id=inc["id"],
            title=f"Operational Pattern: {inc['service']} - {inc['symptoms'][0] if inc['symptoms'] else 'Failure'}",
            service=inc["service"],
            memory_type="Operational",
            content=f"Operational Pattern on {inc['service']}: When encountering symptoms like {', '.join(inc['symptoms'])}, the root cause is frequently {inc['root_cause']}. Effective remediation: {inc['fix_applied']}.",
            symptoms=inc["symptoms"],
            root_cause=inc["root_cause"],
            fix_applied=inc["fix_applied"],
            outcome=inc["outcome"],
            resolution_time_minutes=inc["resolution_time_minutes"],
            lesson=inc["lessons_learned"][0] if inc["lessons_learned"] else "",
            tags=inc["tags"]
        )
        count += 1
        
        # 3. Retain Learning Memory (Heuristic Rule)
        if inc.get("lessons_learned"):
            for lesson_text in inc["lessons_learned"][:1]:
                hindsight_svc.retain(
                    incident_id=inc["id"],
                    title=f"Learned Rule: {inc['service']} Troubleshooting",
                    service=inc["service"],
                    memory_type="Learning",
                    content=f"Learned SRE Rule for {inc['service']}: {lesson_text}. Past Fix: {inc['fix_applied']}.",
                    symptoms=inc["symptoms"],
                    root_cause=inc["root_cause"],
                    fix_applied=inc["fix_applied"],
                    outcome=inc["outcome"],
                    resolution_time_minutes=inc["resolution_time_minutes"],
                    lesson=lesson_text,
                    tags=inc["tags"]
                )
                count += 1

    return count
