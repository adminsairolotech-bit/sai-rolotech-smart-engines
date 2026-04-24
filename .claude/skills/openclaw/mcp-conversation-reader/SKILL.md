# MCP Conversation Reader

## Triggers
- User wants to read conversations via MCP bridge
- User says "read messages", "show chats", "get conversations"

## What It Does

### 1. List Conversations
```
Platform: WhatsApp | Telegram | Slack | Discord | All
         ↓
Fetch: Conversation list with metadata
       ↓
Display:
📱 WhatsApp (5 chats)
├── 🆕 John Doe - "Thanks for the update" (2m ago)
├── 👥 Office Group - 12 new messages (15m ago)
├── 📦 Orders Bot - Delivery confirmed (1h ago)
└── ...

💬 Telegram (3 chats)
├── @Jane - Meeting at 3pm (5m ago)
└── ...
```

### 2. Read Conversation
```
Command: Read "John Doe" last 20 messages
         ↓
Fetch: Messages from MCP bridge
       ↓
Display:
┌─────────────────────────────────────┐
│ John Doe                     10:30 │
│ ────────────────────────────────────│
│ You: Project update ready           │
│ ✓ Read                               │
│                                      │
│ John: Great! Can you share the       │
│       presentation?                  │
│ 10:32 ✓✓                             │
│                                      │
│ You: Sending now...                  │
│ 10:33 ✓✓                             │
└─────────────────────────────────────┘
```

### 3. Message Search
```
Query: "project update"
Platform: All
Date: Last 7 days
       ↓
Results:
📱 WhatsApp - John (2 matches)
💬 Telegram - @Team (5 matches)
📊 Slack - #project-updates (8 matches)
```

### 4. Filter & Sort
```
Filters:
- Unread only
- By platform
- By contact/group
- By date range
- Has attachments
- Has links

Sort:
- Recent first
- Unread first
- By contact
```

### 5. Context Building
```
Read recent conversation
       ↓
Extract key info:
- Pending tasks mentioned
- Decisions made
- Important dates
- Customer requirements
- Open questions
       ↓
Add to conversation context
```

## MCP Bridge Integration
```javascript
// Read messages
mcp__read_conversations({ platform: "whatsapp" })
mcp__read_messages({ conversation_id: "...", limit: 50 })
mcp__search_messages({ query: "...", platform: "all" })
```
