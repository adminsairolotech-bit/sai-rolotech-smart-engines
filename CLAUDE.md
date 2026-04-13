# SAI ROLO TECH - WORKING GUIDE

## ⚠️ BEFORE EVERY TASK - READ THIS

### ✅ AUTOMATIC WORKFLOW

```
╔═══════════════════════════════════════════════════════════════════════╗
║  STEP 1: READ .claude/memory.json (YEH YAAD RAKEGA!)                 ║
║  STEP 2: READ RULES.md                                               ║
║  STEP 3: DO TASK                                                    ║
║  STEP 4: TEST                                                       ║
║  STEP 5: COMMIT + UPDATE memory.json                                 ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### MY DISCIPLINE RULES (MUST FOLLOW)

```
╔═══════════════════════════════════════════════════════════════════════╗
║  1. LOAD MEMORY → Read .claude/memory.json (YEH PEHLE!)              ║
║                                                                       ║
║  2. READ RULES.md BEFORE STARTING                                    ║
║     → cat RULES.md (mandatory)                                       ║
║                                                                       ║
║  3. MODEL SWITCH (Cost Optimization)                                 ║
║     → Gemini (free) > OpenRouter > Claude                            ║
║     → Always try cheapest working model first                        ║
║                                                                       ║
║  4. TOKEN LIMIT - Check every 50 messages                            ║
║     ❌ Don't hit 20M tokens                                           ║
║     ✅ Save work at 100K tokens                                      ║
║                                                                       ║
║  5. TEST BEFORE CLAIM - Never say "done" without test                 ║
║     ❌ "Ho gaya" without testing                                      ║
║     ✅ Run code, show output, then claim done                         ║
║                                                                       ║
║  6. SMALL BATCHES - Max 5 steps, then commit                         ║
║     ❌ All at once = incomplete                                       ║
║     ✅ Batch → Save → Next                                           ║
║                                                                       ║
║  7. SKILL INTEGRATION - USE not KEEP                                  ║
║     ❌ "Skills downloaded" → do nothing                               ║
║     ✅ "Skills downloaded" → INTEGRATE into code                     ║
║                                                                       ║
║  8. UPDATE memory.json - After every task                           ║
║     → Update skills status, last task, session count                 ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 📋 SKILL PIPELINE (USE THESE)

| Skill | When to Use | How |
|-------|-------------|-----|
| agent-orchestrator/CLAUDE.md | Multi-agent work | Read, copy patterns |
| edict/ | 9 agents needed | Study structure |
| graph-memory/ | Token overflow | Install, use |
| clawtrol/ | Dashboard needed | Study, adapt |
| mnemon/ | Cross-session memory | Study, implement |

**RULE:** Downloaded skill = INTEGRATE it into engine code

**ACTION:** Check skill folder README, extract patterns, paste into our code

---

## 🚀 QUICK COMMANDS

```bash
# Save work (MUST DO EVERY 5 STEPS)
git add . && git commit -m "checkpoint" && git push

# Check token usage
echo "Working on step X of 5"

# Test before claim
npm run test 2>&1 || echo "FIX THIS FIRST"
```

---

## 📊 PROJECT STATUS

### Memory File: .claude/memory.json (YEH YAAD RAKEGA!)
```json
{
  "lastUpdated": "2026-04-13",
  "sessionCount": 1,
  "skills": { "clawtrol": true, others: false },
  "api": { "gemini": "WORKING", "openrouter": "FAILING" },
  "engine": { "cmd.js": "WORKING", "index.html": "WORKING" }
}
```

### API Keys (Working Order):
| API | Status | Cost | Model |
|-----|--------|------|-------|
| Gemini Direct | ✅ WORKING | FREE | gemini-2.5-flash |
| OpenRouter | ❌ FAILING | ~$0.001 | - |

**NOTE:** Use Gemini Direct API first (free, working) - 13 keys rotating

### SAI Rolotech Engine (PRIORITY)
- Location: sai-rolotech-engine/
- Status: ✅ WORKING - Gemini API connected
- cmd.js: ✅ WORKING (tested)
- index.html: ✅ WORKING (Gemini direct)
- src/: ✅ READY

### Skills (USE NOT KEEP)
- agent-orchestrator/ → Multi-agent patterns
- edict/ → Agent work division
- graph-memory/ → Token reduction
- clawtrol/ → ✅ Dashboard UI (used)
- mnemon/ → Cross-session memory

---

## ⚡ OPTIMIZATION (40x FASTER)

**Goal:** Small files, fast load, better work

**Methods:**
1. Use Glob/Grep instead of Read (90% less tokens)
2. Split large files into small modules
3. Auto-commit every 5 steps
4. Test before claim

---

## 🔴 CURRENT REMINDER

**This prompt appears every task. Read before starting.**

**REMEMBER:**
- Token limit = 20M per session
- Every 5 steps = commit + push
- Test code before claiming done
- Use skills from pipeline, not just keep them

---

## 📝 TASK: Build Skill Pipeline

1. [x] Read agent-orchestrator/CLAUDE.md patterns ✅
2. [x] Apply patterns to sai-rolotech-engine ✅
3. [ ] Test with real API
4. [ ] Commit working version

**STATUS:** API server running on port 3000, dashboard updated to use local /api/chat

**NEXT:** Test dashboard in browser