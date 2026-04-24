# Incident Alert Router

## Triggers
- User wants incident/error routing
- User says "incident", "alert", "error", "emergency", "pagerduty"

## What It Does

### 1. Alert Classification
```
Incoming Alert → Classify Severity → Route

SEV1 - CRITICAL:
├── Service down / Data loss
├── Security breach
├── Revenue impact
└── Route: @on-call + @manager + PagerDuty

SEV2 - HIGH:
├── Feature broken
├── Performance degraded
├── Error rate > 5%
└── Route: @on-call + #incidents channel

SEV3 - MEDIUM:
├── Non-critical bug
├── Minor outage
├── Warning threshold
└── Route: #dev-support + ticket created

SEV4 - LOW:
├── Informational
├── Scheduled maintenance
└── Route: #monitoring (logged only)
```

### 2. Routing Matrix
```
Alert Type → Primary Route → Secondary Route

Server Down → @on-call (call) → @manager (SMS)
DB Slow → #dev-support (Slack) → @dba (optional)
API Error ↑ → #api-team (Slack) → Ticket
Payment Failed → @payments (Slack) → Alert email
Suspicious Login → #security (Slack) → SOC email
```

### 3. Alert Format
```
🚨 INCIDENT ALERT - SEV1

What: Payment service returning 500 errors
Where: production / payment-api
When: 2024-01-15 14:32 UTC
Impact: 100% of transactions failing
Duration: Ongoing (3 min)

Actions:
- [ ] On-call acknowledged
- [ ] Investigating
- [ ] Mitigation started

[View Dashboard] [Acknowledge] [Escalate]
```

### 4. Response Workflow
```
1. Alert received
2. Classify severity
3. Route to appropriate people
4. Create incident ticket
5. Start bridge if SEV1/SEV2
6. Status updates every 5 min
7. Resolve + post-mortem
```

### 5. On-Call Rotation
```
Schedule: Weekly rotation
Primary: First to be called
Backup: If primary no response in 5 min

Escalation:
Primary (5 min) → Backup (5 min) → Manager
```

## Dashboard
- Active incidents
- MTTR (Mean Time to Resolve)
- Incidents by type
- On-call schedule
