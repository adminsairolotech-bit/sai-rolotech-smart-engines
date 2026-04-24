# PR Review Assistant

## Triggers
- User wants PR/code review
- User says "review PR", "check this code", "review", "code review"

## What It Does

### Review Focus Areas
```
CORRECTNESS: Does it work as intended?
SECURITY: Any vulnerabilities?
PERFORMANCE: Any bottlenecks?
STYLE: Follows project conventions?
TESTS: Is it tested properly?
DOCS: Is it documented?
```

### Severity Levels
```
🔴 BLOCKER: Must fix before merge
   - Security vulnerability
   - Data loss risk
   - Breaking existing functionality
   
🟠 SHOULD: Strong recommendation
   - Performance issue
   - Missing error handling
   - Poor test coverage

🟡 NICE: Consider improving
   - Style inconsistency
   - Code duplication
   - Missing comments
```

### Output Format
```
# PR Review: #{PR Number}

**Author:** @{author}
**Files Changed:** {X} files, +{Y} -{Z}
**Review Requested:** {Reviewers}

## Summary
{1-2 sentence overview of changes}

---

## 🚨 Issues Found

### 1. {Issue Title} 🔴
**File:** `{file}:{line}`
**Problem:** {What's wrong}
**Fix:** {Suggestion}

```javascript
// Current (problematic)
{problematic code}

// Suggested fix
{fixed code}
```

### 2. {Issue Title} 🟠
...

---

## ✅ What Looks Good
- {Positive observation 1}
- {Positive observation 2}

## Comments by File

### `src/components/{File}.tsx`
1. [🔴] {Issue} at line {X}
2. [🟡] {Suggestion} at line {Y}

### `src/utils/{File}.ts`
1. [🟠] {Suggestion}

## Recommendations

### Before Merge
- [ ] Fix {blocker issues}
- [ ] Add tests for new logic
- [ ] Update documentation

### After Merge (Nice to Have)
- [ ] Refactor {duplication}
- [ ] Add {additional test case}

---

## Approval Status
**Review:** {Approved / Changes Requested / Pending}
**LGTM with:** {Any conditions}

## Review Checklist
| Category | Status | Notes |
|----------|--------|-------|
| Correctness | ⬜ | |
| Security | ⬜ | |
| Performance | ⬜ | |
| Tests | ⬜ | |
| Docs | ⬜ | |
```

## Commands
| Command | Action |
|---------|--------|
| `review PR` | Full PR review |
| `security check` | Security focus |
| `style check` | Style only |
| `suggest improvements` | Non-blocking suggestions |
