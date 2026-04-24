# Team Standup Collector

## Triggers
- User wants to collect team standup updates
- User says "standup", "daily standup", "team update", "what did you do"

## What It Does

### 1. Collection Flow
```
Scheduled Time: 9:30 AM (configurable)

Day X-1: Remind team members
"☀️ Morning! Please share your standup update.
Reply with:
1. What you did yesterday
2. What you're doing today  
3. Any blockers"

Collect responses within 2 hours
```

### 2. Response Parsing
```
User Response:
"Yesterday: Fixed login bug, reviewed PR
Today: Working on search feature
Blocker: Waiting for design specs"

↓ Parsed to:
{
  yesterday: ["Fixed login bug", "Reviewed PR"],
  today: ["Working on search feature"],
  blocker: "Waiting for design specs"
}
```

### 3. Standup Report Format
```
📋 TEAM STANDUP - Jan 15, 2024
Team Size: 5 | Responses: 4/5

══ ✅ COMPLETED ══
👤 John
• Fixed login bug (#1234)
• Reviewed PR #234

👤 Priya
• Completed API integration
• Wrote unit tests

══ 📍 IN PROGRESS ══
👤 Alex
• Working on search feature (60%)

👤 Sarah
• Designing dashboard mockups

══ ⚠️ BLOCKERS ══
👤 Alex - Waiting for design specs
👤 Priya - Need access to staging server

══ 📅 MEETINGS ══
• 10am - Sprint planning
• 2pm - Client call
```

### 4. Routing
```
Blockers → Notify relevant people:
- Design blocker → Tag designer
- Code blocker → Tag lead dev
- Access blocker → Tag manager

Highlights → Share in team channel
```

### 5. Integration
```
Collect from:
- Slack (async standup bot)
- WhatsApp (quick reply)
- Email (form submission)
- Linear/Jira (task updates)
- Custom form
```

## Commands
| Command | Action |
|---------|--------|
| `standup now` | Collect now |
| `standup schedule 9:30` | Set time |
| `standup report` | Show last report |
| `standup add @user` | Add team member |
