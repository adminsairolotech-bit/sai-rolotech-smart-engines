# Discord Community Moderator

## Triggers
- User wants Discord server moderation
- User says "moderate Discord", "Discord bot", "auto mod"

## What It Does

### 1. Spam Detection
```
Message → Check Patterns → Action

Spam Patterns:
- Repeated characters (aaaaaaa)
- Excessive emojis (🎉🎉🎉🎉🎉🎉🎉)
- ALL CAPS (more than 70%)
- Link spam (3+ links in 1 min)
- New account + spam behavior
- Invites to other servers

Actions: Warn → Mute (5min) → Mute (1hr) → Ban
```

### 2. Bad Words Filter
```
Levels:
- WARN: Mild language, first offense
- DELETE: Explicit words, second offense
- MUTE: slurs, hate speech
- BAN: extreme content, threats
```

### 3. FAQ Auto-Responder
```
Keywords → Pre-defined Answers

"how to apply" → Application link + steps
"price" → Pricing page + contact
"rules" → Server rules summary
"mod" → DM to mod mail channel
```

### 4. User Reputation
```
Points System:
+10: Helpful answer
+5: Quality message
+3: Daily active
-5: Warning
-20: Temporary mute
-100: Ban

Auto-roles based on points:
100+: Member
500+: Trusted
1000+: VIP
```

### 5. Welcome Flow
```
New Member Joins:
1. Send welcome DM with rules
2. Assign newcomer role
3. Post in #welcome channel
4. After 10 messages → Member role
5. After 7 days → Verified role
```

### 6. Mod Mail (DM to Mods)
```
User DMs bot:
→ Forward to #mod-mail channel
→ Mods can reply from channel
→ Reply goes back to user as bot DM
```

## Commands
| Command | Action |
|---------|--------|
| `!warn @user <reason>` | Issue warning |
| `!mute @user <duration>` | Mute user |
| `!ban @user <reason>` | Ban user |
| `!role @user <role>` | Assign role |
| `!stats @user` | Show user reputation |
