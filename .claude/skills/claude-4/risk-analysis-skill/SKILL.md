# Risk Analysis Skill

## Triggers
- User wants risk identification and mitigation
- User says "risk", "what could go wrong", "mitigation", "contingency"

## What It Does

### Risk Framework
```
1. IDENTIFY RISKS
   → Brainstorm all possibilities
   → Categorize by type
   
2. ASSESS
   → Probability (Likelihood)
   → Impact (Severity)
   → Combined Risk Score
   
3. MITIGATE
   → Prevention strategies
   → Contingency plans
   
4. MONITOR
   → Key risk indicators
   → Review cadence
```

### Output Format
```
# Risk Analysis: {Project/Decision}

## Overview
{Total risks: X}
🔴 High: {X} | 🟠 Medium: {X} | 🟡 Low: {X}

## Risk Register

### 🔴 HIGH RISKS (Act Now)

| Risk | Probability | Impact | Score | Mitigation |
|------|------------|--------|-------|------------|
| {Risk 1} | High | High | 9 | {Action} |
| {Risk 2} | High | Medium | 6 | {Action} |

**Risk 1: {Description}**
- Category: {Technical / Business / Operational / External}
- Trigger: {How to detect}
- Impact: {Consequence if occurs}
- Mitigation: {Preventive action}
- Contingency: {If it happens despite prevention}
- Owner: @{Person}
- KRIs: {Key Risk Indicators}

### 🟠 MEDIUM RISKS (Monitor)

| Risk | Probability | Impact | Score | Mitigation |
|------|------------|--------|-------|------------|
| {Risk 3} | Medium | Medium | 4 | {Action} |

### 🟡 LOW RISKS (Accept or Watch)

| Risk | Score | Mitigation |
|------|-------|------------|
| {Risk 4} | 2 | Watch, accept |

## Risk Matrix Visualization
```
Impact
  ↑
9 │     │     │ [HIGH 1]
  │     │     │
6 │     │[MED 3]│ [HIGH 2]
  │     │     │
3 │[LOW 4]│     │
  │     │     │
0 └─────┴─────┴────────→
  0     3     6     9
       Probability
```

## Top 3 Action Items
1. **[HIGH]** {Action} - Owner: @{Person} - Due: {Date}
2. **[HIGH]** {Action} - Owner: @{Person} - Due: {Date}
3. **[MED]** {Action} - Owner: @{Person} - Due: {Date}

## Risk Categories Breakdown

| Category | Count | Highest Risk |
|----------|-------|--------------|
| Technical | {X} | {Risk} |
| Business | {X} | {Risk} |
| External | {X} | {Risk} |

## Monitoring Plan
- Review cadence: {Weekly/Bi-weekly}
- Next review: {Date}
- Escalation: {When to escalate}

## Emergency Contacts
- Risk 1 owner: @{Person} - {Phone}
- Risk 2 owner: @{Person} - {Phone}
```

## Commands
| Command | Action |
|---------|--------|
| `risk analysis` | Full analysis |
| `identify risks` | List all risks |
| `mitigation plan` | Specific mitigation |
