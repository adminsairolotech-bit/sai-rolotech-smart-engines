# SAI ROLO TECH - WORKING GUIDE

## MY APPROACH (NEW - TESTED)

### Rule 1: Small Batches
- Maximum 5 steps per session
- Save after every batch
- No multi-tasking

### Rule 2: Test Before Move
- Run code, verify output
- If error, fix before next step
- Never assume "it works"

### Rule 3: Commit Frequently
- Git add + commit after each batch
- Push to remote
- Never lose work

### Rule 4: Check Token Usage
- Keep context small
- Use Glob/Grep instead of Read
- Save memory to files

---

## CURRENT STATUS

### Done ✅
- graph-memory repo cloned (OpenClaw memory plugin)
- clawtrol repo cloned (OpenClaw dashboard)
- mnemon repo cloned (memory server)
- OpenClaw-Graph-2.0.0-win-x64.exe downloaded

### Pending ⏳
- CLAUDE.md recreate
- Settings optimize
- Test working setup

---

## QUICK COMMANDS

```bash
# Test AI Engine
cd sai-rolotech-engine
npm run chat

# Open Dashboard
npx serve sai-rolotech-engine -p 3333

# Push changes
git add . && git commit -m "update" && git push
```

---

## RESOURCES DOWNLOADED

| Repo | Purpose | Status |
|------|---------|--------|
| graph-memory | 75% token reduction | ✅ Cloned |
| clawtrol | OpenClaw dashboard | ✅ Cloned |
| mnemon | Cross-session memory | ✅ Cloned |
| graph-memory.exe | Windows installer | ✅ Downloaded |

---

## NEXT STEPS (5 MAX)

1. Create minimal CLAUDE.md
2. Test cmd.js with local API
3. Update index.html for local API
4. Commit and push
5. Test in browser

---

## MY ERRORS (LEARNED)

❌ Used 20M tokens in 5 hours
❌ Tested API after claiming "working"
❌ Created multiple agents instead of doing work
❌ No incremental saves

**NOW:** One thing at a time. Test before claim.