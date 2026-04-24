# Lead Capture Agent

## Triggers
- User wants to capture leads from conversations
- User says "capture lead", "new lead", "add prospect"

## What It Does

### 1. Auto Extraction
```
Message → Identify Lead Info → Store

Extracted Fields:
├── Name: First + Last
├── Phone: With country code
├── Email: Valid format
├── Company: Organization name
├── Role: Job title
├── Interest: What they're looking for
├── Budget: If mentioned
├── Timeline: When they need it
├── Source: How they found you
└── Notes: Additional context
```

### 2. Extraction Examples
```
"Hi, I'm Rahul from Infosys, we need 
 software for 500 employees"
→ Name: Rahul
→ Company: Infosys
→ Need: Software
→ Size: 500 employees
→ Confidence: High

"Just browsing... how much is this?"
→ Name: Unknown
→ Interest: This product
→ Confidence: Low
→ Action: Nurture sequence
```

### 3. Lead Card
```
┌─────────────────────────────────┐
│ 👤 LEAD CAPTURED               │
│ ─────────────────────────────────│
│ Name: Rahul Sharma              │
│ Company: Infosys                │
│ Role: IT Manager                │
│ Email: rahul@infosys.com 📧     │
│ Phone: +91 98765 43210 📱       │
│ ─────────────────────────────────│
│ Interest: Enterprise Software   │
│ Team Size: 500 employees        │
│ Timeline: Q2 this year           │
│ Budget: ₹50L+                   │
│ Source: Website                 │
│ ─────────────────────────────────│
│ Score: 85 (Hot Lead) 🔥         │
│ Status: New → Contact Today     │
│ ─────────────────────────────────│
│ Notes: "Called after demo request"│
└─────────────────────────────────┘
```

### 4. Follow-Up Actions
```
Hot Lead (80+): → Immediate call
Warm Lead (50-79): → Email + WhatsApp
Cold Lead (<50): → Nurture sequence
```
