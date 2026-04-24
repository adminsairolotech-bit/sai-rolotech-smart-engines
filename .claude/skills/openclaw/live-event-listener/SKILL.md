# Live Event Listener

## Triggers
- User wants real-time monitoring of events
- User says "listen", "monitor", "watch for", "alert me"

## What It Does

### 1. Event Sources
```
Supported:
- GitHub: PR, Issues, Releases, Commits
- Slack: Mentions, keywords, channels
- Twitter/X: Brand mentions, keywords
- News: News API for topics
- Custom: Webhook endpoints
- System: File changes, errors
```

### 2. Watch Rules
```
Define: WHAT + WHERE + ACTION

Examples:
- "Watch GitHub for new issues on repo X" → GitHub webhook
- "Alert when someone says 'deploy' in Slack" → Keyword monitoring
- "Notify when my name appears online" → News/social monitoring
- "Watch for errors in logs" → Log file monitoring
```

### 3. Event Actions
```
When Event Matches → Take Action

Actions:
- Push notification
- WhatsApp message
- Slack DM
- Email
- Run command
- Create task
- Forward to channel
```

### 4. Polling vs Webhook
```
POLLING (Check periodically):
- GitHub: Every 5 min
- Twitter: Every 15 min
- News: Every hour

WEBHOOK (Instant):
- GitHub PR/Issue → Instant
- Slack events → Instant
- Custom endpoints → Instant
```

### 5. Event Log
```
Recent Events (Last 24h):
├── 🔔 GitHub: New PR #234 in repo-X (2m ago)
├── ⚠️ GitHub: PR #232 failed checks (15m ago)
├── 📢 Twitter: @user mentioned you (1h ago)
├── 🆕 News: "AI" topic trending (3h ago)
└── 🔧 System: High CPU alert (5h ago)
```

## Setup Example
```yaml
watch:
  - source: github
    repo: my-repo
    events: [issues, pulls]
    action: notify
    
  - source: slack
    channel: "#alerts"
    keywords: [deploy, outage, error]
    action: alert
```
