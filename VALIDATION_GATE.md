# SAI ROLO TECH - VALIDATION GATE
## Version: V2.0

---

## Purpose

This is the **VALIDATION GATE** - a checkpoint that must be passed before marking any task complete.

---

## Validation Rules

### 1. NO TEST = NO DONE

Every code change MUST have corresponding tests.

```
❌ WRONG: "Code likh diya, ho gaya"
✅ RIGHT: "Code likha, test run kiya, output dekho..."
```

### 2. NO OUTPUT = NO SUCCESS

Every command MUST show its output.

```
❌ WRONG: "Server start ho gaya"
✅ RIGHT: "curl http://localhost:3000 → <html>...</html>"
```

### 3. NO VERIFICATION = NO TRUST

Never claim something works without verification.

```
❌ WRONG: "Probably working hai"
✅ RIGHT: "curl http://localhost:3000/api/health → {"status":"ok"}"
```

---

## Response Validation Checklist

Before marking a task VERIFIED, ensure:

- [ ] **Status**: Correct status (IN_PROGRESS/BLOCKED/VERIFIED/COMPLETE)
- [ ] **Understanding**: Clear description of what needs to be done
- [ ] **Root Cause**: Actual reason for failure (if applicable)
- [ ] **Evidence**: Error messages, logs, symptoms shown
- [ ] **Files**: All files involved listed with changes
- [ ] **Services**: All services checked with commands and outputs
- [ ] **Plan**: Numbered steps to complete
- [ ] **Test Results**: Actual test outputs (not "tests pass")
- [ ] **Commands Run**: Real commands with real outputs
- [ ] **Confidence**: Score that reflects actual completion (not 0/100)
- [ ] **Change Log**: Every file change documented

---

## Forbidden Words (Without Proof)

These words CANNOT appear without showing evidence:

| Word | Why Forbidden | Required Proof |
|------|--------------|---------------|
| done | No verification | Test output showing success |
| fixed | No verification | Before/after comparison |
| ho gaya | No verification | Command output showing success |
| should work | No guarantee | Actual test proving it works |
| try karo | Incomplete | Result of trying shown |
| probably | Uncertainty | Actual proof shown |

---

## Service Verification Templates

### Backend Server
```bash
curl -s http://localhost:5000/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Frontend Server
```bash
curl -s http://localhost:3000
# Expected: HTML content with <html> tag
```

### Gemini API
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
# Expected: {"candidates":[...]}
# Error: {"error":{"code":403,"message":"..."}}
```

### Git Status
```bash
git status --short
# Expected: List of changed files
```

---

## Test Output Template

```
Test: [name of test]
Command: [exact command run]
Expected: [what should happen]
Actual: [what actually happened]
Result: [PASS/FAIL]
```

---

## Confidence Scoring

| Score | Meaning | When to Use |
|-------|---------|-------------|
| 0/100 | Just started | Initial task receipt |
| 25/100 | Investigation done | Root cause found |
| 50/100 | Plan defined | Execution started |
| 75/100 | Partially complete | Some steps done |
| 90/100 | Almost done | Minor verification left |
| 100/100 | Complete | All tests pass, verified |

---

## Enforcement

This validation gate is ENFORCED by:

1. `guard-task.sh` - Pre-task validation
2. `run-task.sh` - Task initialization with token
3. `validate-response.py` - Response format check
4. Husky hooks - Pre-commit and pre-push checks
5. Playwright tests - Browser verification

---

## Version

- **Version:** V2.0
- **Created:** 2026-04-14
- **Enforcement Level:** STRICT

---
