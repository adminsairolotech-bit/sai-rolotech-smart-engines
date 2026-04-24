# Complex Coding Architect

## Triggers
- User wants architecture for large/complex systems
- User says "architecture", "system design", "scalable", "high-level design"

## What It Does

### Architecture Process
```
COMPLEX SYSTEM REQUEST
        ↓
1. REQUIREMENTS ANALYSIS
   → Functional requirements
   → Non-functional requirements
   → Scale requirements
   → Performance targets
   → Security requirements
   → Budget constraints
        ↓
2. HIGH-LEVEL DESIGN
   → System components
   → Data flow architecture
   → API gateway design
   → Service boundaries
   → Communication patterns
        ↓
3. DATA ARCHITECTURE
   → Data models
   → Storage strategy
   → Caching layers
   → Data flow
   → Backup/recovery
        ↓
4. INFRASTRUCTURE
   → Cloud services
   → Deployment strategy
   → Monitoring
   → Scaling approach
   → Disaster recovery
        ↓
5. SECURITY
   → Authentication/Authorization
   → Data encryption
   → Network security
   → Compliance
        ↓
OUTPUT: System design document
```

### Output Format
```
# System Architecture: {System Name}

## Executive Summary
**Purpose:** {What system does}
**Scale:** {Users/Requests per day}
**Availability Target:** {X}% (99.9% = 8.7h downtime/year)
**Performance Target:** {X}ms p95 latency

## Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                      CDN / Edge                         │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│              (Health checks, SSL termination)           │
└─────────────────────────────────────────────────────────┘
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
┌───┴───┐             ┌────┴────┐             ┌────┴────┐
│Server │             │ Server  │             │ Server  │
│  1    │             │   2     │             │   N     │
└───────┘             └─────────┘             └─────────┘
                            │
┌───────────────────────────┼───────────────────────────┐
│                    Message Queue                        │
│               (Kafka / RabbitMQ / SQS)                 │
└───────────────────────────┼───────────────────────────┘
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
┌───┴───┐             ┌────┴────┐             ┌────┴────┐
│ Worker│             │ Worker  │             │ Worker  │
│   1   │             │   2     │             │   N     │
└───┴───┘             └─────────┘             └─────────┘
                            │
┌───────────────────────────────────────────────────────┐
│                    Data Layer                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │Primary  │  │Replica  │  │ Cache   │  │ Object  │ │
│  │Database │  │Database │  │ (Redis) │  │ Storage │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │
└───────────────────────────────────────────────────────┘
```

## Component Design

### {Component Name}
**Purpose:** {What it does}
**Technology:** {Stack}
**Scaling:** {How it scales}
**Failure mode:** {What happens if it fails}

### {Component Name}
...

## Data Architecture

### Primary Database
- Type: {PostgreSQL / MySQL / MongoDB}
- Version: {X.Y}
- Sharding: {Yes/No}
- Replication: {Master-slave / Multi-master}

### Caching Strategy
```
┌─────────┐    Cache Hit    ┌─────────┐
│  User   │ ──────────────→│  Redis  │
│ Request │                 │  Cache  │
└─────────┘                 └─────────┘
       │ Cache Miss
       ↓
┌─────────┐                 ┌─────────┐
│  User   │ ←──────────────│Primary  │
│ Request │   Return Data  │Database │
└─────────┘                 └─────────┘
       │ (Cache + Return)
       ↓
┌─────────┐
│  Redis  │
│  Cache  │ (Store for next time)
└─────────┘
```

### Data Models
```
User
├── id: UUID
├── email: String (unique)
├── password_hash: String
├── created_at: Timestamp
└── updated_at: Timestamp

Order
├── id: UUID
├── user_id: UUID (FK → User)
├── status: Enum
├── total_amount: Decimal
├── created_at: Timestamp
└── items: JSON
```

## API Design

### API Gateway
| Endpoint | Service | Auth |
|----------|---------|------|
| /api/users/* | User Service | JWT |
| /api/orders/* | Order Service | JWT |
| /api/payments/* | Payment Service | API Key |

### Request Flow
```
Client → API Gateway → Auth Middleware → Rate Limiter → Service → Database
                  ↓                      ↓
            Log Request             Return Response
```

## Infrastructure

### Cloud: {AWS / GCP / Azure}
```
Region: {Region}
Services:
- ECS/EKS for containers
- RDS for database
- ElastiCache for Redis
- S3 for object storage
- CloudFront for CDN
```

### Deployment
- Strategy: {Blue-Green / Canary / Rolling}
- CI/CD: {GitHub Actions / Jenkins}
- Container: {Docker / Podman}

## Monitoring & Observability

### Metrics
- Request rate
- Error rate
- Latency (p50, p95, p99)
- CPU/Memory utilization

### Logging
- Centralized: {ELK / Datadog / CloudWatch}
- Log levels: ERROR, WARN, INFO, DEBUG

### Alerting
- PagerDuty integration
- On-call rotation
- Escalation policy

## Security

### Authentication
- Method: {JWT / OAuth2 / Session}
- Token expiry: {X} minutes
- Refresh token: Yes/No

### Authorization
- Type: {RBAC / ABAC}
- Roles: {Admin, User, Guest}
- Permissions: {CRUD on resources}

## Cost Estimate (Monthly)
| Component | Quantity | Cost |
|-----------|----------|------|
| Servers | {X} × ${Y} | ${Z} |
| Database | ${X} | ${Y} |
| Storage | {X} TB × ${Y} | ${Z} |
| CDN | {X} GB | ${Y} |
| **Total** | | **${X}** |

## Risks
| Risk | Probability | Impact | Mitigation |
|------|--------------|--------|------------|
| {Risk} | High | High | {Action} |
```

## Commands
| Command | Action |
|---------|--------|
| `design <system>` | Full architecture |
| `scale <component>` | Scaling design |
| `migrate <old> <new>` | Migration plan |
| `review architecture` | Architecture review |