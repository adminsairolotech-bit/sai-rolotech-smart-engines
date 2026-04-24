# High-Stakes Review Skill

## Triggers
- User wants thorough review before major decision
- User says "review", "check this", "double check", "before I send", "critical"

## What It Does

### Review Areas
```
ACCURACY: Facts, data, numbers
COMPLETENESS: Nothing missing
CLARITY: Clear and understandable
CONSISTENCY: No contradictions
APPROPRIATENESS: Right for audience
RISKS: What could go wrong
```

### Output Format
```
# High-Stakes Review

## Document: {Name/Type}
**Reviewed at:** {Date}
**Reviewer:** Claude

## Overall Assessment
**Readiness:** {Ready / Needs Work / Not Ready}
**Confidence:** {X}% confident

---

## ✓ PASSED CHECKS

### Accuracy
- [✓] All facts verified
- [✓] Numbers are correct
- [✓] Sources cited properly
- [✓] No typos or grammar errors

### Completeness
- [✓] All required sections present
- [✓] Nothing missing from scope
- [✓] Supporting data included

### Clarity
- [✓] Clear headline/message
- [✓] Easy to understand
- [✓] Appropriate detail level

---

## ⚠️ ISSUES FOUND

### Critical (Must Fix Before Sending)
1. {Issue 1}
   - Location: {Where}
   - Problem: {What's wrong}
   - Fix: {Suggestion}

### Medium (Should Improve)
1. {Issue 2}
   - Location: {Where}
   - Problem: {What's wrong}
   - Fix: {Suggestion}

### Minor (Nice to Improve)
1. {Issue 3}
   - Location: {Where}
   - Suggestion: {Improvement}

---

## RISK ASSESSMENT

### If We Send As-Is
| Risk | Likelihood | Impact |
|------|------------|--------|
| {Risk} | {H/M/L} | {H/M/L} |

### Potential Reactions
- {Audience}: {Expected reaction}
- {Worst case}: {What could happen}
- {Best case}: {Best outcome}

---

## FINAL RECOMMENDATION

### 🟢 READY TO SEND
{Rationale}

### 🟡 READY WITH MINOR CHANGES
{Fixes needed before sending}

### 🔴 NOT READY
{Why and what needs to change}

---

## CHANGES MADE DURING REVIEW
1. {Change 1}
2. {Change 2}
```

## Review Checklist
| Category | Item | Status |
|----------|------|--------|
| **Accuracy** | Facts verified | ⬜ |
| | Numbers checked | ⬜ |
| | Sources valid | ⬜ |
| **Completeness** | All sections done | ⬜ |
| | Nothing missing | ⬜ |
| **Clarity** | Clear message | ⬜ |
| | Right for audience | ⬜ |
| **Timing** | Sent at right time | ⬜ |
| **Risks** | No hidden risks | ⬜ |

## Commands
| Command | Action |
|---------|--------|
| `review document` | Full review |
| `accuracy check` | Numbers/facts only |
| `risk check` | Risk assessment only |
| `make it better` | Improvement suggestions |
