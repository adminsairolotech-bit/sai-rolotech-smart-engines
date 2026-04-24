# MCP Message Sender

## Triggers
- User wants to send messages via MCP bridge
- User says "send message", "reply to", "send to"

## What It Does

### Send Message
```
Platform: WhatsApp | Telegram | Slack | Discord
Recipient: Contact name / Channel / Group ID
Message: {your message}
```

### Quick Send
```
"send to John: Meeting at 3pm"
"whatsapp Rahul: Your order has shipped"
"slack #general: Deploy complete"
```

### Batch Send
```
Send same message to multiple recipients:
"email all customers: Holiday sale starts today"

Recipients: 150 customers
Status: Sending...
✓ Sent: 148/150
⚠️ Failed: 2 (will retry)
```
