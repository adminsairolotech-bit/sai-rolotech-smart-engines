# SAI ROLO TECH - TASK TEMPLATE
## Version: V2.0

---

## Status

```
IN_PROGRESS | BLOCKED | VERIFIED | COMPLETE
```

---

## Understanding

*(What is failing or what needs to be built? Be specific.)*

-

---

## Root Cause

*(Why is it failing? What's the actual problem?)*
*(Evidence: error messages, logs, symptoms)*

-

---

## Evidence

*(What supports the root cause claim?)*

| Type | Value |
|------|-------|
| Error | |
| Log | |
| Symptom | |

---

## Files Involved

*(Files inspected/changed)*

| File | Role | Changes |
|------|------|---------|
| | | |

---

## Services Checked

*(Service verification results - MUST show real commands and outputs)*

| Service | Status | Command | Result |
|---------|--------|---------|--------|
| Port 3000 | ? | `curl localhost:3000` | |
| Port 3333 | ? | `curl localhost:3333` | |
| Port 5000 | ? | `curl localhost:5000/api/health` | |
| Gemini API | ? | `curl -X POST...` | |
| Git | ? | `git status` | |

---

## Skills/Tools Used

*(Which skill or pattern was applied?)*

| Skill | Location | How Applied |
|-------|----------|-------------|
| | | |

---

## Plan

*(Execution plan with numbered steps)*

1. [ ] Step 1
2. [ ] Step 2
3. [ ] Step 3

---

## Test Plan

*(How to verify success? What commands to run?)*

```
Command:
Expected:
Actual:
```

---

## Commands Run

*(Show real commands and their outputs)*

```bash
# Describe what this command does
$ command here
output here
```

---

## Test Results

*(Show actual test outputs)*

```
Test: [what was tested]
Command: [command run]
Output:
[PASS/FAIL]
```

---

## Actual Output

*(Real command outputs - paste actual text)*

```
$ real output here
```

---

## Gemini Verification Status

*(Verify Gemini API works)*

```
PENDING | TESTED | WORKING | BLOCKED
```

If blocked, show error:
```
{"error": {...}}
```

---

## Confidence

*(How sure are you that this is complete and correct?)*

```
0/100 - Just started
25/100 - Initial investigation done
50/100 - Plan defined, not executed
75/100 - Partially complete
90/100 - Complete, needs final verification
100/100 - Verified and tested
```

---

## Change Log

*(For every file changed)*

| Field | Value |
|-------|-------|
| File Name | |
| What Changed | |
| Why | |
| Expected Effect | |
| Possible Risk | |

---

## Response Format Checklist

```
[ ] Status section present
[ ] Understanding section filled
[ ] Root Cause section filled with evidence
[ ] Files section with actual file paths
[ ] Services checked with real commands
[ ] Plan section with numbered steps
[ ] Test Results with actual output
[ ] Commands Run with real output
[ ] Confidence level set (not 0/100)
[ ] Change Log completed
[ ] No forbidden words (done, fixed, ho gaya, should work)
```

---

## Forbidden Words (Without Proof)

NEVER use these without showing evidence:
- ~~done~~
- ~~fixed~~
- ~~ho gaya~~
- ~~should work~~
- ~~probably solved~~
- ~~try karo~~ (without showing result)

---

## Reminder

```
╔═══════════════════════════════════════════════════════════════╗
║  ❌ NO TEST = NO DONE                                        ║
║  ❌ NO OUTPUT = NO SUCCESS                                   ║
║  ❌ NO VERIFICATION = NO TRUST                                ║
║                                                               ║
║  ✅ INSPECT → CODE → TEST → VERIFY → COMMIT                   ║
╚═══════════════════════════════════════════════════════════════╝
```
