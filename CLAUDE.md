# SAI ROLO TECH - WORKING GUIDE

## ⚠️ BEFORE EVERY TASK - READ THIS

### MY DISCIPLINE RULES (MUST FOLLOW)

```
╔═══════════════════════════════════════════════════════════════════════╗
║  1. READ RULES.md BEFORE STARTING                                    ║
║     → cat RULES.md (mandatory)                                       ║
║                                                                       ║
║  2. MODEL SWITCH (Cost Optimization)                                 ║
║     → Gemini (free) > OpenRouter > Claude                            ║
║     → Always try cheapest working model first                        ║
║                                                                       ║
║  3. TOKEN LIMIT - Check every 50 messages                            ║
║     ❌ Don't hit 20M tokens                                           ║
║     ✅ Save work at 100K tokens                                      ║
║                                                                       ║
║  4. TEST BEFORE CLAIM - Never say "done" without test                 ║
║     ❌ "Ho gaya" without testing                                      ║
║     ✅ Run code, show output, then claim done                         ║
║                                                                       ║
║  5. SMALL BATCHES - Max 5 steps, then commit                         ║
║     ❌ All at once = incomplete                                       ║
║     ✅ Batch → Save → Next                                           ║
║                                                                       ║
║  6. SKILL INTEGRATION - USE not KEEP                                  ║
║     ❌ "Skills downloaded" → do nothing                               ║
║     ✅ "Skills downloaded" → INTEGRATE into code                     ║
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

### API Keys (Working Order):
| API | Status | Cost | Model |
|-----|--------|------|-------|
| Gemini Direct | ✅ WORKING | FREE | gemini-2.5-flash |
| OpenRouter | ❌ FAILING | ~$0.001 | - |
| Gemini Fallback | ✅ Available | FREE | gemini-2.0-flash |

**NOTE:** Use Gemini Direct API first (free, working)

### SAI Rolotech Engine (PRIORITY)
- Location: sai-rolotech-engine/
- Status: API fix needed - use Gemini direct
- cmd.js: Needs Gemini API update
- index.html: Needs Gemini API update

### Skills (USE NOT KEEP)
- agent-orchestrator/ → Multi-agent patterns
- edict/ → Agent work division
- graph-memory/ → Token reduction
- clawtrol/ → Dashboard UI
- mnemon/ → Memory system

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