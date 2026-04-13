# SAI ROLO TECH - WORKING GUIDE

## 🚨 BEFORE ANY TASK - MUST READ 🚨

### ⚠️ CHECKPOINT VALIDATION (MANDATORY)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║  ❌ AGAR YE ERROR AAYE:                                              ║
║     "Checkpoint not loaded"                                           ║
║     "Skills not found"                                                ║
║     "memory.json not read"                                            ║
║                                                                       ║
║  TOH YE KARTE HAIN (ORDER MEIN):                                     ║
║                                                                       ║
║     1. cat .claude/memory.json                                       ║
║     2. cat RULES.md                                                  ║
║     3. cat .claude/CHECKPOINT.md                                     ║
║                                                                       ║
║  PHIR KAAM SHURU KARNA!                                              ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## ✅ AUTOMATIC WORKFLOW

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║  STEP 1: cat .claude/memory.json  ← YEH PEHLE!                     ║
║  STEP 2: cat RULES.md               ← YEH DOOSRE!                   ║
║  STEP 3: cat .claude/CHECKPOINT.md  ← YEH TEEJSRE!                  ║
║  STEP 4: DO TASK                                                     ║
║  STEP 5: TEST                                                        ║
║  STEP 6: COMMIT + UPDATE memory.json                                 ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 📋 MY DISCIPLINE RULES

```
╔═══════════════════════════════════════════════════════════════════════╗
║  1. ✅ LOAD MEMORY → .claude/memory.json (YEH PEHLE!)                ║
║  2. ✅ READ RULES → RULES.md                                        ║
║  3. ✅ CHECKPOINT → .claude/CHECKPOINT.md                           ║
║  4. ✅ MODEL SWITCH → Gemini (free) > OpenRouter > Claude            ║
║  5. ✅ TOKEN LIMIT → Check har 50 messages                          ║
║  6. ✅ TEST FIRST → "Ho gaya" mat bol, test karo!                   ║
║  7. ✅ SMALL BATCHES → 5 steps, commit                              ║
║  8. ✅ SKILL INTEGRATE → USE not KEEP                               ║
║  9. ✅ UPDATE memory.json → After every task                         ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 📊 PROJECT STATUS (From memory.json)

### ✅ WORKING:
| Component | Status | API |
|-----------|--------|-----|
| cmd.js | WORKING | Gemini Direct (FREE) |
| index.html | WORKING | Gemini Direct (FREE) |
| memory.json | CREATED | - |
| CHECKPOINT.md | CREATED | - |

### ❌ PENDING SKILLS:
- graph-memory: NOT INSTALLED
- mnemon: NOT INTEGRATED
- agent-orchestrator: NOT USED
- edict: NOT USED
- clawtrol: PARTIALLY USED

### 🔑 API Keys:
- Gemini: ✅ WORKING (13 keys rotating)
- OpenRouter: ❌ FAILING (401 error)

---

## 🚀 QUICK COMMANDS

```bash
# CHECKPOINT VALIDATION (HAR CHECKPOINT PE):
cat .claude/memory.json
cat RULES.md
cat .claude/CHECKPOINT.md

# SAVE WORK (HAR 5 STEPS):
git add . && git commit -m "checkpoint" && git push

# TEST BEFORE CLAIM:
npm run test 2>&1 || echo "FIX THIS FIRST"
```

---

## 📁 IMPORTANT FILES

| File | Purpose |
|------|---------|
| `.claude/memory.json` | Skills & API status yaad rakhega |
| `RULES.md` | Workflow rules & commands |
| `.claude/CHECKPOINT.md` | Validation key - error aayega toh padhna |
| `CLAUDE.md` | YEH FILE - har task se pehle |

---

## 🚨 ERROR MESSAGES & SOLUTIONS

| Error | Solution |
|-------|----------|
| "memory.json not loaded" | `cat .claude/memory.json` |
| "rules not found" | `cat RULES.md` |
| "checkpoint failed" | `cat .claude/CHECKPOINT.md` |
| "API key not working" | memory.json mein API status check karo |
| "skill not integrated" | Skills list memory.json mein dekho |

---

## 💡 REMEMBER

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║  YE 3 FILES HAR CHECKPOINT PE PADHNI HAIN!                           ║
║                                                                       ║
║  1. .claude/memory.json    → Skills & API status                    ║
║  2. RULES.md               → Workflow rules                          ║
║  3. .claude/CHECKPOINT.md  → Validation key                          ║
║                                                                       ║
║  AGAR BHUL GAYE TOH ERROR AAYEGA - PHIR YE 3 PADHNA!                 ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 📝 TASK TRACKER

Last Updated: 2026-04-13
Last Task: Memory system + Checkpoint validation created
Session: 1

---

## ⚡ OPTIMIZATION

- Small files = Fast load
- Glob/Grep = 90% less tokens
- Auto-commit har 5 steps
- Test before claim