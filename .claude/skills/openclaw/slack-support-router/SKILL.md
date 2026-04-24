# Slack Support Router

## Triggers
- User wants Slack message routing
- User says "route Slack", "Slack support", "Slack automation"

## What It Does

### 1. Message Classification
```
Incoming Message → Analyze → Route to correct channel/person

Categories:
- SUPPORT → #support channel + @support-lead
- SALES → #sales channel + @sales-lead  
- DEV → #dev-support channel + @dev-oncall
- URGENT → DM to on-call + @channel alert
- GENERAL → #general or appropriate team
```

### 2. Keyword Routing
| Keywords | Route To |
|----------|----------|
| "bug", "error", "crash", "not working" | #dev-support |
| "buy", "price", "demo", "sales" | #sales |
| "refund", "cancel", "complaint" | #support |
| "urgent", "emergency", "production" | @on-call + #incidents |
| "meeting", "schedule", "calendar" | #general |
| "password", "login", "access" | #it-support |

### 3. Response Templates
```
SUPPORT_TICKET: "Thanks for reaching out! Your ticket #{id} created. 
                 Our team will respond within 4 hours."

SALES_QUALIFY: "Hi {name}! Thanks for your interest. 
                Let me connect you with our sales team."

DEV_ACK: "Got it - investigating now. 
         Ticket created: #{id}. Updates every 30 mins."

URGENT_ALERT: "@on-call - Urgent issue in {area}. 
               Check {link} for details."
```

### 4. Escalation Rules
```
TICKET_OPEN → 4 hours no response → Escalate to manager
TICKET_OPEN → Customer says "urgent" → Immediate escalation  
TICKET_OPEN → Negative sentiment detected → Flag for review
```

### 5. Dashboard Stats
- Messages routed today
- Avg response time
- Pending tickets
- Top issues by category

## Setup Required
- Slack API token
- Channel IDs
- Team member mappings
