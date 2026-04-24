# Code Review Fix Executor

## Triggers
- User has review comments and wants fixes applied
- User says "apply fixes", "fix review", "address feedback"

## What It Does

### Fix Application
```
REVIEW COMMENTS
        ↓
1. PRIORITIZE
   → Blockers first
   → Then suggestions
   → Low priority last
        ↓
2. APPLY FIXES
   → One at a time
   → Test after each
   → Document changes
        ↓
OUTPUT: Fixed code + summary
```

### Output Format
```
# Applying Review Fixes

## Fixed (X/Y)

### 1. [BLOCKER] Fix null check
**Comment:** Line 42 - missing null check
**Applied:** ✅

```typescript
// Added
if (!data) {
  throw new Error('Data required');
}
```

### 2. [SHOULD] Add loading state
**Comment:** No loading indicator
**Applied:** ✅

```typescript
// Added
const [loading, setLoading] = useState(false);
```

## Remaining (Y/Y)
- [ ] Add error boundary (nice to have)
- [ ] Optimize re-renders (nice to have)

## Summary
✅ All blockers resolved
✅ Ready for re-review
```

## Commands
| Command | Action |
|---------|--------|
| `apply all` | Apply all fixes |
| `apply <num>` | Apply specific fix |
| `show remaining` | List pending |
