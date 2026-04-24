# Daily Digest Generator

## Triggers
- User says "daily digest", "day summary", "today's updates"
- Scheduled: Every evening at 6pm

## What It Does

### 1. Activity Collection
```
Time Range: Yesterday 6pm → Today 6pm

Collect:
- Messages sent/received
- Tasks completed/created
- Meetings attended
- Files created/modified
- Decisions made
- Blockers identified
- Approvals pending
```

### 2. Digest Sections

#### A. Communication Summary
```
Conversations:
- 12 WhatsApp messages (3 important)
- 5 Slack messages (1 urgent)
- 8 Email threads

Key Decisions:
✓ Approved Q4 budget
✓ Selected vendor for project X
✗ Deferred: New hire decision

Open Threads:
- Team expansion plan (3 messages)
- Product launch timeline (pending input)
```

#### B. Work Completed
```
Tasks Done:
✓ [HIGH] Complete project proposal
✓ [MED] Review PR #234
○ [LOW] Update documentation
✗ [MED] Bug fix (blocked by design)

Time Spent:
- Meetings: 4 hours
- Development: 3 hours
- Communication: 2 hours
```

#### C. Tomorrow's Preview
```
Scheduled:
- Team sync at 10am
- Client call at 2pm
- Deadline: Report submission

Pending Approvals:
- Marketing budget
- New hire request

Blockers:
- Waiting for design sign-off
- API documentation pending
```

### 3. Digest Formats

#### Morning (9am) - Brief
```
☀️ Good morning!
Today: 3 meetings, 2 deadlines, 1 pending approval
Top: Client presentation at 3pm

Action items: 2
```

#### Evening (6pm) - Detailed
```
🌙 End of day summary
Tasks done: 8/12
Most productive: 10am-1pm
Tomorrow: Client demo + report due

See full digest below ↓
```

### 4. Delivery Options
```
- WhatsApp message
- Telegram bot
- Email
- Slack DM
- System notification
- All of the above
```

### 5. Customization
```
[Your Digest Preferences]
Time: 6:00 PM daily
Format: Detailed
Channels: WhatsApp + Email
Include:
✓ Tasks
✓ Meetings
✓ Decisions
✓ Stats
✗ Time breakdown
✗ Blockers (too stressful)
```

## Scheduling
```yaml
daily_digest:
  enabled: true
  time: "18:00"
  timezone: "Asia/Kolkata"
  channels: ["whatsapp", "email"]
  format: "detailed"
```
