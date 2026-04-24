# Conversation Memory Builder

## Triggers
- User wants to remember important details
- User says "remember this", "note that", "don't forget"

## What It Does

### 1. Memory Extraction
```
Conversation → Extract Important Facts

Types of Memory:
├── USER PREFERENCES
│   - Preferred language
│   - Communication style
│   - Working hours
│   └── Contact preferences
│
├── USER CONTEXT
│   - Company/Role
│   - Current projects
│   - Ongoing issues
│   └── Deadlines
│
├── RELATIONSHIPS
│   - Team members
│   - Key contacts
│   └── Stakeholders
│
└── ONGOING TASKS
    - Pending approvals
    - Follow-ups needed
    └── Open questions
```

### 2. Memory Format
```
USER PROFILE:
Name: {name}
Language: Hindi (preferred)
Working Hours: 9 AM - 6 PM IST
Last Contact: {date}
Status: Active

CURRENT PROJECT:
Name: Website Redesign
Deadline: March 15
Budget: ₹2 lakhs
Pending: Design approval

KEY CONTACTS:
- Designer: @Priya (Slack)
- Developer: @Amit (Slack)

FOLLOW-UPS:
- Send proposal: Tomorrow
- Follow up on design: March 5
```

### 3. Memory Commands
```
"remember that {info}" → Save fact
"what do you remember about {topic}" → Recall
"forget {info}" → Delete memory
"my name is {name}" → Store preference
"i prefer {preference}" → Store preference
```
