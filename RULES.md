# SAI ROLO TECH - RULES & WORKFLOW GUIDE

## 🔴 BEFORE ANY TASK - READ THESE

### ✅ MY WORKFLOW RULES

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    MANDATORY WORKFLOW                                 ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  1. LOAD RULES → Before starting any work                           ║
║  2. CHECK POINT → Every 5 steps, commit + push                      ║
║  3. TEST BEFORE CLAIM → Run code, show output, then say "done"      ║
║  4. USE SKILLS → Don't just download, INTEGRATE them                 ║
║  5. MODEL SWITCH → Use cheapest working model for cost optimization ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 💰 MODEL SWITCHING (COST OPTIMIZATION)

### Priority Order (Cheapest to Expensive):

| Priority | Model | Cost | Use Case |
|----------|-------|------|----------|
| 1 | **Gemini 2.5 Flash (Direct)** | FREE | Fast tasks, chat, simple queries |
| 2 | **gemini-2.0-flash** | FREE | Fallback if 2.5 fails |
| 3 | **OpenRouter (if working)** | ~$0.001/1K | Complex reasoning |
| 4 | **Claude Haiku** | ~$0.001/1K | Fallback reasoning |
| 5 | **Claude Sonnet** | ~$0.003/1K | Complex coding |
| 6 | **Claude Opus** | ~$0.015/1K | Only when needed |

### Rules:
```
✅ ALWAYS try Gemini first (free)
✅ If Gemini fails → try OpenRouter
✅ If OpenRouter fails → try Claude
✅ Never use expensive model when cheap works
✅ Log which model was used for cost tracking
```

---

## 📋 CHECKPOINT SYSTEM

### Every 5 Steps:
```bash
# Step 1-5 done → DO THIS:
git add . && git commit -m "checkpoint: [what was done]" && git push

# Don't skip this! It prevents losing work.
```

### Checkpoints to Remember:
- Session start → Read RULES.md
- After coding → Test immediately
- After testing → Show output to user
- After completion → Commit + Push
- Before new task → Read RULES.md again

---

## 🎯 SKILL INTEGRATION RULES

### Downloaded Skills (MUST USE):

| Skill | Location | Status | Action Required |
|-------|----------|--------|-----------------|
| graph-memory | graph-memory/ | .exe downloaded | Install + Run |
| clawtrol | clawtrol/ | Code ready | Integrate into engine |
| mnemon | mnemon/ | Downloaded | Add to memory system |
| clawbridge | clawbridge/ | Downloaded | Mobile dashboard |
| agent-orchestrator | agent-orchestrator/ | Patterns ready | Study + Apply |

**RULE:** "Downloaded but not used" = WASTED TIME

### How to USE Skills:
```
1. Skill downloaded → READ its README/CLAUDE.md
2. Find patterns → COPY to our project
3. Test the pattern → Make sure it works
4. If works → INTEGRATE into engine
5. If fails → FIX before moving on
```

---

## 🔍 TESTING RULES

### Before Claiming "Done":
```
❌ WRONG: "Ho gaya, code likh diya"
✅ RIGHT: "Code likha, test run kiya, output dekho..."

Test Commands:
- npm run dev / build / test
- node src/index.ts
- npx tsx [file]
- Browser check
```

### Test Output Template:
```
✅ [Feature] - WORKING
   Output: [actual result]
   Model Used: [which API]
   Tokens: [if tracking]
```

---

## 📁 FILE STRUCTURE RULES

### Always Keep:
```
project/
├── CLAUDE.md          # Main guide (read first)
├── RULES.md           # This file (read every checkpoint)
├── sai-rolotech-engine/
│   ├── src/           # Source code
│   ├── tests/         # Test files
│   ├── data/          # Working data
│   └── .env           # API keys
└── skills/            # Downloaded skills
```

### Never Forget:
- Read RULES.md before starting
- Check API key before API calls
- Commit after every 5 steps
- Test before claiming done

---

## 🔧 API KEY PRIORITY

### Working Keys (Use in this order):

1. **GEMINI_DIRECT** - `AIzaSyATGzuZ7DTWczUoOug4zSbGW3qJEZ1YDPQ`
   - Status: WORKING ✅
   - Cost: FREE
   - Model: gemini-2.5-flash

2. **OPENROUTER** - `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`
   - Status: FAILING (401) ❌
   - Need: Fresh key

3. **GEMINI_FALLBACK** - Multiple keys available
   - Key 2: `AIzaSyA78P7IW0HFyPt4a-JH-LBvrpmoAaT_2Fo`
   - Key 3: `AIzaSyBETwDFw5yUknNC0HcR0mc4RajJI5Az3Kk`
   - Key 4: `AIzaSyBZBftDyEDmKOC4dRIe2EZSA1trZXZTFO0`

---

## 📊 PROJECT STATUS TRACKER

### Current State (2026-04-14):

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    ESSENTIAL SERVICES CHECK                         ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  📱 PLAY STORE:                                                       ║
║  ✅ AAB File: crm-official/android-release.aab (35MB)              ║
║  ⚠️  EAS Account: vipu1164 - Wrong (need correct owner account)    ║
║                                                                       ║
║  🤖 GEMINI API:                                                       ║
║  ❌ GEMINI_API_KEY: BLOCKED (403 - Leaked key reported)           ║
║  ❌ AI_INTEGRATIONS_GEMINI_API_KEY: BLOCKED (403)                  ║
║                                                                       ║
║  🖥️  BACKEND SERVER:                                                ║
║  ✅ Port 5000: Running (mock mode - no Gemini)                    ║
║  ⚠️  API URL: https://api.sairolotech.com (NOT REACHABLE)        ║
║                                                                       ║
║  📋 PENDING FIXES:                                                    ║
║  1. GEMINI API KEY CHANGE - OLD KEY BLOCKED                        ║
║  2. EAS login with correct Expo account                             ║
║  3. Upload AAB to Play Console                                       ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### BEFORE ANY TASK - MUST VERIFY:

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    PRE-TASK VERIFICATION                            ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  1. ✅ GEMINI API TEST:                                            ║
║     curl -X POST "https://generativelanguage.googleapis.com/..."    ║
║     If 403 → API Key Blocked → Get NEW KEY first                   ║
║                                                                       ║
║  2. ✅ BACKEND SERVER TEST:                                        ║
║     curl http://localhost:5000/api/health                           ║
║     If fail → Start server first                                    ║
║                                                                       ║
║  3. ✅ MOBILE BUILD TEST:                                           ║
║     eas build --platform android --profile preview                   ║
║     If fail → Check EAS login + expo token                          ║
║                                                                       ║
║  4. ✅ VERIFY BEFORE CLAIM:                                        ║
║     Run test → Show output → Then say "DONE"                        ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Current State (2026-04-13):
```
SAI ROLOTECH ENGINE: PARTIALLY WORKING ⚠️
├── cmd.js: API fail (need Gemini direct)
├── index.html: API fail (same issue)
├── src/agents: Orchestrator ready
├── src/tools: Browser, search, image ready
├── src/channels: Telegram, WhatsApp, Discord ready

SKILLS: 3% USED ⚠️
├── graph-memory: Downloaded, not installed
├── clawtrol: Code ready, not integrated
├── mnemon: Downloaded, not integrated

NEXT ACTION: Fix API → Test → Commit
```

---

## 🚨 REMEMBER THIS

```
╔═══════════════════════════════════════════════════════════════════════╗
║                        NEVER FORGET                                    ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  1. Before ANY task → Read RULES.md                                   ║
║  2. After coding → Test immediately                                   ║
║  3. After testing → Show output to user                               ║
║  4. Every 5 steps → Commit + Push                                     ║
║  5. API fail → Switch model, don't stop                               ║
║  6. Downloaded skill → USE it, not keep it                           ║
║  7. Cheap model first → Gemini (free) > OpenRouter > Claude           ║
║                                                                       ║
║  ❌ "Ho gaya" → ✅ "Test kiya, output mila, done"                       ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 📝 QUICK REFERENCE COMMANDS

```bash
# Read rules before starting
cat RULES.md

# Check API status
curl -s -X POST "https://generativelanguage.googleapis.com/..." | jq .error

# Test engine
cd sai-rolotech-engine && npx tsx cmd.js

# Test dashboard
npx serve sai-rolotech-engine -p 3333

# Commit checkpoint
git add . && git commit -m "checkpoint" && git push
```
