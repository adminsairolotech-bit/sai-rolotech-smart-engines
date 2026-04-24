# Git Conflict Resolver

## Triggers
- User has merge conflicts
- User says "conflict", "merge", "git conflict", "resolve"

## What It Does

### Resolution Process
```
CONFLICT FILE
        ↓
1. SHOW CONFLICTS
   → Parse conflict markers
   → Show both versions
        ↓
2. UNDERSTAND
   → What changed locally
   → What changed in remote
   → Which is correct?
        ↓
3. RESOLVE
   → Keep local
   → Keep remote
   → Merge both
   → Manual edit
        ↓
OUTPUT: Resolved file
```

### Output Format
```
# Git Conflict: {file}

## Conflict Found
```diff
<<<<<<< HEAD (Local)
- const x = 1;
+ const x = 2;
=======
  const x = 3;
>>>>>>> branch (Remote)
```

## Options
1. **Keep yours**: Use local version
2. **Keep theirs**: Use remote version
3. **Merge both**: Combine changes

## Resolution
```typescript
// Resolved: Merge both
const x = 2; // Keep local's approach
const y = 3; // Add remote's addition
```

## Commands
| Command | Action |
|---------|--------|
| `show conflicts` | List conflicts |
| `resolve <file>` | Propose resolution |
| `accept ours/theirs` | Choose version |
