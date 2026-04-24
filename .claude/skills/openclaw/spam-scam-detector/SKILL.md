# Spam & Scam Detector

## Triggers
- User wants to detect spam/scam messages
- User shares suspicious message for analysis

## What It Does

### 1. Spam Patterns
```
Detection Flags:
├── Excessive links (3+ URLs)
├── Urgency keywords: "urgent", "act now", "limited time"
├── Money requests: "send", "pay", "gift", "win"
├── Suspicious sender: New/unknown
├── Misspellings and poor grammar
├── Generic greeting: "Dear Customer"
└── Threat language: "account will be closed"
```

### 2. Scam Indicators
```
🚨 RED FLAGS:
- Request for personal info (OTPs, passwords)
- Payment to unusual accounts
- "You've won" without entry
- Impersonation of banks/govt
- Cryptocurrency/payment app requests
- Urgency to bypass security
- Requests outside normal channel
```

### 3. Analysis Response
```
🔍 SCAM ANALYSIS

Your Message:
"{suspicious_message}"

Risk Level: ⚠️ HIGH

Detected Issues:
1. ⚠️ Urgency language: "Act immediately"
2. ⚠️ Requests personal information
3. ⚠️ Suspicious link domain

Recommendation: 🚫 DO NOT RESPOND

What to do:
• Block this number/sender
• Do not click any links
• Do not share any information
• Report to authorities if money involved
```

### 4. Auto-Actions
```
LOW RISK: Log, allow through
MEDIUM RISK: Warn user, allow if they proceed
HIGH RISK: Block sender, alert user
CRITICAL: Block + notify platform
```
