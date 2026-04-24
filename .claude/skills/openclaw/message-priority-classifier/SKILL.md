# Message Priority Classifier

## Triggers
- User wants message priority sorting
- User says "sort messages", "priority", "urgent first"

## What It Does

### Priority Calculation
```
Score = Urgency × Importance × Sender Weight

URGENCY:
- "urgent"/"ASAP"/"critical": 10
- "today"/"by 5pm": 7
- Normal: 3

IMPORTANCE:
- Action needed: 8
- FYI only: 4
- Newsletter: 1

SENDER:
- Customer: 2x
- Manager: 1.5x
- Unknown: 0.8x
```

### Output Format
```
📬 PRIORITY INBOX

🔴 P1 CRITICAL (2)
├── Customer: Payment failed
└── Manager: Board meeting now

🟠 P2 HIGH (5)
├── Team: Review needed
└── ...

🟡 P3 MEDIUM (12)
⚪ P4 LOW (30)

[Process P1] [View All]
```
