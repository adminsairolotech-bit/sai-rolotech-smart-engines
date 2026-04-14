# SAI RoloTech - Claude Code Operating Guide

## Complete Reference Manual v1.0

---

# 📋 TABLE OF CONTENTS

1. [How I Work](#-how-i-work)
2. [Pre-Task Verification](#-pre-task-verification)
3. [Project Structure](#-project-structure)
4. [Services Status](#-services-status)
5. [Workflow Rules](#-workflow-rules)
6. [Skills System](#-skills-system)
7. [Testing Protocol](#-testing-protocol)
8. [API Keys](#-api-keys)
9. [Commands Reference](#-commands-reference)
10. [Play Store Guide](#-play-store-guide)

---

# 🤖 HOW I WORK

## My Identity
- **Name:** Claude Code (Opus 4.6)
- **Creator:** Anthropic
- **Type:** AI Coding Assistant
- **Specialty:** Full-stack development, automation, deployment

## My Approach
```
1. READ RULES FIRST → Understand workflow
2. VERIFY SERVICES → Test before starting
3. EXECUTE TASK → Code, test, verify
4. UPDATE MEMORY → Save progress
5. COMMIT → Save to git
```

## Key Principles
- ✅ Always verify services before any task
- ✅ Test code before claiming "done"
- ✅ Follow rule book strictly
- ✅ Update memory after every task
- ✅ Use cheapest working model (Gemini > OpenRouter > Claude)

---

# ✅ PRE-TASK VERIFICATION

## MUST DO BEFORE ANY TASK:

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    PRE-TASK CHECKLIST                                 ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  1. cat .claude/memory.json    → Load memory                       ║
║  2. cat RULES.md               → Read rules                        ║
║  3. cat .claude/CHECKPOINT.md  → Check checkpoint                  ║
║  4. Test services              → Verify before starting            ║
║  5. Read project files         → Understand structure              ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## Service Verification Commands:

```bash
# Gemini API Test
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'

# If 403 Error → API Key Blocked → Get new key

# Backend Server Test
curl http://localhost:5000/api/health

# If fail → Start server: npm run server

# Git Status
git status
```

---

# 📁 PROJECT STRUCTURE

## Main Repository
```
cloud-code-extension/
├── crm/                    # 3D Industrial CRM (crm/index.html)
├── crm-official/          # Official CRM (React + Express)
│   ├── mobile/            # Expo React Native app
│   ├── server/            # Express backend
│   ├── src/               # Frontend pages & components
│   └── android-release.aab # Built Android app
├── sai-rolotech-engine/   # AI Design Engine
├── skills/                 # Downloaded skills
└── CLAUDE.md              # Main guide
```

## Key Files
| File | Purpose |
|------|---------|
| `CLAUDE.md` | Main project instructions |
| `RULES.md` | Workflow rules & commands |
| `.claude/memory.json` | Session memory |
| `.claude/CHECKPOINT.md` | Validation key |

---

# 🔧 SERVICES STATUS

## Current Status (2026-04-14)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    SERVICES STATUS                                      ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ✅ WORKING:                                                         ║
║  ├── Local CRM (crm/index.html) - http://localhost:3000           ║
║  ├── Backend Server - Port 5000 (mock mode)                       ║
║  └── Git Repository - Committed to GitHub                           ║
║                                                                       ║
║  ❌ ISSUES:                                                          ║
║  ├── Gemini API - BLOCKED (403 - Leaked key reported)              ║
║  ├── EAS Account - Wrong token (vipu1164)                          ║
║  └── api.sairolotech.com - NOT REACHABLE                            ║
║                                                                       ║
║  ⚠️  NEEDS ATTENTION:                                               ║
║  ├── New Gemini API key required                                    ║
║  ├── Correct Expo token needed for EAS                              ║
║  └── AAB upload to Play Store                                       ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

# 📋 WORKFLOW RULES

## Core Workflow

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    MANDATORY WORKFLOW                                 ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  1. READ RULES → cat RULES.md (First!)                              ║
║  2. VERIFY → Test services before starting                           ║
║  3. EXECUTE → Code, test, show output                                ║
║  4. UPDATE → Save to memory.json                                    ║
║  5. COMMIT → Every 5 steps, git commit + push                       ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## Checkpoint System

### Every 5 Steps:
```bash
git add . && git commit -m "checkpoint: [what was done]" && git push
```

### Checkpoints:
- Session start → Read RULES.md
- After coding → Test immediately
- After testing → Show output
- After completion → Commit + Push
- Before new task → Read RULES.md again

## Testing Rules

```
❌ WRONG: "Ho gaya, code likh diya"
✅ RIGHT: "Code likha, test run kiya, output dekho..."
```

### Test Commands:
```bash
npm run dev / build / test
node src/index.ts
npx tsx [file]
curl http://localhost:3000/
```

---

# 🎓 SKILLS SYSTEM

## Downloaded Skills

| Skill | Location | Status | Action |
|-------|----------|--------|--------|
| graph-memory | graph-memory/ | Downloaded | Install |
| clawtrol | clawtrol/ | Code Ready | Integrate |
| mnemon | mnemon/ | Downloaded | Add to memory |
| clawbridge | clawbridge/ | Downloaded | Mobile dashboard |
| agent-orchestrator | agent-orchestrator/ | Patterns Ready | Study |

## Rule: "Downloaded but not used" = WASTED TIME

## How to USE Skills:
```
1. Skill downloaded → READ its README/CLAUDE.md
2. Find patterns → COPY to our project
3. Test the pattern → Make sure it works
4. If works → INTEGRATE into engine
5. If fails → FIX before moving on
```

---

# 🧪 TESTING PROTOCOL

## Before Claiming "Done":
```
❌ WRONG: "Ho gaya, code likh diya"
✅ RIGHT: "Code likha, test run kiya, output dekho..."
```

## Test Output Template:
```
✅ [Feature] - WORKING
   Output: [actual result]
   Model Used: [which API]
   Tokens: [if tracking]
```

## Verification Checklist:
- [ ] Code runs without errors
- [ ] Output matches expectation
- [ ] Browser/App test done
- [ ] Git committed

---

# 🔑 API KEYS

## Current Keys

### Gemini API
```
Status: ❌ BLOCKED (403 Error)
Keys in .env:
- GEMINI_API_KEY=AIzaSyCIoT8GOSCBgDJAVhsdCgGrIciFF8rFvwM
- AI_INTEGRATIONS_GEMINI_API_KEY=AIzaSyCIoT8GOSCBgDJAVhsdCgGrIciFF8rFvwM

SOLUTION: Get new key from https://aistudio.google.com/apikey
```

### Model Priority (Cost Optimization)
| Priority | Model | Cost |
|----------|-------|------|
| 1 | Gemini 2.5 Flash | FREE |
| 2 | gemini-2.0-flash | FREE |
| 3 | OpenRouter | ~$0.001/1K |
| 4 | Claude Haiku | ~$0.001/1K |

---

# 💻 COMMANDS REFERENCE

## Quick Commands

```bash
# Read rules
cat RULES.md

# Load memory
cat .claude/memory.json

# Test Gemini
curl -X POST "https://generativelanguage.googleapis.com/..."

# Start Backend
cd crm-official && npm run server

# Start CRM
cd crm && npx serve -p 3000

# Commit
git add . && git commit -m "message" && git push
```

## CRM Commands
```bash
# Start 3D Industrial CRM
cd crm && npx serve -p 3000

# Open: http://localhost:3000
```

## Backend Commands
```bash
# Start server
cd crm-official && npm run server

# Build web
cd crm-official && npm run build

# Mobile build
cd crm-official/mobile && eas build --platform android --profile preview
```

---

# 📱 PLAY STORE GUIDE

## Current Build
```
File: crm-official/android-release.aab
Size: 35MB
Date: March 29, 2026
Status: Ready to upload
```

## Play Console Link
```
https://play.google.com/console/u/2/developers/5557389597984591128/app/4976180857303773796
```

## Upload Steps (Beta Testing)
1. Open Play Console link above
2. Go to "Testing" tab
3. Select "Closed Testing" or "Open Testing"
4. Click "Create Release"
5. Upload `android-release.aab`
6. Add release notes
7. Click "Save & Publish"

## Package Info
```
App Name: SAI RoloTech CRM
Package: com.vipinjangra.crmmobile
Version: 1.1.0
```

---

# 🔧 TROUBLESHOOTING

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "memory.json not loaded" | `cat .claude/memory.json` |
| "rules not found" | `cat RULES.md` |
| "checkpoint failed" | `cat .claude/CHECKPOINT.md` |
| "API key not working" | Check RULES.md for API status |
| "Gemini 403" | Get new API key |
| "EAS permission error" | Check Expo account ownership |

---

# 📞 MEMORY FILES

## Memory Structure
```
.claude/
├── memory/
│   ├── MEMORY.md           # Main index
│   ├── user_*.md          # User info
│   ├── project_*.md       # Project info
│   ├── feedback_*.md      # User preferences
│   └── reference_*.md     # External references
└── CHECKPOINT.md          # Validation key
```

## Update Memory After:
- Completing a task
- Finding issues
- User preferences
- API status changes

---

# 🚀 QUICK START CHECKLIST

```
□ Read RULES.md
□ Test Gemini API
□ Check backend server
□ Understand project structure
□ Execute task
□ Test code
□ Update memory
□ Commit to git
```

---

# 📌 IMPORTANT REMINDERS

```
╔═══════════════════════════════════════════════════════════════════════╗
║                        NEVER FORGET                                    ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  1. Before ANY task → Read RULES.md                                   ║
║  2. After coding → Test immediately                                   ║
║  3. After testing → Show output to user                              ║
║  4. Every 5 steps → Commit + Push                                     ║
║  5. API fail → Switch model, don't stop                              ║
║  6. Downloaded skill → USE it, not keep it                           ║
║  7. Cheap model first → Gemini (free) > OpenRouter > Claude           ║
║                                                                       ║
║  ❌ "Ho gaya" → ✅ "Test kiya, output mila, done"                      ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Document Info
- **Created:** 2026-04-14
- **Version:** 1.0
- **Last Updated:** 2026-04-14
- **Author:** Claude Code (Opus 4.6)

---

**End of Document**
