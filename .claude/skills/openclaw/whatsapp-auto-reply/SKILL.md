# WhatsApp Auto Reply Agent

## Triggers
- User wants WhatsApp auto-reply
- User says "auto reply", "WhatsApp bot", "set reply"

## What It Does

### Auto Reply Flow
```
Incoming Message → Analyze → Draft Reply → User Approves → Send

Reply Templates:
GREETING: "Hi {name}! Thanks for reaching out 🙏"
ORDER: "Your order #{id} is {status}"
SUPPORT: "I've noted your concern. Team will contact within 4 hours."
```

### Approval Options
```
"send" / "yes" / "y" → Send
"edit" → Modify message
"no" / "deny" → Don't send
```

### Multi-Language
- Hindi, English, Hinglish auto-detect
- User preference stored in memory
