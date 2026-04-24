# Approval Request Manager

## Triggers
- Agent wants to perform action requiring human approval
- User says "approve", "deny", "pending approvals"

## What It Does

### 1. Approval Workflow
```
Agent Action → Create Request → Show to User → Await Response

Request Contains:
- WHAT: Action to be performed
- WHY: Reason/purpose
- IMPACT: What happens if approved
- ALTERNATIVE: What happens if denied
- TIME: Decision needed by
```

### 2. Approval Categories
```
LOW RISK → Auto-approve after 5 seconds
- Formatting changes
- Comment additions
- Non-critical file edits

MEDIUM RISK → Explicit approval needed
- New file creation
- Config changes
- Dependency updates

HIGH RISK → Explicit approval + confirmation
- File deletion
- Secret changes
- Production deployments
- Data modifications
```

### 3. Request Format
```
╔══════════════════════════════════════╗
║     ⚠️  APPROVAL REQUIRED            ║
╠══════════════════════════════════════╣
║ Action: Delete 3 old log files        ║
║ File: ./logs/*.log                   ║
║ Size: ~50MB will be freed            ║
╠══════════════════════════════════════╣
║ [APPROVE] [DENY] [EDIT] [DETAILS]    ║
╚══════════════════════════════════════╝
```

### 4. Quick Responses
```
"yes" / "y" / "approve" → Approve immediately
"no" / "n" / "deny" → Deny and stop
"edit" → Modify parameters
"later" → Snooze 1 hour
"always allow <type>" → Remember choice
```

### 5. Batch Approvals
```
Multiple similar requests:
"3 pending file deletions"
[APPROVE ALL] [REVIEW INDIVIDUALLY] [DENY ALL]
```

### 6. Auto-Approve Rules
```
Store user preferences:
- Auto-approve: "formatting only"
- Auto-approve: "comments"
- Always ask: "deletions over 10MB"
- Always ask: "production changes"
```

## Storage
- Pending requests in memory
- Decision history for learning
