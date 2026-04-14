# SAI ROLO TECH - PROJECT CONTROL
## Version: V2.0

---

## Purpose

This file defines the **PROJECT CONTROL** layer - governance rules for working with the SAI RoloTech project.

---

## Project Overview

### Name
SAI RoloTech - Cloud Code Extension

### Type
Monorepo (pnpm workspace)

### Root
`c:\Users\Sai Rolotech\New folder\cloud-code-extension`

### Structure
```
cloud-code-extension/
├── crm/                      # 3D Industrial CRM
├── crm-official/             # Official CRM (React + Express)
│   ├── mobile/               # Expo React Native app
│   └── server/               # Express backend
├── sai-rolotech-engine/      # AI Design Engine
├── .claude/                  # Claude Code configuration
│   ├── scripts/              # V2 enforcement scripts
│   ├── memory/               # Session memory
│   └── tasks/                # Task tracking
├── tests/                    # Playwright smoke tests
└── [other packages]
```

---

## Session Management

### Start Session
```bash
./.claude/scripts/start-session.sh
```
This must be run at the START of every session.

### End Session
```bash
./.claude/scripts/end-session.sh
```
This MUST be run at the END of every session.

### Before Every Task
```bash
./.claude/scripts/run-task.sh "task description"
```
This creates a task token and initializes the response file.

---

## Required Files

These files MUST exist in the project:

| File | Purpose | Check |
|------|---------|-------|
| RULES.md | Workflow rules | Auto-load |
| RULES-STRICT.md | Strict enforcement rules | Auto-load |
| TASK_TEMPLATE.md | Response format | Must follow |
| VALIDATION_GATE.md | Validation rules | Must pass |
| PROJECT_CONTROL.md | This file | Governance |
| .claude/CHECKPOINT.md | Validation key | Must check |
| .claude/memory.json | Session memory | Must update |
| .claude/session_state.json | Session tracking | Must maintain |
| .claude/session_lock.json | Session lock | Auto-set on error |
| .claude/project_fingerprint.json | Project identity | Auto-verify |

---

## Session State

The session state tracks:

- [ ] `session_status`: NOT_STARTED | ACTIVE | ENDED
- [ ] `task_execution_allowed`: true/false
- [ ] `rules_loaded`: true/false
- [ ] `memory_loaded`: true/false
- [ ] `checkpoint_loaded`: true/false
- [ ] `project_control_loaded`: true/false

If any of these are false, task execution is BLOCKED.

---

## Stale Session Lock

Sessions automatically expire after **3 hours** (10800 seconds).

If a session is stale:
1. `guard-task.sh` will BLOCK task execution
2. Session will be LOCKED
3. `start-session.sh` must be run to reset

---

## New Project Detection

If the project root changes (detected via `.claude/project_fingerprint.json`):
1. `guard-task.sh` will BLOCK execution
2. Error: "project root changed: possible new project"
3. Solution: Run `start-session.sh` again

---

## Checkpoint System

### Every 5 Steps
```bash
git add . && git commit -m "checkpoint: [description]" && git push
```

### Required Checkpoints
- After completing a task
- After finding issues
- After user preferences change
- After API status changes

---

## Enforcement Stack

### 1. Husky (Git Hooks)
- `.husky/pre-commit`: Runs pre-commit checks
- `.husky/pre-push`: Runs pre-push validation

### 2. pre-commit
- File hygiene (trailing whitespace, EOF)
- Secret scanning (Gitleaks)
- YAML/JSON validation

### 3. Gitleaks
- Scans for API keys, tokens, passwords
- Config: `.gitleaks.toml`
- Allowed paths: node_modules, dist, build, artifacts

### 4. Playwright
- Browser smoke tests
- Config: `playwright.config.ts`
- Tests: `tests/smoke.spec.ts`

### 5. Guard Scripts
- `start-session.sh`: Initialize session
- `guard-task.sh`: Pre-task validation
- `run-task.sh`: Task initialization
- `end-session.sh`: Clean session termination
- `validate-response.py`: Response format check

---

## Success Criteria

A task is considered COMPLETE when:

- [ ] All required sections in TASK_TEMPLATE.md are filled
- [ ] All tests pass (shown in output)
- [ ] No forbidden words used without proof
- [ ] Confidence level >= 90/100
- [ ] Change log completed for all files
- [ ] Commit made with checkpoint message

---

## API Keys (Current Status)

| Service | Status | Key | Action |
|---------|--------|-----|--------|
| Gemini | BLOCKED | All expired | Get new key |
| OpenRouter | FAILING | 401 error | Get fresh key |
| api.sairolotech.com | NOT REACHABLE | N/A | Check DNS/hosting |

---

## Critical Rules

### NEVER DO
```
❌ Make blind edits without inspection
❌ Assume system is running without verification
❌ Assume previous fix worked without testing
❌ Hide uncertainty
❌ Skip relevant checks
❌ Claim done without proof
❌ Reply too fast without verification
```

### ALWAYS DO
```
✅ Inspect before changing
✅ Verify before claiming
✅ Test before closing
✅ Be honest when blocked
✅ Show real outputs
✅ Use relevant skills
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| V1.0 | 2026-04-14 | Initial rules |
| V2.0 | 2026-04-14 | V2 enforcement stack |

---

## Contact

For issues with the enforcement system:
1. Check session state: `cat .claude/session_state.json`
2. Check session lock: `cat .claude/session_lock.json`
3. Re-run start-session: `./.claude/scripts/start-session.sh`

---
