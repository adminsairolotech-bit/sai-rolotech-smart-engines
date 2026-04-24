# Cross-Channel Inbox Summarizer

## Triggers
- User wants summary of multiple messaging platforms
- User says "summarize all", "inbox summary", "daily digest"

## What It Does

### 1. Multi-Platform Aggregation
```
Sources:
- WhatsApp: Individual + Group chats
- Telegram: Channels + Groups + DMs
- Slack: All joined channels
- Discord: All accessible servers
- Email: Inbox (optional)
- Signal: If connected
```

### 2. Message Classification
```
Each Message → Tag → Priority Score

Tags:
- ACTION_REQUIRED: Needs user response
- FOLLOW_UP: Pending from user
- URGENT: Flagged as important
- MEETING: Meeting related
- DOC_SHARED: Links/docs shared
- QUESTION: Direct question asked
- DECISION: Decision made
- UPDATE: Status update
```

### 3. Daily Summary Format
```
📱 CROSS-CHANNEL DAILY DIGEST
📅 Date: 2024-XX-XX

══🔥 URGENT (3)══
1. WhatsApp: @John asking about deadline
2. Slack: Server alert - action needed
3. Email: Payment failed - customer upset

══📋 ACTION REQUIRED (5)══
1. Telegram: Customer #{id} waiting for response
2. Slack #sales: Demo request from @Jane
3. WhatsApp: Order #{id} status query
4. Email: Meeting tomorrow - confirm attendance
5. Discord: New member needs approval

══✅ COMPLETED (8)══
1. Order #{id} delivered
2. Slack #support: Ticket #{id} resolved
3. WhatsApp: Query answered

══📊 BY PLATFORM══
WhatsApp: 47 messages, 3 urgent, 2 action
Telegram: 23 messages, 0 urgent, 1 action
Slack: 89 messages, 1 urgent, 2 action
Discord: 156 messages, 0 urgent, 0 action
```

### 4. Priority Sorting
```
Score = Urgency × Recency × Sender

Urgency:
- Direct mention: 10
- @channel/@here: 8
- Keywords: 5
- General: 3

Recency:
- Last hour: 1.5x
- Last 6hrs: 1.2x
- Older: 1.0x

Sender:
- Manager/Director: 2x
- Customer: 1.5x
- Peer: 1.0x
```

### 5. Quick Actions
```
Summary → Click to jump to message
Reply button → Quick reply
Archive → Mark as read
Delegate → Assign to team member
Snooze → Remind later
```

## Setup Required
- API access to each platform
- Authentication tokens
- Channel/chat ID mappings
