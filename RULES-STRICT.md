# SAI ROLO TECH - STRICT AGENT OPERATING RULES
## Version 2.0 - DISCIPLINED EXECUTION

---

# 🔴 CORE LAWS (MANDATORY)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                         CORE LAWS                                      ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  1. NO TEST = NO DONE                                               ║
║  2. NO OUTPUT = NO SUCCESS                                          ║
║  3. NO VERIFICATION = NO TRUST                                       ║
║  4. NEVER GUESS WHEN YOU CAN CHECK                                   ║
║  5. SPEED IS SECONDARY, VERIFIED CORRECTNESS IS PRIMARY             ║
║  6. SKILLS MUST BE EVALUATED BEFORE MANUAL SHORTCUTS                  ║
║  7. DOUBLE VERIFICATION WHEN GEMINI IS AVAILABLE                     ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

# ⚠️ FORBIDDEN WORDS (Without Proof)

**NEVER use these without real evidence:**
- done
- fixed
- ho gaya
- should work
- probably solved
- try karo (without showing result)

**IF PROOF MISSING = CANNOT CLAIM VERIFIED**

---

# 📋 BEFORE ANY TASK (MANDATORY ORDER)

## Step 1: UNDERSTAND
```
- Restate the task in my own words
- Explain what the user actually wants
- Identify likely root cause or problem area
```

## Step 2: INSPECT
```
- Identify relevant files, folders, modules
- Identify relevant services:
  * frontend
  * backend
  * API/AI
  * mobile
```

## Step 3: EVALUATE
```
- Check for relevant skills/tools/patterns
- Check for existing project patterns
- If skill exists → USE IT first
```

## Step 4: PLAN
```
- Define execution plan
- Define test plan
- Define success criteria
```

## Step 5: EXECUTE
```
- Execute carefully
- Show real commands
- Show real outputs
```

## Step 6: VERIFY
```
- Test the result
- Show proof
- If fails → Fix and retest
```

---

# 📁 ROOT CAUSE ANALYSIS (BEFORE CODING)

## MUST STATE:

| Item | What to Explain |
|------|----------------|
| **Understanding** | What is failing? |
| **Root Cause** | Why is it failing? |
| **Evidence** | What supports this? |
| **Files** | Which files are involved? |
| **Services** | Which services are affected? |
| **Uncertainty** | What is unknown? |

## MUST NOT:
```
- Make blind edits
- Assume system is running
- Assume previous fix worked
- Hide uncertainty
- Skip relevant checks
```

---

# 📝 CHANGE LOG (FOR EVERY FILE)

For every file changed, MUST report:

| Field | Description |
|-------|-------------|
| **File Name** | Exact file path |
| **What Changed** | Specific change made |
| **Why** | Reason for change |
| **Expected Effect** | What should happen |
| **Possible Risk** | Side effects or risks |

---

# 🔧 SERVICE VERIFICATION RULE

## Backend Tasks:
```bash
# 1. Check server status
curl http://localhost:5000/api/health

# 2. Test relevant API endpoint
curl -X POST http://localhost:5000/api/[endpoint]

# 3. Check server logs
```

## Frontend Tasks:
```bash
# 1. Check page loads
curl http://localhost:5000

# 2. Check for errors
curl http://localhost:5000 2>&1 | grep -i error

# 3. Test interaction
```

## Mobile Tasks:
```bash
# 1. Check build status
cd mobile && npx expo prebuild

# 2. Check relevant feature
# 3. Inspect logs if issue exists
```

## AI/API Tasks:
```bash
# 1. Verify key/auth state
curl -X POST "https://generativelanguage.googleapis.com/..."

# 2. Run real request
# 3. Validate actual response
# 4. Use fallback if primary unavailable
```

**NEVER ASSUME SERVICE HEALTH**

---

# 🧪 TESTING RULE (MOST IMPORTANT)

## For every meaningful change:

```
MUST SHOW:
✓ Command run
✓ Real output/result
✓ Brief interpretation
```

## Example (CORRECT):
```bash
Command: npm run test
Output: 12 tests passed, 0 failed
Interpretation: All unit tests passing
```

## Example (WRONG):
```bash
Code likh diya, ho gaya ✓
```

**NO OUTPUT = NOT VERIFIED**

---

# 📄 RESPONSE FORMAT (MANDATORY)

Every task response MUST include:

## 1. STATUS
```
PLANNING / IN_PROGRESS / BLOCKED / VERIFIED
```

## 2. UNDERSTANDING
What the task is about

## 3. ROOT CAUSE HYPOTHESIS
Why the problem exists

## 4. FILES INVOLVED
Files inspected/changed

## 5. SERVICES CHECKED
Service verification results

## 6. SKILLS/TOOLS USED
Which skill or pattern was applied

## 7. PLAN
Execution plan

## 8. TEST PLAN
How to verify success

## 9. EXECUTION
Real commands and outputs

## 10. VERIFICATION
Final proof of success

---

# 🔑 API VERIFICATION

## Gemini API Test:
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

## If 403 Error:
```
GEMINI_API_KEY is BLOCKED
→ Get new key from: https://aistudio.google.com/apikey
→ Update .env file
→ Re-test
```

## Backend Server Test:
```bash
curl http://localhost:5000/api/health
```

## Git Status:
```bash
git status && git log --oneline -3
```

---

# 🚫 BEHAVIOR PROHIBITIONS

## NEVER DO:
```
❌ Make blind edits
❌ Assume system is running
❌ Assume previous fix worked
❌ Hide uncertainty
❌ Skip relevant checks
❌ Claim done without proof
❌ Reply too fast
❌ Say "should work"
❌ Say "probably solved"
❌ Use skill without reading it
```

## ALWAYS DO:
```
✅ Inspect before changing
✅ Verify before claiming
✅ Test before closing
✅ Be honest when blocked
✅ Show real outputs
✅ Use relevant skills
```

---

# 💾 CHECKPOINT SYSTEM

## Every 5 Steps:
```bash
git add . && git commit -m "checkpoint: [description]" && git push
```

## Must Commit After:
- Completing a task
- Finding issues
- User preferences
- API status changes

---

# 📊 PROJECT STATUS (UPDATED)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    SERVICES STATUS (2026-04-14)                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ✅ WORKING:                                                         ║
║  ├── Local CRM (crm/index.html) - http://localhost:3000           ║
║  ├── Git Repository - Pushed to GitHub                               ║
║  └── Complete Guide PDF - Desktop saved                              ║
║                                                                       ║
║  ❌ BLOCKED:                                                        ║
║  ├── Gemini API - 403 Error (Key reported as leaked)                 ║
║  ├── EAS Account - Wrong token (vipu1164)                           ║
║  └── api.sairolotech.com - NOT REACHABLE                            ║
║                                                                       ║
║  📋 PENDING:                                                         ║
║  ├── New Gemini API key from aistudio.google.com                    ║
║  ├── Correct Expo token for EAS build                                 ║
║  └── AAB upload to Play Console                                     ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

# 📞 QUICK REFERENCE

```bash
# VERIFY GEMINI API
curl -X POST "https://generativelanguage.googleapis.com/..."

# VERIFY BACKEND
curl http://localhost:5000/api/health

# VERIFY GIT
git status

# READ RULES
cat RULES-STRICT.md
```

---

# ⚡ FINAL REMINDER

```
╔═══════════════════════════════════════════════════════════════════════╗
║                     NEVER FORGET                                      ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ❌ NO TEST = NO DONE                                                ║
║  ❌ NO OUTPUT = NO SUCCESS                                           ║
║  ❌ NO VERIFICATION = NO TRUST                                       ║
║                                                                       ║
║  ✅ INSPECT → CODE → TEST → VERIFY → COMMIT                          ║
║                                                                       ║
║  Surface-level completion = FAILURE                                   ║
║  Verified completion with proof = SUCCESS                              ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Document Info
- **Version:** 2.0 - STRICT AGENT MODE
- **Created:** 2026-04-14
- **Author:** Claude Code (Opus 4.6)
- **Status:** MANDATORY - MUST FOLLOW

---

**END OF RULES - FOLLOW STRICTLY**
