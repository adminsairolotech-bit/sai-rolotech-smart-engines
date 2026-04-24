# Human Handoff Skill

## Triggers
- User wants to talk to a human
- User says "human", "real person", "agent", "representative"

## What It Does

### 1. Handoff Detection
```
Trigger Words:
- "human", "person", "agent", "real"
- "not a bot", "speak to someone"
- Frustration detected (repeated caps, emojis)
- Explicit request for human

Response: Immediate escalation
```

### 2. Handoff Message
```
"Something important requires personal attention.
 Let me connect you with our team right away..."

Collect:
- Name
- Reason for contact
- Previous context
- Best callback number

→ Forward to human with full context
→ Create ticket if not resolved
```

### 3. Warm Transfer
```
Bot → Human Transfer with Context

What Human Receives:
• Customer name and contact
• Full conversation history
• What was attempted
• Customer's current state
• Why they escalated

This prevents customer repeating themselves.
```
