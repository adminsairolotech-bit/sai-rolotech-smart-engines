# Telegram Task Bot

## Triggers
- User wants task management via Telegram
- User says "add task", "reminder", "task list", "todo"

## What It Does

### 1. Task Creation
```
Message: "add taskFinish report by tomorrow 5pm"
         ↓
PARSE: task="Finish report", due="tomorrow 5pm", priority="medium"
       ↓
CREATE: { id, task, due, priority, status: "pending", created: now }
       ↓
CONFIRM: "Task added: Finish report (Due: tomorrow 5pm)"
```

### 2. Task Parsing Rules
| Input | Parsed |
|-------|--------|
| "by tomorrow" | due: tomorrow 9am |
| "by 5pm" | due: today 5pm |
| "urgent" | priority: high |
| "low priority" | priority: low |
| "next week" | due: +7 days |
| "#work" | tag: work |
| "@John" | assignee: John |

### 3. Task Commands
| Command | Action |
|---------|--------|
| `/add <task>` | Create new task |
| `/list` | Show all pending tasks |
| `/list today` | Show today's tasks |
| `/list @user` | Show user's tasks |
| `/done <id>` | Mark task complete |
| `/delete <id>` | Delete task |
| `/remind <id> <time>` | Set reminder |
| `/priority <id> high/med/low` | Change priority |

### 4. Reminders
```
SET: /remind "Finish report" tomorrow 4pm
     ↓
CRON: Check every 5 minutes
     ↓
TRIGGER: "Reminder: Finish report is due in 1 hour"
```

### 5. Daily Summary
```
Morning (9am): "You have X tasks today"
Evening (6pm): "Pending tasks: X. Overdue: Y"
```

## Storage
- Tasks stored in memory/project
- Can export to JSON/Notion/Todoist
