# Personal Reminder Agent

## Triggers
- User wants to set reminders
- User says "remind me", "reminder", "don't forget", "yaad dilana"

## What It Does

### 1. Natural Reminder Setting
```
Input → Parse → Schedule → Confirm

"remind me to call John at 5pm"
→ { action: "call John", time: "5pm today", type: reminder }

"yaad dilana ki interview hai kal subah"
→ { action: "interview", time: "tomorrow 9am", type: reminder }

"don't forget to submit report tomorrow"
→ { action: "submit report", time: "tomorrow 9am", type: reminder }

"meeting with team in 30 minutes"
→ { action: "meeting with team", time: "+30min", type: meeting }
```

### 2. Time Parsing
```
Natural → Structured

Relative:
- "in 5 minutes" → now + 5min
- "in an hour" → now + 1hr
- "tomorrow" → tomorrow 9am
- "next week" → +7 days 9am

Absolute:
- "5pm" → today 5pm (or tomorrow if past)
- "January 15" → Jan 15 9am
- "Monday" → Next Monday 9am
- "2:30pm Jan 20" → Jan 20 2:30pm
```

### 3. Reminder Types
```
ONE_TIME:
- Remind once, then delete
- "Call doctor tomorrow 3pm"

RECURRING:
- Daily: "Every day at 9am, standup"
- Weekly: "Every Monday 10am, planning"
- Monthly: "1st of month, report"
- Custom: "Every 2 weeks on Tuesday"

SNOOZE:
- "Remind me again in 1 hour"
- "Snooze until tomorrow"
```

### 4. Reminder Delivery
```
When time arrives:

WhatsApp/Telegram/Slack:
"🔔 Reminder: Call John now
[View] [Snooze 15m] [Done]"

If no response:
- 5 min: First snooze prompt
- 15 min: Second prompt
- 30 min: Final prompt + log as missed
```

### 5. Smart Reminders
```
Context-aware:
- "Meeting at 3pm" → Remind 10min before
- "Lunch with @Jane" → Remind 30min before + location
- "Deadline tomorrow" → Remind evening before + morning of

Location-based (if GPS):
- "When I reach office, remind me to..."
- "When I leave, remind me to..."
```

## Commands
| Command | Action |
|---------|--------|
| `remind me to <X> at <time>` | Set reminder |
| `remind me in <duration>` | Quick reminder |
| `list reminders` | Show all |
| `cancel reminder <id>` | Delete |
| `done <id>` | Mark complete |
