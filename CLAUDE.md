# SAI ROLO TECH - WORKING GUIDE

## ⚠️ BEFORE EVERY TASK - READ THIS

### MY DISCIPLINE RULES (MUST FOLLOW)

```
1. TOKEN LIMIT - Check every 50 messages
   ❌ Don't hit 20M tokens
   ✅ Save work at 100K tokens

2. TEST BEFORE CLAIM - Never say "done" without test
   ❌ "Ho gaya" without testing
   ✅ Run code, show output, then claim done

3. SMALL BATCHES - Max 5 steps, then commit
   ❌ All at once = incomplete
   ✅ Batch → Save → Next

4. SKILL PIPELINE - USE not KEEP
   ❌ "Skills downloaded" → do nothing
   ✅ "Skills downloaded" → USE in actual code

5. NO AGENTS - Do work yourself
   ❌ Spawn agent → lose control
   ✅ Direct code → test → commit
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

**RULE:** If working on something that matches above → USE IT, not ignore it.

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

### SAI Rolotech Engine (PRIORITY)
- Location: sai-rolotech-engine/
- Status: Needs API key fix
- Next: Test cmd.js, then browser

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

1. [ ] Read agent-orchestrator/CLAUDE.md patterns
2. [ ] Apply patterns to sai-rolotech-engine
3. [ ] Test with real API
4. [ ] Commit working version

**START NOW - NO EXCUSES**