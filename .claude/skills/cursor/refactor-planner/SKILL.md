# Refactor Planner

## Triggers
- User wants to refactor code safely
- User says "refactor", "clean up", "improve code", "restructure"

## What It Does

### Refactor Process
```
MESSY CODE
        ↓
1. UNDERSTAND CURRENT STATE
   → What does it do?
   → How is it used?
   → Dependencies?
   → Test coverage?
        ↓
2. PLAN SAFE REFACTOR
   → Break into small steps
   → Identify breaking changes
   → Plan migration path
   → Test strategy at each step
        ↓
3. EXECUTE STEP BY STEP
   → Smallest change first
   → Run tests after each
   → Commit after each step
   → Keep working code in between
        ↓
OUTPUT: Safe refactor plan
```

### Output Format
```
# Refactor Plan: {Component/File}

## Current State
**Problem:** {What's wrong}
**Lines of code:** {X}
**Complexity:** {High/Med/Low}
**Test coverage:** {X}%

## Why Refactor Now?
- {Reason 1}
- {Reason 2}
- {Risk if not done}

## Refactor Steps

### Step 1: Extract Utility Functions ⬜
**Changes:**
- Extract `{function1}` to utils
- Extract `{function2}` to utils

**Tests:** Run existing tests
**Break risk:** Low

### Step 2: Rename Variables for Clarity ⬜
**Changes:**
- `{oldName}` → `{newName}`
- `{oldName}` → `{newName}`

**Tests:** Update affected tests
**Break risk:** Low

### Step 3: Replace Nested Conditionals ⬜
**Changes:**
- Replace if/else chain with switch/map
- Extract complex logic to named functions

**Tests:** Add tests for new paths
**Break risk:** Medium

### Step 4: Introduce Type Safety ⬜
**Changes:**
- Add TypeScript types
- Replace `any` with proper types

**Tests:** Type check
**Break risk:** Low

## Estimated Time
**Total:** {X} hours
**Per step:** ~{Y} minutes

## Testing Strategy
```
Before changes → Run all tests → Pass
Make small change → Run tests → Pass
Commit → Next change
```

## Migration Guide (if public API changes)
```typescript
// Old API
oldFunction(param1, param2)

// New API
newFunction({ param1, param2, param3 })

// Migration
const result = newFunction({ 
  param1: oldParam1, 
  param2: oldParam2,
  param3: defaultValue 
});
```

## Rollback Plan
If step N breaks:
```bash
git revert HEAD~1  # Revert last step
git checkout main -- src/file.ts  # Restore from main
```

## Files to Change
- `src/components/{File}.tsx` - Main refactor
- `src/utils/{File}.ts` - New utilities
- `src/types/{File}.ts` - Type definitions
```

## Commands
| Command | Action |
|---------|--------|
| `plan refactor` | Full plan |
| `quick clean` | Simple cleanup |
| `safe rename` | Rename with references |
| `extract function` | Extract to helper |
