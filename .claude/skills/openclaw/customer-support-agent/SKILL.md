# Customer Support Agent

## Triggers
- User wants customer support automation
- User says "support ticket", "customer issue", "handle complaint"

## What It Does

### 1. Issue Classification
```
Customer Message → Analyze → Classify → Route

Categories:
BUG_REPORT
├── Severity: Critical / High / Medium / Low
├── Area: Login / Payment / Feature / Other
└── Impact: All users / Single user / Rare

REFUND_REQUEST
├── Type: Full / Partial
├── Reason: Defective / Wrong item / Changed mind
└── Amount: From order data

COMPLAINT
├── Type: Service / Product / Staff
├── Sentiment: Angry / Frustrated / Disappointed
└── Requires: Apology / Action / Compensation

GENERAL_QUERY
├── Topic: Pricing / Features / How-to / Shipping
└── Complexity: FAQ / Detailed explanation
```

### 2. Response Templates

#### Acknowledgment
```
"Hi {name}, thanks for reaching out!

I've received your message about {issue_summary}. 
Your ticket #{id} has been created.

What happens next:
1. Our team will review within 4 hours
2. You'll receive an email update
3. We'll resolve this as quickly as possible

For urgent matters, call: {support_phone}"
```

#### Resolution
```
"Great news, {name}!

Your issue has been resolved.
Ticket #{id} - {issue_summary}

Resolution: {what_was_done}
If you have questions, reply to this message.

Thank you for your patience! 🙏"
```

### 3. Information Extraction
```
From message, extract:
- Customer name
- Email / Phone
- Order ID
- Product/SKU
- Issue description
- Expected resolution
- Timeline urgency

If missing → Ask follow-up questions
```

### 4. Escalation Rules
```
TRIGGER → ESCALATE TO
"refund" over ₹5000 → Supervisor
"angry" / "lawsuit" / "lawyer" → Legal
"billing" / "payment" / "charge" → Finance
3+ repeated tickets → Customer Success Manager
VIP customer → Dedicated support
```

### 5. Sentiment Analysis
```
Positive 😊 → Standard response
Neutral 😐 → Friendly response
Frustrated 😤 → Empathetic + priority
Angry 😡 → Immediate escalation + supervisor alert
```

### 6. Ticket Management
```
Create → Update → Resolve → Close

Status Flow:
OPEN → IN_PROGRESS → WAITING_CUSTOMER → RESOLVED → CLOSED

Auto-close: 7 days no response after resolution
Auto-escalate: SLA breach warning at 3 hours, breach at 4 hours
```

## Metrics
- First response time
- Resolution time
- Customer satisfaction score
- Tickets by category
- Escalation rate
