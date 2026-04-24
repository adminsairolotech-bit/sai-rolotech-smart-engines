# Spec-to-Implementation Planner

## Triggers
- User has requirements and wants implementation plan
- User says "break down", "plan this", "implementation", "tasks"

## What It Does

### Planning Process
```
SPEC/REQUIREMENT
        ↓
1. BREAK DOWN
   → Epic → Features → Tasks
   → Dependencies
   → Technical decisions
        ↓
2. ESTIMATE
   → Effort per task
   → Complexity
   → Risks
        ↓
3. SEQUENCE
   → What first?
   → Parallel work?
   → Blockers?
        ↓
OUTPUT: Task breakdown
```

### Output Format
```markdown
# Implementation Plan: {Feature}

## Tasks

### Phase 1: Foundation
- [ ] Task 1 (2h)
  - Sub-task 1.1
  - Sub-task 1.2
- [ ] Task 2 (4h)
  - Depends on: Task 1

### Phase 2: Core
- [ ] Task 3 (4h)
- [ ] Task 4 (2h)

### Phase 3: Polish
- [ ] Task 5 (2h)
- [ ] Task 6 (1h)

**Total: ~15 hours**

## Dependencies
```
Task 1 → Task 2 → Task 3
              ↘ Task 4 → Task 5
```

## Tech Decisions Needed
- [ ] Database choice
- [ ] API format
```

## Commands
| Command | Action |
|---------|--------|
| `break down` | Full task plan |
| `estimate` | Time estimates |
| `sequence` | Task order |
